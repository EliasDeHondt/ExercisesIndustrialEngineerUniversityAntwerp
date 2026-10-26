/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 26/10/2026
**/

'use strict';

// The monitor of Lab 1 and Lab 2: the devices of the figure, drawn as cards that turn green or red depending on whether this PC
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
    // Lab 2: four pairs. Switch n at the bottom, router n between switch n and switch n+1 (router 4 closes the ring to switch 1).
    const nodes = [], links = [];
    for (let n = 1; n <= 4; n++) {
        const x = (n - 1) * 2 + 0.5, next = n % 4 + 1;
        nodes.push({ id: `sw${n}`, type: 'switch', label: `Switch ${n}`, ips: [['mgmt', `10.1.${n}.1`]], x, y: 1 });
        nodes.push({ id: `rt${n}`, type: 'router', label: `Router ${n}`, ips: [['LAN1', `10.1.${n}.3`], ['LAN2', `10.1.${next}.2`]], x: x + 1, y: 0 });
        nodes.push({ id: `h${n}a`, type: 'host', label: `Host ${n}.10`, ips: [['', `10.1.${n}.10`]], x: x - 0.5, y: 2 });
        nodes.push({ id: `h${n}b`, type: 'host', label: `Host ${n}.11`, ips: [['', `10.1.${n}.11`]], x: x + 0.5, y: 2 });
        links.push([`h${n}a`, `sw${n}`], [`h${n}b`, `sw${n}`], [`rt${n}`, `sw${n}`], [`rt${n}`, `sw${next}`]);
    }
    return { title: 'Figure 2: switches, routers and hosts', nodes, links };
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
    els: new Map(),

    enter(labId) {
        this.leave();
        this.labId = labId;
        this.active = true;
        this.spec = mapSpec(labId);
        this.polls = 0; this.pings = {}; this.facts = new Map();
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
            el.className = `stp-dm-node stp-dm-${n.type}`;
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
        this.busy = true;
        $('refreshBtn').classList.add('stp-spinning');
        try {
            const ips = this.spec.nodes.flatMap(n => n.ips.map(x => x[1]));
            this.pings = (await api(`/api/ping?ips=${ips.join(',')}`)).results;
            // Settings of the switches and routers that answer, a few times slower than the pings.
            if (this.polls % 3 === 0) await this.readFacts();
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

    async readFacts() {
        const targets = this.spec.nodes.filter(n => ['switch', 'router', 'device'].includes(n.type) && this.pings[n.ips[0][1]] && this.pings[n.ips[0][1]].ok).map(n => n.ips[0][1]);
        if (!targets.length) return;
        try {
            const data = await api(`/api/facts?ips=${targets.join(',')}&sections=board,addr,route,firewall,fwd,frrdaemons`);
            for (const d of data.devices) { if (d.ok) this.facts.set(d.ip, parseDevice(d.ip, d.sections)); else this.facts.delete(d.ip); }
        } catch { /* the cards keep their last settings */ }
    },

    describe(n) {
        const d = this.facts.get(n.ips[0][1]);
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
            n.ips.forEach(([, ip], i) => {
                const row = el.querySelector(`.stp-dm-ip[data-ip="${ip}"]`);
                const r = results[i];
                row.className = 'stp-dm-ip' + (r && r.ok ? ' stp-up' : '');
                row.querySelector('em').textContent = r && r.ok ? (r.ms != null ? `${r.ms} ms` : 'up') : 'down';
            });
            const meta = el.querySelector('.stp-dm-meta');
            const text = up ? this.describe(n) : (n.hint || 'not answering');
            meta.textContent = text;
            meta.title = text;
        }
        for (const line of $('mapLines').querySelectorAll('line')) {
            const a = this.spec.nodes.find(n => n.id === line.dataset.a), b = this.spec.nodes.find(n => n.id === line.dataset.b);
            const alive = [a, b].every(n => n.ips.some(([, ip]) => this.pings[ip] && this.pings[ip].ok));
            line.setAttribute('class', 'stp-link ' + (alive ? 'stp-link--fwd' : 'stp-link--cut'));
        }
        $('mapSummary').textContent = `${ok} of ${total} addresses answer ping from this PC`;
        const st = $('status');
        st.className = `stp-status stp-status--${ok === total ? 'ok' : ok ? 'warn' : 'bad'}`;
        st.textContent = `${ok}/${total} reachable`;
    }
};

window.addEventListener('resize', () => { if (DeviceMap.active) DeviceMap.fit(); });
