/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 15/11/2026
**/

'use strict';

// A small model of the OpenWrt firewall (fw4) for the Lab 5 checker. It reads "uci show firewall" of the routers and
// predicts what happens to a packet: which router sees it, which rule or zone policy decides, and whether the reply
// makes it back. The model follows the order of the ruleset that fw4 generates:
//   - an established connection is accepted before any rule (stateful), but only on a router that saw the request;
//   - rules with source zone "Any zone" come first, then the rules of the source zone, top to bottom, first match wins;
//   - forward: then the forwardings to other zones, then the intra-zone forward policy, then the global forward policy;
//   - input: then the input policy of the zone the packet came in on.
// It is a prediction from the configuration, not a measurement: the real tests stay ping and SSH from the hosts.

const FW_TARGETS = ['ACCEPT', 'REJECT', 'DROP'];

const fwList = v => String(v || '').split(/\s+/).filter(Boolean);

// "uci show firewall" -> { defaults, zones, rules, forwardings, present }
function parseFirewall(text) {
    const { sections } = parseUci(text);
    const up = v => String(v || '').toUpperCase();
    const fw = { defaults: { input: 'REJECT', output: 'ACCEPT', forward: 'REJECT' }, zones: [], rules: [], forwardings: [], present: sections.length > 0 };
    const def = sections.find(s => s.type === 'defaults');
    if (def) for (const k of ['input', 'output', 'forward']) if (def.opts[k]) fw.defaults[k] = up(def.opts[k]);
    for (const s of sections) {
        const o = s.opts;
        if (s.type === 'zone') {
            fw.zones.push({
                name: o.name || s.name, networks: fwList(o.network),
                input: up(o.input) || fw.defaults.input, output: up(o.output) || fw.defaults.output, forward: up(o.forward) || fw.defaults.forward
            });
        } else if (s.type === 'forwarding' && o.enabled !== '0') {
            fw.forwardings.push({ src: o.src, dest: o.dest });
        } else if (s.type === 'rule') {
            fw.rules.push({
                name: o.name || s.name, enabled: o.enabled !== '0', src: o.src || null, dest: o.dest || null,
                srcIp: fwList(o.src_ip), destIp: fwList(o.dest_ip), srcPort: fwList(o.src_port), destPort: fwList(o.dest_port),
                proto: fwProto(o.proto), icmp: fwList(o.icmp_type).map(t => t.toLowerCase()), target: up(o.target) || 'DROP', family: o.family || 'any'
            });
        }
    }
    return fw;
}

// The protocols of a rule. No protocol in the configuration means TCP and UDP (also the default in LuCI).
function fwProto(v) {
    const list = fwList(v || 'tcp udp').map(p => p.toLowerCase());
    if (list.some(p => ['all', 'any', '*', '0'].includes(p))) return ['all'];
    return list.flatMap(p => p === 'tcpudp' ? ['tcp', 'udp'] : p === '6' ? ['tcp'] : p === '17' ? ['udp'] : p === '1' ? ['icmp'] : [p]);
}

// "nft list ruleset" lines of the rules with a counter: { name: packets }
function parseFwCounters(text) {
    const out = {};
    for (const line of String(text || '').split('\n')) {
        const m = line.match(/counter packets (\d+) bytes \d+.*comment "!fw4: ([^"]+)"/);
        if (m) out[m[2]] = (out[m[2]] || 0) + Number(m[1]);
    }
    return out;
}

/* ---------- Matching ---------- */

function fwIpMatch(list, ip) {
    if (!list.length) return true;
    const inEntry = e => {
        if (e.includes('/')) { const [net, p] = e.split('/'); return sameSubnet(ip, net, Number(p)); }
        if (e.includes('-')) { const [a, b] = e.split('-'); return ipToInt(ip) >= ipToInt(a) && ipToInt(ip) <= ipToInt(b); }
        return e === ip;
    };
    const pos = list.filter(e => !e.startsWith('!')), neg = list.filter(e => e.startsWith('!')).map(e => e.slice(1));
    return (!pos.length || pos.some(inEntry)) && !neg.some(inEntry);
}

function fwPortMatch(list, port) {
    if (!list.length) return true;
    const inEntry = e => { const [a, b] = e.split(/[-:]/).map(Number); return port >= a && port <= (b || a); };
    const pos = list.filter(e => !e.startsWith('!')), neg = list.filter(e => e.startsWith('!')).map(e => e.slice(1));
    return (!pos.length || pos.some(inEntry)) && !neg.some(inEntry);
}

const FW_ICMP = { 'echo-request': ['echo-request', '8', 'ping'], 'echo-reply': ['echo-reply', '0', 'pong'] };

