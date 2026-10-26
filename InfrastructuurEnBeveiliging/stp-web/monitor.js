/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 26/10/2026
**/

'use strict';

/* ---------- Constants ---------- */

const CARD_W = 200;
const CARD_H = 124;
const X_GAP = 250;
const Y_GAP = 230;
const HOST_DROP = 46;        // distance from the bottom of a card to the hosts
const HOST_EXTRA = 80;       // extra height below the bottom row for the hosts

// The figures from the assignments. `layout` puts every switch where it is in the figure: [column, row] in card spacings.
const CORE_IPS = ['10.1.2.5', '10.1.4.5', '10.1.1.5', '10.1.3.5', '10.1.1.1', '10.1.2.1', '10.1.3.1', '10.1.4.1'];
const CORE_LAYOUT = {
    '10.1.2.5': [0.5, 0], '10.1.4.5': [2.5, 0],
    '10.1.1.5': [0.5, 1], '10.1.3.5': [2.5, 1],
    '10.1.1.1': [0, 2], '10.1.2.1': [1, 2], '10.1.3.1': [2, 2], '10.1.4.1': [3, 2]
};
// Figure 4 of Lab 3 has no fixed picture. The page scans these addresses (10.1.1.1 to 10.1.6.6) for switches and draws whatever it finds,
// including extra switches and extra cables. Hosts use .10 and .11, so those are not scanned.
const SCAN_IPS = [];
for (let g = 1; g <= 6; g++) for (let h = 1; h <= 6; h++) SCAN_IPS.push(`10.1.${g}.${h}`);

// Lab 4 uses the same eight switches, but their management addresses change during the lab:
// access N goes from 10.1.N.1 to 10.1.1.N and core N from 10.1.N.5 to 10.1.1.(N+4). Both addresses map to the same card.
const L4 = (() => {
    const names = {}, layout = {}, keys = {}, candidates = new Set();
    const at = { c1: [0.5, 1], c2: [0.5, 0], c3: [2.5, 1], c4: [2.5, 0], a1: [0, 2], a2: [1, 2], a3: [2, 2], a4: [3, 2] };
    for (let n = 1; n <= 4; n++) {
        for (const ip of [`10.1.${n}.1`, `10.1.1.${n}`]) { names[ip] = `Access ${n}`; keys[ip] = 'a' + n; layout[ip] = at['a' + n]; candidates.add(ip); }
        for (const ip of [`10.1.${n}.5`, `10.1.1.${n + 4}`]) { names[ip] = `Core ${n}`; keys[ip] = 'c' + n; layout[ip] = at['c' + n]; candidates.add(ip); }
    }
    return { names, layout, keys, candidates: [...candidates] };
})();

const LAB_MONITORS = {
    3: {
        vlan: false,
        presets: [
            { label: 'Figure 1: access network', demo: 'fig1', ips: ['10.1.1.4', '10.1.1.1', '10.1.2.1'], layout: { '10.1.1.4': [1.05, 0], '10.1.1.1': [0, 1], '10.1.2.1': [2.1, 1] } },
            { label: 'Figure 2: core network', demo: 'fig2', ips: CORE_IPS, layout: CORE_LAYOUT },
            { label: 'Figure 3: extra loops', demo: 'fig3', ips: CORE_IPS, layout: CORE_LAYOUT },
            { label: 'Figure 4: Extra', demo: 'fig4', auto: true, ips: [], layout: null }
        ]
    },
    4: {
        vlan: true,
        names: L4.names,
        presets: [
            { label: 'VLAN network', demo: 'lab4', auto: true, ips: [], layout: L4.layout, scan: L4.candidates, keyOf: ip => L4.keys[ip] || ip }
        ]
    }
};

let LAB = LAB_MONITORS[3];
let PRESETS = LAB.presets;

// The switches the current figure reads: fixed for fixed figures, the discovered ones for automatic ones.
const currentIps = () => PRESETS[S.preset].auto ? S.discovered : PRESETS[S.preset].ips;

const ROLE_TEXT = { root: 'root port', des: 'designated', alt: 'alternate', dis: 'off' };
const TRANSITIONAL = ['listening', 'learning'];
// The colours of the VLANs in the figures of Lab 4: VLAN 1 yellow, VLAN 2 red, VLAN 3 green, VLAN 4 blue.
const VLAN_COLORS = { 1: '#f0b840', 2: '#d4524e', 3: '#6fb868', 4: '#5b8db8' };

const nameOf = ip => (LAB.names && LAB.names[ip]) || (ip.startsWith('10.1.') ? 'SW ' + ip.slice(5) : ip);

/* ---------- State ---------- */

const S = {
    active: false,
    preset: 0,
    bridge: load('stp.bridge', 'switch'),
    interval: load('stp.interval', 2000),
    demo: null,
    demoLinks: [],
    discovered: [],            // switches found by the scan (automatic figures)
    scanned: false,
    scanning: false,
    lastScan: 0,
    scanTimer: null,
    localClient: true,         // false when the page is opened from another PC (no SSH terminal window then)
    title: '',
    paused: false,
    busy: false,
    timer: null,
    error: null,

    vlan: new Map(),           // ip -> { lan1: { 1: { untagged, pvid } } } (Lab 4)

    model: null,
    layoutPos: new Map(),      // automatic positions
    pos: new Map(),            // positions after dragging
    moved: new Set(),
    sig: '',
    selected: null,
    zoom: 1,
    pan: { x: 40, y: 30 },
    fitted: false,
    adjusted: false,           // true once you zoom or pan yourself

    events: [],
    track: null,               // { start, last } while STP is still recalculating
    lastDuration: null,

    nodeEls: new Map(),
    linkEls: new Map(),
    hostEls: new Map()
};

/* ---------- Fetching data ---------- */

async function poll() {
    clearTimeout(S.timer);
    if (S.busy) return;
    S.busy = true;
    $('refreshBtn').classList.add('stp-spinning');
    try {
        if (!S.demo && !currentIps().length) {          // Figure 4 before anything has been found
            S.error = null;
            update({ time: Date.now(), switches: [] });
            return;
        }
        const url = S.demo
            ? `/api/demo?preset=${encodeURIComponent(S.demo)}`
            : `/api/stp?ips=${encodeURIComponent(currentIps().join(','))}&bridge=${encodeURIComponent(S.bridge)}`;
        const res = await fetch(url, { cache: 'no-store' });
        if (!res.ok) throw new Error('server responded ' + res.status);
        const data = await res.json();
        S.error = null;
        if (S.demo) {
            S.demoLinks = data.links; S.title = data.title;
            if (PRESETS[S.preset].auto) S.discovered = data.ips;
            for (const sw of data.switches) if (sw.vlan) S.vlan.set(sw.ip, sw.vlan);
        }
        update(data);
        pollVlan();
    } catch (e) {
        S.error = e.message;
        renderStatus();
    } finally {
        S.busy = false;
        $('refreshBtn').classList.remove('stp-spinning');
        if (!S.paused && S.active) S.timer = setTimeout(poll, S.interval);
    }
}

// Lab 4: which VLANs every port belongs to (tagged or untagged), read with "bridge vlan show".
async function pollVlan() {
    if (!LAB.vlan || S.demo || !S.model) return;
    const ips = [...S.model.nodes.values()].filter(n => n.ok).map(n => n.ip);
    if (!ips.length) return;
    try {
        const data = await api(`/api/facts?ips=${ips.join(',')}&sections=vlan`);
        for (const d of data.devices) if (d.ok) S.vlan.set(d.ip, parseBridgeVlan(d.sections.vlan));
        for (const [ip, el] of S.nodeEls) { const n = S.model && S.model.nodes.get(ip); if (n) updateNode(el, n); }
    } catch { /* the next poll tries again */ }
}

/* ---------- Model: roles, links and loops ---------- */

function roleOf(sw, p) {
    if (p.state === 'disabled') return 'dis';
    if (p.no === sw.rootPort) return 'root';
    if (p.desBridge === sw.bridgeId) return 'des';
    return 'alt';
}

const sortedPair = (a, b) => [a, b].sort().join('|');

