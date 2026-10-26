/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 26/10/2026
**/

'use strict';

// Parsers for the output of the read-only commands of /api/facts, and the collector that gathers everything
// a lab checker needs: facts of the switches and routers, pings from this PC, pings from the devices, the PC's own network settings.

/* ---------- Parsers ---------- */

// "ip -o -4 addr show": [{ ifname, ip, prefix, mask }]
function parseAddr(text) {
    const out = [];
    for (const line of (text || '').split('\n')) {
        const m = line.match(/^\d+:\s+(\S+?)(?:@\S+)?\s+inet\s+(\d+\.\d+\.\d+\.\d+)\/(\d+)/);
        if (m) out.push({ ifname: m[1], ip: m[2], prefix: Number(m[3]), mask: prefixToMask(Number(m[3])) });
    }
    return out;
}

// "ip route": [{ dst, via, dev, proto }] (dst "default" is kept as "default")
function parseRoutes(text) {
    const out = [];
    for (const line of (text || '').split('\n')) {
        const m = line.match(/^(default|\d+\.\d+\.\d+\.\d+(?:\/\d+)?)\s*(.*)$/);
        if (!m) continue;
        const rest = m[2];
        out.push({
            dst: m[1],
            via: (rest.match(/\bvia\s+(\S+)/) || [])[1] || null,
            dev: (rest.match(/\bdev\s+(\S+)/) || [])[1] || null,
            proto: (rest.match(/\bproto\s+(\S+)/) || [])[1] || null
        });
    }
    return out;
}

// "uci show network": a flat map plus a list of sections [{ name, type, opts }]
function parseUci(text) {
    const map = {};
    const sections = new Map();
    for (const line of (text || '').split('\n')) {
        const m = line.match(/^([\w.@\[\]-]+?)=(.*)$/);
        if (!m) continue;
        const key = m[1];
        const val = m[2].replace(/^'|'$/g, '').replace(/'\s+'/g, ' ');
        map[key] = val;
        const parts = key.split('.');
        if (parts.length === 2) sections.set(parts[1], { name: parts[1], type: val, opts: {} });
        else if (parts.length === 3 && sections.has(parts[1])) sections.get(parts[1]).opts[parts[2]] = val;
    }
    return { map, sections: [...sections.values()] };
}

// "ip -o link show": { lan1: { up, carrier, master, state } }
function parseLinks(text) {
    const out = {};
    for (const line of (text || '').split('\n')) {
        const m = line.match(/^\d+:\s+(\S+?)(?:@\S+)?:\s+<([^>]*)>/);
        if (!m) continue;
        const flags = m[2].split(',');
        out[m[1]] = { up: flags.includes('UP'), carrier: flags.includes('LOWER_UP'), master: (line.match(/master\s+(\S+)/) || [])[1] || null, state: (line.match(/state\s+(\S+)/) || [])[1] || null };
    }
    return out;
}

// "brctl show": [{ name, id, stp, ports }]
function parseBrctl(text) {
    const out = [];
    for (const line of (text || '').split('\n').slice(1)) {
        if (!line.trim()) continue;
        if (/^\s/.test(line) && out.length) { out[out.length - 1].ports.push(line.trim()); continue; }
        const f = line.trim().split(/\s+/);
        out.push({ name: f[0], id: f[1], stp: f[2] === 'yes', ports: f.slice(3) });
    }
    return out;
}

