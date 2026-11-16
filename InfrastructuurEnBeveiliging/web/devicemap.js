/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 26/10/2026
**/

'use strict';

// The monitor of Lab 1, Lab 2 and Lab 5: the devices of the figure, drawn as cards that turn green or red depending on whether this PC
// can ping them, with the settings of the switches and routers (read-only) on each card.

const DM = { unitX: 170, unitY: 200, cardW: 150, cardH: 126 };

function mapSpec(labId) {
    if (labId === 1) {
        // Figure 7 of Lab 1: a switch and a router in one /16, a host at each. The factory default address is shown too.
        return {
            title: 'Figure 7: switch and router connected LAN to LAN',
            nodes: [
                { id: 'def', type: 'device', label: 'Factory default', ips: [['', '192.168.1.1']], x: 1.5, y: 0, hint: 'A new or reset device. After Exercise 4 nothing should answer here any more.' },
                { id: 'sw', type: 'switch', label: 'Switch', ips: [['mgmt', '10.1.1.1']], x: 0.5, y: 1 },
                { id: 'rt', type: 'router', label: 'Router', ips: [['LAN', '10.1.2.1']], x: 2.5, y: 1 },
                { id: 'h1', type: 'host', label: 'Host', ips: [['', '10.1.1.10']], x: 0.5, y: 2 },
                { id: 'h2', type: 'host', label: 'Host', ips: [['', '10.1.2.10']], x: 2.5, y: 2 }
            ],
            links: [['sw', 'rt'], ['h1', 'sw'], ['h2', 'rt']]
        };
    }
    // Lab 2 and Lab 5: four pairs. Switch n at the bottom, router n between switch n and switch n+1 (router 4 closes the ring to switch 1).
    const nodes = [], links = [];
    for (let n = 1; n <= 4; n++) {
        const x = (n - 1) * 2 + 0.5, next = n % 4 + 1;
        nodes.push({ id: `sw${n}`, type: 'switch', label: `Switch ${n}`, ips: [['mgmt', `10.1.${n}.1`]], x, y: 1 });
        nodes.push({ id: `rt${n}`, type: 'router', label: `Router ${n}`, ips: [['LAN1', `10.1.${n}.3`], ['LAN2', `10.1.${next}.2`]], x: x + 1, y: 0 });
        nodes.push({ id: `h${n}a`, type: 'host', label: `Host ${n}.10`, ips: [['', `10.1.${n}.10`]], x: x - 0.5, y: 2 });
        nodes.push({ id: `h${n}b`, type: 'host', label: `Host ${n}.11`, ips: [['', `10.1.${n}.11`]], x: x + 0.5, y: 2 });
        links.push([`h${n}a`, `sw${n}`], [`h${n}b`, `sw${n}`], [`rt${n}`, `sw${n}`], [`rt${n}`, `sw${next}`]);
    }
    // Lab 5 adds the default gateways of the hosts (.10 uses 10.1.n.2, .11 uses 10.1.n.3) and the firewall.
    if (labId === 5) for (const nd of nodes.filter(x => x.type === 'host')) nd.hint = `gateway ${nd.ips[0][1].replace(/\.(\d+)$/, (m, h) => h === '10' ? '.2' : '.3')}`;
    return { title: labId === 5 ? 'Figure 1: full connectivity with the firewall on' : 'Figure 2: switches, routers and hosts', nodes, links };
}

