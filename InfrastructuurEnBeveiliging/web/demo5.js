/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 15/11/2026
**/

'use strict';

// Demo of Lab 5 without devices: open the app with ?demo=lab5. The four routers of the ring are simulated in the page with
// the firewall model of fwsim.js, in a scenario of one of the exercises. You choose which host "this PC" is; the Monitor
// shows what that host can ping, the terminal of a router shows its (simulated) configuration and ruleset, and the
// Check tab runs the real checker on the simulated routers. Nothing is sent to a switch or a router.

const D5_NEXT = n => n % 4 + 1;
const D5_HOSTS = [1, 2, 3, 4].flatMap(n => [`10.1.${n}.10`, `10.1.${n}.11`]);
const D5_ROUTER_IPS = [1, 2, 3, 4].flatMap(n => [`10.1.${n}.3`, `10.1.${D5_NEXT(n)}.2`]);
const D5_DEPT = { 1: 'IT', 2: 'Finance', 3: 'HR', 4: 'Guest' };

// Rule helpers: every rule has source zone lan unless it says otherwise, and action reject.
const d5Rule = (name, o) => Object.assign({ name, src: 'lan', target: 'REJECT' }, o);
const d5Fwd = (name, src, dst, proto, extra = {}) => d5Rule(name, Object.assign({ dest: '*', src_ip: src, proto }, dst ? { dest_ip: dst } : {}, extra));
const d5Ssh = () => [d5Rule('Allow_SSH_IT', { src_ip: '10.1.1.0/24', proto: 'tcp', dest_port: '22', target: 'ACCEPT' }), d5Rule('Block_SSH_Routers', { proto: 'tcp', dest_port: '22' })];
const d5A = n => `10.1.${n}.11`, d5B = n => `10.1.${D5_NEXT(n)}.10`;