function buildModel(data) {
    const nodes = new Map();
    for (const s of data.switches) {
        const n = { ip: s.ip, name: nameOf(s.ip), ok: s.ok, error: s.error || '', ports: [] };
        if (s.ok) {
            Object.assign(n, {
                bridgeId: s.bridgeId, prio: parseInt(s.bridgeId.split('.')[0], 16), root: s.root, isRoot: s.root === s.bridgeId,
                rootPort: s.rootPort, rootCost: s.rootCost, maxAge: s.maxAge, helloTime: s.helloTime, forwardDelay: s.forwardDelay,
                topologyChange: s.topologyChange
            });
            n.ports = s.ports.map(p => ({ ...p, role: roleOf(s, p) })).sort((a, b) => a.no - b.no);
        }
        nodes.set(s.ip, n);
    }

    const okNodes = [...nodes.values()].filter(n => n.ok);
    const byBid = new Map(okNodes.map(n => [n.bridgeId, n]));
    const links = new Map();
    const stubs = [];
    const linked = new Set();      // "ip:port" that is part of a link

    // A port that is not designated points at the other end of the link with its designated bridge/port.
    for (const n of okNodes) {
        for (const p of n.ports) {
            if (p.role !== 'root' && p.role !== 'alt') continue;
            const m = byBid.get(p.desBridge);
            if (!m) { stubs.push({ n, p, bridge: p.desBridge }); continue; }
            const q = m.ports.find(x => x.portId === p.desPort);
            const id = sortedPair(`${n.ip}:${p.name}`, `${m.ip}:${q ? q.name : '?'}`);
            links.set(id, { id, a: { ip: n.ip, port: p }, b: { ip: m.ip, port: q || null } });
            linked.add(`${n.ip}:${p.name}`);
            if (q) linked.add(`${m.ip}:${q.name}`);
        }
    }

    // Designated ports without a far end in the list: a host or a device outside the list.
    const hosts = [];
    for (const n of okNodes) {
        for (const p of n.ports) {
            if (p.role === 'des' && !linked.has(`${n.ip}:${p.name}`)) hosts.push({ n, p });
        }
    }

    const list = [...links.values()];
    for (const l of list) {
        const sa = l.a.port.state, sb = l.b.port ? l.b.port.state : sa;
        l.state = (sa === 'blocking' || sb === 'blocking') ? 'blocking' : (TRANSITIONAL.includes(sa) || TRANSITIONAL.includes(sb)) ? 'trn' : 'fwd';
        l.tree = l.a.port.role === 'root' || (l.b.port && l.b.port.role === 'root');
        l.blockedEnd = l.a.port.state === 'blocking' ? 'a' : (l.b.port && l.b.port.state === 'blocking') ? 'b' : null;
    }

    // Demo: disabled links stay visible as a grey dotted line so you can switch them back on.
    const sid = new Map(S.demoLinks.map(d => [sortedPair(...d.id.split('|')), d]));
    for (const l of list) { const d = sid.get(l.id); if (d) l.serverId = d.id; }
    const cutLinks = S.demo ? S.demoLinks.filter(d => d.cut).map(d => {
        const [x, y] = d.id.split('|').map(s => s.split(':'));
        return { id: sortedPair(...d.id.split('|')), serverId: d.id, cut: true, state: 'cut', a: { ip: x[0], port: { name: x[1] } }, b: { ip: y[0], port: { name: y[1] } } };
    }) : [];

    // Loops: a graph with L links, N switches and C connected parts has L - N + C independent loops.
    const parent = new Map(okNodes.map(n => [n.ip, n.ip]));
    const find = x => { while (parent.get(x) !== x) { parent.set(x, parent.get(parent.get(x))); x = parent.get(x); } return x; };
    for (const l of list) if (l.b.ip) parent.set(find(l.a.ip), find(l.b.ip));
    const components = new Set(okNodes.map(n => find(n.ip))).size;
    const loops = Math.max(0, list.length - okNodes.length + components);
    const blocked = list.filter(l => l.state === 'blocking').length;
    const forwarding = list.filter(l => l.state !== 'blocking').length;
    const activeLoop = forwarding > okNodes.length - components;

    const roots = [...new Set(okNodes.map(n => n.root))];
    const transitional = okNodes.some(n => n.ports.some(p => TRANSITIONAL.includes(p.state)));

    return {
        time: data.time, nodes, links: list, cutLinks, stubs, hosts, byBid,
        okCount: okNodes.length, loops, blocked, activeLoop, components,
        roots, rootsDisagree: roots.length > 1,
        rootNode: okNodes.find(n => n.isRoot) || null,
        unstable: transitional || roots.length > 1
    };
}

/* ---------- Events and stopwatch ---------- */

function addEvent(kind, text, time) {
    S.events.unshift({ kind, text, time: time || Date.now() });
    if (S.events.length > 120) S.events.pop();
}

// Compares two consecutive readings and logs what changed. Returns the number of changes.
function diffModels(prev, cur) {
    let changes = 0;
    const kindOf = st => st === 'forwarding' ? 'ok' : st === 'blocking' ? 'bad' : 'warn';
    for (const n of cur.nodes.values()) {
        const o = prev.nodes.get(n.ip);
        if (!o) {
            // Only happens with Figure 4: the scan found a switch that was not there before.
            addEvent('ok', `New switch found: ${n.name} (${n.ip})`, cur.time);
            changes++;
            if (n.ok) celebrate(n.ip);
            continue;
        }
        if (o.ok !== n.ok) {
            addEvent(n.ok ? 'ok' : 'bad', `${n.name} is ${n.ok ? 'reachable again' : 'no longer reachable'}`, cur.time);
            changes++;
            if (n.ok) celebrate(n.ip);     // a switch has come online
            continue;
        }
        if (!n.ok) continue;
        for (const p of n.ports) {
            const q = o.ports.find(x => x.name === p.name);
            if (!q) continue;
            if (q.state !== p.state) {
                const roleNote = q.role !== p.role ? ` (${ROLE_TEXT[q.role]} to ${ROLE_TEXT[p.role]})` : '';
                addEvent(kindOf(p.state), `${n.name} ${p.name}: ${q.state} to ${p.state}${roleNote}`, cur.time);
                changes++;
            } else if (q.role !== p.role) {
                addEvent('warn', `${n.name} ${p.name}: ${ROLE_TEXT[q.role]} to ${ROLE_TEXT[p.role]}`, cur.time);
                changes++;
            }
        }
    }
    const was = prev.rootNode ? prev.rootNode.ip : null;
    const now = cur.rootNode ? cur.rootNode.ip : null;
    if (was !== now && now) {
        addEvent('warn', `New root bridge: ${cur.rootNode.name}`, cur.time);
        changes++;
    }
    return changes;
}

function trackStability(model, changes) {
    const now = model.time;
    if (changes > 0 || model.unstable) {
        if (!S.track) S.track = { start: now, last: now };
        S.track.last = now;
    } else if (S.track) {
        const sec = (S.track.last - S.track.start) / 1000;
        S.lastDuration = sec;
        addEvent('ok', sec > 0 ? `STP stable after about ${sec.toFixed(1)} s` : `STP stable (within ${S.interval / 1000} s)`, now);
        S.track = null;
    }
}

/* ---------- Confetti when a switch comes online ---------- */

const CONFETTI_COLORS = ['#10b981', '#4f94f0', '#f59e0b', '#ef4444', '#6366f1', '#e87ba4', '#ffffff'];
const confettiParts = [];
let confettiRunning = false;

function celebrate(ip) {
    const el = S.nodeEls.get(ip);
    const r = el ? el.getBoundingClientRect() : null;
    const x = r ? r.left + r.width / 2 : innerWidth / 2;
    const y = r ? r.top + r.height / 2 : innerHeight / 2;
    confetti(x, y);
}

// A burst from (x, y) plus a light shower from the top of the screen. Skipped for people who prefer reduced motion.
function confetti(x, y) {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const now = performance.now();
    const add = (px, py, angle, speed, delay) => confettiParts.push({
        x: px, y: py, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
        size: 6 + Math.random() * 6, rot: Math.random() * 6.28, vr: (Math.random() - 0.5) * 0.4,
        color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)], round: Math.random() < 0.3,
        born: now + delay, life: 3200 + Math.random() * 1200
    });
    for (let i = 0; i < 110; i++) add(x, y, -Math.PI / 2 + (Math.random() - 0.5) * 2.4, 6 + Math.random() * 12, 0);
    for (let i = 0; i < 80; i++) add(Math.random() * innerWidth, -20, Math.PI / 2 + (Math.random() - 0.5) * 0.6, 1 + Math.random() * 3, Math.random() * 900);
    if (!confettiRunning) { confettiRunning = true; requestAnimationFrame(confettiFrame); }
}

function confettiFrame(t) {
    const host = document.fullscreenElement || document.body;
    let cv = $('confetti');
    if (!cv) {
        cv = document.createElement('canvas');
        cv.id = 'confetti';
        cv.style.cssText = 'position:fixed;inset:0;width:100vw;height:100vh;pointer-events:none;z-index:3000';
    }
    if (cv.parentNode !== host) host.appendChild(cv);
    const dpr = window.devicePixelRatio || 1;
    if (cv.width !== Math.round(innerWidth * dpr) || cv.height !== Math.round(innerHeight * dpr)) { cv.width = Math.round(innerWidth * dpr); cv.height = Math.round(innerHeight * dpr); }
    const ctx = cv.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, innerWidth, innerHeight);

    for (let i = confettiParts.length - 1; i >= 0; i--) {
        const p = confettiParts[i];
        const age = t - p.born;
        if (age < 0) continue;
        if (age > p.life || p.y > innerHeight + 30) { confettiParts.splice(i, 1); continue; }
        p.vy += 0.32; p.vx *= 0.992; p.vy *= 0.992;
        p.x += p.vx; p.y += p.vy; p.rot += p.vr;
        ctx.globalAlpha = Math.min(1, (p.life - age) / 900);
        ctx.fillStyle = p.color;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        if (p.round) { ctx.beginPath(); ctx.arc(0, 0, p.size / 2, 0, 6.28); ctx.fill(); } else ctx.fillRect(-p.size / 2, -p.size / 3, p.size, p.size * 0.66);
        ctx.restore();
    }
    ctx.globalAlpha = 1;

    if (confettiParts.length) requestAnimationFrame(confettiFrame);
    else { confettiRunning = false; cv.remove(); }
}

