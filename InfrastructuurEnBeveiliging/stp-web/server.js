#!/usr/bin/env node
/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 26/10/2026
**/

// Small local web server for the STP monitor (no npm packages needed, only Node 18 or newer).
// A browser cannot do SSH itself, so this server does it for the page: per request it reads
// "brctl showstp <bridge>" from all requested switches (in parallel) and returns the result as JSON.
// It also serves the switch logs and a fixed list of read-only "show" commands.
// By default it listens on all network interfaces, so everyone on the network can open the page
// with http://<ip of this PC>:8080. The page only gets the fixed read-only commands below.
//
// Usage:
//   node server.js                       # then open http://localhost:8080 (others: http://<ip of this PC>:8080)
//   PORT=9000 node server.js             # other port (PowerShell: $env:PORT = 9000; node server.js)
//   HOST=127.0.0.1 node server.js        # only this PC (PowerShell: $env:HOST = '127.0.0.1')
//   STP_PASSWORD=secret node server.js   # ask for a password (any user name, this password)
//   http://localhost:8080/?demo=fig2     # demo without switches (Figure 2 with 8 switches)

'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');
const net = require('net');
const crypto = require('crypto');
const { execFile, spawn } = require('child_process');

const PORT = Number(process.env.PORT || 8080);
const HOST = process.env.HOST || '0.0.0.0';
const PASSWORD = process.env.STP_PASSWORD || '';
const ROOT = __dirname;

const MIME = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.ico': 'image/x-icon',
    '.woff2': 'font/woff2',
    '.json': 'application/json; charset=utf-8'
};

// ---------- Reading STP over SSH ----------

// Ignore host keys: the same IPs are reused on different devices (otherwise "HOST IDENTIFICATION HAS CHANGED").
// Every SSH call gets its own throw-away known_hosts file. A fixed path such as /dev/null or NUL does not work on every
// ssh build (Git's ssh treats "NUL" as a real file name and creates a file called NUL, which Windows and Git cannot handle).
function knownHostsFile() {
    return path.join(os.tmpdir(), `stp-kh-${process.pid}-${crypto.randomBytes(4).toString('hex')}`).replace(/\\/g, '/');
}

function sshOptions(knownHosts, connectTimeout = 3) {
    return [
        '-o', 'StrictHostKeyChecking=no',
        '-o', `UserKnownHostsFile=${knownHosts}`,
        '-o', 'LogLevel=ERROR',
        '-o', 'BatchMode=yes',
        '-o', `ConnectTimeout=${connectTimeout}`
    ];
}


function parseStp(text) {
    const headerLines = [];
    const blocks = [];
    let cur = null;
    for (const raw of text.split('\n')) {
        const line = raw.replace(/\r$/, '');
        const m = line.match(/^(\S+)\s+\((\d+)\)\s*$/);
        if (m) {
            cur = { name: m[1], no: Number(m[2]), lines: [] };
            blocks.push(cur);
        } else if (cur) {
            cur.lines.push(line);
        } else {
            headerLines.push(line);
        }
    }
    const h = headerLines.join('\n');
    const pick = (t, re) => { const m = t.match(re); return m ? m[1].toLowerCase() : null; };
    const num = (t, re) => { const m = t.match(re); return m ? Number(m[1]) : 0; };

    const bridgeId = pick(h, /^\s*bridge id\s+(\S+)/m);
    const root = pick(h, /^\s*designated root\s+(\S+)/m);
    if (!bridgeId || !root) return null;

    const ports = blocks.map(b => {
        const t = b.lines.join('\n');
        return {
            name: b.name,
            no: b.no,
            portId: pick(t, /^\s*port id\s+(\S+)/m),
            state: pick(t, /state\s+(\w+)/),
            cost: num(t, /^\s*designated root\s+\S+\s+path cost\s+(\d+)/m),
            desBridge: pick(t, /^\s*designated bridge\s+(\S+)/m),
            desPort: pick(t, /^\s*designated port\s+(\S+)/m)
        };
    });

    const flags = (h.match(/^\s*flags[ \t]*(.*)$/m) || [, ''])[1].trim();
    return {
        bridgeId,
        root,
        rootPort: num(h, /^\s*root port\s+(\d+)/m),
        rootCost: num(h, /root port\s+\d+\s+path cost\s+(\d+)/m),
        maxAge: num(h, /^\s*max age\s+([\d.]+)/m),
        helloTime: num(h, /^\s*hello time\s+([\d.]+)/m),
        forwardDelay: num(h, /^\s*forward delay\s+([\d.]+)/m),
        topologyChange: /TOPOLOGY_CHANGE/.test(flags),
        ports
    };
}