const DeviceMap = {
    labId: null,
    active: false,
    spec: null,
    timer: null,
    busy: false,
    polls: 0,
    pings: {},
    facts: new Map(),
    fw: { rows: new Map(), log: [], reached: [], missing: [] },
    els: new Map(),

    enter(labId) {
        this.leave();
        this.labId = labId;
        this.active = true;
        this.spec = mapSpec(labId);
        this.demo = labId === 5 && Demo5.active;   // demo5.js: simulated routers instead of real devices
        this.polls = 0; this.pings = {}; this.facts = new Map();
        this.fw = { rows: new Map(), log: [], reached: [], missing: [] };
        $('fwLive').hidden = labId !== 5;
        if (this.demo) Demo5.controls($('mapDemo'), () => this.poll()); else $('mapDemo').hidden = true;
        this.build();
        this.poll();
    },

    leave() {
        this.active = false;
        clearTimeout(this.timer);
    },

    build() {
        const box = $('mapStage');
        box.innerHTML = '<svg class="stp-dm-lines" id="mapLines"></svg>';
        this.els.clear();
        let maxX = 0, maxY = 0;
        for (const n of this.spec.nodes) {
            const el = document.createElement('div');
            el.className = `stp-dm-node stp-dm-${n.type}${this.demo && n.type === 'host' ? ' cursor-pointer' : ''}`;
            el.dataset.ip = n.ips[0][1];
            if (this.demo && n.type === 'host') el.title = 'Demo: click to make this host "this PC"';
            el.style.width = DM.cardW + 'px';
            el.style.left = n.x * DM.unitX + 'px';
            el.style.top = n.y * DM.unitY + 'px';
            el.innerHTML = `
                <div class="stp-dm-head"><span class="stp-node-dot"></span><b>${esc(n.label)}</b>${n.type === 'device' ? '<span class="stp-dm-type">new</span>' : '<span class="stp-dm-type"></span>'}
                    ${n.type === 'switch' || n.type === 'router' || n.type === 'device' ? `<button class="stp-node-term cursor-pointer" type="button" data-term="${esc(n.ips[0][1])}" title="Terminal and show commands"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="5 8 10 12 5 16"/><line x1="12" y1="17" x2="19" y2="17"/></svg></button>` : ''}
                </div>
                ${n.ips.map(([l, ip]) => `<div class="stp-dm-ip" data-ip="${ip}"><i></i><span>${l ? esc(l) + ' ' : ''}${ip}</span><em></em></div>`).join('')}
                <div class="stp-dm-meta" title="${esc(n.hint || '')}">${esc(n.hint || '')}</div>`;
            box.appendChild(el);
            this.els.set(n.id, el);
            maxX = Math.max(maxX, n.x * DM.unitX + DM.cardW);
            maxY = Math.max(maxY, n.y * DM.unitY + DM.cardH);
        }
        box.onclick = e => {
            const host = this.demo && !e.target.closest('[data-term]') && e.target.closest('.stp-dm-host');
            if (host) { Demo5.setViewer(host.dataset.ip); Demo5.controls($('mapDemo'), () => this.poll()); this.poll(); }
        };
        box.style.width = maxX + 'px';
        box.style.height = maxY + 'px';
        const svg = $('mapLines');
        svg.setAttribute('width', maxX); svg.setAttribute('height', maxY);
        for (const [a, b] of this.spec.links) {
            const A = this.spec.nodes.find(n => n.id === a), B = this.spec.nodes.find(n => n.id === b);
            const x1 = A.x * DM.unitX + DM.cardW / 2, y1 = A.y * DM.unitY + DM.cardH / 2, x2 = B.x * DM.unitX + DM.cardW / 2, y2 = B.y * DM.unitY + DM.cardH / 2;
            const line = svgEl('line', 'stp-link stp-link--fwd');
            line.setAttribute('x1', x1); line.setAttribute('y1', y1); line.setAttribute('x2', x2); line.setAttribute('y2', y2);
            line.dataset.a = a; line.dataset.b = b;
            svg.appendChild(line);
        }
        this.fit();
    },

    fit() {
        const wrap = $('mapWrap'), stage = $('mapStage');
        if (!stage.style.width) return;
        const w = parseFloat(stage.style.width), avail = wrap.clientWidth - 24;
        const scale = avail > 0 ? Math.min(1, avail / w) : 1;
        stage.style.transform = `scale(${scale})`;
        stage.style.transformOrigin = '0 0';
        wrap.style.height = Math.ceil(parseFloat(stage.style.height) * scale + 40) + 'px';
    },

    async poll() {
        clearTimeout(this.timer);
        if (!this.active || this.busy) return;
        if (this.demo) {
            const ips = this.spec.nodes.flatMap(n => n.ips.map(x => x[1]));
            this.pings = Demo5.pings(ips);
            this.facts = Demo5.facts(this.spec.nodes.filter(n => n.type === 'router').map(n => n.ips[0][1]));
            if (this.labId === 5) this.firewallFromDemo();
            this.render();
            $('mapError').textContent = '';
            return;
        }
        this.busy = true;
        $('refreshBtn').classList.add('stp-spinning');
        try {
            const ips = this.spec.nodes.flatMap(n => n.ips.map(x => x[1]));
            this.pings = (await api(`/api/ping?ips=${ips.join(',')}`)).results;
            await this.pingViaRouters(ips);
            // Settings of the switches and routers that answer, a few times slower than the pings.
            if (this.polls % 3 === 0) await this.readFacts();
            // Lab 5: the firewall counters every poll, so a blocked packet shows up within a few seconds.
            if (this.labId === 5) await this.readFirewall();
            this.polls++;
            this.render();
            $('mapError').textContent = '';
        } catch (e) {
            $('mapError').textContent = 'Cannot reach the server: ' + e.message;
        } finally {
            this.busy = false;
            $('refreshBtn').classList.remove('stp-spinning');
            if (this.active) this.timer = setTimeout(() => this.poll(), 3000);
        }
    },

    // Addresses this PC cannot ping are pinged again from every router this PC can log in to (SSH, the pings run on the router).
    // An address that a router reaches counts as reachable and shows "via Router n". A router does not ping its own addresses.
    async pingViaRouters(ips) {
        const direct = ip => this.pings[ip] && this.pings[ip].ok && !this.pings[ip].via;
        const down = ips.filter(ip => !direct(ip));
        if (!down.length) return;
        const routers = this.spec.nodes.filter(n => n.type === 'router')
            .map(n => ({ label: n.label, own: n.ips.map(x => x[1]), ip: n.ips.map(x => x[1]).find(direct) }))
            .filter(r => r.ip);
        await Promise.all(routers.map(async r => {
            const targets = down.filter(t => !r.own.includes(t));
            if (!targets.length) return;
            try {
                const res = await api(`/api/devping?ip=${r.ip}&targets=${targets.join(',')}`);
                if (!res.ok) return;
                for (const t of targets) {
                    if (!res.results[t] || (this.pings[t] && this.pings[t].ok)) continue;
                    const ms = res.ms && res.ms[t] != null ? res.ms[t] : null;
                    this.pings[t] = { ok: true, ms, via: r.label, text: `This PC cannot ping ${t} directly. ${r.label} (${r.ip}) can: pinged on the router over SSH.` };
                }
            } catch { /* router not reachable over SSH */ }
        }));
    },

    // Lab 5: the counters ("nft list ruleset"), the rules ("uci show firewall") and the logged packets ("logread") of every router
    // this PC can log in to. Only the routers this PC reaches itself: SSH goes from this PC.
    async readFirewall() {
        const routers = this.spec.nodes.filter(n => n.type === 'router')
            .map(n => ({ label: n.label, ip: n.ips.map(x => x[1]).find(ip => this.pings[ip] && this.pings[ip].ok && !this.pings[ip].via) }));
        const reach = routers.filter(r => r.ip);
        this.fw.reached = reach.map(r => r.label);
        this.fw.missing = routers.filter(r => !r.ip).map(r => r.label);
        if (!reach.length) return;
        try {
            const data = await api(`/api/facts?ips=${reach.map(r => r.ip).join(',')}&sections=fwcount,fwuci,fwlog`);
            for (const d of data.devices) {
                const r = reach.find(x => x.ip === d.ip);
                if (r && d.ok) this.firewallUpdate(r.label, parseFwCounters(d.sections.fwcount), parseFirewall(d.sections.fwuci || ''), d.sections.fwlog || '');
            }
        } catch { /* the table keeps its last values */ }
    },

    firewallFromDemo() {
        this.fw.reached = []; this.fw.missing = [];
        for (const n of this.spec.nodes.filter(x => x.type === 'router')) {
            const d = this.facts.get(n.ips[0][1]);
            if (!d) continue;
            this.fw.reached.push(n.label);
            this.firewallUpdate(n.label, d.fwCounters || {}, d.fw, '');
        }
    },

    // Compares the new counters with the previous poll: a counter that went up means the rule matched packets just now.
    firewallUpdate(label, counters, fw, logText) {
        const now = Date.now();
        const rules = fw && fw.present ? fw.rules.filter(r => r.enabled && r.src !== 'wan') : null;   // the default rules of OpenWrt are for wan
        const names = rules ? rules.map(r => r.name) : Object.keys(counters);
        for (const [key, row] of this.fw.rows) if (row.label === label && !names.includes(row.rule)) this.fw.rows.delete(key);
        names.forEach((name, i) => {
            const key = `${label}|${name}`;
            const old = this.fw.rows.get(key);
            const rule = rules ? rules[i] : null;
            const row = {
                label, rule: name, order: i, count: counters[name] || 0,
                target: rule ? rule.target : '', what: rule ? fwRuleText(rule) : '',
                lastHit: old ? old.lastHit : 0, lastDelta: old ? old.lastDelta : 0
            };
            // After a firewall reload the counters start again at 0: that is not a hit.
            if (old && row.count > old.count) { row.lastHit = now; row.lastDelta = row.count - old.count; }
            this.fw.rows.set(key, row);
        });
        this.fw.log = this.fw.log.filter(e => e.label !== label)
            .concat(String(logText).split('\n').map(l => parseFwLogLine(l, label)).filter(Boolean));
    },

    fwRecent(row) {
        return row.lastHit && Date.now() - row.lastHit < 8000;
    },

    renderFirewall() {
        if (this.labId !== 5) return;
        const rows = [...this.fw.rows.values()].sort((a, b) => a.label.localeCompare(b.label) || a.order - b.order);
        const blocking = rows.filter(r => this.fwRecent(r) && r.target !== 'ACCEPT');
        const info = [];
        if (this.fw.reached.length) info.push(`read from ${this.fw.reached.map(l => l.replace('Router ', 'R')).join(', ')}`);
        if (!this.demo && this.fw.missing.length) info.push(`${this.fw.missing.map(l => l.replace('Router ', 'R')).join(', ')} not reachable over SSH`);
        if (blocking.length) info.unshift(`${blocking.length} rule${blocking.length === 1 ? '' : 's'} blocking now`);
        $('fwLiveInfo').textContent = info.join(' · ');

        const ago = t => { const s = Math.round((Date.now() - t) / 1000); return s < 60 ? `${s} s ago` : s < 3600 ? `${Math.round(s / 60)} min ago` : 'long ago'; };
        $('fwRules').innerHTML = rows.length ? `
            <thead><tr><th>Router</th><th>Rule</th><th>Matches</th><th>Action</th><th class="stp-num">Packets</th><th>Last hit</th></tr></thead>
            <tbody>${rows.map(r => {
                const hit = this.fwRecent(r);
                const pill = r.target ? `<span class="stp-pill stp-pill--${r.target === 'ACCEPT' ? 'forwarding' : 'blocking'}">${esc(r.target)}</span>` : '';
                return `<tr class="${hit ? 'stp-fw-hit' : ''}${r.target === 'ACCEPT' ? ' stp-fw-accept' : ''}">
                    <td>${esc(r.label.replace('Router ', 'R'))}</td><td><b>${esc(r.rule)}</b></td><td>${esc(r.what)}</td><td>${pill}</td>
                    <td class="stp-num">${r.count}${hit ? ` <span class="stp-fw-delta">+${r.lastDelta}</span>` : ''}</td>
                    <td>${r.lastHit ? ago(r.lastHit) : '-'}</td></tr>`;
            }).join('')}</tbody>`
            : `<tbody><tr><td class="stp-muted">${this.fw.reached.length ? 'No own firewall rules on the routers yet (the default wan rules are left out).' : 'No router reachable over SSH from this PC yet.'}</td></tr></tbody>`;

        const log = [...this.fw.log].sort((a, b) => b.time.localeCompare(a.time)).slice(0, 40);
        $('fwLogInfo').textContent = log.length ? `newest ${log.length}` : '';
        $('fwLog').innerHTML = log.length
            ? log.map(e => `<li title="${esc(e.line)}"><span class="stp-event-time">${esc(e.time)}</span><span><b>${esc(e.label.replace('Router ', 'R'))}</b> ${e.prefix ? `<code>${esc(e.prefix)}</code> ` : ''}${esc(e.src)} → ${esc(e.dst)} · ${esc(e.what)}${e.inIf ? ` · in ${esc(e.inIf)}` : ''}</span></li>`).join('')
            : `<li><span class="stp-muted">No logged packets. The counters above always work. For the details of every packet (who, to where, which port) turn logging on for a rule: in LuCI the rule, Advanced Settings, "Enable logging on this rule", or <code>uci set firewall.@rule[N].log='1'</code>, <code>uci commit firewall</code>, <code>/etc/init.d/firewall reload</code>. Packets refused by a zone policy (no rule matched): <code>uci set firewall.@zone[0].log='1'</code>.</span></li>`;
    },

    async readFacts() {
        // Only devices this PC reaches itself: SSH goes from this PC, not through a router.
        const targets = this.spec.nodes.filter(n => ['switch', 'router', 'device'].includes(n.type) && this.pings[n.ips[0][1]] && this.pings[n.ips[0][1]].ok && !this.pings[n.ips[0][1]].via).map(n => n.ips[0][1]);
        if (!targets.length) return;
        try {
            const data = await api(`/api/facts?ips=${targets.join(',')}&sections=board,addr,route,firewall,fwd,frrdaemons${this.labId === 5 ? ',uci,fwuci' : ''}`);
            for (const d of data.devices) { if (d.ok) this.facts.set(d.ip, parseDevice(d.ip, d.sections)); else this.facts.delete(d.ip); }
        } catch { /* the cards keep their last settings */ }
    },

    describe(n) {
        const d = this.facts.get(n.ips[0][1]);
        if (this.demo && n.type === 'host' && n.ips[0][1] === Demo5.viewer) return `this PC · ${n.hint}`;
        if (this.demo && n.type === 'switch') return 'switch (Layer 2, not simulated)';
        if (!d) return n.hint || (n.type === 'host' ? 'host (ping only)' : 'no SSH answer');
        const parts = [];
        const main = addrOf(d, n.ips[0][1]);
        if (n.type === 'router' && n.ips.length > 1) {
            const lan2 = addrOf(d, n.ips[1][1]);
            parts.push(`${main ? '/' + main.prefix : 'no LAN1'} ${lan2 ? '/' + lan2.prefix : 'no LAN2'}`);
            parts.push(d.forwarding ? 'fwd on' : 'fwd off');
            const proto = d.frrDaemons.ospfd === 'yes' ? 'OSPF' : d.frrDaemons.ripd === 'yes' ? 'RIP' : d.routes.some(r => r.proto === 'static') ? 'static' : '';
            if (proto) parts.push(proto);
        } else {
            parts.push(main ? `mask /${main.prefix}` : 'address ?');
        }
        parts.push(d.firewallRunning ? 'firewall ON' : 'firewall off');
        if (this.labId === 5 && d.fw.present) {
            const rules = d.fw.rules.filter(r => r.enabled && r.src !== 'wan').length;   // the default rules of OpenWrt are all for the wan zone
            parts.push(`${rules} own rule${rules === 1 ? '' : 's'}`);
        }
        parts.push(d.defaultGw ? `gw ${d.defaultGw}` : 'no gw');
        return parts.join(' · ');
    },

    render() {
        let ok = 0, total = 0;
        for (const n of this.spec.nodes) {
            const el = this.els.get(n.id);
            const results = n.ips.map(([, ip]) => this.pings[ip]);
            const up = results.filter(r => r && r.ok).length;
            total += n.ips.length; ok += up;
            el.querySelector('.stp-node-dot').className = 'stp-node-dot' + (up === n.ips.length ? ' stp-ok' : up ? ' stp-trn' : '');
            el.classList.toggle('stp-down', up === 0);
            el.classList.toggle('stp-dm-me', !!this.demo && n.ips[0][1] === Demo5.viewer);
            el.classList.toggle('stp-dm-fwhit', this.labId === 5 && n.type === 'router' && [...this.fw.rows.values()].some(r => r.label === n.label && r.target !== 'ACCEPT' && this.fwRecent(r)));
            n.ips.forEach(([, ip], i) => {
                const row = el.querySelector(`.stp-dm-ip[data-ip="${ip}"]`);
                const r = results[i];
                row.className = 'stp-dm-ip' + (r && r.ok ? ' stp-up' : '') + (r && r.via ? ' stp-via' : '');
                row.querySelector('em').textContent = r && r.ok ? (r.via ? `via ${r.via.replace('Router ', 'R')}` : r.ms != null ? `${r.ms} ms` : 'up') : 'down';
                row.title = r && r.text ? r.text : '';
            });
            const meta = el.querySelector('.stp-dm-meta');
            const text = up || this.demo ? this.describe(n) : (n.hint || 'not answering');
            meta.textContent = text;
            meta.title = text;
        }
        for (const line of $('mapLines').querySelectorAll('line')) {
            const a = this.spec.nodes.find(n => n.id === line.dataset.a), b = this.spec.nodes.find(n => n.id === line.dataset.b);
            const alive = [a, b].every(n => n.ips.some(([, ip]) => this.pings[ip] && this.pings[ip].ok));
            line.setAttribute('class', 'stp-link ' + (alive ? 'stp-link--fwd' : 'stp-link--cut'));
        }
        const via = Object.values(this.pings).filter(r => r && r.ok && r.via).length;
        $('mapSummary').textContent = this.demo ? `${ok} of ${total} addresses answer ping from ${Demo5.viewer} (demo)`
            : `${ok} of ${total} addresses answer ping` + (via ? ` (${ok - via} from this PC, ${via} via a router)` : ' from this PC');
        const st = $('status');
        st.className = `stp-status stp-status--${ok === total ? 'ok' : ok ? 'warn' : 'bad'}`;
        st.textContent = `${ok}/${total} reachable`;
        this.renderFirewall();
    }
};