/* ---------- Layout ---------- */

// If all switches are in the figure they get the same position as in the figure. Otherwise a layout is computed:
// layers from the root (BFS over all physical links), then the order within each layer is improved so links cross less.
function computeLayout(model) {
    const fixed = PRESETS[S.preset].layout;
    if (fixed && [...model.nodes.keys()].every(ip => fixed[ip])) {
        return new Map([...model.nodes.keys()].map(ip => [ip, { x: 40 + fixed[ip][0] * X_GAP, y: 40 + fixed[ip][1] * Y_GAP }]));
    }
    return autoLayout(model);
}

function autoLayout(model) {
    const all = [...model.nodes.values()];
    const adj = new Map(all.map(n => [n.ip, new Set()]));
    for (const l of model.links) {
        if (!l.b.ip) continue;
        adj.get(l.a.ip).add(l.b.ip);
        adj.get(l.b.ip).add(l.a.ip);
    }
    const depth = new Map();
    const start = all.filter(n => n.ok && n.isRoot).map(n => n.ip);
    if (!start.length && all.some(n => n.ok)) start.push(all.find(n => n.ok).ip);
    start.forEach(ip => depth.set(ip, 0));
    for (let q = [...start]; q.length;) {
        const ip = q.shift();
        for (const nb of adj.get(ip)) if (!depth.has(nb)) { depth.set(nb, depth.get(ip) + 1); q.push(nb); }
    }
    const maxDepth = Math.max(0, ...depth.values());
    for (const n of all) if (!depth.has(n.ip)) depth.set(n.ip, n.ok ? maxDepth + 1 : maxDepth + 2);

    const layers = [];
    for (const n of all.sort((a, b) => a.ip.localeCompare(b.ip, undefined, { numeric: true }))) {
        (layers[depth.get(n.ip)] = layers[depth.get(n.ip)] || []).push(n.ip);
    }
    const rows = layers.filter(Boolean);
    const xOf = new Map();
    const place = row => row.forEach((ip, i) => xOf.set(ip, (i - (row.length - 1) / 2) * X_GAP));
    rows.forEach(place);

    const reorder = (row, ref) => {
        const key = ip => {
            const xs = [...adj.get(ip)].filter(nb => ref.includes(nb)).map(nb => xOf.get(nb));
            return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : xOf.get(ip);
        };
        row.sort((a, b) => key(a) - key(b));
        place(row);
    };
    for (let pass = 0; pass < 4; pass++) {
        for (let d = 1; d < rows.length; d++) reorder(rows[d], rows[d - 1]);
        for (let d = rows.length - 2; d >= 0; d--) reorder(rows[d], rows[d + 1]);
    }

    const out = new Map();
    const minX = Math.min(...[...xOf.values()], 0);
    rows.forEach((row, d) => row.forEach(ip => out.set(ip, { x: xOf.get(ip) - minX + 40, y: 40 + d * Y_GAP })));
    return out;
}

const posOf = ip => (S.moved.has(ip) ? S.pos.get(ip) : S.layoutPos.get(ip)) || { x: 40, y: 40 };

function bounds() {
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const ip of S.model ? S.model.nodes.keys() : []) {
        const p = posOf(ip);
        x0 = Math.min(x0, p.x); y0 = Math.min(y0, p.y);
        x1 = Math.max(x1, p.x + CARD_W); y1 = Math.max(y1, p.y + CARD_H + (S.model.hosts.length || S.model.stubs.length ? HOST_EXTRA : 0));
    }
    return x0 === Infinity ? { x0: 0, y0: 0, x1: 1, y1: 1 } : { x0, y0, x1, y1 };
}

/* ---------- Drawing: cards ---------- */

function createNode(ip) {
    const el = document.createElement('div');
    el.className = 'stp-node cursor-move';
    el.dataset.ip = ip;
    el.style.width = CARD_W + 'px';
    el.innerHTML = `
        <div class="stp-node-card cursor-move">
            <div class="stp-node-header cursor-move"><span class="stp-node-dot"></span><span class="stp-node-name"></span><span class="stp-node-role"></span><button class="stp-node-term cursor-pointer" type="button" title="Terminal and show commands"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="5 8 10 12 5 16"/><line x1="12" y1="17" x2="19" y2="17"/></svg></button></div>
            <div class="stp-node-ip cursor-move"></div>
            <div class="stp-node-meta cursor-move"></div>
            <div class="stp-ports"></div>
        </div>`;
    el._q = sel => el.querySelector(sel);
    el._anchors = {};
    el._portsKey = '';
    el.addEventListener('pointerdown', e => startNodeDrag(e, ip));
    // The terminal button must not start a drag or select the card.
    const termBtn = el._q('.stp-node-term');
    termBtn.addEventListener('pointerdown', e => e.stopPropagation());
    termBtn.addEventListener('click', e => { e.stopPropagation(); openTerm(ip); });
    $('stage').appendChild(el);
    S.nodeEls.set(ip, el);
    return el;
}

function updateNode(el, n) {
    const transitional = n.ok && n.ports.some(p => TRANSITIONAL.includes(p.state));
    el.classList.toggle('stp-root', n.ok && n.isRoot);
    el.classList.toggle('stp-down', !n.ok);
    el.classList.toggle('stp-selected', S.selected === n.ip);
    el._q('.stp-node-dot').className = 'stp-node-dot' + (!n.ok ? '' : transitional ? ' stp-trn' : ' stp-ok');
    el._q('.stp-node-name').textContent = n.name;
    const role = el._q('.stp-node-role');
    role.className = 'stp-node-role ' + (n.ok && n.isRoot ? 'stp-role--root' : 'stp-role--other');
    role.textContent = !n.ok ? 'offline' : n.isRoot ? 'root' : `cost ${n.rootCost}`;
    el._q('.stp-node-ip').textContent = n.ip;
    el._q('.stp-node-meta').textContent = n.ok ? `prio ${n.prio}  ·  ${n.bridgeId.split('.')[1]}` : n.error;
    el._q('.stp-node-meta').title = n.ok ? n.bridgeId : n.error;

    const ports = n.ok ? n.ports : Array.from({ length: 8 }, (_, i) => ({ name: `lan${i + 1}`, no: i + 1, state: 'disabled', role: 'dis', cost: 0 }));
    const box = el._q('.stp-ports');
    const key = ports.map(p => p.name).join(',');
    if (key !== el._portsKey) {
        el._portsKey = key;
        const size = Math.min(18, Math.floor(((CARD_W - 28) - (ports.length - 1) * 4) / ports.length));
        box.style.setProperty('--sq', size + 'px');
        box.innerHTML = ports.map(() => '<span class="stp-port"></span>').join('');
    }
    const vlans = LAB.vlan ? S.vlan.get(n.ip) : null;
    [...box.children].forEach((sq, i) => {
        const p = ports[i];
        sq.className = `stp-port stp-port--${p.state}` + (p.role === 'root' ? ' stp-port--rootport' : '');
        sq.textContent = p.no;
        sq.title = n.ok ? `${p.name}: ${p.state}, ${ROLE_TEXT[p.role]}${p.state === 'disabled' ? '' : ', cost ' + p.cost}` : '';
        sq.style.background = '';
        if (vlans && n.ok) {
            // Lab 4: the colour of a port is its VLAN (stripes for a trunk). A blocking port keeps a red outline.
            const v = vlans[p.name] || {};
            const ids = Object.keys(v).map(Number).sort();
            sq.classList.add('stp-port--vlan');
            if (p.state === 'blocking') sq.classList.add('stp-port--blk');
            if (ids.length) {
                const cols = ids.map(id => VLAN_COLORS[id] || '#888');
                sq.style.background = cols.length === 1 ? cols[0] : `linear-gradient(135deg, ${cols.map((col, k) => `${col} ${Math.round(k * 100 / cols.length)}% ${Math.round((k + 1) * 100 / cols.length)}%`).join(', ')})`;
                sq.title += '  |  ' + ids.map(id => `VLAN ${id} ${v[id].untagged ? 'untagged' + (v[id].pvid ? ' (PVID)' : '') : 'tagged'}`).join(', ');
            } else if (p.state !== 'disabled') {
                sq.title += '  |  no VLAN data';
            }
        }
    });
    // Where each port sits on the card, needed to make links start at the right port.
    el._anchors = {};
    [...box.children].forEach((sq, i) => {
        el._anchors[ports[i].name] = { x: sq.offsetLeft + sq.offsetWidth / 2, y: sq.offsetTop + sq.offsetHeight / 2 };
    });
}

function placeNodes() {
    for (const [ip, el] of S.nodeEls) {
        const p = posOf(ip);
        el.style.left = p.x + 'px';
        el.style.top = p.y + 'px';
    }
}