// Many people can have the page open at the same time. Identical requests within a short time share one SSH call,
// so the switches are not hit once per visitor.
const cache = new Map();   // key -> { at, promise }
function cached(key, ttl, fn) {
    const hit = cache.get(key);
    if (hit && Date.now() - hit.at < ttl) return hit.promise;
    const promise = fn();
    cache.set(key, { at: Date.now(), promise });
    if (cache.size > 500) for (const [k, v] of cache) if (Date.now() - v.at > 60000) cache.delete(k);
    return promise;
}

const readSwitch = (ip, bridge) => cached(`stp|${ip}|${bridge}`, 800, () => readSwitchRaw(ip, bridge));

function readSwitchRaw(ip, bridge, connectTimeout = 3) {
    const kh = knownHostsFile();
    return new Promise(resolve => {
        const child = execFile('ssh', [...sshOptions(kh, connectTimeout), `root@${ip}`, `brctl showstp ${bridge}`],
            { timeout: connectTimeout === 3 ? 8000 : 5000, windowsHide: true, maxBuffer: 1024 * 1024 },
            (err, stdout, stderr) => {
                fs.unlink(kh, () => { /* may not exist */ });
                const text = String(stdout || '');
                if (err && !text.trim()) {
                    const why = String(stderr || err.message || '').trim().split('\n').pop();
                    return resolve({ ip, ok: false, error: why || 'not reachable' });
                }
                if (/does not exist/.test(text) || /does not exist/.test(String(stderr))) {
                    return resolve({ ip, ok: false, error: `bridge "${bridge}" does not exist` });
                }
                const parsed = parseStp(text);
                resolve(parsed ? { ip, ok: true, ...parsed } : { ip, ok: false, error: 'output not recognised' });
            });
        child.stdin.end();   // ssh does not need to read anything from stdin
    });
}

// Finds the switches among a list of candidate IPs: the ones that answer "brctl showstp" (a few at a time, short timeout).
function discover(ips, bridge) {
    return cached(`discover|${ips.join(',')}|${bridge}`, 20000, async () => {
        const found = [];
        let next = 0;
        const worker = async () => {
            while (next < ips.length) {
                const ip = ips[next++];
                if ((await readSwitchRaw(ip, bridge, 2)).ok) found.push(ip);
            }
        };
        await Promise.all(Array.from({ length: Math.min(12, ips.length) }, worker));
        return found.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
    });
}

// ---------- Demo: a small STP simulator ----------
// Calculates root, root ports, designated ports and blocking ports of a topology like a real
// 802.1D switch (lowest bridge ID wins, shortest path to the root, lowest bridge/port as tie-break).