const DEMO5_SCENARIOS = [
    { id: 'start', ex: 'ex1', label: 'Ex 1: firewall on, lan2 in no zone', lanNets: ['lan'], rules: () => [] },
    { id: 'ex1', ex: 'ex1', label: 'Ex 1: .10 host blocked from 10.1.x.2 (reject)', rules: n => [d5Rule('Block_10_to_GW', { src_ip: `10.1.${D5_NEXT(n)}.10`, dest_ip: `10.1.${D5_NEXT(n)}.2`, proto: 'all' })] },
    { id: 'ex1drop', ex: 'ex1', label: 'Ex 1: the same rule with action drop', rules: n => [d5Rule('Block_10_to_GW', { src_ip: `10.1.${D5_NEXT(n)}.10`, dest_ip: `10.1.${D5_NEXT(n)}.2`, proto: 'all', target: 'DROP' })] },
    { id: 'ex1tcp', ex: 'ex1', label: 'Ex 1: mistake, protocol left on TCP+UDP', rules: n => [d5Rule('Block_10_to_GW', { src_ip: `10.1.${D5_NEXT(n)}.10`, dest_ip: `10.1.${D5_NEXT(n)}.2` })] },
    { id: 'ex2', ex: 'ex2', label: 'Ex 2.1: Block_SSH_11', rules: n => [d5Rule('Block_SSH_11', { src_ip: d5A(n), dest_ip: `10.1.${n}.3`, proto: 'tcp', dest_port: '22' })] },
    { id: 'ex2port', ex: 'ex2', label: 'Ex 2.1: Block_SSH_11 without destination port', rules: n => [d5Rule('Block_SSH_11', { src_ip: d5A(n), dest_ip: `10.1.${n}.3`, proto: 'tcp' })] },
    { id: 'ex2order', ex: 'ex2', label: 'Ex 2.2: Allow_SSH_11 above Block_SSH_11', rules: n => [d5Rule('Allow_SSH_11', { src_ip: d5A(n), dest_ip: `10.1.${n}.3`, proto: 'tcp', dest_port: '22', target: 'ACCEPT' }), d5Rule('Block_SSH_11', { src_ip: d5A(n), dest_ip: `10.1.${n}.3`, proto: 'tcp', dest_port: '22' })] },
    { id: 'ex2fwd', ex: 'ex2', label: 'Ex 2.4: Block_SSH_11 as forward rule to the router on the right', rules: n => [d5Rule('Block_SSH_11', { dest: '*', src_ip: d5A(n), dest_ip: `10.1.${D5_NEXT(n)}.3`, proto: 'tcp', dest_port: '22' })] },
    { id: 'ex3deny', ex: 'ex3', label: 'Ex 3.1: zone labo, denylist with Reject_A_to_B_HTTP', labo: 'ACCEPT', rules: n => [d5Rule('Reject_A_to_B_HTTP', { src: 'labo', dest: 'labo', src_ip: d5A(n), dest_ip: d5B(n), proto: 'tcp', dest_port: '8000' })] },
    { id: 'ex3allow', ex: 'ex3', label: 'Ex 3.2: zone labo, allowlist with Allow_A_to_B_HTTP', labo: 'REJECT', rules: n => [d5Rule('Allow_A_to_B_HTTP', { src: 'labo', dest: 'labo', src_ip: d5A(n), dest_ip: d5B(n), proto: 'tcp', dest_port: '8000', target: 'ACCEPT' })] },
    {
        id: 'ex4hint', ex: 'ex4', label: 'Ex 4: NetCorp, every rule on the gateways (shows the asymmetric problem)',
        rules: n => [...d5Ssh(),
            ...([1, 2].includes(n) ? [d5Fwd('Fin_to_IT', '10.1.2.0/24', '10.1.1.0/24', 'all')] : []),
            ...([2, 3].includes(n) ? [d5Fwd('HR_to_IT', '10.1.3.0/24', '10.1.1.0/24', 'all'), d5Fwd('HR_no_SSH', '10.1.3.0/24', null, 'tcp', { dest_port: '22' })] : []),
            ...([3, 4].includes(n) ? [d5Fwd('Guest_to_LAN', '10.1.4.0/24', ['10.1.1.0/24', '10.1.2.0/24', '10.1.3.0/24'], 'all'), d5Fwd('Guest_no_SSH', '10.1.4.0/24', null, 'tcp', { dest_port: '22' })] : [])]
    },
    {
        id: 'ex4', ex: 'ex4', label: 'Ex 4: NetCorp, rules placed by path (as in Lab5.md)',
        rules: n => [...d5Ssh(),
            ...(n === 1 ? [d5Fwd('Fin_to_IT', '10.1.2.0/24', '10.1.1.0/24', 'all')] : []),
            ...([2, 3].includes(n) ? [d5Fwd('HR_to_IT', '10.1.3.0/24', '10.1.1.0/24', 'icmp', { icmp_type: 'echo-request' }), d5Fwd('HR_no_SSH', '10.1.3.0/24', null, 'tcp', { dest_port: '22' })] : []),
            ...(n === 4 ? [d5Fwd('Guest_to_IT', '10.1.4.0/24', '10.1.1.0/24', 'all')] : []),
            ...(n === 3 ? [d5Fwd('Guest_to_HR', '10.1.4.0/24', '10.1.3.0/24', 'all')] : []),
            ...([3, 4].includes(n) ? [d5Fwd('Guest_to_Fin', '10.1.4.0/24', '10.1.2.0/24', 'all')] : []),
            ...(n === 3 ? [d5Rule('Guest_to_Router', { src_ip: '10.1.4.0/24', dest_ip: '10.1.3.3', proto: 'all' })] : []),
            ...(n === 4 ? [d5Rule('Guest_to_Router', { src_ip: '10.1.4.0/24', dest_ip: '10.1.1.2', proto: 'all' })] : [])]
    }
];
const D5_MAIN = { ex1: 'ex1', ex2: 'ex2', ex3: 'ex3deny', ex4: 'ex4' };

/* ---------- The simulated routers ---------- */

const d5Uci = (sec, o) => Object.entries(o).map(([k, v]) => `firewall.${sec}.${k}=${Array.isArray(v) ? v.map(x => `'${x}'`).join(' ') : `'${v}'`}`).join('\n');