function anchor(ip, portName) {
    const el = S.nodeEls.get(ip);
    const p = posOf(ip);
    const a = el && el._anchors[portName];
    return a ? { x: p.x + a.x, y: p.y + a.y } : { x: p.x + CARD_W / 2, y: p.y + CARD_H / 2 };
}

/* ---------- Drawing: links and hosts ---------- */

// Returns a control point for a bend around the cards, or null if the straight line is clear.
function bendAround(A, B, others) {
    const hit = pts => others.find(p => pts.some(pt => pt.x > p.x - 8 && pt.x < p.x + CARD_W + 8 && pt.y > p.y - 8 && pt.y < p.y + CARD_H + 8));
    const sample = at => Array.from({ length: 41 }, (_, i) => at(i / 40));
    const blocker = hit(sample(t => ({ x: A.x + (B.x - A.x) * t, y: A.y + (B.y - A.y) * t })));
    if (!blocker) return null;
    const dx = B.x - A.x, dy = B.y - A.y, len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len, ny = dx / len, mid = { x: (A.x + B.x) / 2, y: (A.y + B.y) / 2 };
    const away = ((blocker.x + CARD_W / 2 - mid.x) * nx + (blocker.y + CARD_H / 2 - mid.y) * ny) > 0 ? -1 : 1;
    for (const k of [60, 110, 160, 220, 300]) {
        for (const side of [away, -away]) {
            const c = { x: mid.x + nx * side * k * 2, y: mid.y + ny * side * k * 2 };   // the middle of the bend lies k px from the straight line
            const q = t => ({ x: (1 - t) * (1 - t) * A.x + 2 * (1 - t) * t * c.x + t * t * B.x, y: (1 - t) * (1 - t) * A.y + 2 * (1 - t) * t * c.y + t * t * B.y });
            if (!hit(sample(q))) return c;
        }
    }
    return null;
}

function linkGeometry(l) {
    const A = anchor(l.a.ip, l.a.port.name);
    const B = anchor(l.b.ip, l.b.port ? l.b.port.name : '');
    const pa = posOf(l.a.ip), pb = posOf(l.b.ip);
    const sameRow = Math.abs(pa.y - pb.y) < 40;
    const hops = Math.round(Math.abs(pa.x - pb.x) / X_GAP);
    let curve = null;
    // A straight line that runs through another card bends away from it (like the long links in Figure 3).
    // Between non-adjacent cards in the same row it arcs over the cards in between.
    const bend = bendAround(A, B, [...S.nodeEls.keys()].filter(ip => ip !== l.a.ip && ip !== l.b.ip).map(posOf));
    if (bend) curve = (sameRow && hops >= 2) ? { x: (A.x + B.x) / 2, y: Math.min(pa.y, pb.y) - 150 - 45 * (hops - 2) } : bend;
    const at = t => curve
        ? { x: (1 - t) * (1 - t) * A.x + 2 * (1 - t) * t * curve.x + t * t * B.x, y: (1 - t) * (1 - t) * A.y + 2 * (1 - t) * t * curve.y + t * t * B.y }
        : { x: A.x + (B.x - A.x) * t, y: A.y + (B.y - A.y) * t };
    const inside = (pt, p) => pt.x >= p.x - 2 && pt.x <= p.x + CARD_W + 2 && pt.y >= p.y - 2 && pt.y <= p.y + CARD_H + 2;
    // The visible part of the line lies outside both cards. The label and the block marker go there.
    let tOut = 0, tIn = 1;
    for (let i = 0; i <= 60; i++) { if (!inside(at(i / 60), pa)) { tOut = i / 60; break; } }
    for (let i = 60; i >= 0; i--) { if (!inside(at(i / 60), pb)) { tIn = i / 60; break; } }
    if (tIn <= tOut) { tOut = 0.3; tIn = 0.7; }
    const d = curve ? `M${A.x},${A.y} Q${curve.x},${curve.y} ${B.x},${B.y}` : `M${A.x},${A.y} L${B.x},${B.y}`;
    return { d, mid: at((tOut + tIn) / 2), blockPt: at(l.blockedEnd === 'b' ? tIn - 0.12 * (tIn - tOut) : tOut + 0.12 * (tIn - tOut)) };
}

function createLink(l) {
    const g = svgEl('g', 'stp-link-group');
    g.innerHTML = '<title></title>';
    const hit = svgEl('path', 'stp-link-hit');
    const line = svgEl('path', 'stp-link');
    const label = svgEl('g', 'stp-link-label');
    label.append(svgEl('rect'), svgEl('text'));
    const block = svgEl('g', 'stp-link-block');
    block.append(svgEl('circle'), svgEl('text'));
    block.lastChild.textContent = '×';
    block.firstChild.setAttribute('r', 9);
    g.append(hit, line, label, block);
    g.addEventListener('click', () => { if (S.demo && g._link && g._link.serverId) toggleCut(g._link.serverId); });
    $('lines').appendChild(g);
    return g;
}

function updateLink(g, l) {
    g._link = l;
    const geo = linkGeometry(l);
    const [hit, line, label, block] = [g.children[1], g.children[2], g.children[3], g.children[4]];
    hit.setAttribute('d', geo.d);
    line.setAttribute('d', geo.d);
    line.setAttribute('class', `stp-link stp-link--${l.cut ? 'cut' : l.state === 'blocking' ? 'blk' : l.state}` + (l.tree ? ' stp-link--tree' : ''));
    g.classList.toggle('stp-link-group--demo', !!S.demo);

    const costA = l.cut ? '' : l.a.port.cost, costB = l.cut || !l.b.port ? '' : l.b.port.cost;
    const text = l.cut ? 'off' : costA === costB || costB === '' ? String(costA) : `${costA} | ${costB}`;
    const t = label.lastChild;
    t.textContent = text;
    const w = Math.max(24, text.length * 7 + 14);
    const r = label.firstChild;
    r.setAttribute('x', geo.mid.x - w / 2); r.setAttribute('y', geo.mid.y - 10); r.setAttribute('width', w); r.setAttribute('height', 20); r.setAttribute('rx', 10);
    t.setAttribute('x', geo.mid.x); t.setAttribute('y', geo.mid.y);
    label.setAttribute('class', 'stp-link-label' + (l.state === 'blocking' ? ' stp-link-label--blk' : ''));

    block.style.display = l.state === 'blocking' ? '' : 'none';
    block.firstChild.setAttribute('cx', geo.blockPt.x); block.firstChild.setAttribute('cy', geo.blockPt.y);
    block.lastChild.setAttribute('x', geo.blockPt.x); block.lastChild.setAttribute('y', geo.blockPt.y);

    const side = (end, n) => {
        if (!end.port) return n;
        const p = end.port;
        return l.cut ? `${nameOf(end.ip)} ${p.name}` : `${nameOf(end.ip)} ${p.name} (${p.state}, ${ROLE_TEXT[p.role]}, cost ${p.cost})`;
    };
    g.firstChild.textContent = `${side(l.a)}  <->  ${side(l.b)}` + (S.demo ? '\nClick to switch this link off or on' : '');
}

function syncLinks() {
    const all = [...S.model.links, ...S.model.cutLinks].filter(l => S.nodeEls.has(l.a.ip) && S.nodeEls.has(l.b.ip));
    const seen = new Set();
    for (const l of all) {
        seen.add(l.id);
        let g = S.linkEls.get(l.id);
        if (!g) { g = createLink(l); S.linkEls.set(l.id, g); }
        updateLink(g, l);
    }
    for (const [id, g] of S.linkEls) if (!seen.has(id)) { g.remove(); S.linkEls.delete(id); }
}

const HOST_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="12" rx="2"/><line x1="2" y1="20" x2="22" y2="20"/></svg>';

function syncHosts() {
    const per = new Map();
    const items = [
        ...S.model.hosts.map(h => ({ key: `${h.n.ip}:${h.p.name}`, ip: h.n.ip, port: h.p, ext: false, label: h.p.name })),
        ...S.model.stubs.map(s => ({ key: `${s.n.ip}:${s.p.name}:x`, ip: s.n.ip, port: s.p, ext: true, label: s.p.name }))
    ];
    for (const it of items) { if (!per.has(it.ip)) per.set(it.ip, []); per.get(it.ip).push(it); }
    const seen = new Set();
    for (const [ip, list] of per) {
        if (!S.nodeEls.has(ip)) continue;
        list.sort((a, b) => a.port.no - b.port.no);
        const w = 62, gap = 8, total = list.length * w + (list.length - 1) * gap;
        const p = posOf(ip);
        list.forEach((it, i) => {
            seen.add(it.key);
            let h = S.hostEls.get(it.key);
            if (!h) {
                h = { div: document.createElement('div'), path: svgEl('path', 'stp-host-line') };
                h.div.className = 'stp-host';
                $('stage').appendChild(h.div);
                $('lines').appendChild(h.path);
                S.hostEls.set(it.key, h);
            }
            const x = p.x + CARD_W / 2 - total / 2 + i * (w + gap), y = p.y + CARD_H + HOST_DROP;
            h.div.style.left = x + 'px'; h.div.style.top = y + 'px';
            h.div.className = 'stp-host' + (it.ext ? ' stp-host--ext' : it.port.state === 'forwarding' ? ' stp-host--on' : '');
            h.div.innerHTML = HOST_ICON + `<span>${esc(it.ext ? it.label : it.label)}</span>`;
            h.div.title = it.ext ? `${nameOf(ip)} ${it.port.name} points to a switch that is not in the list` : `${nameOf(ip)} ${it.port.name}: host (${it.port.state})`;
            const a = anchor(ip, it.port.name);
            h.path.setAttribute('d', `M${a.x},${a.y} L${x + 20},${y}`);
            h.path.setAttribute('class', 'stp-host-line' + (it.port.state === 'forwarding' ? ' stp-host-line--on' : ''));
        });
    }
    for (const [key, h] of S.hostEls) if (!seen.has(key)) { h.div.remove(); h.path.remove(); S.hostEls.delete(key); }
}