const DEMOS = {
    fig1: {
        title: 'Figure 1 (access network)',
        priority: { '10.1.1.4': 4096 },
        hosts: { '10.1.1.1': [1, 2], '10.1.2.1': [1, 2] },
        links: [
            ['10.1.1.4', 1, '10.1.1.1', 4], ['10.1.1.4', 2, '10.1.2.1', 4], ['10.1.1.1', 3, '10.1.2.1', 3]
        ]
    },
    // Port numbers as in Figure 2 of the assignment.
    fig2: {
        title: 'Figure 2 (core network, 8 switches)',
        priority: { '10.1.2.5': 4096, '10.1.4.5': 8192 },
        hosts: { '10.1.1.1': [1, 2], '10.1.2.1': [1, 2], '10.1.3.1': [1, 2], '10.1.4.1': [1, 2] },
        links: [
            ['10.1.1.5', 1, '10.1.1.1', 4], ['10.1.1.5', 2, '10.1.2.1', 4], ['10.1.3.5', 4, '10.1.3.1', 3], ['10.1.3.5', 5, '10.1.4.1', 4],
            ['10.1.1.1', 3, '10.1.2.1', 3], ['10.1.3.1', 4, '10.1.4.1', 3],
            ['10.1.2.5', 1, '10.1.1.5', 5], ['10.1.2.5', 2, '10.1.3.5', 2], ['10.1.2.5', 3, '10.1.4.5', 1],
            ['10.1.1.5', 3, '10.1.3.5', 1], ['10.1.1.5', 4, '10.1.4.5', 2], ['10.1.3.5', 3, '10.1.4.5', 3]
        ]
    }
};

// Figure 3: Figure 2 with four extra links from an access switch to an extra core switch.
DEMOS.fig3 = {
    ...DEMOS.fig2,
    title: 'Figure 3 (extra loops)',
    links: [
        ...DEMOS.fig2.links,
        ['10.1.2.5', 4, '10.1.1.1', 5], ['10.1.3.5', 6, '10.1.2.1', 5], ['10.1.1.5', 6, '10.1.3.1', 5], ['10.1.4.5', 4, '10.1.4.1', 5]
    ]
};

// Figure 4: Figure 3 plus extra cables and two extra switches that nobody drew, to show the automatic discovery.
DEMOS.fig4 = {
    ...DEMOS.fig3,
    title: 'Figure 4 (extra, found automatically)',
    hosts: { ...DEMOS.fig3.hosts, '10.1.5.1': [1, 2] },
    links: [
        ...DEMOS.fig3.links,
        ['10.1.5.5', 1, '10.1.1.5', 7], ['10.1.5.5', 2, '10.1.3.5', 7], ['10.1.5.1', 4, '10.1.5.5', 3], ['10.1.5.1', 3, '10.1.4.1', 6]
    ]
};

const demoState = {};   // per preset: { cuts:Set, from:Map, changedAt }

function fakeMac(ip) {
    const [, , g, t] = ip.split('.').map(Number);
    return '54077d20' + (g * 16 + t).toString(16).padStart(2, '0') + ((t * 37 + g * 11) & 255).toString(16).padStart(2, '0');
}

function linkId(l) { return `${l[0]}:lan${l[1]}|${l[2]}:lan${l[3]}`; }