function fwRuleMatches(r, pkt) {
    if (!r.enabled || r.family === 'ipv6' || !FW_TARGETS.includes(r.target)) return false;
    if (!r.proto.includes('all') && !r.proto.includes(pkt.proto)) return false;
    if (!fwIpMatch(r.srcIp, pkt.src) || !fwIpMatch(r.destIp, pkt.dst)) return false;
    if (!r.proto.includes('all') && (pkt.proto === 'tcp' || pkt.proto === 'udp')) {
        if (!fwPortMatch(r.srcPort, pkt.sport) || !fwPortMatch(r.destPort, pkt.dport)) return false;
    }
    if (pkt.proto === 'icmp' && r.icmp.length && !r.icmp.includes('any') && !r.icmp.some(t => (FW_ICMP[pkt.icmp] || []).includes(t))) return false;
    return true;
}

/* ---------- One router ---------- */

// The logical interface (network.<name>) behind a Linux device such as br-lan or lan2.
function fwNetOf(d, ifname) {
    const s = d.uci.sections.find(x => x.type === 'interface' && (x.opts.device === ifname || x.opts.ifname === ifname));
    return s ? s.name : null;
}

function fwZoneOf(d, ifname) {
    const net = fwNetOf(d, ifname);
    return net ? d.fw.zones.find(z => z.networks.includes(net)) || null : null;
}

// What the firewall of router d does with a packet that comes in on inIf and is for the router itself (outIf null)
// or is routed out on outIf. Returns { verdict, by, rule, zone }.
function fwDecide(d, pkt, inIf, outIf) {
    if (!d.firewallRunning) return { verdict: 'ACCEPT', by: 'off' };
    const inZone = fwZoneOf(d, inIf), outZone = outIf ? fwZoneOf(d, outIf) : null;
    const input = !outIf;
    const cand = d.fw.rules.filter(r => r.src && (input ? !r.dest : !!r.dest)
        && (r.src === '*' || (inZone && r.src === inZone.name))
        && (input || r.dest === '*' || (outZone && r.dest === outZone.name)));
    for (const r of [...cand.filter(x => x.src === '*'), ...cand.filter(x => x.src !== '*')]) {
        if (fwRuleMatches(r, pkt)) return { verdict: r.target, by: 'rule', rule: r.name, zone: inZone && inZone.name };
    }
    if (input) {
        if (inZone) return { verdict: inZone.input, by: 'zone', zone: inZone.name, policy: 'input' };
        return { verdict: d.fw.defaults.input, by: 'default', policy: 'input', note: `${inIf} is in no firewall zone` };
    }
    if (inZone && outZone && d.fw.forwardings.some(f => f.src === inZone.name && f.dest === outZone.name)) return { verdict: 'ACCEPT', by: 'forwarding', zone: `${inZone.name} > ${outZone.name}` };
    if (inZone && outZone && inZone.name === outZone.name) return { verdict: inZone.forward, by: 'zone', zone: inZone.name, policy: 'intra-zone forward' };
    return { verdict: d.fw.defaults.forward, by: 'default', policy: 'forward', note: !inZone ? `${inIf} is in no firewall zone` : !outZone ? `${outIf} is in no firewall zone` : `no forwarding from ${inZone.name} to ${outZone.name}` };
}

function fwWhy(v) {
    if (v.by === 'off') return 'firewall off';
    if (v.by === 'same subnet' || v.by === 'output' || v.by === 'noroute') return v.by === 'noroute' ? 'no route' : v.by;
    if (v.by === 'established') return 'established connection';
    if (v.by === 'rule') return `rule ${v.rule}`;
    if (v.by === 'zone') return `${v.policy} policy of zone ${v.zone}`;
    if (v.by === 'forwarding') return `forwarding ${v.zone}`;
    return `global ${v.policy} policy${v.note ? ' (' + v.note + ')' : ''}`;
}

/* ---------- Following a packet through the routers ---------- */

// routers: [{ label, d }] of the routers that answered. gw(hostIp) gives the default gateway of a host.
function fwOwner(routers, ip) {
    for (const r of routers) { const a = r.d.addrs.find(x => x.ip === ip); if (a) return { r, ifname: a.ifname }; }
    return null;
}

function fwRoute(d, dst) {
    let best = null, bestLen = -1;
    for (const rt of d.routes) {
        const [net, p] = rt.dst === 'default' ? ['0.0.0.0', 0] : rt.dst.includes('/') ? [rt.dst.split('/')[0], Number(rt.dst.split('/')[1])] : [rt.dst, 32];
        if (p > bestLen && sameSubnet(dst, net, p)) { best = rt; bestLen = p; }
    }
    return best;
}