// The raw command output of router n in a scenario, in the same form the server returns for a real router.
function d5Sections(n, sc) {
    const lan1 = `10.1.${n}.3`, lan2 = `10.1.${D5_NEXT(n)}.2`, prev = (n + 2) % 4 + 1, far = D5_NEXT(D5_NEXT(n));
    const zones = [{ name: 'lan', network: sc.labo ? [] : (sc.lanNets || ['lan', 'lan2']), input: 'ACCEPT', output: 'ACCEPT', forward: 'ACCEPT' },
        { name: 'wan', network: ['wan', 'wan6'], input: 'REJECT', output: 'ACCEPT', forward: 'REJECT', masq: '1', mtu_fix: '1' }];
    if (sc.labo) zones.push({ name: 'labo', network: ['lan', 'lan2'], input: 'ACCEPT', output: 'ACCEPT', forward: sc.labo });
    const rules = [{ name: 'Allow-DHCP-Renew', src: 'wan', proto: 'udp', dest_port: '68', target: 'ACCEPT', family: 'ipv4' },
        { name: 'Allow-Ping', src: 'wan', proto: 'icmp', icmp_type: 'echo-request', family: 'ipv4', target: 'ACCEPT' }, ...sc.rules(n)];
    const fw = [
        'firewall.@defaults[0]=defaults', d5Uci('@defaults[0]', { syn_flood: '1', input: 'REJECT', output: 'ACCEPT', forward: 'REJECT' }),
        ...zones.flatMap((z, i) => [`firewall.@zone[${i}]=zone`, d5Uci(`@zone[${i}]`, z)]),
        'firewall.@forwarding[0]=forwarding', d5Uci('@forwarding[0]', { src: 'lan', dest: 'wan' }),
        ...rules.flatMap((r, i) => [`firewall.@rule[${i}]=rule`, d5Uci(`@rule[${i}]`, r)])
    ].join('\n').replace(/\n+/g, '\n');
    return {
        board: JSON.stringify({ kernel: '6.6.93', hostname: `R${n}`, model: 'ASUS RT-AX53U', board_name: 'asus,rt-ax53u', release: { distribution: 'OpenWrt', version: '24.10.2', description: 'OpenWrt 24.10.2 r28739-d9340319c6' } }, null, 2),
        addr: `6: br-lan    inet ${lan1}/24 brd 10.1.${n}.255 scope global br-lan\\       valid_lft forever preferred_lft forever\n7: lan2@eth0    inet ${lan2}/24 brd 10.1.${D5_NEXT(n)}.255 scope global lan2\\       valid_lft forever preferred_lft forever`,
        route: [`10.1.${n}.0/24 dev br-lan proto kernel scope link src ${lan1}`, `10.1.${D5_NEXT(n)}.0/24 dev lan2 proto kernel scope link src ${lan2}`,
            `10.1.${far}.0/24 via 10.1.${D5_NEXT(n)}.3 dev lan2 proto static`, `10.1.${prev}.0/24 via 10.1.${n}.2 dev br-lan proto static`].join('\n'),
        uci: [`network.loopback=interface`, `network.loopback.device='lo'`, `network.lan=interface`, `network.lan.device='br-lan'`, `network.lan.proto='static'`, `network.lan.ipaddr='${lan1}'`, `network.lan.netmask='255.255.255.0'`,
            `network.lan2=interface`, `network.lan2.device='lan2'`, `network.lan2.proto='static'`, `network.lan2.ipaddr='${lan2}'`, `network.lan2.netmask='255.255.255.0'`,
            `network.wan=interface`, `network.wan.device='wan'`, `network.wan.proto='dhcp'`,
            `network.route1=route`, `network.route1.interface='lan2'`, `network.route1.target='10.1.${far}.0/24'`, `network.route1.gateway='10.1.${D5_NEXT(n)}.3'`,
            `network.route2=route`, `network.route2.interface='lan'`, `network.route2.target='10.1.${prev}.0/24'`, `network.route2.gateway='10.1.${n}.2'`].join('\n'),
        fwuci: fw,
        firewall: '1',
        fwd: '1',
        brctl: 'bridge name\tbridge id\t\tSTP enabled\tinterfaces\nbr-lan\t\t7fff.000000000000\tno\t\tlan1\n\t\t\t\t\t\t\tlan3',
        time: String(Math.floor(Date.now() / 1000))
    };
}