// Returns the final state of every port of the demo network (without the transition phase).
function simulate(demo, cuts) {
    const ips = [...new Set(demo.links.flatMap(l => [l[0], l[2]]))];
    const sw = new Map(ips.map(ip => {
        const prio = demo.priority[ip] || 32767;
        return [ip, { ip, bid: prio.toString(16).padStart(4, '0') + '.' + fakeMac(ip), ports: new Map() }];
    }));
    const live = demo.links.filter(l => !cuts.has(linkId(l)));
    const pid = n => (0x8000 + n).toString(16);
    const COST = 4;

    const root = [...sw.values()].sort((a, b) => a.bid < b.bid ? -1 : 1)[0];
    // Shortest path to the root (Bellman-Ford is enough for a few switches).
    const rpc = new Map(ips.map(ip => [ip, ip === root.ip ? 0 : Infinity]));
    for (let i = 0; i < ips.length; i++) {
        for (const [a, , b] of live) {
            if (rpc.get(a) + COST < rpc.get(b)) rpc.set(b, rpc.get(a) + COST);
            if (rpc.get(b) + COST < rpc.get(a)) rpc.set(a, rpc.get(b) + COST);
        }
    }
    const better = (x, y) => { for (let i = 0; i < x.length; i++) { if (x[i] !== y[i]) return x[i] < y[i]; } return false; };
    const offer = (ip, port) => [rpc.get(ip), sw.get(ip).bid, port];   // what this port offers on the link

    // Root port per switch: the port whose far end makes the best offer.
    const rootPort = new Map();
    for (const ip of ips) {
        if (ip === root.ip || rpc.get(ip) === Infinity) continue;
        let best = null;
        for (const [a, pa, b, pb] of live) {
            const mine = a === ip ? pa : b === ip ? pb : 0;
            if (!mine) continue;
            const other = a === ip ? [b, pb] : [a, pa];
            const o = offer(other[0], other[1]);
            const cand = [o[0] + COST, o[1], o[2], mine];
            if (!best || better(cand, best.cand)) best = { cand, port: mine };
        }
        if (best) rootPort.set(ip, best.port);
    }

    const record = (ip, port, state, desIp, desPort) => sw.get(ip).ports.set(port, {
        name: `lan${port}`, no: port, portId: pid(port), state, cost: COST, desBridge: sw.get(desIp).bid, desPort: pid(desPort)
    });
    for (const [a, pa, b, pb] of live) {
        const aWins = better(offer(a, pa), offer(b, pb));
        const [d, pd, o, po] = aWins ? [a, pa, b, pb] : [b, pb, a, pa];
        record(d, pd, 'forwarding', d, pd);                               // designated
        record(o, po, rootPort.get(o) === po ? 'forwarding' : 'blocking', d, pd);   // root port of alternate
    }
    for (const [ip, ports] of Object.entries(demo.hosts)) for (const p of ports) record(ip, p, 'forwarding', ip, p);

    return { sw, root, rootPort, rpc };
}

function demoResponse(name) {
    const demo = DEMOS[name];
    if (!demo) return null;
    const st = demoState[name] || (demoState[name] = { cuts: new Set(), from: new Map(), changedAt: 0 });
    const sim = simulate(demo, st.cuts);
    const age = (Date.now() - st.changedAt) / 1000;

    const switches = [...sim.sw.values()].map(s => {
        const ports = [];
        for (let n = 1; n <= 8; n++) {
            const p = s.ports.get(n) || { name: `lan${n}`, no: n, portId: (0x8000 + n).toString(16), state: 'disabled', cost: 4, desBridge: s.bid, desPort: (0x8000 + n).toString(16) };
            let state = p.state;
            // After a change a port that becomes forwarding first goes through listening and learning (2 x forward delay = 4 s).
            const before = st.from.get(`${s.ip}:${n}`);
            if (st.changedAt && age < 4 && before && before !== state && state === 'forwarding') state = age < 2 ? 'listening' : 'learning';
            ports.push({ ...p, state });
        }
        return {
            ip: s.ip, ok: true, bridgeId: s.bid, root: sim.root.bid,
            rootPort: sim.rootPort.get(s.ip) || 0, rootCost: sim.rpc.get(s.ip) === Infinity ? 0 : sim.rpc.get(s.ip),
            maxAge: 20, helloTime: 2, forwardDelay: 2, topologyChange: age < 4 && !!st.changedAt, ports
        };
    });
    return {
        demo: name,
        title: demo.title,
        time: Date.now(),
        ips: switches.map(s => s.ip),
        links: demo.links.map(l => ({ id: linkId(l), cut: st.cuts.has(linkId(l)) })),
        switches
    };
}