// A firewall rule in one line: "10.1.2.11 → 10.1.2.3 · tcp 22 (input)".
function fwRuleText(r) {
    const src = r.srcIp.join(' ') || 'any';
    const dst = r.destIp.join(' ') || (r.dest ? 'any' : 'the router');
    const proto = r.proto.includes('all') ? 'any protocol' : r.proto.join('/');
    const port = r.destPort.length ? ' ' + r.destPort.join(',') : r.icmp.length ? ' ' + r.icmp.join(',') : '';
    return `${src} → ${dst} · ${proto}${port} (${r.dest ? 'forward' : 'input'})`;
}

// One line of logread written by the firewall, for example
// "Mon Nov 16 09:12:01 2026 kern.warn kernel: [ 812.4] Block_SSH_11: IN=br-lan OUT= MAC=... SRC=10.1.2.11 DST=10.1.2.3 ... PROTO=TCP SPT=51234 DPT=22".
function parseFwLogLine(line, label) {
    if (!/ SRC=\S+ DST=/.test(line)) return null;
    const f = k => (line.match(new RegExp(`\\b${k}=(\\S*)`)) || [])[1] || '';
    const proto = f('PROTO');
    const what = proto === 'ICMP' ? (f('TYPE') === '8' ? 'ping' : `ICMP type ${f('TYPE')}`) : `${proto} ${f('DPT')}`.trim();
    return {
        label, line,
        time: (line.match(/\b(\d\d:\d\d:\d\d)\b/) || [])[1] || '',
        prefix: ((line.match(/kernel:\s*(?:\[[^\]]*\]\s*)?(.*?)\s*IN=/) || [])[1] || '').replace(/:\s*$/, ''),
        src: f('SRC'), dst: f('DST'), what, inIf: f('IN')
    };
}

window.addEventListener('resize', () => { if (DeviceMap.active) DeviceMap.fit(); });