const Demo5 = {
    active: new URLSearchParams(location.search).get('demo') === 'lab5',
    scenario: load('ieb-demo5-scenario', 'ex4'),
    viewer: load('ieb-demo5-viewer', '10.1.1.10'),
    cache: null,

    current() { return DEMO5_SCENARIOS.find(s => s.id === this.scenario) || DEMO5_SCENARIOS[0]; },

    setScenario(id) { if (DEMO5_SCENARIOS.some(s => s.id === id)) { this.scenario = id; this.cache = null; save('ieb-demo5-scenario', id); } },
    setViewer(ip) { if (D5_HOSTS.includes(ip)) { this.viewer = ip; save('ieb-demo5-viewer', ip); } },
    forExercise(exId) { if (this.current().ex !== exId && D5_MAIN[exId]) this.setScenario(D5_MAIN[exId]); },

    // The four routers of the scenario, with the rule counters of a round of test traffic between all hosts.
    build() {
        if (this.cache && this.cache.id === this.scenario) return this.cache;
        const sc = this.current();
        const raw = new Map(), routers = [];
        for (const n of [1, 2, 3, 4]) {
            const s = d5Sections(n, sc);
            raw.set(n, s);
            routers.push({ n, label: `R${n}`, d: parseDevice(`10.1.${n}.3`, s) });
        }
        const net = { routers, gw: l5Gw };
        const counters = {};
        for (const src of D5_HOSTS) for (const dst of [...D5_HOSTS, ...D5_ROUTER_IPS]) {
            if (src === dst) continue;
            for (const kind of sc.ex === 'ex3' ? ['ping', 'ssh', 'http8000'] : ['ping', 'ssh']) {
                const f = fwFlow(net, src, dst, kind);
                for (const h of [...f.request.hops, ...(f.reply ? f.reply.hops : [])]) if (h.by === 'rule') {
                    const k = `${h.router}|${h.rule}`;
                    counters[k] = (counters[k] || 0) + 1;
                }
            }
        }
        for (const [n, s] of raw) {
            const d = routers[n - 1].d;
            s.fwcount = d.fw.rules.filter(r => r.enabled && r.src !== 'wan').map(r => `\t\t${d5NftMatch(r)} counter packets ${counters[`R${n}|${r.name}`] || 0} bytes ${(counters[`R${n}|${r.name}`] || 0) * 60} ${d5NftAction(r)} comment "!fw4: ${r.name}"`).join('\n');
            d.fwCounters = parseFwCounters(s.fwcount);
        }
        this.cache = { id: this.scenario, raw, routers, net };
        return this.cache;
    },

    ownerOf(ip) {
        const c = this.build();
        return c.routers.find(r => r.d.addrs.some(a => a.ip === ip)) || null;
    },

    // Ping results from the viewer, in the form of /api/ping. The text explains the path (shown as a tooltip).
    pings(ips) {
        const { net } = this.build();
        const out = {};
        for (const ip of ips) {
            if (ip === this.viewer) { out[ip] = { ok: true, ms: 0, text: 'this PC' }; continue; }
            const f = fwFlow(net, this.viewer, ip, 'ping');
            const hops = f.request.hops.length + (f.reply ? f.reply.hops.length : 0);
            out[ip] = { ok: f.ok, ms: f.ok ? Math.round((0.4 + hops * 0.35) * 10) / 10 : null, text: f.text };
        }
        return out;
    },

    // The facts of the routers, as the device map reads them.
    facts(ips) {
        const out = new Map();
        for (const ip of ips) { const r = this.ownerOf(ip); if (r) out.set(ip, parseDevice(ip, this.cache.raw.get(r.n))); }
        return out;
    },

    // What collect() of facts.js would return for a check plan, with this PC = the viewer.
    collect(plan) {
        const { net, raw } = this.build();
        const ctx = { devices: new Map(), failed: new Map(), ping: {}, dev: new Map(), http: new Map(), local: null, model: null, time: Date.now(), found: [] };
        for (const ip of plan.candidates || []) {
            const r = this.ownerOf(ip);
            if (!r) { ctx.failed.set(ip, 'Not simulated in the demo.'); continue; }
            const f = fwFlow(net, this.viewer, ip, 'ssh');
            if (f.ok) {
                ctx.found.push(ip);
                const d = parseDevice(ip, raw.get(r.n));
                d.fwCounters = r.d.fwCounters;
                ctx.devices.set(ip, d);
            } else ctx.failed.set(ip, `ssh: connect to host ${ip} port 22: ${/DROP/.test(fwBlocker(f)) ? 'Connection timed out' : 'Connection refused'} (${fwBlocker(f)})`);
        }
        Object.assign(ctx.ping, this.pings(plan.pcPing || []));
        for (const target of plan.http || []) {
            const [ip, port] = target.split(':');
            const f = fwFlow(net, this.viewer, ip, port === '8000' ? 'http8000' : 'web');
            ctx.http.set(target, f.ok ? { ip, ok: true, status: 200 } : { ip, ok: false });
        }
        if (plan.local) ctx.local = { hostname: 'demo', interfaces: [{ name: 'Ethernet (demo)', address: this.viewer, netmask: '255.255.255.0' }], gateways: [{ gateway: l5Gw(this.viewer), iface: this.viewer }] };
        return ctx;
    },

    // Output of the show commands of the terminal for a simulated router.
    term(ip, ids, commands) {
        const r = this.ownerOf(ip);
        if (!r) return `${ip} is not simulated in the demo (only the four routers are).`;
        const s = this.cache.raw.get(r.n), d = r.d;
        const out = {
            board: s.board,
            uptime: ' 10:42:07 up  1:12,  load average: 0.02, 0.04, 0.01',
            addr: `lo               UNKNOWN        127.0.0.1/8\nbr-lan           UP             ${L2.r1(r.n)}/24\nlan2@eth0        UP             ${L2.r2(r.n)}/24\nwan@eth0         DOWN`,
            route: s.route,
            netcfg: s.uci,
            fwcfg: s.fwuci,
            fwrules: d5Ruleset(d),
            fwcount: s.fwcount || '(no own rules)',
            conntrack: d5Conntrack(this.cache.net, r.label, this.viewer)
        };
        const one = id => out[id] != null ? out[id] : '(not simulated in the demo)';
        if (ids.length === 1) return one(ids[0]);
        return ids.map(id => { const c = commands.find(x => x.id === id) || { title: id, cmd: id }; return `### ${c.title}\n$ ${c.cmd.replace(/\{bridge\}/g, 'br-lan')}\n${one(id)}`; }).join('\n\n');
    },

    // The scenario and viewer pickers, used on the Monitor and on the Check tab.
    controls(box, onChange) {
        const sc = this.current();
        const dept = h => sc.ex === 'ex4' ? ` · ${D5_DEPT[h.split('.')[2]]}` : '';
        box.hidden = false;
        box.innerHTML = `
            <span class="stp-badge stp-badge--warn">Demo</span>
            <label class="stp-demo-field">Scenario <select class="stp-demo-select cursor-pointer" data-demo="scenario">${DEMO5_SCENARIOS.map(s => `<option value="${s.id}"${s.id === sc.id ? ' selected' : ''}>${esc(s.label)}</option>`).join('')}</select></label>
            <label class="stp-demo-field">This PC <select class="stp-demo-select cursor-pointer" data-demo="viewer">${D5_HOSTS.map(h => `<option value="${h}"${h === this.viewer ? ' selected' : ''}>${h} (gateway ${l5Gw(h)})${dept(h)}</option>`).join('')}</select></label>
            <span class="stp-muted">Simulated routers, nothing is sent to a device. Hover an address for the path of the ping.</span>`;
        box.onchange = e => {
            const t = e.target.dataset.demo;
            if (t === 'scenario') this.setScenario(e.target.value);
            if (t === 'viewer') this.setViewer(e.target.value);
            this.controls(box, onChange);
            onChange();
        };
    }
};