function demoToggleCut(name, id) {
    const demo = DEMOS[name];
    if (!demo || !demo.links.some(l => linkId(l) === id)) return false;
    const st = demoState[name] || (demoState[name] = { cuts: new Set(), from: new Map(), changedAt: 0 });
    // Remember the current state so new forwarding ports go through listening and learning for a moment.
    const now = simulate(demo, st.cuts);
    st.from = new Map();
    for (const s of now.sw.values()) for (const [n, p] of s.ports) st.from.set(`${s.ip}:${n}`, p.state);
    if (st.cuts.has(id)) st.cuts.delete(id); else st.cuts.add(id);
    st.changedAt = Date.now();

    // Write kernel-style log lines for everything that changes, like a real switch would.
    const after = simulate(demo, st.cuts);
    const [a, pa, b, pb] = demo.links.find(l => linkId(l) === id);
    const up = !st.cuts.has(id);
    pushDemoLog(name, a, `lan${pa}: link is ${up ? 'up' : 'down'}`);
    pushDemoLog(name, b, `lan${pb}: link is ${up ? 'up' : 'down'}`);
    for (const s of after.sw.values()) {
        for (const [n, p] of s.ports) {
            const was = st.from.get(`${s.ip}:${n}`);
            if (!was || was === p.state) continue;
            if (p.state === 'forwarding') {
                pushDemoLog(name, s.ip, `switch: port ${n}(lan${n}) entered listening state`);
                setTimeout(() => pushDemoLog(name, s.ip, `switch: port ${n}(lan${n}) entered learning state`), 2000);
                setTimeout(() => pushDemoLog(name, s.ip, `switch: port ${n}(lan${n}) entered forwarding state`), 4000);
            } else {
                pushDemoLog(name, s.ip, `switch: port ${n}(lan${n}) entered ${p.state} state`);
            }
        }
    }
    return true;
}

// ---------- Demo logs ----------

const demoLogs = {};   // per preset: Map ip -> [lines]

function logStamp(d) {
    return `${d.toDateString().slice(0, 10)} ${d.toTimeString().slice(0, 8)} ${d.getFullYear()}`;
}

function pushDemoLog(name, ip, message) {
    ensureDemoLogs(name);
    const logs = demoLogs[name];
    if (!logs.has(ip)) logs.set(ip, []);
    const lines = logs.get(ip);
    lines.push(`${logStamp(new Date())} kern.info kernel: [${(process.uptime() + 1000).toFixed(6).padStart(12)}] ${message}`);
    if (lines.length > 150) lines.shift();
}

// First use: the switches have just "booted" and every forwarding port has come up.
function ensureDemoLogs(name) {
    if (demoLogs[name]) return;
    demoLogs[name] = new Map();
    const sim = simulate(DEMOS[name], new Set());
    for (const s of sim.sw.values()) {
        pushDemoLog(name, s.ip, 'switch: STP enabled');
        for (const [n, p] of s.ports) if (p.state === 'forwarding') pushDemoLog(name, s.ip, `switch: port ${n}(lan${n}) entered forwarding state`);
    }
}

function demoLogLines(name, ip) {
    ensureDemoLogs(name);
    return (demoLogs[name].get(ip) || []).slice();
}

// ---------- Commands and logs over SSH ----------

// The page may only run these read-only commands. It sends an id, never a command line.
const COMMANDS = [
    { id: 'stp', group: 'STP', title: 'STP status of the bridge', cmd: 'brctl showstp {bridge}' },
    { id: 'bridges', group: 'STP', title: 'Bridges and their ports', cmd: 'brctl show' },
    { id: 'macs', group: 'STP', title: 'MAC address table', cmd: 'brctl showmacs {bridge}' },
    { id: 'stpparams', group: 'STP', title: 'STP settings (state, priority, timers)', cmd: 'for f in stp_state priority hello_time max_age forward_delay ageing_time; do printf "%-14s %s\\n" "$f" "$(cat /sys/class/net/{bridge}/bridge/$f)"; done' },
    { id: 'links', group: 'Interfaces', title: 'Link state of all interfaces', cmd: 'ip -br link' },
    { id: 'addr', group: 'Interfaces', title: 'IP addresses', cmd: 'ip -br addr' },
    { id: 'stats', group: 'Interfaces', title: 'Packet counters per interface', cmd: 'ip -s link' },
    { id: 'route', group: 'Interfaces', title: 'Routes', cmd: 'ip route' },
    { id: 'neigh', group: 'Interfaces', title: 'ARP / neighbours', cmd: 'ip neigh' },
    { id: 'netcfg', group: 'Configuration', title: 'Network configuration (uci)', cmd: 'uci show network' },
    { id: 'board', group: 'System', title: 'Board and firmware', cmd: 'ubus call system board' },
    { id: 'uptime', group: 'System', title: 'Uptime and load', cmd: 'uptime' },
    { id: 'mem', group: 'System', title: 'Memory', cmd: 'free' },
    { id: 'logstp', group: 'Logs', title: 'STP and link messages (last 100)', cmd: "(logread 2>/dev/null || dmesg) | grep -i -E 'port|link|stp|forwarding|blocking|learning|listening' | tail -n 100" },
    { id: 'logall', group: 'Logs', title: 'System log (last 100)', cmd: '(logread 2>/dev/null || dmesg) | tail -n 100' },
    { id: 'dmesg', group: 'Logs', title: 'Kernel messages (last 100)', cmd: 'dmesg | tail -n 100' }
];