function renderStage() {
    const m = S.model;
    for (const [ip, n] of m.nodes) {
        const el = S.nodeEls.get(ip) || createNode(ip);
        updateNode(el, n);
    }
    for (const [ip, el] of S.nodeEls) if (!m.nodes.has(ip)) { el.remove(); S.nodeEls.delete(ip); }
    placeNodes();
    syncLinks();
    syncHosts();
    renderEmpty();
}

function renderEmpty() {
    const m = S.model;
    const box = $('empty');
    if (m && m.okCount > 0) { box.innerHTML = ''; return; }
    if (PRESETS[S.preset].auto && !S.demo && (!S.scanned || S.scanning)) {
        box.innerHTML = '<strong>Scanning the network...</strong><span>Looking for switches on 10.1.1.1 to 10.1.6.6. This takes a few seconds.</span>';
        return;
    }
    if (PRESETS[S.preset].auto && !S.demo && m && !m.nodes.size) {
        box.innerHTML = '<strong>No switches found</strong><span>No switch answered on 10.1.1.1 to 10.1.6.6. Check that your PC is in 10.1.0.0/16 and that SSH is enabled. The scan repeats every minute.</span>';
        return;
    }
    box.innerHTML = m
        ? '<strong>No switch reachable</strong><span>Is your PC in 10.1.0.0/16, is SSH enabled and is the bridge name correct?</span>'
        : '<strong>Connecting...</strong><span>Reading the switches.</span>';
}

/* ---------- Drawing: summary, notes and tables ---------- */

const ICON = {
    minus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><line x1="5" y1="12" x2="19" y2="12"/></svg>',
    plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>',
    fit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>',
    full: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>',
    pause: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>',
    play: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="6 3 20 12 6 21 6 3"/></svg>',
    sun: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
    moon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8z"/></svg>'
};

function stat(value, label, cls) {
    return `<div class="stp-summary-stat"><span class="stp-summary-value ${cls || ''}">${value}</span><span class="stp-summary-label">${label}</span></div>`;
}

function renderSummary() {
    const m = S.model;
    const total = m ? m.nodes.size : currentIps().length;
    const ok = m ? m.okCount : 0;
    const dur = S.track ? `${((Date.now() - S.track.start) / 1000).toFixed(1)} s`
        : S.lastDuration === null ? '-' : S.lastDuration > 0 ? `${S.lastDuration.toFixed(1)} s` : `< ${S.interval / 1000} s`;
    $('summary').innerHTML = `
        ${stat(`${ok}/${total}`, 'Switches', ok < total ? 'stp-medium' : '')}
        ${stat(m ? m.links.length : 0, 'Links')}
        ${stat(m ? m.loops : 0, 'Loops', m && m.loops ? 'stp-medium' : '')}
        ${stat(m ? m.blocked : 0, 'Blocked', m && m.blocked < m.loops ? 'stp-high' : m && m.blocked ? 'stp-low' : '')}
        <div class="stp-summary-divider"></div>
        ${stat(m && m.rootNode ? m.rootNode.name : m && m.rootsDisagree ? 'unknown' : '-', 'Root bridge')}
        ${stat(m && m.rootNode ? m.rootNode.rootCost === 0 ? 'prio ' + m.rootNode.prio : '' : '', 'Priority root')}
        ${stat(dur, S.track ? 'Recalculating' : 'Last recalculation', S.track ? 'stp-medium' : '')}
        <div class="stp-summary-actions">
            <div class="stp-zoom-controls">
                <button class="stp-zoom-btn cursor-pointer" type="button" data-act="zoomOut" title="Zoom out">${ICON.minus}</button>
                <span class="stp-zoom-value" id="zoomValue">${Math.round(S.zoom * 100)}%</span>
                <button class="stp-zoom-btn cursor-pointer" type="button" data-act="zoomIn" title="Zoom in">${ICON.plus}</button>
            </div>
            ${PRESETS[S.preset].auto && !S.demo ? '<button class="stp-btn cursor-pointer" type="button" data-act="rescan">Rescan</button>' : ''}
            <button class="stp-btn cursor-pointer" type="button" data-act="fit">Fit</button>
            <button class="stp-btn cursor-pointer" type="button" data-act="reset">Reset layout</button>
            <button class="stp-zoom-btn cursor-pointer" type="button" data-act="full" title="Full screen">${ICON.full}</button>
        </div>`;
}

function renderStatus() {
    const el = $('status');
    const m = S.model;
    let cls = 'idle', text = 'Connecting';
    if (S.error) { cls = 'bad'; text = 'Server not reachable'; }
    else if (m) {
        if (m.okCount === 0) { cls = 'bad'; text = 'No switches reachable'; }
        else if (m.activeLoop && !S.track) { cls = 'bad'; text = 'Loop active'; }
        else if (S.track) { cls = 'warn'; text = `Converging ${((Date.now() - S.track.start) / 1000).toFixed(1)} s`; }
        else if (m.activeLoop) { cls = 'bad'; text = 'Loop active'; }
        else { cls = 'ok'; text = 'STP stable'; }
        if (S.paused) { cls = 'idle'; text = 'Paused'; }
    }
    el.className = `stp-status stp-status--${cls}`;
    el.textContent = text;
    el.title = S.error || '';
}

function buildNotes() {
    const m = S.model, notes = [];
    if (!m) return notes;
    const down = [...m.nodes.values()].filter(n => !n.ok);
    if (down.length) {
        const first = down[0].error;
        notes.push(['warn', `Not reachable: ${down.map(n => `<b>${esc(n.name)}</b> (${esc(n.error)})`).join(', ')}.` +
            (/permission denied/i.test(first) ? ' SSH asks for a password or key: leave the root password empty or set up a key.' : '')]);
    }
    if (m.activeLoop) {
        notes.push(['bad', `There is a loop in the forwarding path (${m.links.length - m.blocked} active links for ${m.okCount} switches, a tree has ${m.okCount - m.components}). This causes a broadcast storm: unplug a cable or enable STP on all switches.`]);
    }
    if (m.rootsDisagree) notes.push(['warn', 'The switches do not agree on the root bridge yet. Wait until STP has converged.']);
    if (!m.unstable && !m.activeLoop && m.blocked < m.loops) {
        notes.push(['info', `There are ${m.loops} loops but only ${m.blocked} blocked links: probably not all switches are in the list.`]);
    }
    if (m.rootNode && !m.rootsDisagree && m.rootNode.prio === 32767 && m.okCount > 1) {
        notes.push(['info', `The root is now <b>${esc(m.rootNode.name)}</b> with the default priority 32767, so the lowest MAC address wins. Choose a root yourself with <code>echo 4096 &gt; /sys/class/net/${esc(S.bridge)}/bridge/priority</code> on that switch.`]);
    }
    if (m.stubs.length) {
        const ids = [...new Set(m.stubs.map(s => s.bridge))];
        notes.push(['info', `${ids.length} bridge(s) outside the list are seen (${ids.map(esc).join(', ')}). Add those switches to see the full topology.`]);
    }
    return notes;
}

function renderNotes() {
    $('notes').innerHTML = buildNotes().map(([k, t]) => `<div class="stp-note stp-note--${k}">${t}</div>`).join('');
}

const pill = state => `<span class="stp-pill stp-pill--${state}">${state}</span>`;