// Follows one packet. seen: routers that let the request through (their conntrack knows the connection).
// Returns { status: 'delivered' | 'blocked' | 'noroute' | 'unknown' | 'loop', hops: [{ router, kind, verdict, ... }] }
function fwTrace(net, pkt, seen, isReply) {
    const hops = [];
    const done = status => ({ status, hops });
    const decide = (r, inIf, outIf) => {
        const v = isReply && seen.has(r.label) ? { verdict: 'ACCEPT', by: 'established' } : fwDecide(r.d, pkt, inIf, outIf);
        hops.push(Object.assign({ router: r.label, kind: outIf ? 'forward' : 'input' }, v));
        if (v.verdict === 'ACCEPT' && !isReply) seen.add(r.label);
        return v.verdict === 'ACCEPT';
    };
    let cur, inIf;
    const own = fwOwner(net.routers, pkt.src);
    if (own) {
        cur = own.r; inIf = null;                       // the packet starts on a router (a reply of the router itself)
    } else {
        const owner = fwOwner(net.routers, pkt.dst);
        if (sameSubnet(pkt.src, pkt.dst, 24)) {
            if (!owner) { hops.push({ router: 'switch', kind: 'switch', verdict: 'ACCEPT', by: 'same subnet' }); return done('delivered'); }
            return done(decide(owner.r, owner.ifname, null) ? 'delivered' : 'blocked');
        }
        const gw = fwOwner(net.routers, net.gw(pkt.src));
        if (!gw) return done('unknown');
        cur = gw.r; inIf = gw.ifname;
    }
    for (let i = 0; i < 8; i++) {
        if (inIf && cur.d.addrs.some(a => a.ip === pkt.dst)) return done(decide(cur, inIf, null) ? 'delivered' : 'blocked');
        const rt = fwRoute(cur.d, pkt.dst);
        if (!rt || !rt.dev) { hops.push({ router: cur.label, kind: 'route', verdict: 'DROP', by: 'noroute' }); return done('noroute'); }
        if (inIf && !decide(cur, inIf, rt.dev)) return done('blocked');
        if (!inIf) hops.push({ router: cur.label, kind: 'output', verdict: 'ACCEPT', by: 'output' });
        if (rt.via) {
            const next = fwOwner(net.routers, rt.via);
            if (!next) return done('unknown');
            cur = next.r; inIf = next.ifname;
            continue;
        }
        const owner = fwOwner(net.routers, pkt.dst);
        if (owner) return done(decide(owner.r, owner.ifname, null) ? 'delivered' : 'blocked');
        return done('delivered');
    }
    return done('loop');
}

// The test traffic of the lab: ping, SSH, LuCI and the Python web server of Exercise 3.
const FW_KINDS = { ssh: 22, web: 80, http8000: 8000 };

// A ping or a TCP connection: the request and, when it arrives, the reply.
// Returns { ok, unknown, request, reply, text }
function fwFlow(net, src, dst, kind) {
    const req = FW_KINDS[kind] ? { src, dst, proto: 'tcp', sport: 50000, dport: FW_KINDS[kind] } : { src, dst, proto: 'icmp', icmp: 'echo-request' };
    const rep = req.proto === 'tcp' ? { src: dst, dst: src, proto: 'tcp', sport: req.dport, dport: req.sport } : { src: dst, dst: src, proto: 'icmp', icmp: 'echo-reply' };
    const seen = new Set();
    const request = fwTrace(net, req, seen, false);
    const reply = request.status === 'delivered' ? fwTrace(net, rep, seen, true) : null;
    const unknown = ['unknown', 'loop'].includes(request.status) || (reply && ['unknown', 'loop'].includes(reply.status));
    const ok = request.status === 'delivered' && reply.status === 'delivered';
    return { ok, unknown, request, reply, text: fwFlowText(request, reply) };
}

function fwHopText(h) {
    if (h.kind === 'switch') return 'same subnet (switch only)';
    if (h.kind === 'output') return `${h.router} sends`;
    if (h.by === 'noroute') return `${h.router}: no route`;
    return `${h.router} ${h.kind} ${h.verdict} (${fwWhy(h)})`;
}

function fwFlowText(request, reply) {
    const part = (t, label) => `${label}: ${t.hops.map(fwHopText).join(' > ') || 'no router'}${t.status === 'unknown' ? ' > router not readable' : t.status === 'loop' ? ' > routing loop' : ''}`;
    return part(request, 'request') + (reply ? '; ' + part(reply, 'reply') : '');
}

// The first hop that stopped the flow, for short messages.
function fwBlocker(f) {
    const t = f.reply && f.reply.status !== 'delivered' ? f.reply : f.request;
    const h = t.hops.find(x => x.verdict !== 'ACCEPT');
    return h ? `${t === f.reply ? 'the reply is stopped by ' : ''}${fwHopText(h)}` : t.status;
}

if (typeof module !== 'undefined') module.exports = { parseFirewall, parseFwCounters, fwDecide, fwTrace, fwFlow, fwBlocker, fwRoute, fwZoneOf };