function sshRun(ip, remote, timeout = 10000) {
    return new Promise(resolve => {
        const kh = knownHostsFile();
        const child = execFile('ssh', [...sshOptions(kh), `root@${ip}`, remote],
            { timeout, windowsHide: true, maxBuffer: 4 * 1024 * 1024 },
            (err, stdout, stderr) => {
                fs.unlink(kh, () => { /* may not exist */ });
                const out = String(stdout || '');
                if (err && !out.trim()) {
                    return resolve({ ok: false, error: String(stderr || err.message || '').trim().split('\n').pop() || 'not reachable' });
                }
                resolve({ ok: true, output: out.replace(/\r/g, '') });
            });
        child.stdin.end();
    });
}

async function runCommands(ip, ids, bridge) {
    const chosen = ids.map(id => COMMANDS.find(c => c.id === id)).filter(Boolean);
    if (!chosen.length) return { ip, ok: false, error: 'no valid commands' };
    // One SSH call for all commands; every output starts after a marker line.
    const script = chosen.map(c => `echo "@@@${c.id}"; ${c.cmd.replace(/\{bridge\}/g, bridge)} 2>&1`).join('; ');
    const r = await sshRun(ip, script);
    if (!r.ok) return { ip, ok: false, error: r.error };
    const parts = {};
    let cur = null;
    for (const line of r.output.split('\n')) {
        const m = line.match(/^@@@(\w+)$/);
        if (m) { cur = m[1]; parts[cur] = []; } else if (cur) parts[cur].push(line);
    }
    return {
        ip, ok: true,
        sections: chosen.map(c => ({ id: c.id, title: c.title, cmd: c.cmd.replace(/\{bridge\}/g, bridge), output: (parts[c.id] || []).join('\n').replace(/\n+$/, '') }))
    };
}

const readLogs = ip => cached(`log|${ip}`, 2500, async () => {
    const r = await sshRun(ip, '(logread 2>/dev/null || dmesg) | tail -n 150', 8000);
    return r.ok ? { ip, ok: true, lines: r.output.split('\n').filter(Boolean) } : { ip, ok: false, error: r.error };
});

// Opens a real SSH session in a terminal window on this PC (the page itself never gets a free shell).
function openTerminal(ip) {
    // Same options as the monitor, but interactive: no BatchMode, so a password prompt is possible.
    const ssh = ['ssh', '-o', 'StrictHostKeyChecking=no', '-o', `UserKnownHostsFile=${knownHostsFile()}`, '-o', 'LogLevel=ERROR', `root@${ip}`];
    let child;
    if (process.platform === 'win32') {
        child = spawn('cmd.exe', ['/c', 'start', `SSH ${ip}`, 'cmd.exe', '/k', ...ssh], { detached: true, stdio: 'ignore' });
    } else if (process.platform === 'darwin') {
        child = spawn('osascript', ['-e', `tell application "Terminal" to do script "${ssh.join(' ')}"`], { detached: true, stdio: 'ignore' });
    } else {
        child = spawn('x-terminal-emulator', ['-e', ...ssh], { detached: true, stdio: 'ignore' });
    }
    child.on('error', () => { /* no terminal available */ });
    child.unref();
}

// ---------- HTTP ----------