function renderLinks() {
    const m = S.model;
    const rows = m ? [...m.links, ...m.cutLinks] : [];
    rows.sort((a, b) => (a.cut - b.cut) || a.id.localeCompare(b.id, undefined, { numeric: true }));
    $('linksInfo').textContent = S.demo ? 'demo: click a row to switch the link off' : `${rows.length} links`;
    $('linksTable').innerHTML = rows.length
        ? `<thead><tr><th>Side A</th><th>Side B</th><th class="stp-num">Cost A</th><th class="stp-num">Cost B</th><th>Status</th></tr></thead><tbody>` +
        rows.map(l => {
            const a = `${nameOf(l.a.ip)} ${l.a.port.name}`, b = l.b.ip ? `${nameOf(l.b.ip)} ${l.b.port ? l.b.port.name : '?'}` : '?';
            const status = l.cut ? '<span class="stp-pill stp-pill--disabled">off</span>' : pill(l.state === 'fwd' ? 'forwarding' : l.state === 'trn' ? 'learning' : 'blocking') + (l.tree ? ' <span class="stp-muted">path to root</span>' : '');
            return `<tr class="stp-row-click cursor-pointer" data-ip="${esc(l.a.ip)}" data-link="${esc(l.serverId || '')}"><td>${esc(a)}</td><td>${esc(b)}</td><td class="stp-num">${l.cut ? '-' : l.a.port.cost}</td><td class="stp-num">${l.cut || !l.b.port ? '-' : l.b.port.cost}</td><td>${status}</td></tr>`;
        }).join('') + '</tbody>'
        : '<tbody><tr><td class="stp-muted">No links found yet.</td></tr></tbody>';
}

function copyBtn(cmd) {
    return `<div class="stp-cmd"><code>${esc(cmd)}</code><button class="stp-btn cursor-pointer" type="button" data-copy="${esc(cmd)}">Copy</button></div>`;
}

function renderDetail() {
    const n = S.model && S.model.nodes.get(S.selected);
    if (!n) {
        $('detailInfo').textContent = '';
        $('detail').innerHTML = '<p class="stp-muted">Click a switch in the diagram to see its ports, timers and commands.</p>';
        return;
    }
    $('detailInfo').textContent = n.name;
    if (!n.ok) { $('detail').innerHTML = `<p class="stp-muted">${esc(n.name)} (${esc(n.ip)}) is not reachable: ${esc(n.error)}</p><button class="stp-btn cursor-pointer" type="button" data-term="${esc(n.ip)}">Terminal and show commands</button>`; return; }
    const peerOf = p => {
        const link = S.model.links.find(l => (l.a.ip === n.ip && l.a.port.name === p.name) || (l.b.ip === n.ip && l.b.port && l.b.port.name === p.name));
        if (link) { const o = link.a.ip === n.ip && link.a.port.name === p.name ? link.b : link.a; return `${nameOf(o.ip)} ${o.port ? o.port.name : ''}`; }
        if (p.role === 'des' && p.state !== 'disabled') return 'host';
        return '';
    };
    $('detail').innerHTML = `
        <button class="stp-btn cursor-pointer" type="button" data-term="${esc(n.ip)}" style="margin-bottom:12px">Terminal and show commands</button>
        <dl class="stp-detail-grid">
            <dt>IP</dt><dd>${esc(n.ip)}</dd>
            <dt>Bridge ID</dt><dd>${esc(n.bridgeId)}</dd>
            <dt>Priority</dt><dd>${n.prio}${n.isRoot ? ' (root)' : ''}</dd>
            <dt>Root</dt><dd>${esc(n.root)}</dd>
            <dt>Cost to root</dt><dd>${n.rootCost}</dd>
            <dt>Timers</dt><dd>hello ${n.helloTime} s, max age ${n.maxAge} s, forward delay ${n.forwardDelay} s</dd>
            ${n.topologyChange ? '<dt>Flag</dt><dd>topology change</dd>' : ''}
        </dl>
        <div class="stp-table-wrap"><table class="stp-table">
            <thead><tr><th>Port</th><th>State</th><th>Role</th><th class="stp-num">Cost</th><th>Neighbour</th></tr></thead>
            <tbody>${n.ports.filter(p => p.state !== 'disabled').map(p =>
                `<tr><td>${esc(p.name)}</td><td>${pill(p.state)}</td><td>${ROLE_TEXT[p.role]}</td><td class="stp-num">${p.cost}</td><td>${esc(peerOf(p))}</td></tr>`).join('')}</tbody>
        </table></div>
        ${S.demo ? '' : `<p class="stp-muted" style="margin-top:12px">Commands for this switch</p>
        ${copyBtn(`brctl showstp ${S.bridge}`)}
        ${copyBtn(`echo 4096 > /sys/class/net/${S.bridge}/bridge/priority`)}
        ${copyBtn(`uci set network.${S.bridge}.priority='4096'; uci commit network; /etc/init.d/network restart`)}`}`;
}

function renderEvents() {
    $('eventsInfo').textContent = S.events.length ? `${S.events.length}` : '';
    $('events').innerHTML = S.events.length
        ? S.events.map(e => `<li><span class="stp-event-time">${timeOf(e.time)}</span><span class="stp-event--${e.kind}">${esc(e.text)}</span></li>`).join('')
        : '<li><span class="stp-muted">Every change of a port or the root appears here, with the time until STP is stable again. Unplug a cable to try it.</span></li>';
}

/* ---------- Figure tabs ---------- */

function renderFigureTabs() {
    const box = $('figureTabs');
    box.hidden = PRESETS.length < 2;
    box.innerHTML = PRESETS.length < 2 ? '' : PRESETS.map((p, i) =>
        `<button class="stp-seg-btn cursor-pointer${i === S.preset ? ' stp-active' : ''}" type="button" data-preset="${i}">${esc(p.label)}${p.auto && i === S.preset && (S.scanned || S.demo) ? ` (${S.discovered.length})` : ''}</button>`).join('');
    $('vlanLegend').hidden = !LAB.vlan;
}

function resetView() {
    S.model = null; S.sig = ''; S.selected = null; S.events = []; S.track = null; S.lastDuration = null; S.error = null;
    S.layoutPos.clear(); S.pos.clear(); S.moved.clear(); S.fitted = false; S.adjusted = false; S.demoLinks = [];
    for (const el of S.nodeEls.values()) el.remove();
    for (const g of S.linkEls.values()) g.remove();
    for (const h of S.hostEls.values()) { h.div.remove(); h.path.remove(); }
    S.nodeEls.clear(); S.linkEls.clear(); S.hostEls.clear();
    LOGS.data.clear(); LOGS.errors.clear(); LOGS.tab = 'all';
    S.discovered = []; S.scanned = false; S.scanning = false; S.vlan.clear();
    renderAll();
    renderLogs();
}

function setPreset(index) {
    S.preset = index;
    S.demo = null;
    save('stp.preset.' + LAB.id, index);
    resetView();
    start();
}

// Starts reading. Figure 4 first scans for switches (and keeps rescanning), the other figures read their fixed list.
function start() {
    clearTimeout(S.scanTimer);
    if (PRESETS[S.preset].auto && !S.demo) discoverSwitches();
    else { poll(); pollLogs(); }
}

async function discoverSwitches() {
    clearTimeout(S.scanTimer);
    const index = S.preset;
    S.scanning = true;
    S.lastScan = Date.now();
    renderEmpty();
    try {
        const p = PRESETS[index];
        const { found } = await api(`/api/discover?ips=${(p.scan || SCAN_IPS).join(',')}&bridge=${encodeURIComponent(S.bridge)}`);
        if (index !== S.preset || !S.active) return;     // the user switched figure or left the page while scanning
        // Keep switches that were found before: one that stops answering for a moment stays on the picture as offline.
        // A switch that now answers on another address (Lab 4 changes the management IPs) replaces its old card.
        const keyOf = p.keyOf || (ip => ip);
        const byKey = new Map(S.discovered.map(ip => [keyOf(ip), ip]));
        for (const ip of found) byKey.set(keyOf(ip), ip);
        const merged = [...byKey.values()].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
        const changed = merged.join() !== S.discovered.join();
        S.discovered = merged;
        S.scanned = true;
        if (changed || !S.model) { renderFigureTabs(); poll(); pollLogs(); }
    } catch (e) {
        S.error = e.message;
        renderStatus();
    } finally {
        S.scanning = false;
        renderEmpty();
        if (index === S.preset && !S.paused && S.active) S.scanTimer = setTimeout(discoverSwitches, 60000);
    }
}

/* ---------- Putting it together ---------- */

function renderAll() {
    renderFigureTabs(); renderSummary(); renderStatus(); renderNotes(); renderLinks(); renderDetail(); renderEvents();
    if (S.model) renderStage(); else renderEmpty();
}

// True when the picture gained or lost switches (Figure 4), so the view should be fitted again.
let lastNodeCount = 0;
function nodeCountChanged(model) {
    const grew = model.nodes.size !== lastNodeCount;
    lastNodeCount = model.nodes.size;
    return grew;
}

function update(data) {
    const model = buildModel(data);
    // The first reading that contains switches is the baseline; later changes are reported.
    const hadSwitches = !!(S.model && S.model.nodes.size);
    const changes = hadSwitches ? diffModels(S.model, model) : 0;
    if (!hadSwitches && model.nodes.size) addEvent('info', `Connected: read ${model.okCount} of ${model.nodes.size} switches`, model.time);
    S.model = model;
    trackStability(model, changes);

    // The layout is recalculated when the root or the connections change. Cards you dragged yourself stay where they are.
    const sig = [...model.nodes.values()].map(n => n.ip + (n.ok ? (n.isRoot ? 'R' : 'o') : 'x')).join() + '#' + model.links.map(l => l.id).sort().join();
    const first = !S.fitted;
    const relayout = sig !== S.sig;
    if (relayout) { S.sig = sig; S.layoutPos = computeLayout(model); }
    renderAll();
    const p = PRESETS[S.preset];
    if (p.auto && !S.demo && S.active && !S.scanning && Date.now() - S.lastScan > 15000 && [...model.nodes.values()].some(n => !n.ok)) discoverSwitches();
    if (first && model.okCount + model.nodes.size > 0) { fit(); S.fitted = true; }
    else if (relayout && !S.adjusted && nodeCountChanged(model)) fit();
}