// A short, simplified "fw4 print": the chains of zone lan (or labo) with the own rules in order.
function d5NftMatch(r) {
    const set = l => l.length > 1 ? `{ ${l.join(', ')} }` : l[0];
    const parts = [];
    if (r.srcIp.length) parts.push(`ip saddr ${set(r.srcIp)}`);
    if (r.destIp.length) parts.push(`ip daddr ${set(r.destIp)}`);
    if (!r.proto.includes('all')) {
        if (r.proto.length === 1 && r.proto[0] === 'icmp') parts.push(r.icmp.length ? `icmp type ${set(r.icmp)}` : 'meta l4proto icmp');
        else if (r.destPort.length) parts.push(`${r.proto.length > 1 ? 'meta l4proto { tcp, udp } th' : r.proto[0]} dport ${set(r.destPort)}`);
        else parts.push(`meta l4proto ${set(r.proto)}`);
    }
    return parts.join(' ');
}

function d5NftAction(r) {
    const zone = r.dest ? (r.dest === '*' ? '' : r.dest) : r.src;
    if (r.target === 'ACCEPT') return 'accept';
    if (r.target === 'DROP') return 'drop';
    return r.dest ? 'jump handle_reject' : `jump reject_from_${zone}`;
}

function d5Ruleset(d) {
    const own = d.fw.rules.filter(r => r.enabled && r.src !== 'wan');
    const zones = d.fw.zones.filter(z => z.name !== 'wan' && z.networks.length);
    const dev = net => (d.uci.sections.find(s => s.name === net) || { opts: {} }).opts.device || net;
    const line = r => `\t\t${d5NftMatch(r)} counter packets ${d.fwCounters[r.name] || 0} bytes ${(d.fwCounters[r.name] || 0) * 60} ${d5NftAction(r)} comment "!fw4: ${r.name}"`;
    const out = ['# simplified output of the demo (the real fw4 print has more chains)', 'table inet fw4 {',
        '\tchain input {', '\t\ttype filter hook input priority filter; policy drop;', '\t\tiifname "lo" accept comment "!fw4: Accept traffic from loopback"',
        '\t\tct state vmap { established : accept, related : accept } comment "!fw4: Handle inbound flows"',
        ...zones.map(z => `\t\tiifname { ${z.networks.map(dev).map(x => `"${x}"`).join(', ')} } jump input_${z.name} comment "!fw4: Handle ${z.name} IPv4/IPv6 input traffic"`),
        '\t\tjump handle_reject', '\t}', '',
        '\tchain forward {', '\t\ttype filter hook forward priority filter; policy drop;',
        '\t\tct state vmap { established : accept, related : accept } comment "!fw4: Handle forwarded flows"',
        ...own.filter(r => r.src === '*' && r.dest).map(line),
        ...zones.map(z => `\t\tiifname { ${z.networks.map(dev).map(x => `"${x}"`).join(', ')} } jump forward_${z.name} comment "!fw4: Handle ${z.name} IPv4/IPv6 forward traffic"`),
        '\t\tjump handle_reject', '\t}'];
    for (const z of zones) {
        out.push('', `\tchain input_${z.name} {`, ...own.filter(r => r.src === z.name && !r.dest).map(line), `\t\tjump ${z.input.toLowerCase()}_from_${z.name}`, '\t}');
        out.push('', `\tchain forward_${z.name} {`, ...own.filter(r => r.src === z.name && r.dest).map(line),
            ...d.fw.forwardings.filter(f => f.src === z.name).map(f => `\t\tjump accept_to_${f.dest} comment "!fw4: Accept ${f.src} to ${f.dest} forwarding"`),
            `\t\tjump ${z.forward.toLowerCase()}_to_${z.name}`, '\t}');
    }
    out.push('}');
    return out.join('\n');
}

// The connections this router tracks after a ping from the viewer to every other host (only the ones it let through).
function d5Conntrack(net, label, viewer) {
    const lines = [];
    let id = 1;
    for (const dst of D5_HOSTS.filter(h => h !== viewer)) {
        const f = fwFlow(net, viewer, dst, 'ping');
        if (f.request.hops.some(h => h.router === label && h.verdict === 'ACCEPT' && h.kind === 'forward')) {
            lines.push(`ipv4     2 icmp     1 ${20 + (id % 9)} src=${viewer} dst=${dst} type=8 code=0 id=${1000 + id} ${f.ok ? '' : '[UNREPLIED] '}src=${dst} dst=${viewer} type=0 code=0 id=${1000 + id} mark=0 zone=0 use=2`);
            id++;
        }
    }
    return lines.length ? `# demo: after a ping from ${viewer} to every other host\n${lines.join('\n')}` : `# demo: no ping from ${viewer} to another host passes ${label}`;
}