function sendJson(res, status, body) {
    const data = JSON.stringify(body);
    res.writeHead(status, { 'Content-Type': MIME['.json'], 'Cache-Control': 'no-store' });
    res.end(data);
}

const IP_RE = /^\d{1,3}(\.\d{1,3}){3}$/;
const BRIDGE_RE = /^[A-Za-z0-9_.-]{1,15}$/;

// The API can reach your switches, so only requests from this page are accepted. The Host header must be an IP address,
// localhost or the name of this PC (blocks DNS rebinding) and a cross-site Origin is refused (blocks other websites).
function hostAllowed(host) {
    if (!host) return false;
    const name = host.replace(/:\d+$/, '').replace(/^\[|\]$/g, '').toLowerCase();
    const me = os.hostname().toLowerCase();
    return name === 'localhost' || net.isIP(name) !== 0 || name === me || name.startsWith(me + '.');
}

function fromThisPage(req) {
    if (!hostAllowed(req.headers.host)) return false;
    const origin = req.headers.origin;
    return !origin || origin === `http://${req.headers.host}`;
}

// Optional password (STP_PASSWORD). The browser asks for it once; any user name is fine.
function authorised(req) {
    if (!PASSWORD) return true;
    const h = req.headers.authorization || '';
    if (!h.startsWith('Basic ')) return false;
    const given = Buffer.from(Buffer.from(h.slice(6), 'base64').toString().split(':').slice(1).join(':'));
    const wanted = Buffer.from(PASSWORD);
    return given.length === wanted.length && crypto.timingSafeEqual(given, wanted);
}

// True when the visitor is on the same PC as the server (only they may open a terminal window on it).
function isLocalClient(req) {
    const addr = (req.socket.remoteAddress || '').replace(/^::ffff:/, '');
    const mine = new Set(['127.0.0.1', '::1', ...Object.values(os.networkInterfaces()).flat().map(i => i.address)]);
    return mine.has(addr);
}

function lanUrls() {
    return Object.values(os.networkInterfaces()).flat()
        .filter(i => i.family === 'IPv4' && !i.internal)
        .map(i => `http://${i.address}:${PORT}`);
}