/* ---------- Pan, zoom, drag ---------- */

function applyTransform() {
    $('stage').style.transform = `translate(${S.pan.x}px, ${S.pan.y}px) scale(${S.zoom})`;
    const zv = $('zoomValue');
    if (zv) zv.textContent = Math.round(S.zoom * 100) + '%';
}

function fit() {
    const b = bounds(), area = $('stageArea');
    const w = b.x1 - b.x0, h = b.y1 - b.y0;
    S.zoom = clamp(Math.min((area.clientWidth - 60) / w, (area.clientHeight - 60) / h), 0.3, 1.1);
    S.pan = { x: (area.clientWidth - w * S.zoom) / 2 - b.x0 * S.zoom, y: (area.clientHeight - h * S.zoom) / 2 - b.y0 * S.zoom };
    applyTransform();
}

function zoomBy(factor, cx, cy) {
    const area = $('stageArea');
    cx = cx ?? area.clientWidth / 2; cy = cy ?? area.clientHeight / 2;
    const nz = clamp(S.zoom * factor, 0.3, 2);
    S.pan.x = cx - (cx - S.pan.x) * (nz / S.zoom);
    S.pan.y = cy - (cy - S.pan.y) * (nz / S.zoom);
    S.zoom = nz;
    S.adjusted = true;
    applyTransform();
}

let drag = null;

function startNodeDrag(e, ip) {
    if (e.button !== 0) return;
    e.stopPropagation();
    const start = posOf(ip);
    drag = { kind: 'node', ip, sx: e.clientX, sy: e.clientY, ox: start.x, oy: start.y, moved: false };
    e.currentTarget.setPointerCapture(e.pointerId);
}

function selectNode(ip) {
    S.selected = S.selected === ip ? null : ip;
    for (const [k, el] of S.nodeEls) el.classList.toggle('stp-selected', k === S.selected);
    renderDetail();
}

function onPointerMove(e) {
    if (!drag) return;
    const dx = e.clientX - drag.sx, dy = e.clientY - drag.sy;
    if (drag.kind === 'pan') {
        S.pan = { x: drag.ox + dx, y: drag.oy + dy };
        applyTransform();
    } else {
        if (!drag.moved && Math.hypot(dx, dy) < 4) return;
        if (!drag.moved) { drag.moved = true; S.nodeEls.get(drag.ip).classList.add('is-dragging'); }
        S.pos.set(drag.ip, { x: drag.ox + dx / S.zoom, y: drag.oy + dy / S.zoom });
        S.moved.add(drag.ip);
        placeNodes();
        syncLinks();
        syncHosts();
    }
}

function onPointerUp() {
    if (!drag) return;
    if (drag.kind === 'node') {
        const el = S.nodeEls.get(drag.ip);
        if (el) el.classList.remove('is-dragging');
        if (!drag.moved) selectNode(drag.ip);
    }
    drag = null;
}

/* ---------- Actions ---------- */

async function toggleCut(link) {
    await fetch(`/api/demo/cut?preset=${encodeURIComponent(S.demo)}&link=${encodeURIComponent(link)}`, { method: 'POST' });
    poll();
}

function setPaused(paused) {
    S.paused = paused;
    $('pauseBtn').innerHTML = paused ? ICON.play : ICON.pause;
    $('pauseBtn').title = paused ? 'Resume' : 'Pause';
    clearTimeout(S.timer);
    clearTimeout(LOGS.timer);
    clearTimeout(S.scanTimer);
    if (!paused) start();
    renderStatus();
}

function toggleFullscreen() {
    const wrap = $('stageWrap');
    if (document.fullscreenElement) document.exitFullscreen();
    else if (wrap.requestFullscreen) wrap.requestFullscreen();
}

/* ---------- Logs ---------- */

const LOG_STP = /port|link|stp|forwarding|blocking|learning|listening|topology|bridge|carrier/i;
const LOGS = { tab: 'all', stpOnly: true, search: '', data: new Map(), errors: new Map(), timer: null, busy: false };

// "Mon Oct 26 09:40:02 2026 kern.info kernel: [ 123.4] switch: port 4(lan4) entered forwarding state"
function parseLogLine(ip, raw, idx) {
    const m = raw.match(/^(\w{3} \w{3}\s+\d+ \d\d:\d\d:\d\d \d{4})\s+(\S+)\s+(\S+?):\s*(.*)$/);
    let ts = null, time = '', proc = '', msg = raw;
    if (m) {
        const d = new Date(m[1]);
        if (!isNaN(d)) { ts = d.getTime(); time = d.toLocaleTimeString('en-GB', { hour12: false }); }
        proc = m[3];
        msg = m[4];
    }
    msg = msg.replace(/^\[\s*[\d.]+\]\s*/, '');
    return { ip, name: nameOf(ip), ts, time, proc, msg, idx };
}

function logClass(msg) {
    if (/blocking|link is down|link down|carrier lost|NO-CARRIER/i.test(msg)) return 'stp-log-bad';
    if (/forwarding|link is up|link up/i.test(msg)) return 'stp-log-ok';
    if (/listening|learning|topology/i.test(msg)) return 'stp-log-warn';
    return '';
}

function renderLogs() {
    const ips = S.model ? [...S.model.nodes.keys()] : currentIps();
    if (LOGS.tab !== 'all' && !ips.includes(LOGS.tab)) LOGS.tab = 'all';
    $('logTabs').innerHTML = ['all', ...ips].map(ip =>
        `<button class="stp-seg-btn cursor-pointer${LOGS.tab === ip ? ' stp-active' : ''}" type="button" data-logtab="${esc(ip)}">${ip === 'all' ? 'All switches' : esc(nameOf(ip))}</button>`).join('');

    let rows = [];
    for (const [ip, lines] of LOGS.data) {
        if (LOGS.tab !== 'all' && LOGS.tab !== ip) continue;
        lines.forEach((raw, i) => rows.push(parseLogLine(ip, raw, i)));
    }
    if (LOGS.stpOnly) rows = rows.filter(r => LOG_STP.test(r.msg) || LOG_STP.test(r.proc));
    const q = LOGS.search.trim().toLowerCase();
    if (q) rows = rows.filter(r => `${r.name} ${r.proc} ${r.msg}`.toLowerCase().includes(q));
    rows.sort((a, b) => (a.ts ?? 0) - (b.ts ?? 0) || a.idx - b.idx);
    rows = rows.slice(-300);

    const view = $('logView');
    const atBottom = view.scrollHeight - view.scrollTop - view.clientHeight < 40;
    const errors = [...LOGS.errors].map(([ip, err]) => `<div class="stp-log-row stp-log-bad"><span class="stp-log-time"></span><span class="stp-log-sw">${esc(ip === 'server' ? 'server' : nameOf(ip))}</span><span class="stp-log-msg">${esc(err)}</span></div>`).join('');
    view.innerHTML = errors + (rows.length
        ? rows.map(r => `<div class="stp-log-row ${logClass(r.msg)}"><span class="stp-log-time">${esc(r.time)}</span><span class="stp-log-sw">${esc(r.name)}</span><span class="stp-log-msg">${r.proc ? `<i>${esc(r.proc)}</i> ` : ''}${esc(r.msg)}</span></div>`).join('')
        : '<div class="stp-muted">No log lines yet. Plug or unplug a cable and the STP messages of the switches appear here.</div>');
    if (atBottom) view.scrollTop = view.scrollHeight;
    $('logsInfo').textContent = `${rows.length} lines`;
}

async function pollLogs() {
    clearTimeout(LOGS.timer);
    if (LOGS.busy) return;
    LOGS.busy = true;
    try {
        const ips = currentIps();
        if (!ips.length) { LOGS.errors.clear(); return; }
        const res = await fetch(`/api/logs?ips=${encodeURIComponent(ips.join(','))}` + (S.demo ? `&demo=${encodeURIComponent(S.demo)}` : ''), { cache: 'no-store' });
        if (!res.ok) throw new Error('server responded ' + res.status);
        const data = await res.json();
        LOGS.errors.clear();
        for (const s of data.switches) { if (s.ok) LOGS.data.set(s.ip, s.lines); else LOGS.errors.set(s.ip, s.error); }
    } catch (e) {
        LOGS.errors.set('server', e.message);
    } finally {
        LOGS.busy = false;
        renderLogs();
        if (!S.paused && S.active) LOGS.timer = setTimeout(pollLogs, Math.max(S.interval, 4000));
    }
}

/* ---------- Terminal and show commands ---------- */