// "brctl showstp <bridge>" for every bridge, introduced by "## <bridge>"
function parseStpFacts(text) {
    const result = {};
    let name = null, buf = [];
    const flush = () => { if (name) result[name] = parseStpText(buf.join('\n')); };
    for (const line of (text || '').split('\n')) {
        const m = line.match(/^## (\S+)/);
        if (m) { flush(); name = m[1]; buf = []; } else buf.push(line);
    }
    flush();
    return result;
}

function parseStpText(text) {
    const pick = (t, re) => { const m = t.match(re); return m ? m[1].toLowerCase() : null; };
    const num = (t, re) => { const m = t.match(re); return m ? Number(m[1]) : 0; };
    const head = text.split(/\n\S+ \(\d+\)/)[0];
    const bridgeId = pick(head, /^\s*bridge id\s+(\S+)/m);
    if (!bridgeId) return null;
    return {
        bridgeId, priority: parseInt(bridgeId.split('.')[0], 16),
        root: pick(head, /^\s*designated root\s+(\S+)/m),
        rootCost: num(head, /root port\s+\d+\s+path cost\s+(\d+)/m),
        maxAge: num(head, /^\s*max age\s+([\d.]+)/m), helloTime: num(head, /^\s*hello time\s+([\d.]+)/m), forwardDelay: num(head, /^\s*forward delay\s+([\d.]+)/m),
        ports: [...text.matchAll(/^(\S+) \((\d+)\)\s*\n([\s\S]*?)(?=^\S+ \(\d+\)|$(?![\s\S]))/gm)].map(m => ({ name: m[1], no: Number(m[2]), state: pick(m[3], /state\s+(\w+)/) }))
    };
}

// "bridge vlan show": { lan1: { 1: { untagged: true, pvid: true }, 2: { untagged: false, pvid: false } } }
function parseBridgeVlan(text) {
    const out = {};
    let port = null;
    for (const raw of (text || '').split('\n')) {
        if (!raw.trim() || /^port\s+vlan-id/i.test(raw)) continue;
        const m = raw.match(/^(\S+)?\s+(\d+)\b(.*)$/);
        if (!m) continue;
        if (m[1]) port = m[1];
        if (!port) continue;
        const flags = m[3];
        (out[port] = out[port] || {})[Number(m[2])] = { untagged: /Untagged/i.test(flags), pvid: /PVID/i.test(flags) };
    }
    return out;
}

// "/proc/net/vlan/config": [{ name, id, base }]
function parseVlanProc(text) {
    const out = [];
    for (const line of (text || '').split('\n')) {
        const m = line.match(/^(\S+)\s*\|\s*(\d+)\s*\|\s*(\S+)/);
        if (m) out.push({ name: m[1], id: Number(m[2]), base: m[3] });
    }
    return out;
}

// "vtysh -c 'show ip route'": [{ code, dst, via, dev }]
function parseVtyRoutes(text) {
    const out = [];
    for (const line of (text || '').split('\n')) {
        const m = line.match(/^([A-Z])[>*\s]+(\d+\.\d+\.\d+\.\d+\/\d+)\s+(.*)$/);
        if (!m) continue;
        out.push({ code: m[1], dst: m[2], via: (m[3].match(/via\s+(\d+\.\d+\.\d+\.\d+)/) || [])[1] || null, dev: (m[3].match(/(?:via\s+\S+,\s+|connected,\s+)(\S+?)[, ]/) || [])[1] || null });
    }
    return out;
}

// "vtysh -c 'show ip ospf neighbor'": [{ id, state, address, iface }]
function parseOspfNeighbors(text) {
    const out = [];
    for (const line of (text || '').split('\n')) {
        const m = line.match(/^(\d+\.\d+\.\d+\.\d+)\s+\d+\s+(\S+)\s+\S+\s+\S+\s+(\d+\.\d+\.\d+\.\d+)\s+(\S+)/);
        if (m) out.push({ id: m[1], state: m[2].split('/')[0], address: m[3], iface: m[4] });
    }
    return out;
}

function parseBoard(text) {
    try { return JSON.parse(text); } catch { return null; }
}

// Everything the checkers need about one device, parsed from the raw sections.
function parseDevice(ip, sections) {
    const s = sections || {};
    const board = parseBoard(s.board || '');
    const model = board ? `${board.model || ''} ${board.board_name || ''}` : '';
    const d = {
        ip, ok: true, raw: s,
        model: board ? (board.model || board.board_name || '') : '',
        release: board && board.release ? board.release.description || board.release.version : '',
        role: /gs108|netgear/i.test(model) ? 'switch' : /rt-?ax53|asus/i.test(model) ? 'router' : 'unknown',
        time: Number(s.time) || null,
        addrs: parseAddr(s.addr),
        routes: parseRoutes(s.route),
        forwarding: (s.fwd || '').trim() === '1',
        firewallRunning: Number((s.firewall || '0').trim()) > 0,
        uci: parseUci(s.uci),
        links: parseLinks(s.links),
        bridges: parseBrctl(s.brctl),
        stp: parseStpFacts(s.stp),
        vlan: parseBridgeVlan(s.vlan),
        vlanDevs: parseVlanProc(s.vlanproc),
        packages: new Set((s.opkg || '').split('\n').map(l => l.split(' - ')[0].trim()).filter(Boolean)),
        frrDaemons: Object.fromEntries((s.frrdaemons || '').split('\n').map(l => l.split('=')).filter(a => a.length === 2)),
        frrRunning: new Set((s.frrrun || '').split('\n').map(l => l.trim()).filter(Boolean)),
        vtyRoutes: parseVtyRoutes(s.vtyroute),
        ospfNeighbors: parseOspfNeighbors(s.ospfnbr),
        ripText: s.ripdb || '',
        clsact: (s.tc || '').trim().length > 0,
        internet: (s.internet || '').trim() === 'up'
    };
    d.defaultGw = (d.routes.find(r => r.dst === 'default') || {}).via || null;
    return d;
}

/* ---------- Collector ---------- */

// plan = { candidates: [ip], sections: [name], pcPing: [ip], devPing: { srcIp: [targets] }, http: [ip], stp: bool, local: bool }
async function collect(plan, progress = () => { }) {
    const ctx = { devices: new Map(), failed: new Map(), ping: {}, dev: new Map(), http: new Map(), local: null, model: null, time: Date.now() };

    progress('Looking for devices...');
    const found = plan.candidates.length ? (await api(`/api/discoverAny?ips=${plan.candidates.join(',')}`)).found : [];
    ctx.found = found;

    progress(`Reading ${found.length} device(s)...`);
    if (found.length) {
        const data = await api(`/api/facts?ips=${found.join(',')}&sections=${plan.sections.join(',')}`);
        for (const d of data.devices) {
            if (d.ok) ctx.devices.set(d.ip, parseDevice(d.ip, d.sections)); else ctx.failed.set(d.ip, d.error);
        }
    }

    const jobs = [];
    if (plan.pcPing && plan.pcPing.length) {
        jobs.push(api(`/api/ping?ips=${plan.pcPing.join(',')}`).then(r => { ctx.ping = r.results; }));
    }
    for (const [src, targets] of Object.entries(plan.devPing || {})) {
        if (!ctx.devices.has(src)) continue;
        jobs.push(api(`/api/devping?ip=${src}&targets=${targets.join(',')}`).then(r => { if (r.ok) ctx.dev.set(src, r.results); }).catch(() => { /* device unreachable */ }));
    }
    for (const ip of plan.http || []) jobs.push(api(`/api/http?ip=${ip}`).then(r => { ctx.http.set(ip, r); }).catch(() => { /* ignored */ }));
    if (plan.local) jobs.push(api('/api/local').then(r => { ctx.local = r; }).catch(() => { ctx.local = null; }));
    if (plan.stp) {
        const ips = found.filter(ip => ctx.devices.has(ip) && ctx.devices.get(ip).role !== 'router');
        if (ips.length) jobs.push(api(`/api/stp?ips=${ips.join(',')}&bridge=${encodeURIComponent(S.bridge)}`).then(r => { ctx.model = buildModel(r); }).catch(() => { /* ignored */ }));
    }
    progress('Testing connectivity...');
    await Promise.all(jobs);
    return ctx;
}