const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, `http://${HOST}:${PORT}`);

    if (!authorised(req)) {
        res.writeHead(401, { 'WWW-Authenticate': 'Basic realm="STP monitor"' });
        return res.end('Password required');
    }

    if (url.pathname.startsWith('/api/') && !fromThisPage(req)) {
        return sendJson(res, 403, { error: 'forbidden' });
    }

    if (url.pathname === '/api/info') {
        return sendJson(res, 200, { local: isLocalClient(req), protected: !!PASSWORD, urls: lanUrls() });
    }

    if (url.pathname === '/api/discover') {
        const ips = [...new Set((url.searchParams.get('ips') || '').split(',').map(s => s.trim()).filter(Boolean))].slice(0, 64);
        const bridge = url.searchParams.get('bridge') || 'switch';
        if (!ips.length || !ips.every(ip => IP_RE.test(ip)) || !BRIDGE_RE.test(bridge)) return sendJson(res, 400, { error: 'invalid ips or bridge' });
        return sendJson(res, 200, { time: Date.now(), found: await discover(ips, bridge) });
    }

    if (url.pathname === '/api/commands') {
        return sendJson(res, 200, COMMANDS.map(({ id, group, title, cmd }) => ({ id, group, title, cmd })));
    }

    if (url.pathname === '/api/cmd') {
        const ip = url.searchParams.get('ip') || '';
        const bridge = url.searchParams.get('bridge') || 'switch';
        const ids = (url.searchParams.get('ids') || '').split(',').filter(id => /^\w+$/.test(id));
        if (!IP_RE.test(ip) || !BRIDGE_RE.test(bridge)) return sendJson(res, 400, { error: 'invalid ip or bridge' });
        if (url.searchParams.get('demo')) {
            const sections = ids.map(id => COMMANDS.find(c => c.id === id)).filter(Boolean).map(c => ({
                id: c.id, title: c.title, cmd: c.cmd.replace(/\{bridge\}/g, bridge), output: 'Demo mode: there is no real switch behind this.\nOpen the page without ?demo= to run commands on your switches.'
            }));
            return sendJson(res, 200, { ip, ok: true, sections });
        }
        return sendJson(res, 200, await runCommands(ip, ids, bridge));
    }

    if (url.pathname === '/api/logs') {
        const ips = (url.searchParams.get('ips') || '').split(',').map(s => s.trim()).filter(Boolean).slice(0, 24);
        if (!ips.length || !ips.every(ip => IP_RE.test(ip))) return sendJson(res, 400, { error: 'invalid ips' });
        const demo = url.searchParams.get('demo');
        if (demo && DEMOS[demo]) {
            return sendJson(res, 200, { time: Date.now(), switches: ips.map(ip => ({ ip, ok: true, lines: demoLogLines(demo, ip) })) });
        }
        return sendJson(res, 200, { time: Date.now(), switches: await Promise.all(ips.map(readLogs)) });
    }

    if (url.pathname === '/api/terminal' && req.method === 'POST') {
        // The terminal window opens on the PC that runs the server, so only someone sitting at that PC may ask for it.
        if (!isLocalClient(req)) return sendJson(res, 403, { error: 'only available on the PC that runs the server' });
        const ip = url.searchParams.get('ip') || '';
        if (!IP_RE.test(ip)) return sendJson(res, 400, { error: 'invalid ip' });
        openTerminal(ip);
        return sendJson(res, 200, { ok: true });
    }

    if (url.pathname === '/api/stp') {
        const ips = (url.searchParams.get('ips') || '').split(',').map(s => s.trim()).filter(Boolean).slice(0, 24);
        const bridge = url.searchParams.get('bridge') || 'switch';
        // Only real IPs and a safe bridge name: the values end up on an SSH command line.
        if (!ips.length || !ips.every(ip => IP_RE.test(ip)) || !BRIDGE_RE.test(bridge)) {
            return sendJson(res, 400, { error: 'invalid ips or bridge' });
        }
        const switches = await Promise.all(ips.map(ip => readSwitch(ip, bridge)));
        return sendJson(res, 200, { time: Date.now(), switches });
    }

    if (url.pathname === '/api/demo') {
        const body = demoResponse(url.searchParams.get('preset'));
        return body ? sendJson(res, 200, body) : sendJson(res, 404, { error: 'unknown demo' });
    }

    if (url.pathname === '/api/demo/cut' && req.method === 'POST') {
        const ok = demoToggleCut(url.searchParams.get('preset'), url.searchParams.get('link'));
        return sendJson(res, ok ? 200 : 404, { ok });
    }

    // Static files, only from this folder.
    const rel = url.pathname === '/' ? 'index.html' : decodeURIComponent(url.pathname.slice(1));
    const file = path.normalize(path.join(ROOT, rel));
    if (!file.startsWith(ROOT + path.sep) || file === __filename) {
        res.writeHead(404);
        return res.end('Not found');
    }
    fs.readFile(file, (err, data) => {
        if (err) {
            res.writeHead(404);
            return res.end('Not found');
        }
        res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
        res.end(data);
    });
});

if (require.main === module) {
    server.listen(PORT, HOST, () => {
        console.log('STP monitor running');
        console.log(`  This PC:         http://localhost:${PORT}`);
        if (HOST === '0.0.0.0' || HOST === '::') {
            for (const u of lanUrls()) console.log(`  On the network:  ${u}`);
            console.log(PASSWORD ? '  Password protected (STP_PASSWORD).' : '  No password set: anyone on the network can use it (STP_PASSWORD=... to protect it).');
            console.log('  If others cannot connect, allow Node.js through the Windows firewall.');
        }
        console.log(`  Demo:            http://localhost:${PORT}/?demo=fig4`);
    });
}

module.exports = { parseStp, simulate, DEMOS, demoResponse };