const TERM = { ip: null, commands: null, ids: ['stp'], seq: 0 };

async function openTerm(ip) {
    TERM.ip = ip;
    $('termModal').hidden = false;
    $('termTitle').textContent = `${nameOf(ip)}  ·  ${ip}`;
    $('termSsh').hidden = !!S.demo || !S.localClient;
    $('termOut').textContent = '';
    if (!TERM.commands) {
        try { TERM.commands = await (await fetch('/api/commands')).json(); } catch { TERM.commands = []; }
    }
    runTerm(['stp']);
}

function closeTerm() { $('termModal').hidden = true; }

function renderTermList() {
    const groups = [];
    for (const c of TERM.commands) {
        let g = groups.find(x => x.name === c.group);
        if (!g) groups.push(g = { name: c.group, items: [] });
        g.items.push(c);
    }
    const active = TERM.ids.length === 1 ? TERM.ids[0] : '__all';
    $('termList').innerHTML =
        `<button class="stp-term-item stp-term-item--all cursor-pointer${active === '__all' ? ' stp-active' : ''}" type="button" data-cmd="__all">Run all show commands (${TERM.commands.length})</button>` +
        groups.map(g => `<div class="stp-term-group">${esc(g.name)}</div>` +
            g.items.map(c => `<button class="stp-term-item cursor-pointer${active === c.id ? ' stp-active' : ''}" type="button" data-cmd="${esc(c.id)}" title="${esc(c.cmd)}">${esc(c.title)}</button>`).join('')).join('');
}

async function runTerm(ids) {
    TERM.ids = ids;
    renderTermList();
    const my = ++TERM.seq;
    const single = ids.length === 1 ? TERM.commands.find(c => c.id === ids[0]) : null;
    $('termCmd').textContent = single ? '$ ' + single.cmd.replace(/\{bridge\}/g, S.bridge) : `$ ${ids.length} show commands`;
    $('termOut').textContent = 'Running...';
    let text;
    try {
        const url = `/api/cmd?ip=${encodeURIComponent(TERM.ip)}&bridge=${encodeURIComponent(S.bridge)}&ids=${ids.join(',')}` + (S.demo ? '&demo=1' : '');
        const r = await (await fetch(url, { cache: 'no-store' })).json();
        if (!r.ok) text = `Could not run on ${TERM.ip}: ${r.error || 'unknown error'}`;
        else if (r.sections.length === 1) text = r.sections[0].output || '(no output)';
        else text = r.sections.map(s => `### ${s.title}\n$ ${s.cmd}\n${s.output || '(no output)'}`).join('\n\n');
    } catch (e) {
        text = 'Could not reach the server: ' + e.message;
    }
    if (my === TERM.seq) { $('termOut').textContent = text; $('termOut').scrollTop = 0; }
}

// Wires the controls of the monitor once. The shell (labs-ui.js) calls Monitor.enter() when the Monitor tab opens.
function initMonitor() {
    $('interval').value = String(S.interval);
    if (!['1000', '2000', '5000', '10000'].includes($('interval').value)) { S.interval = 2000; $('interval').value = '2000'; }
    $('pauseBtn').innerHTML = ICON.pause;

    $('interval').addEventListener('change', e => { S.interval = Number(e.target.value); save('stp.interval', S.interval); if (S.active && !S.paused) poll(); });
    $('pauseBtn').addEventListener('click', () => setPaused(!S.paused));
    $('refreshBtn').addEventListener('click', () => { if (S.active) poll(); });
    $('figureTabs').addEventListener('click', e => {
        const preset = e.target.closest('[data-preset]');
        if (preset) setPreset(Number(preset.dataset.preset));
    });

    $('summary').addEventListener('click', e => {
        const act = e.target.closest('[data-act]');
        if (!act) return;
        ({
            zoomIn: () => zoomBy(1.2), zoomOut: () => zoomBy(1 / 1.2), fit,
            reset: () => { S.moved.clear(); S.pos.clear(); placeNodes(); syncLinks(); syncHosts(); fit(); S.adjusted = false; },
            full: toggleFullscreen, rescan: discoverSwitches
        })[act.dataset.act]();
    });

    // Logs
    $('logStpOnly').addEventListener('change', e => { LOGS.stpOnly = e.target.checked; renderLogs(); });
    $('logSearch').addEventListener('input', e => { LOGS.search = e.target.value; renderLogs(); });
    $('logTabs').addEventListener('click', e => {
        const tab = e.target.closest('[data-logtab]');
        if (tab) { LOGS.tab = tab.dataset.logtab; renderLogs(); }
    });

    // Terminal dialog
    $('termClose').addEventListener('click', closeTerm);
    $('termModal').addEventListener('click', e => { if (e.target === $('termModal')) closeTerm(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && !$('termModal').hidden) closeTerm(); });
    $('termList').addEventListener('click', e => {
        const item = e.target.closest('[data-cmd]');
        if (!item) return;
        runTerm(item.dataset.cmd === '__all' ? TERM.commands.map(c => c.id) : [item.dataset.cmd]);
    });
    $('termRun').addEventListener('click', () => runTerm(TERM.ids));
    $('termCopy').addEventListener('click', () => {
        const btn = $('termCopy');
        const done = () => { btn.textContent = 'Copied'; setTimeout(() => { btn.textContent = 'Copy'; }, 1200); };
        if (navigator.clipboard) navigator.clipboard.writeText($('termOut').textContent).then(done, done); else done();
    });
    $('termSsh').addEventListener('click', async () => {
        const btn = $('termSsh');
        btn.textContent = 'Opening...';
        try { await fetch(`/api/terminal?ip=${encodeURIComponent(TERM.ip)}`, { method: 'POST' }); } catch { /* shown below */ }
        setTimeout(() => { btn.textContent = 'Open SSH terminal'; }, 1500);
    });

    document.addEventListener('click', e => {
        const term = e.target.closest('[data-term]');
        if (term) openTerm(term.dataset.term);
        const copy = e.target.closest('[data-copy]');
        if (copy) {
            const done = () => { copy.textContent = 'Copied'; setTimeout(() => { copy.textContent = 'Copy'; }, 1200); };
            if (navigator.clipboard) navigator.clipboard.writeText(copy.dataset.copy).then(done, done); else done();
        }
        const row = e.target.closest('tr[data-ip]');
        if (row) {
            if (S.demo && row.dataset.link) toggleCut(row.dataset.link);
            else if (S.selected !== row.dataset.ip) selectNode(row.dataset.ip);
        }
    });

    const area = $('stageArea');
    area.addEventListener('pointerdown', e => {
        if (e.button !== 0 || e.target.closest('.stp-node, .stp-link-group, .stp-host')) return;
        S.adjusted = true;
        drag = { kind: 'pan', sx: e.clientX, sy: e.clientY, ox: S.pan.x, oy: S.pan.y };
        area.setPointerCapture(e.pointerId);
    });
    area.addEventListener('wheel', e => {
        e.preventDefault();
        const r = area.getBoundingClientRect();
        zoomBy(e.deltaY < 0 ? 1.1 : 1 / 1.1, e.clientX - r.left, e.clientY - r.top);
    }, { passive: false });
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);
    document.addEventListener('fullscreenchange', () => setTimeout(fit, 50));
    window.addEventListener('resize', () => { if (!S.adjusted && S.model) fit(); });

    // Live counter while STP is still recalculating.
    setInterval(() => { if (S.track) { renderStatus(); renderSummary(); } }, 200);

    // Opening a terminal window only works for someone sitting at the PC that runs the server.
    fetch('/api/info').then(r => r.json()).then(info => { S.localClient = !!info.local; }).catch(() => { /* keep the default */ });
}

const Monitor = {
    inited: false,

    // Wires the controls once. Safe to call more than once.
    init() {
        if (this.inited) return;
        initMonitor();
        this.inited = true;
    },

    // Selects the lab configuration (names, figures) without starting to read; the checkers use it for the names of switches.
    select(labId) {
        if (!LAB_MONITORS[labId]) return;
        LAB = LAB_MONITORS[labId];
        LAB.id = labId;
        PRESETS = LAB.presets;
    },

    // Show the monitor of one lab. `demoName` starts the demo of the server instead of reading real switches.
    enter(labId, demoName) {
        LAB = LAB_MONITORS[labId];
        LAB.id = labId;
        PRESETS = LAB.presets;
        S.active = true;
        S.demo = null;
        let index = -1;
        if (demoName) { index = PRESETS.findIndex(p => p.demo === demoName); if (index >= 0) S.demo = demoName; }
        if (index < 0) index = clamp(Number(load('stp.preset.' + labId, 0)) || 0, 0, PRESETS.length - 1);
        S.preset = index;
        this.init();
        resetView();
        applyTransform();
        start();
    },

    leave() {
        S.active = false;
        clearTimeout(S.timer);
        clearTimeout(S.scanTimer);
        clearTimeout(LOGS.timer);
    },

    // Called by the shell when the lab changes or the figure/tab size changes.
    refit() { if (S.active && S.model) fit(); }
};
