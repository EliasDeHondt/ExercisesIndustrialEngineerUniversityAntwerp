/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 26/10/2026
**/

'use strict';

// The checkers of the five labs. Every exercise has a `plan` (what to read from the network) and a `run` function that
// turns the collected facts into a list of results. A result says what was found and, when it is wrong, how to fix it.
// All commands behind this are read-only: the checker never changes a switch or a router.

const R = {
    pass: (title, detail = '') => ({ status: 'pass', title, detail }),
    // action (optional): a one-click fix the page can offer, { kind, ip, ... }. The server decides what it really does.
    fail: (title, detail = '', fix = '', action = null) => ({ status: 'fail', title, detail, fix, action }),
    warn: (title, detail = '', fix = '', action = null) => ({ status: 'warn', title, detail, fix, action }),
    info: (title, detail = '') => ({ status: 'info', title, detail }),
    manual: (title, detail = '') => ({ status: 'manual', title, detail })
};

const CHECKS = {};   // 'labNumber.exerciseId' -> { plan, run }

/* ---------- Shared helpers ---------- */

const seq = n => Array.from({ length: n }, (_, i) => i + 1);
const dev = (ctx, ip) => ctx.devices.get(ip);
const addrOf = (d, ip) => d.addrs.find(a => a.ip === ip);
const pingOf = (ctx, ip) => !!(ctx.ping[ip] && ctx.ping[ip].ok);

// The address of this PC on the lab network (10.1.x.y) and its default gateway on that interface.
function pcLab(ctx) {
    if (!ctx.local) return null;
    const ifc = ctx.local.interfaces.find(i => /^10\.1\./.test(i.address));
    if (!ifc) return null;
    const o = ifc.address.split('.').map(Number);
    return {
        name: ifc.name, ip: ifc.address, mask: ifc.netmask, prefix: maskToPrefix(ifc.netmask), net: o[2], host: o[3],
        gateway: (ctx.local.gateways.find(g => g.iface === ifc.address) || {}).gateway || null
    };
}

// "The device must answer on this address" check. Returns the device when it does.
function needDevice(res, ctx, ip, label, hint) {
    const d = dev(ctx, ip);
    if (d) { res.push(R.pass(`${label} answers on ${ip}`, d.model ? `${d.model}${d.release ? ', ' + d.release : ''}` : 'SSH works')); return d; }
    res.push(R.fail(`${label} does not answer on ${ip}`, ctx.failed.get(ip) || 'No SSH connection (no answer, wrong address or the cable is missing).', hint || 'Check the cable, the IP address and mask of the device and that your PC is in the same network.'));
    return null;
}

function needMask(res, d, ip, prefix, label) {
    const a = addrOf(d, ip);
    if (!a) { res.push(R.fail(`${label}: address ${ip} not found`, 'The device answers, but the address is not on one of its interfaces.', 'Check Network > Interfaces.')); return; }
    if (a.prefix === prefix) res.push(R.pass(`${label} has mask /${prefix} (${prefixToMask(prefix)})`, `${ip}/${a.prefix} on ${a.ifname}`));
    else res.push(R.fail(`${label} has mask /${a.prefix}, expected /${prefix}`, `${ip}/${a.prefix} on ${a.ifname}`, `Network > Interfaces > LAN > Edit: set the netmask to ${prefixToMask(prefix)} (/${prefix}).`));
}

function needFirewallOff(res, d, label) {
    if (!d.firewallRunning) res.push(R.pass(`${label}: firewall is stopped`));
    else res.push(R.fail(`${label}: firewall is still running`, 'The lab needs all traffic to pass.', 'Run  /etc/init.d/firewall stop  (it comes back after a reboot).'));
}

function needNoGateway(res, d, label, severity = 'fail') {
    if (!d.defaultGw) res.push(R.pass(`${label}: no default gateway`));
    else res.push(R[severity](`${label}: has a default gateway (${d.defaultGw})`, 'This exercise works without a gateway on this device.', 'Network > Interfaces > LAN > Edit: empty the IPv4 gateway field.'));
}

function pcCheck(res, ctx, wantedPrefix, wantGateway = null) {
    const pc = pcLab(ctx);
    if (!pc) {
        res.push(R.warn('This PC has no 10.1.x.y address', 'The checker runs on the PC that runs the server, and that PC is not in the lab network. Host checks are skipped.', 'Give the Ethernet adapter a static address, for example 10.1.1.10 with mask 255.255.0.0, no gateway.'));
        return null;
    }
    if (wantedPrefix) {
        if (pc.prefix === wantedPrefix) res.push(R.pass(`This PC (${pc.ip}) has mask /${pc.prefix}`));
        else res.push(R.fail(`This PC (${pc.ip}) has mask /${pc.prefix}, expected /${wantedPrefix}`, `Adapter ${pc.name}.`, `Set the mask of the adapter to ${prefixToMask(wantedPrefix)}.`));
    }
    if (wantGateway === false) {
        if (!pc.gateway) res.push(R.pass('This PC has no default gateway on the lab adapter'));
        else res.push(R.fail(`This PC has a default gateway on the lab adapter (${pc.gateway})`, 'This exercise works without a gateway on the host.', 'Remove the gateway from the adapter settings.'));
    } else if (wantGateway) {
        if (pc.gateway === wantGateway) res.push(R.pass(`This PC uses ${wantGateway} as default gateway`));
        else res.push(R.fail(`This PC uses ${pc.gateway || 'no default gateway'}, expected ${wantGateway}`, '', `Set the default gateway of the adapter to ${wantGateway}.`));
    }
    return pc;
}

// A ping from this PC with an expected outcome.
function expectPing(res, ctx, ip, label, shouldWork, whyNot = '') {
    const ok = pingOf(ctx, ip);
    if (shouldWork) {
        if (ok) res.push(R.pass(`Ping ${label} (${ip}) works`, ctx.ping[ip].ms != null ? `${ctx.ping[ip].ms} ms` : ''));
        else res.push(R.fail(`Ping ${label} (${ip}) fails`, 'This should work at this point of the lab.', whyNot || 'Check cables, IP addresses and masks on both ends.'));
    } else if (!ok) res.push(R.pass(`Ping ${label} (${ip}) fails, as expected`, whyNot));
    else res.push(R.fail(`Ping ${label} (${ip}) works, but it should fail here`, whyNot, 'Check the subnet mask and the default gateway of the host and the device.'));
}

function manualQuestions(res, text) {
    res.push(R.manual('Answer the questions of this exercise', text || 'The questions are in the Guide tab. Show your answers and the setup to the lab assistant.'));
}

/* ---------- Lab 1 ---------- */

const L1_IPS = ['192.168.1.1', '10.1.1.1', '10.1.2.1'];

CHECKS['1.ex1'] = {
    plan: { candidates: L1_IPS, sections: ['board', 'addr'], http: L1_IPS, local: true },
    run(ctx) {
        const res = [];
        if (!ctx.found.length) res.push(R.fail('No device answers', 'Tried 192.168.1.1, 10.1.1.1 and 10.1.2.1.', 'Plug your laptop into a LAN port of the switch or router. For the switch give your laptop 192.168.1.10/24 without gateway; for the router use DHCP.'));
        for (const ip of ctx.found) {
            const d = dev(ctx, ip);
            if (d) res.push(R.pass(`${d.role === 'router' ? 'Router' : d.role === 'switch' ? 'Switch' : 'Device'} answers on ${ip}`, `${d.model} ${d.release}`));
            const h = ctx.http.get(ip);
            if (h && h.ok) res.push(R.pass(`LuCI web interface answers on http://${ip}`, `HTTP ${h.status}`));
            else res.push(R.fail(`LuCI does not answer on http://${ip}`, 'SSH works but the web interface does not.', 'Open http://' + ip + ' in a browser. If it fails, check the browser proxy settings.'));
        }
        manualQuestions(res, 'Explore the LuCI menus and discuss how the IP allocation differs between switch (no DHCP server) and router (DHCP server).');
        return res;
    }
};

CHECKS['1.ex2'] = {
    plan: { candidates: L1_IPS, sections: ['board', 'uptime', 'addr', 'route'] },
    run(ctx) {
        const res = [];
        if (!ctx.found.length) res.push(R.fail('SSH does not work', 'No device answered on SSH (port 22).', 'ssh root@192.168.1.1  (or the address you set). If you see "host identification has changed": ssh-keygen -R 192.168.1.1'));
        for (const ip of ctx.found) {
            const d = dev(ctx, ip);
            if (d) res.push(R.pass(`SSH to ${ip} works`, `${d.model}; ${d.release}`));
        }
        manualQuestions(res, 'Run the warm-up commands (ubus call system board, uptime, free -h, df -h, ip a, ip route, ifstatus lan, uci show network, logread) and write down what each one shows.');
        return res;
    }
};

CHECKS['1.ex3'] = {
    plan: { candidates: L1_IPS, sections: ['board', 'time', 'opkg', 'internet'] },
    run(ctx) {
        const res = [];
        if (!ctx.found.length) res.push(R.fail('No device answers', '', 'Connect to the device first (Exercise 2).'));
        for (const ip of ctx.found) {
            const d = dev(ctx, ip);
            if (!d) continue;
            const skew = d.time ? Math.abs(d.time * 1000 - ctx.time) / 3600000 : null;
            if (skew == null) res.push(R.warn(`${ip}: could not read the clock`));
            else if (skew < 24) res.push(R.pass(`${ip}: system date is correct`, new Date(d.time * 1000).toLocaleString()));
            else res.push(R.fail(`${ip}: system date is wrong (${new Date(d.time * 1000).toLocaleString()})`, 'opkg update fails with "SSL verify error" when the clock is wrong.', 'Run  date -s "YYYY-MM-DD HH:MM:SS"  with today\'s date.'));
            if (d.packages.has('tcpdump')) res.push(R.pass(`${ip}: tcpdump is installed`));
            else res.push(R.warn(`${ip}: tcpdump is not installed`, 'The exercise installs tcpdump as an example.', 'opkg update && opkg install tcpdump  (the device needs Internet for this).'));
            if (d.internet) res.push(R.warn(`${ip}: still has Internet access`, 'Unplug the campus cable once the installation is finished.', 'Remove the cable to the campus network.'));
            else res.push(R.pass(`${ip}: no Internet access (safe)`));
        }
        manualQuestions(res);
        return res;
    }
};

CHECKS['1.ex4'] = {
    plan: {
        candidates: L1_IPS, sections: ['board', 'addr', 'route', 'firewall', 'brctl'],
        pcPing: ['10.1.1.1', '10.1.2.1', '10.1.1.10', '10.1.2.10'], devPing: { '10.1.1.1': ['10.1.2.1'], '10.1.2.1': ['10.1.1.1'] }, local: true
    },
    run(ctx) {
        const res = [];
        for (const [ip, label] of [['10.1.1.1', 'Switch (Netgear)'], ['10.1.2.1', 'Router (Asus)']]) {
            const d = needDevice(res, ctx, ip, label, ctx.found.includes('192.168.1.1')
                ? 'A device still answers on 192.168.1.1. Change its address: Network > Interfaces > LAN > Edit, IPv4 address ' + ip + ', netmask 255.255.0.0, Save & Apply.'
                : 'Check that you changed the IP of the device and that your PC is in 10.1.0.0/16.');
            if (!d) continue;
            if (ip === '10.1.1.1' && d.role === 'router') res.push(R.warn('The device on 10.1.1.1 is a router', 'The figure has the switch on 10.1.1.1 and the router on 10.1.2.1.'));
            if (ip === '10.1.2.1' && d.role === 'switch') res.push(R.warn('The device on 10.1.2.1 is a switch', 'The figure has the router on 10.1.2.1 and the switch on 10.1.1.1.'));
            needMask(res, d, ip, 16, label);
            needFirewallOff(res, d, label);
            needNoGateway(res, d, label, 'warn');
            const wan = d.addrs.find(a => a.ifname === 'wan' && /^10\.1\./.test(a.ip));
            if (wan) res.push(R.fail(`${label}: the WAN port carries ${wan.ip}`, 'Switch and router must be connected LAN to LAN, in the same /16.', 'Move the cable to a LAN port of the router.'));
        }
        for (const [src, dst, label] of [['10.1.1.1', '10.1.2.1', 'switch to router'], ['10.1.2.1', '10.1.1.1', 'router to switch']]) {
            const r = ctx.dev.get(src);
            if (!r) continue;
            if (r[dst]) res.push(R.pass(`Ping ${label} works (from the device itself)`));
            else res.push(R.fail(`Ping ${label} fails (from the device itself)`, `${src} cannot reach ${dst}.`, 'Check the cable between the switch and a LAN port of the router, and that both devices use /16.'));
        }
        const pc = pcCheck(res, ctx, 16, false);
        if (pc && ![10].includes(pc.host)) res.push(R.warn(`This PC is ${pc.ip}`, 'The exercise uses 10.1.1.10 (at the switch) and 10.1.2.10 (at the router).'));
        expectPing(res, ctx, '10.1.1.1', 'the switch', true);
        expectPing(res, ctx, '10.1.2.1', 'the router', true);
        const other = pc && pc.net === 1 ? '10.1.2.10' : '10.1.1.10';
        if (pc && pc.ip !== other) expectPing(res, ctx, other, 'the other host', true, 'The other host must be connected and configured with a /16 mask.');
        res.push(R.manual('Management GUIs', 'Open http://10.1.1.1 and http://10.1.2.1 in a browser and answer the questions (what happens to your browser when the IP changes, do you need a gateway, why not WAN).'));
        return res;
    }
};

CHECKS['1.ex5'] = {
    plan: { candidates: ['192.168.1.1', '10.1.1.1', '10.1.2.1'], sections: ['board', 'addr', 'opkg'] },
    run(ctx) {
        const res = [];
        const d = dev(ctx, '192.168.1.1');
        if (d && !d.packages.has('tcpdump') && !d.addrs.some(a => /^10\.1\./.test(a.ip))) res.push(R.pass('A device is back in its clean default state', '192.168.1.1, no extra packages, no 10.1.x.y address.'));
        else if (d) res.push(R.warn('A device answers on 192.168.1.1 but is not clean', 'It still has extra packages or an extra address.', 'Reset it at the end of the lab: hold the reset button for 10 seconds, or  firstboot -y && reboot.'));
        else res.push(R.info('No device on 192.168.1.1', 'That is fine while you are still working. After the final reset the device is back on 192.168.1.1.'));
        res.push(R.manual('Backup and restore', 'Download a backup archive in LuCI (System > Backup / Flash Firmware), restore it, and do the reset at the end of the lab. Never remove the power while the device reboots.'));
        manualQuestions(res);
        return res;
    }
};

/* ---------- Lab 2 ---------- */

const L2 = {
    sw: n => `10.1.${n}.1`,
    r1: n => `10.1.${n}.3`,            // LAN1 of router n, on the network of switch n
    r2: n => `10.1.${n % 4 + 1}.2`,    // LAN2 of router n, on the network of the next switch
    next: n => n % 4 + 1
};
const L2_ROUTERS = seq(4).map(n => L2.r1(n));
const L2_SWITCHES = seq(4).map(n => L2.sw(n));

function l2Plan(extra = {}) {
    const hosts = seq(4).flatMap(n => [`10.1.${n}.10`, `10.1.${n}.11`]);
    return Object.assign({
        candidates: [...L2_SWITCHES, ...L2_ROUTERS], sections: ['board', 'addr', 'route', 'uci', 'firewall'],
        pcPing: [...L2_SWITCHES, ...hosts, ...L2_ROUTERS, ...seq(4).map(n => L2.r2(n))], local: true
    }, extra);
}

// Every switch that answers must have the right mask; missing switches of other pairs are only a warning.
function l2Switches(res, ctx, prefix, myNet) {
    for (const n of seq(4)) {
        const ip = L2.sw(n);
        const d = dev(ctx, ip);
        if (!d) {
            res.push(n === myNet ? R.fail(`Switch ${n} (${ip}) does not answer`, ctx.failed.get(ip) || 'No SSH connection.', 'Check IP, mask and cables of your switch.') : R.warn(`Switch ${n} (${ip}) not found`, 'The switch of another pair is not reachable from here. Fine if they are not ready yet.'));
            continue;
        }
        needMask(res, d, ip, prefix, `Switch ${n}`);
        needFirewallOff(res, d, `Switch ${n}`);
        needNoGateway(res, d, `Switch ${n}`);
    }
}

CHECKS['2.ex1'] = {
    plan: l2Plan(),
    run(ctx) {
        const res = [];
        const pc = pcCheck(res, ctx, 16, false);
        l2Switches(res, ctx, 16, pc ? pc.net : 0);
        if (pc) {
            const partner = `10.1.${pc.net}.${pc.host === 10 ? 11 : 10}`;
            expectPing(res, ctx, L2.sw(pc.net), 'your own switch', true);
            expectPing(res, ctx, partner, 'your partner', true, 'Your partner must be connected with a /16 mask.');
            for (const n of seq(4).filter(x => x !== pc.net)) expectPing(res, ctx, L2.sw(n), `switch ${n}`, true, 'With /16 and no gateway every device in 10.1.0.0/16 is reachable if the switches are connected.');
        }
        manualQuestions(res, 'Ping your own switch, another switch, your partner and other hosts, then analyse ARP and ICMP in Wireshark and answer the questions.');
        return res;
    }
};

CHECKS['2.ex2'] = {
    plan: l2Plan(),
    run(ctx) {
        const res = [];
        const pc = pcCheck(res, ctx, 24, false);
        l2Switches(res, ctx, 24, pc ? pc.net : 0);
        if (pc) {
            expectPing(res, ctx, L2.sw(pc.net), 'your own switch', true);
            for (const n of seq(4).filter(x => x !== pc.net)) expectPing(res, ctx, L2.sw(n), `switch ${n}`, false, 'Another /24 and no gateway: the packet never leaves your PC (no ARP, no ICMP).');
        }
        manualQuestions(res, 'Observe in Wireshark what you see when you ping another group, and why SSH to another switch fails.');
        return res;
    }
};

CHECKS['2.ex3'] = {
    plan: l2Plan(),
    run(ctx) {
        const res = [];
        const pc = pcLab(ctx);
        const prefix = pc ? (pc.host === 10 ? 16 : 24) : 0;
        pcCheck(res, ctx, prefix || null, false);
        if (pc && ![10, 11].includes(pc.host)) res.push(R.warn(`This PC is ${pc.ip}`, 'The exercise uses the hosts 10.1.x.10 (mask /16) and 10.1.x.11 (mask /24).'));
        l2Switches(res, ctx, 24, pc ? pc.net : 0);
        if (pc) {
            res.push(R.info(pc.host === 10 ? 'This PC is the .10 host and keeps /16' : 'This PC is the .11 host and stays in the /24'));
            const partner = `10.1.${pc.net}.${pc.host === 10 ? 11 : 10}`;
            expectPing(res, ctx, L2.sw(pc.net), 'your own switch', true);
            expectPing(res, ctx, partner, 'your partner', true, 'Same switch: both masks include the other address, so it works in both directions.');
            for (const n of seq(4).filter(x => x !== pc.net)) {
                expectPing(res, ctx, L2.sw(n), `switch ${n}`, false, pc.host === 10
                    ? 'The request leaves (within /16) but the switch has a /24 and no gateway, so it cannot answer.'
                    : 'Other /24 and no gateway: nothing is sent.');
            }
        }
        manualQuestions(res, 'Explain for each ping why it is or is not sent.');
        return res;
    }
};

function l2Routers(res, ctx, myNet, wantFrr) {
    for (const n of seq(4)) {
        const ip = L2.r1(n), lan2 = L2.r2(n);
        const d = dev(ctx, ip);
        if (!d) {
            res.push(n === myNet ? R.fail(`Router ${n} (${ip}) does not answer`, ctx.failed.get(ip) || 'No SSH connection.', `Give the bridge br-lan the address ${ip}/24 and connect LAN1 to switch ${n}.`) : R.warn(`Router ${n} (${ip}) not found`, 'The router of another pair is not reachable from here.'));
            continue;
        }
        res.push(R.pass(`Router ${n} answers on ${ip}`, d.model));
        needMask(res, d, ip, 24, `Router ${n} LAN1`);
        const a2 = addrOf(d, lan2);
        if (!a2) res.push(R.fail(`Router ${n}: LAN2 address ${lan2} not found`, 'Create the interface lan2 with this static address.', 'Network > Interfaces > Add new interface: name lan2, static address, device lan2, IPv4 ' + lan2 + ', netmask 255.255.255.0.'));
        else if (a2.prefix !== 24) res.push(R.fail(`Router ${n}: LAN2 has mask /${a2.prefix}, expected /24`, '', 'Set netmask 255.255.255.0 on the lan2 interface.'));
        else res.push(R.pass(`Router ${n}: LAN2 is ${lan2}/24 on ${a2.ifname}`));
        const br = d.bridges.find(b => b.name === 'br-lan');
        if (br && br.ports.includes('lan2')) res.push(R.fail(`Router ${n}: lan2 is still a member of br-lan`, 'LAN1 and LAN2 must be separate networks.', 'Network > Interfaces > Devices > br-lan > Configure: remove lan2 from the bridge ports.'));
        else if (br) res.push(R.pass(`Router ${n}: lan2 is not in the bridge`));
        needFirewallOff(res, d, `Router ${n}`);
        if (wantFrr) {
            const missing = ['frr', 'frr-ripd', 'frr-ospfd', 'frr-zebra', 'frr-watchfrr', 'frr-vtysh'].filter(p => !d.packages.has(p));
            if (!missing.length) res.push(R.pass(`Router ${n}: the FRR packages are installed`));
            else res.push(R.warn(`Router ${n}: FRR packages missing (${missing.join(', ')})`, 'Needed for RIP and OSPF in Exercise 7.', 'opkg update && opkg install frr frr-ripd frr-ospfd frr-zebra frr-watchfrr frr-vtysh'));
        }
    }
}

CHECKS['2.ex4'] = {
    plan: l2Plan({ sections: ['board', 'addr', 'route', 'uci', 'firewall', 'brctl', 'opkg', 'fwd'] }),
    run(ctx) {
        const res = [];
        const pc = pcCheck(res, ctx, 24, false);
        l2Switches(res, ctx, 24, pc ? pc.net : 0);
        l2Routers(res, ctx, pc ? pc.net : 0, true);
        for (const n of seq(4)) { const d = dev(ctx, L2.r1(n)); if (d && d.defaultGw) res.push(R.fail(`Router ${n} has a default gateway (${d.defaultGw})`, 'No gateway is needed in this exercise.', 'Remove it from the interfaces.')); }
        if (pc) {
            expectPing(res, ctx, L2.sw(pc.net), 'your switch', true);
            expectPing(res, ctx, L2.r1(pc.net), 'your router LAN1', true);
            expectPing(res, ctx, `10.1.${pc.net}.2`, 'the LAN2 of the previous router (on your network)', true);
            expectPing(res, ctx, L2.r2(pc.net), 'your router LAN2', false, 'That address is in the next /24 and your PC has no default gateway yet.');
            expectPing(res, ctx, L2.sw(L2.next(pc.net)), "your neighbor's switch", false, 'Another /24, no gateway.');
        }
        manualQuestions(res, 'Check in Wireshark which packets are sent and which are not, and conclude why connectivity is incomplete.');
        return res;
    }
};

CHECKS['2.ex5'] = {
    plan: l2Plan({ sections: ['board', 'addr', 'route', 'uci', 'firewall', 'brctl', 'fwd'] }),
    run(ctx) {
        const res = [];
        const pc = pcLab(ctx);
        const gw = pc ? `10.1.${pc.net}.${pc.host === 11 ? 3 : 2}` : null;
        pcCheck(res, ctx, 24, gw || null);
        if (pc && ![10, 11].includes(pc.host)) res.push(R.warn(`This PC is ${pc.ip}`, 'The default gateway is 10.1.x.2 for the .10 host and 10.1.x.3 for the .11 host.'));
        l2Routers(res, ctx, pc ? pc.net : 0, false);
        for (const n of seq(4)) {
            const d = dev(ctx, L2.r1(n));
            if (!d) continue;
            if (d.forwarding) res.push(R.pass(`Router ${n}: IP forwarding is on`));
            else res.push(R.fail(`Router ${n}: IP forwarding is off`, 'The router cannot route between its two networks.', 'echo 1 > /proc/sys/net/ipv4/ip_forward  (OpenWrt has it on by default).'));
        }
        if (pc) {
            expectPing(res, ctx, L2.r1(pc.net), 'your router LAN1', true);
            expectPing(res, ctx, `10.1.${pc.net}.2`, 'the router on the other side', true);
        }
        manualQuestions(res, 'Send a ping to the far side of the router you can reach, analyse it in Wireshark and explain why full connectivity is still missing (the routers only know their direct networks).');
        return res;
    }
};

CHECKS['2.ex6'] = {
    plan: l2Plan({
        sections: ['board', 'addr', 'route', 'uci', 'firewall', 'brctl', 'fwd'],
        devPing: Object.fromEntries(L2_ROUTERS.map(ip => [ip, [...L2_ROUTERS, ...seq(4).map(n => L2.r2(n))]]))
    }),
    run(ctx) {
        const res = [];
        const pc = pcCheck(res, ctx, 24, null);
        l2Routers(res, ctx, pc ? pc.net : 0, false);
        for (const n of seq(4)) {
            const d = dev(ctx, L2.r1(n));
            if (!d) continue;
            if (!d.forwarding) res.push(R.fail(`Router ${n}: IP forwarding is off`, '', 'echo 1 > /proc/sys/net/ipv4/ip_forward'));
            const own = [n, L2.next(n)];
            const remote = seq(4).filter(x => !own.includes(x));
            for (const y of remote) {
                const r = d.routes.find(x => x.dst === `10.1.${y}.0/24`);
                if (r && r.via) res.push(R.pass(`Router ${n}: route to 10.1.${y}.0/24 via ${r.via}`, `${r.dev}${r.proto ? ', ' + r.proto : ''}`));
                else res.push(R.fail(`Router ${n}: no route to 10.1.${y}.0/24`, 'Each router is connected to two networks and needs one route for each of the other two.', `Network > Routing > Static IPv4 Routes: target 10.1.${y}.0/24 with the gateway of the neighbouring router on a directly connected network.`));
            }
            const staticCount = d.routes.filter(r => r.proto === 'static').length;
            if (staticCount >= 2) res.push(R.pass(`Router ${n}: ${staticCount} static route(s)`));
        }
        const all = [...L2_ROUTERS, ...seq(4).map(n => L2.r2(n))];
        for (const src of L2_ROUTERS) {
            const r = ctx.dev.get(src);
            if (!r) continue;
            const failed = all.filter(t => !r[t]);
            if (!failed.length) res.push(R.pass(`Router ${src} reaches all router interfaces`));
            else res.push(R.fail(`Router ${src} cannot reach ${failed.join(', ')}`, 'Static routes are missing or wrong on this router or on a router on the path (the reply must find its way back too).', 'Check the routes on every router: each needs the two networks it is not connected to.'));
        }
        manualQuestions(res, 'Describe how you added the static routes, what ip route shows, and the disadvantages of static routes.');
        return res;
    }
};

CHECKS['2.ex7'] = {
    plan: l2Plan({
        sections: ['board', 'addr', 'route', 'uci', 'firewall', 'brctl', 'fwd', 'opkg', 'frrdaemons', 'frrrun', 'vtyroute', 'ospfnbr', 'ripdb'],
        devPing: Object.fromEntries(L2_ROUTERS.map(ip => [ip, [...L2_ROUTERS, ...seq(4).map(n => L2.r2(n))]]))
    }),
    run(ctx) {
        const res = [];
        const pc = pcCheck(res, ctx, 24, null);
        l2Routers(res, ctx, pc ? pc.net : 0, false);
        const all = [...L2_ROUTERS, ...seq(4).map(n => L2.r2(n))];
        for (const n of seq(4)) {
            const d = dev(ctx, L2.r1(n));
            if (!d) continue;
            const t = `Router ${n}`;
            const rip = d.frrDaemons.ripd === 'yes', ospf = d.frrDaemons.ospfd === 'yes';
            if (d.frrDaemons.zebra !== 'yes') res.push(R.fail(`${t}: zebra is not enabled in /etc/frr/daemons`, 'zebra installs the routes into the kernel.', 'vi /etc/frr/daemons: zebra=yes, then /etc/init.d/frr restart'));
            if (!rip && !ospf) { res.push(R.fail(`${t}: neither ripd nor ospfd is enabled`, '', 'vi /etc/frr/daemons: set ripd=yes (RIP) or ospfd=yes (OSPF), then /etc/init.d/frr enable && /etc/init.d/frr restart')); continue; }
            if (rip && ospf) res.push(R.warn(`${t}: RIP and OSPF are both enabled`, 'Compare them one at a time: set ripd=no when you test OSPF.', 'vi /etc/frr/daemons'));
            const proto = ospf && !rip ? 'OSPF' : rip && !ospf ? 'RIP' : 'RIP + OSPF';
            res.push(R.info(`${t} runs ${proto}`));
            const wantDaemon = ospf ? 'ospfd' : 'ripd';
            if (d.frrRunning.has(wantDaemon)) res.push(R.pass(`${t}: ${wantDaemon} is running`));
            else res.push(R.fail(`${t}: ${wantDaemon} is not running`, '', '/etc/init.d/frr enable; /etc/init.d/frr restart'));
            const staticLeft = d.routes.filter(r => r.proto === 'static');
            if (staticLeft.length) res.push(R.fail(`${t}: static routes are still present (${staticLeft.map(r => r.dst).join(', ')})`, 'They hide whether the routing protocol works.', 'Network > Routing: delete the static routes.'));
            else res.push(R.pass(`${t}: no static routes left`));
            const code = ospf && !rip ? 'O' : 'R';
            const own = [n, L2.next(n)];
            for (const y of seq(4).filter(x => !own.includes(x))) {
                const learned = d.vtyRoutes.find(r => r.dst === `10.1.${y}.0/24` && r.code === code);
                if (learned) res.push(R.pass(`${t}: learned 10.1.${y}.0/24 via ${proto}`, learned.via ? `via ${learned.via}` : ''));
                else res.push(R.fail(`${t}: did not learn 10.1.${y}.0/24`, 'Every router must advertise both its directly connected networks.', ospf ? 'vtysh: router ospf, network 10.1.x.0/24 area 0 for both networks, write memory' : 'vtysh: router rip, version 2, network for both networks, no passive-interface br-lan and lan2, write memory'));
            }
            if (ospf && !rip) {
                const full = d.ospfNeighbors.filter(x => x.state === 'Full');
                if (full.length >= 2) res.push(R.pass(`${t}: ${full.length} OSPF neighbours in state Full`));
                else res.push(R.fail(`${t}: only ${full.length} OSPF neighbour(s) in state Full, expected 2`, d.ospfNeighbors.map(x => `${x.id} ${x.state}`).join('; ') || 'no neighbours', 'Check the router-id (must be unique) and that both networks are in area 0 on both routers.'));
            }
        }
        for (const src of L2_ROUTERS) {
            const r = ctx.dev.get(src);
            if (!r) continue;
            const failed = all.filter(t => !r[t]);
            if (!failed.length) res.push(R.pass(`Router ${src} reaches all router interfaces`));
            else res.push(R.fail(`Router ${src} cannot reach ${failed.join(', ')}`, 'The routing protocol has not converged yet or a router is not configured.'));
        }
        manualQuestions(res, 'Do the RIP part and then the OSPF part: traceroute, unplug a cable and time the convergence, and capture the update packets in Wireshark.');
        return res;
    }
};

/* ---------- Lab 3 ---------- */

// The cabling of the figures as pairs of switches (the ports are shown in the monitor).
const L3_FIG1 = [['10.1.1.4', '10.1.1.1'], ['10.1.1.4', '10.1.2.1'], ['10.1.1.1', '10.1.2.1']];
const L3_FIG2 = [
    ['10.1.1.5', '10.1.1.1'], ['10.1.1.5', '10.1.2.1'], ['10.1.3.5', '10.1.3.1'], ['10.1.3.5', '10.1.4.1'], ['10.1.1.1', '10.1.2.1'], ['10.1.3.1', '10.1.4.1'],
    ['10.1.2.5', '10.1.1.5'], ['10.1.2.5', '10.1.3.5'], ['10.1.2.5', '10.1.4.5'], ['10.1.1.5', '10.1.3.5'], ['10.1.1.5', '10.1.4.5'], ['10.1.3.5', '10.1.4.5']
];
const L3_FIG3 = [...L3_FIG2, ['10.1.2.5', '10.1.1.1'], ['10.1.3.5', '10.1.2.1'], ['10.1.1.5', '10.1.3.1'], ['10.1.4.5', '10.1.4.1']];
const L3_ALL = [...new Set([...L3_FIG2.flat(), '10.1.1.4'])];

const pairKey = (a, b) => [a, b].sort().join('|');

function l3Links(res, ctx, expected, label) {
    const m = ctx.model;
    if (!m) { res.push(R.fail('No STP data', 'No switch answered "brctl showstp".', 'Check IP addresses and that STP is enabled on the switches.')); return; }
    const wanted = new Set(expected.map(([a, b]) => pairKey(a, b)));
    const have = new Set(m.links.filter(l => l.b.ip).map(l => pairKey(l.a.ip, l.b.ip)));
    const nameIp = ip => nameOf(ip);
    const missing = [...wanted].filter(k => !have.has(k)), extra = [...have].filter(k => !wanted.has(k));
    if (!missing.length && !extra.length) res.push(R.pass(`The cabling matches ${label} (${wanted.size} links)`));
    if (missing.length) res.push(R.fail(`${missing.length} link(s) of ${label} not found`, missing.map(k => k.split('|').map(nameIp).join(' - ')).join(', '), 'Check those cables and that STP is enabled on both switches (a link only shows up when both switches run STP).'));
    if (extra.length) res.push(R.warn(`${extra.length} link(s) that are not in ${label}`, extra.map(k => k.split('|').map(nameIp).join(' - ')).join(', '), 'Remove the extra cable, or this is a later figure of the lab.'));
}

function l3Common(res, ctx, ips, needStp = true) {
    for (const ip of ips) {
        const d = needDevice(res, ctx, ip, nameOf(ip), 'Check the address and the cable. After a factory reset the switch is on 192.168.1.1.');
        if (!d) continue;
        needMask(res, d, ip, 16, nameOf(ip));
        needFirewallOff(res, d, nameOf(ip));
        const br = d.bridges.find(b => /^(switch|br-lan)$/.test(b.name)) || d.bridges[0];
        if (needStp) {
            if (br && br.stp) res.push(R.pass(`${nameOf(ip)}: STP is enabled on ${br.name}`));
            else res.push(R.fail(`${nameOf(ip)}: STP is not enabled`, br ? `Bridge ${br.name} has STP off.` : 'No bridge found.', 'uci set network.switch.stp=\'1\'; uci commit network; /etc/init.d/network restart  (or Network > Interfaces > Devices > Bridge settings > Enable STP).'));
        }
    }
}

function l3State(res, ctx) {
    const m = ctx.model;
    if (!m) return;
    if (m.rootsDisagree) res.push(R.warn('The switches do not agree on the root yet', 'STP is still converging, or switches are not connected to each other.', 'Wait a few seconds and run the check again.'));
    else if (m.rootNode) res.push(R.info(`Root bridge: ${m.rootNode.name} (priority ${m.rootNode.prio})`));
    if (m.unstable && !m.rootsDisagree) res.push(R.warn('Some ports are still in listening or learning', 'The tree has not settled.', 'Wait for STP to converge and check again.'));
    if (m.activeLoop) res.push(R.fail('There is a loop in the forwarding path', 'More active links than a tree has: this causes a broadcast storm.', 'Unplug the last cable, enable STP on every switch and plug it back in.'));
    else if (!m.unstable) res.push(R.pass(`No loop: ${m.blocked} link(s) are blocked for ${m.loops} loop(s)`));
    if (!m.unstable && !m.activeLoop && m.blocked < m.loops) res.push(R.warn(`${m.loops} loops but only ${m.blocked} blocked link(s)`, 'Probably not all switches answered.'));
}

function l3Priority(res, ctx, ip, want, label) {
    const d = dev(ctx, ip);
    if (!d) return;
    const st = Object.values(d.stp).find(Boolean);
    if (!st) { res.push(R.warn(`${label}: priority unknown`, 'No STP data.')); return; }
    if (st.priority === want) res.push(R.pass(`${label} has bridge priority ${want}`));
    else res.push(R.fail(`${label} has bridge priority ${st.priority}, expected ${want}`, '', `uci set network.switch.priority='${want}'; uci commit network; /etc/init.d/network restart  (quick test: echo ${want} > /sys/class/net/switch/bridge/priority)`));
}

const L3_SECTIONS = ['board', 'addr', 'firewall', 'brctl', 'stp', 'uci'];

CHECKS['3.ex1'] = {
    plan: { candidates: ['10.1.1.4', '10.1.1.1', '10.1.2.1'], sections: L3_SECTIONS, stp: true },
    run(ctx) {
        const res = [];
        l3Common(res, ctx, ['10.1.1.4', '10.1.1.1', '10.1.2.1']);
        l3Links(res, ctx, L3_FIG1, 'Figure 1');
        l3State(res, ctx);
        l3Priority(res, ctx, '10.1.1.4', 4096, 'Distribution switch 10.1.1.4');
        const m = ctx.model;
        if (m && m.rootNode && !m.rootsDisagree) {
            if (m.rootNode.ip === '10.1.1.4') res.push(R.pass('The distribution switch is the root'));
            else res.push(R.fail(`The root is ${m.rootNode.name}, not the distribution switch`, 'Last part of Exercise 1: make the distribution switch the root.', 'On 10.1.1.4: set the bridge priority to 4096 (lower than the 32767 of the others).'));
        }
        manualQuestions(res, 'Identify root, bridge ID, port states and capture a BPDU in Wireshark (see the Guide).');
        return res;
    }
};

CHECKS['3.ex2'] = {
    plan: { candidates: ['10.1.1.4', '10.1.1.1', '10.1.2.1'], sections: L3_SECTIONS, stp: true },
    run(ctx) {
        const res = [];
        l3Common(res, ctx, ['10.1.1.4', '10.1.1.1', '10.1.2.1']);
        l3Links(res, ctx, L3_FIG1, 'Figure 1 (all cables back in place)');
        l3State(res, ctx);
        const m = ctx.model;
        if (m && m.rootNode && m.rootNode.ip === '10.1.1.4') res.push(R.pass('The distribution switch is still the root'));
        res.push(R.manual('Failure tests', 'Disconnect and repair a distribution link, an access link and an access switch, time the reconfiguration (the Monitor tab has a stopwatch) and describe the STP state each time.'));
        manualQuestions(res);
        return res;
    }
};

CHECKS['3.ex3'] = {
    plan: { candidates: L3_ALL.filter(ip => ip !== '10.1.1.4'), sections: L3_SECTIONS, stp: true },
    run(ctx) {
        const res = [];
        const ips = L3_ALL.filter(ip => ip !== '10.1.1.4');
        l3Common(res, ctx, ips);
        l3Links(res, ctx, L3_FIG2, 'Figure 2');
        l3State(res, ctx);
        l3Priority(res, ctx, '10.1.2.5', 4096, 'Core switch 2 (10.1.2.5)');
        l3Priority(res, ctx, '10.1.4.5', 8192, 'Core switch 4 (10.1.4.5)');
        for (const ip of ips.filter(x => !['10.1.2.5', '10.1.4.5'].includes(x))) l3Priority(res, ctx, ip, 32767, nameOf(ip));
        const m = ctx.model;
        if (m && m.rootNode && !m.rootsDisagree) {
            if (m.rootNode.ip === '10.1.2.5') res.push(R.pass('Core switch 2 is the root'));
            else res.push(R.fail(`The root is ${m.rootNode.name}, expected core switch 2 (10.1.2.5)`, 'The root should be the core switch that every access switch can reach.', 'Set priority 4096 on 10.1.2.5 and 8192 on 10.1.4.5.'));
        }
        if (m && !m.unstable && m.okCount === 8 && m.links.length === 12) {
            res.push(m.blocked === 5 ? R.pass('5 links are blocked: 12 links - 7 for a tree') : R.warn(`${m.blocked} blocked links, expected 5`, 'A tree over 8 switches uses 7 of the 12 links.'));
        }
        manualQuestions(res, 'Describe the root, the port roles and why; then shut down the root and see the secondary root take over.');
        res.push(R.manual('Extra exercise: Figure 3', 'Add the four extra links in the Monitor tab (Figure 3) and explain why bridges cannot handle too many loops.'));
        return res;
    }
};

CHECKS['3.extra'] = {
    plan: { candidates: L3_ALL.filter(ip => ip !== '10.1.1.4'), sections: L3_SECTIONS, stp: true },
    run(ctx) {
        const res = [];
        const ips = L3_ALL.filter(ip => ip !== '10.1.1.4');
        l3Common(res, ctx, ips);
        l3Links(res, ctx, L3_FIG3, 'Figure 3 (extra loops)');
        l3State(res, ctx);
        const m = ctx.model;
        if (m && !m.unstable && m.okCount === 8 && m.links.length === 16) res.push(m.blocked === 9 ? R.pass('9 links are blocked: 16 links - 7 for a tree') : R.warn(`${m.blocked} blocked links, expected 9`, 'STP blocks one end of every link that is not in the tree.'));
        manualQuestions(res, 'Why do you think the bridges cannot handle too many loops?');
        return res;
    }
};

/* ---------- Lab 4 ---------- */

// Port plan of the lab (Figure 2 and 3). Ports are 1..8.
const L4_ACCESS_VLAN = n => seq(8).map(p => p <= 5 ? n : [1, 2, 3, 4].filter(v => v !== n)[p - 6]);   // [VLAN of port 1..8]
const L4_CORE_VLAN = seq(8).map(p => Math.ceil(p / 2));
// Trunk ports of Figure 3 (access: the uplink; cores: the ports that carry a link)
const L4_TRUNKS = { a1: [3], a2: [3], a3: [3], a4: [3], c1: [1, 2, 3, 5, 7], c2: [1, 2, 3], c3: [1, 5, 6, 7, 8], c4: [3, 7, 8] };
const L4_OLD_IP = { a: n => `10.1.${n}.1`, c: n => `10.1.${n}.5` };
const L4_NEW_IP = { a: n => `10.1.1.${n}`, c: n => `10.1.1.${n + 4}` };
const L4_KEYS = [1, 2, 3, 4].flatMap(n => [{ key: 'a' + n, n, type: 'Access', ip: [L4_OLD_IP.a(n), L4_NEW_IP.a(n)] }, { key: 'c' + n, n, type: 'Core', ip: [L4_OLD_IP.c(n), L4_NEW_IP.c(n)] }]);
const L4_CANDIDATES = [...new Set(L4_KEYS.flatMap(k => k.ip))];
const L4_SECTIONS = ['board', 'addr', 'route', 'uci', 'firewall', 'brctl', 'stp', 'vlan', 'opkg', 'links', 'tc'];

// Finds which address answers for every logical switch. Returns [{ ...key, address, d }]
function l4Devices(ctx, preferNew) {
    return L4_KEYS.map(k => {
        const order = preferNew ? [...k.ip].reverse() : k.ip;
        const ip = order.find(x => ctx.devices.has(x));
        return Object.assign({}, k, { address: ip || null, d: ip ? ctx.devices.get(ip) : null, label: `${k.type} switch ${k.n}` });
    });
}

function l4Missing(res, ctx, list) {
    for (const x of list) {
        if (x.d) res.push(R.pass(`${x.label} answers on ${x.address}`, x.d.model));
        else res.push(R.fail(`${x.label} does not answer`, `Tried ${x.ip.join(' and ')}.`, 'Check power, cable and that the management IP of the switch is set (access N: 10.1.N.1, core N: 10.1.N.5; after Exercise 3: 10.1.1.N and 10.1.1.(N+4)).'));
    }
}

function l4Packages(res, list) {
    for (const x of list.filter(y => y.d)) {
        const missing = ['ip-full', 'ip-bridge', 'tc-full'].filter(p => !x.d.packages.has(p));
        if (!missing.length) res.push(R.pass(`${x.label}: ip-full, ip-bridge and tc-full are installed`));
        else res.push(R.fail(`${x.label}: missing packages ${missing.join(', ')}`, 'Needed for "bridge vlan show" and for the port mirroring with tc.', 'Press the button: this PC downloads the packages and copies them to the switch (the switch needs no internet). Or on the switch: opkg update && opkg install ip-full ip-bridge tc-full  (Internet needed; revert the new WAN interface to LAN afterwards).', { kind: 'pkg', key: x.key, ip: x.address, label: x.label }));
    }
}

// Compares the VLAN table of a switch with the expected untagged/tagged layout.
// expect: { lanN: { untaggedVlan: v | null, tagged: [v...] } }
function l4Vlans(res, x, expect, stage = null) {
    const vl = x.d.vlan;
    if (!Object.keys(vl).length) { res.push(R.fail(`${x.label}: no VLAN table (bridge vlan show is empty)`, 'VLAN filtering is not configured, or the package ip-bridge is missing.', x.d.packages.has('ip-bridge') ? 'Network > Interfaces > Devices > switch > Configure > Bridge VLAN filtering: enable it and add the VLANs.' : 'The package ip-bridge is not installed, so "bridge vlan show" does not exist. Install the packages first (press the button), then run the check again.',
        !x.d.packages.has('ip-bridge') ? { kind: 'pkg', key: x.key, ip: x.address, label: x.label } : stage ? { kind: 'vlan', stage, key: x.key, ip: x.address, label: x.label } : null)); return; }
    const bad = [];
    for (const p of seq(8)) {
        const e = expect[`lan${p}`];
        const have = vl[`lan${p}`] || {};
        const ids = Object.keys(have).map(Number).sort();
        const untagged = ids.filter(id => have[id].untagged);
        const tagged = ids.filter(id => !have[id].untagged);
        const pvid = ids.find(id => have[id].pvid);
        const wantTagged = (e.tagged || []).slice().sort();
        const okUntagged = e.untaggedVlan == null ? !untagged.length : untagged.length === 1 && untagged[0] === e.untaggedVlan && pvid === e.untaggedVlan;
        const okTagged = wantTagged.join() === tagged.join();
        if (!okUntagged || !okTagged) {
            const describe = (u, t) => `${u != null ? 'VLAN ' + u + ' untagged' : 'no untagged VLAN'}${t.length ? ', VLAN ' + t.join(',') + ' tagged' : ''}`;
            bad.push(`port ${p}: ${describe(untagged[0] ?? null, tagged)} (expected ${describe(e.untaggedVlan, wantTagged)})`);
        }
    }
    if (!bad.length) res.push(R.pass(`${x.label}: the VLAN configuration of all 8 ports is correct`));
    else res.push(R.fail(`${x.label}: ${bad.length} port(s) have the wrong VLAN configuration`, bad.join('; '), 'Network > Interfaces > Devices > switch > Configure > Bridge VLAN filtering. Use "U*" (untagged + PVID) for host and access ports and "T" (tagged) on trunk ports.',
        stage ? { kind: 'vlan', stage, key: x.key, ip: x.address, label: x.label } : null));
}

function l4ExpectEx1() {
    return x => Object.fromEntries(seq(8).map(p => [`lan${p}`, { untaggedVlan: 1, tagged: [] }]));
}

function l4ExpectVlans(x) {
    const v = x.type === 'Access' ? L4_ACCESS_VLAN(x.n) : L4_CORE_VLAN;
    return Object.fromEntries(seq(8).map(p => [`lan${p}`, { untaggedVlan: v[p - 1], tagged: [] }]));
}

function l4ExpectTrunks(x) {
    const trunks = L4_TRUNKS[x.key];
    const base = x.type === 'Access' ? L4_ACCESS_VLAN(x.n) : seq(8).map(() => 1);   // core ports outside the trunks stay untagged in VLAN 1
    return Object.fromEntries(seq(8).map(p => [`lan${p}`, trunks.includes(p) ? { untaggedVlan: null, tagged: [1, 2, 3, 4] } : { untaggedVlan: base[p - 1], tagged: [] }]));
}

function l4Common(res, ctx, list, prefix) {
    for (const x of list.filter(y => y.d)) {
        needMask(res, x.d, x.address, prefix, x.label);
        needFirewallOff(res, x.d, x.label);
        const br = x.d.bridges.find(b => b.name === 'switch') || x.d.bridges[0];
        if (br && br.stp) res.push(R.pass(`${x.label}: STP is enabled`));
        else res.push(R.fail(`${x.label}: STP is not enabled`, 'Turn STP on before cabling; the trunk links form loops.', "uci set network.switch.stp='1'; uci commit network; /etc/init.d/network restart", { kind: 'stp', ip: x.address, label: x.label }));
    }
}

CHECKS['4.ex1'] = {
    plan: { candidates: L4_CANDIDATES, sections: L4_SECTIONS, pcPing: L4_CANDIDATES, local: true },
    run(ctx) {
        const res = [];
        const list = l4Devices(ctx, false);
        l4Missing(res, ctx, list);
        l4Packages(res, list);
        l4Common(res, ctx, list, 16);
        for (const x of list.filter(y => y.d)) l4Vlans(res, x, l4ExpectEx1()(x), 'ex1');
        for (const x of list.filter(y => y.d)) expectPing(res, ctx, x.address, x.label, true, 'Full connectivity is required before you continue: every port must be an untagged member of VLAN 1.');
        pcCheck(res, ctx, 16, null);
        manualQuestions(res, 'Explain how you check it in the GUI and the CLI, and why all ports must be untagged.');
        return res;
    }
};

CHECKS['4.ex1b'] = {
    plan: { candidates: L4_CANDIDATES, sections: L4_SECTIONS, pcPing: L4_CANDIDATES, local: true },
    run(ctx) {
        const res = [];
        const list = l4Devices(ctx, false);
        l4Missing(res, ctx, list);
        l4Common(res, ctx, list, 16);
        for (const x of list.filter(y => y.d)) l4Vlans(res, x, l4ExpectVlans(x), 'ex1b');
        res.push(R.info('Connectivity in this step', 'The ports are untagged members of separate VLANs and the links are not trunks yet, so devices on different VLAN segments no longer see each other. Your PC must be on a VLAN1 port to manage the switches.'));
        manualQuestions(res, 'Move a host to another VLAN and see what happens to reachability; answer how the switch keeps the VLANs apart.');
        return res;
    }
};

CHECKS['4.ex2'] = {
    plan: { candidates: L4_CANDIDATES, sections: L4_SECTIONS, pcPing: L4_CANDIDATES, local: true, stp: true },
    run(ctx) {
        const res = [];
        const list = l4Devices(ctx, false);
        l4Missing(res, ctx, list);
        l4Common(res, ctx, list, 16);
        for (const x of list.filter(y => y.d)) l4Vlans(res, x, l4ExpectTrunks(x), 'ex2');
        for (const x of list.filter(y => y.d)) expectPing(res, ctx, x.address, x.label, true, 'With trunks on all inter-switch links and the PC in VLAN 1, every management address must answer.');
        if (ctx.model) {
            const m = ctx.model;
            if (m.activeLoop) res.push(R.fail('There is a loop in the forwarding path', 'The trunk links form loops and STP must block some of them.', 'Check that STP is enabled on all switches.'));
            else if (!m.unstable) res.push(R.pass(`STP is stable: ${m.blocked} link(s) blocked for ${m.loops} loop(s)`));
        }
        manualQuestions(res, 'Paste the 802.1Q header diagram, explain the tag fields, test connectivity within and between VLANs, and capture a tagged frame on a mirrored trunk port (tc, see the Guide).');
        const tc = list.filter(x => x.d && x.d.clsact);
        res.push(tc.length ? R.info(`Port mirroring (clsact) is active on ${tc.map(x => x.label).join(', ')}`, 'Remove it afterwards with: tc qdisc del dev lan3 clsact') : R.manual('Port mirroring', 'Mirror a trunk port to a free port with tc and capture a frame with an 802.1Q tag in Wireshark.'));
        return res;
    }
};

CHECKS['4.ex3'] = {
    plan: { candidates: [...L4_CANDIDATES, '10.1.1.254', '10.1.2.254', '10.1.3.254', '10.1.4.254'], sections: [...L4_SECTIONS, 'vlanproc', 'fwd'], pcPing: [...L4_CANDIDATES, '10.1.1.254', '10.1.2.254', '10.1.3.254', '10.1.4.254'], local: true },
    run(ctx) {
        const res = [];
        const list = l4Devices(ctx, true);
        l4Missing(res, ctx, list);
        // 1. new management addresses
        for (const x of list.filter(y => y.d)) {
            const wanted = L4_NEW_IP[x.key[0]](x.n);
            if (x.address === wanted) res.push(R.pass(`${x.label} uses the new management address ${wanted}`));
            else res.push(R.fail(`${x.label} still uses ${x.address}, expected ${wanted}`, 'Every switch is managed through VLAN 1, so its address must be in the VLAN 1 subnet 10.1.1.0/24.', `Network > Interfaces > LAN > Edit: IPv4 ${wanted}, netmask 255.255.255.0 (do this from a VLAN 1 port).`));
            if (x.address === wanted) {
                needMask(res, x.d, wanted, 24, x.label);
                if (x.d.defaultGw === '10.1.1.254') res.push(R.pass(`${x.label}: default gateway is 10.1.1.254`));
                else res.push(R.fail(`${x.label}: default gateway is ${x.d.defaultGw || 'not set'}, expected 10.1.1.254`, 'Without a gateway the switch cannot answer hosts in other VLANs.', 'Network > Interfaces > LAN > Edit: IPv4 gateway 10.1.1.254.'));
            }
            needFirewallOff(res, x.d, x.label);
            // The port that connects the router is one extra port that is tagged in all four VLANs; it is allowed here.
            const exp = l4ExpectTrunks(x);
            for (const p of seq(8).filter(p => !L4_TRUNKS[x.key].includes(p))) {
                const have = x.d.vlan[`lan${p}`] || {};
                if ([1, 2, 3, 4].every(v => have[v] && !have[v].untagged) && Object.keys(have).length === 4) exp[`lan${p}`] = { untaggedVlan: null, tagged: [1, 2, 3, 4] };
            }
            l4Vlans(res, x, exp);
        }
        // 2. the router
        const router = [1, 2, 3, 4].map(n => dev(ctx, `10.1.${n}.254`)).find(Boolean);
        const rip = router ? [1, 2, 3, 4].map(n => `10.1.${n}.254`).find(ip => ctx.devices.has(ip)) : null;
        if (!router) res.push(R.fail('The router does not answer on 10.1.1.254', 'The router of the stick is not reachable over SSH on its VLAN 1 address.', 'Configure the interface vlan1 (device lan2.1) with 10.1.1.254/24, connect the router to the tagged switch port and make sure your PC is in 10.1.1.0/24 with gateway 10.1.1.254.'));
        else {
            res.push(R.pass(`The router answers on ${rip}`, router.model));
            const want = [1, 2, 3, 4];
            const missing = want.filter(v => !router.vlanDevs.some(x => x.id === v && x.base === 'lan2'));
            if (!missing.length) res.push(R.pass('The router has the VLAN devices lan2.1, lan2.2, lan2.3 and lan2.4 on lan2', router.vlanDevs.map(x => x.name).join(', ')));
            else res.push(R.fail(`The router is missing VLAN device(s) for VLAN ${missing.join(', ')}`, `/proc/net/vlan/config shows: ${router.vlanDevs.map(x => `${x.name} (VLAN ${x.id})`).join(', ') || 'nothing'}`, 'Network > Interfaces > Devices > Add device configuration: type VLAN (802.1Q), base device lan2, VLAN ID n.'));
            for (const v of want) {
                const a = router.addrs.find(x => x.ip === `10.1.${v}.254`);
                if (!a) res.push(R.fail(`The router has no address 10.1.${v}.254 (VLAN ${v})`, '', `Create the interface vlan${v}: static address, device lan2.${v}, IPv4 10.1.${v}.254, netmask 255.255.255.0, no gateway, no DHCP.`));
                else if (a.prefix !== 24) res.push(R.fail(`10.1.${v}.254 has mask /${a.prefix}, expected /24`, '', `Netmask 255.255.255.0 on the interface vlan${v}.`));
                else if (a.ifname !== `lan2.${v}`) res.push(R.fail(`10.1.${v}.254 is on ${a.ifname}, expected lan2.${v}`, 'The address must be on the VLAN device of that VLAN.', `Set the device of the interface vlan${v} to lan2.${v}.`));
                else res.push(R.pass(`10.1.${v}.254/24 is on lan2.${v}`));
            }
            const br = router.bridges.find(b => b.name === 'br-lan');
            if (br && br.ports.includes('lan2')) res.push(R.fail('lan2 of the router is still in br-lan', 'The port is used for the 802.1Q devices, so it must leave the bridge.', 'Network > Interfaces > Devices > br-lan > Configure: remove lan2.'));
            else if (br) res.push(R.pass('lan2 of the router is not in br-lan'));
            if (router.forwarding) res.push(R.pass('IP forwarding is on in the router')); else res.push(R.fail('IP forwarding is off in the router', '', 'echo 1 > /proc/sys/net/ipv4/ip_forward'));
            needFirewallOff(res, router, 'Router');
        }
        // 3. the switch port that connects the router: tagged in all four VLANs and not one of the trunk ports of the figure
        const stick = [];
        for (const x of list.filter(y => y.d)) {
            for (const p of seq(8).filter(p => !L4_TRUNKS[x.key].includes(p))) {
                const have = x.d.vlan[`lan${p}`] || {};
                if ([1, 2, 3, 4].every(v => have[v] && !have[v].untagged)) stick.push(`${x.label} port ${p}`);
            }
        }
        if (stick.length === 1) res.push(R.pass(`Router port: ${stick[0]} is a tagged member of VLAN 1, 2, 3 and 4`));
        else if (!stick.length) res.push(R.fail('No switch port is configured for the router', 'Choose a free port on a core switch and make it a tagged (T) member of VLAN 1, 2, 3 and 4, without untagged/PVID.', 'Bridge VLAN filtering: set T for all four VLANs on that port.'));
        else res.push(R.warn(`${stick.length} ports look like router ports: ${stick.join(', ')}`, 'Only the port that connects the router should be tagged in all VLANs.'));
        // 4. reachability from this PC
        const pc = pcCheck(res, ctx, 24, '10.1.1.254');
        for (const x of list.filter(y => y.d)) expectPing(res, ctx, x.address, x.label, true);
        for (const v of [1, 2, 3, 4]) expectPing(res, ctx, `10.1.${v}.254`, `gateway of VLAN ${v}`, true, v === 1 ? 'The router must answer on VLAN 1.' : `The router interface for VLAN ${v} is missing, or VLAN ${v} is not tagged on the router port.`);
        if (pc && pc.net !== 1) res.push(R.info('This PC is not in VLAN 1', 'To manage the switches keep your PC on a VLAN 1 port with 10.1.1.x/24 and gateway 10.1.1.254.'));
        manualQuestions(res, 'Answer the router-on-a-stick questions, traceroute inside and between VLANs and analyse the traffic on the link to the router (mirror it with tc).');
        return res;
    }
};

/* ---------- Lab 5 ---------- */

// The network of Lab 2 again (Figure 1 of Lab5.pdf): router n has LAN1 10.1.n.3 (br-lan) and LAN2 10.1.(n+1).2 (lan2).
// The .10 host uses 10.1.x.2 as gateway, the .11 host 10.1.x.3. Now the firewall is on, and fwsim.js predicts from the
// configuration of the routers what happens to the test traffic (ping, SSH, LuCI, the web server on port 8000).
const L5_SECTIONS = ['board', 'addr', 'route', 'uci', 'firewall', 'fwuci', 'fwcount', 'brctl', 'fwd'];
const L5_ROUTER_IPS = seq(4).flatMap(n => [L2.r1(n), L2.r2(n)]);
const L5_HOSTS = seq(4).flatMap(n => [`10.1.${n}.10`, `10.1.${n}.11`]);
const L5_DEPT = { 1: 'IT', 2: 'Finance', 3: 'HR', 4: 'Guest' };
const l5Gw = ip => { const o = ip.split('.'); return `10.1.${o[2]}.${o[3] === '10' ? 2 : 3}`; };
const l5Prev = n => (n + 2) % 4 + 1;          // router n-1 (router 4 for n = 1): it owns 10.1.n.2
const l5Net = ip => Number(ip.split('.')[2]);
const l5Sev = (n, mine) => mine === null || n === mine ? 'fail' : 'warn';

function l5Plan(extra = {}) {
    return Object.assign({ candidates: L5_ROUTER_IPS, sections: L5_SECTIONS, pcPing: [...L5_ROUTER_IPS, ...L5_HOSTS], local: true }, extra);
}

// The routers that answered over SSH, on LAN1 or else on LAN2 (a rule of the lab can block SSH to one of them).
function l5Routers(ctx) {
    const routers = [];
    for (const n of seq(4)) {
        const ip = [L2.r1(n), L2.r2(n)].find(x => ctx.devices.has(x));
        if (ip) routers.push({ n, label: `R${n}`, ip, d: ctx.devices.get(ip) });
    }
    return { routers, gw: l5Gw, byN: n => routers.find(r => r.n === n) || null };
}

const l5Rule = (d, re) => d.fw.rules.find(r => re.test(r.name));
const l5Show = (f, max = 4) => f.slice(0, max).join('; ') + (f.length > max ? `; and ${f.length - max} more` : '');

// Addresses, firewall on, zones and routes of every router. zone: the zone LAN1 and LAN2 must be in.
function l5Base(res, ctx, net, mine, zone = 'lan') {
    for (const n of seq(4)) {
        const r = net.byN(n);
        const sev = l5Sev(n, mine);
        if (!r) {
            res.push(R[sev](`Router ${n} cannot be read over SSH`, `Tried ${L2.r1(n)} and ${L2.r2(n)}. ${ctx.failed.get(L2.r1(n)) || ''}`.trim(), 'Check the router, the cables and that this PC can reach it. A firewall rule of this lab can also block SSH from this PC; then run the check from another host.'));
            continue;
        }
        const d = r.d, t = `R${n}`;
        const a1 = addrOf(d, L2.r1(n)), a2 = addrOf(d, L2.r2(n));
        if (a1 && a2 && a1.prefix === 24 && a2.prefix === 24) res.push(R.pass(`${t}: LAN1 ${L2.r1(n)}/24 and LAN2 ${L2.r2(n)}/24`, `${a1.ifname} and ${a2.ifname}`));
        else res.push(R[sev](`${t}: the addresses do not match Figure 1`, `LAN1 ${a1 ? a1.ip + '/' + a1.prefix : 'missing'}, LAN2 ${a2 ? a2.ip + '/' + a2.prefix : 'missing'}`, `Set up the router as in Lab 2: br-lan ${L2.r1(n)}/24 and an interface lan2 (device lan2) with ${L2.r2(n)}/24.`));
        if (d.firewallRunning) res.push(R.pass(`${t}: the firewall is running`));
        else res.push(R[sev](`${t}: the firewall is not running`, 'This lab needs the firewall on (in Labs 2 to 4 it was stopped).', '/etc/init.d/firewall enable; /etc/init.d/firewall start'));
        if (!d.fw.present) { res.push(R[sev](`${t}: no firewall configuration found`, '"uci show firewall" is empty.', 'Check /etc/config/firewall (a reset brings back the default).')); continue; }
        const z1 = a1 ? fwZoneOf(d, a1.ifname) : null, z2 = a2 ? fwZoneOf(d, a2.ifname) : null;
        if (z1 && z2 && z1.name === zone && z2.name === zone) res.push(R.pass(`${t}: LAN1 and LAN2 are both in zone ${zone}`));
        else if (a2 && !z2) res.push(R[sev](`${t}: LAN2 is in no firewall zone`, 'Traffic from and to LAN2 falls back to the global policies (input and forward REJECT), so there is no full connectivity.', zone === 'lan' ? "Network > Firewall > Zones > lan > Edit > Covered networks: add lan2.  CLI: uci add_list firewall.@zone[0].network='lan2'; uci commit firewall; /etc/init.d/firewall reload" : `Network > Firewall > Zones > ${zone} > Edit > Covered networks: lan and lan2.`));
        else res.push(R[sev](`${t}: LAN1 is in zone ${z1 ? z1.name : 'none'} and LAN2 in zone ${z2 ? z2.name : 'none'}, expected ${zone}`, '', `Covered networks of zone ${zone}: lan and lan2.`));
        const missing = seq(4).filter(y => y !== n && y !== L2.next(n) && !d.routes.some(rt => rt.dst === `10.1.${y}.0/24`));
        if (!missing.length) res.push(R.pass(`${t}: routes to the two remote networks`));
        else res.push(R[sev](`${t}: no route to ${missing.map(y => `10.1.${y}.0/24`).join(' and ')}`, 'Full connectivity comes first: use the static routes (or OSPF) of Lab 2.', 'Network > Routing > Static IPv4 Routes, as in Lab 2 Exercise 6.'));
        if (!d.forwarding) res.push(R[sev](`${t}: IP forwarding is off`, '', 'echo 1 > /proc/sys/net/ipv4/ip_forward'));
    }
}

// Flows that do not give the expected result, as short texts.
function l5Expect(net, flows) {
    const wrong = [], unknown = [];
    for (const [src, dst, kind, want] of flows) {
        const f = fwFlow(net, src, dst, kind);
        if (f.unknown) unknown.push(`${src} > ${dst}`);
        else if (f.ok !== want) wrong.push(`${kind} ${src} > ${dst} ${f.ok ? 'gets through' : 'is blocked: ' + fwBlocker(f)}`);
    }
    return { wrong, unknown };
}

CHECKS['5.ex1'] = {
    plan: l5Plan(),
    run(ctx) {
        const res = [];
        const pc = pcLab(ctx);
        const mine = pc ? pc.net : null;
        pcCheck(res, ctx, 24, pc ? l5Gw(pc.ip) : null);
        const net = l5Routers(ctx);
        l5Base(res, ctx, net, mine);
        // 3.1 full connectivity between all hosts, apart from the rule of 3.3
        if (net.routers.length === 4) {
            const flows = [];
            for (const s of L5_HOSTS) for (const d of L5_HOSTS) if (s !== d && l5Net(s) !== l5Net(d)) flows.push([s, d, 'ping', true]);
            const { wrong } = l5Expect(net, flows);
            if (!wrong.length) res.push(R.pass('Full connectivity: every host can ping every host in another subnet (predicted from the routers)'));
            else res.push(R.fail(`${wrong.length} host-to-host ping(s) are blocked`, l5Show(wrong), 'Put lan2 in the lan zone on every router and check the routes; only the rule of 3.3 may block anything.'));
        } else res.push(R.warn('Not all four routers could be read', 'Full connectivity between all subnets is only predicted when every router answers.'));
        // 3.3 the .10 host may not reach its default gateway 10.1.x.2, the .11 host may
        for (const s of seq(4)) {
            const n = l5Prev(s), r = net.byN(n);
            if (!r) continue;
            const h10 = `10.1.${s}.10`, h11 = `10.1.${s}.11`, gw = `10.1.${s}.2`;
            const sev = l5Sev(n, mine);
            const ping10 = fwFlow(net, h10, gw, 'ping'), web10 = fwFlow(net, h10, gw, 'web');
            // Blocked, but by a zone or global policy (lan2 in no zone): that is reported above, not as the rule of 3.3.
            const stop = f => [...f.request.hops, ...(f.reply ? f.reply.hops : [])].find(x => x.verdict !== 'ACCEPT');
            const notRule = f => !f.ok && stop(f) && stop(f).by !== 'rule';
            if (notRule(ping10)) {
                res.push(R[sev](`R${n}: ${h10} > ${gw} is blocked by the ${fwWhy(stop(ping10))}, not by a rule`, 'Restore full connectivity first (zones), then add the rule of 3.3.'));
                continue;
            }
            if (!ping10.ok && !web10.ok) {
                const h = stop(ping10);
                res.push(R.pass(`R${n}: ${h10} can no longer reach ${gw} (ping and LuCI)`, `${fwWhy(h)}, action ${h.verdict}${h.verdict === 'REJECT' ? ' (the host gets an error back)' : ' (the packet disappears, the host waits for a timeout)'}`));
            } else if (ping10.ok && !web10.ok) {
                res.push(R[sev](`R${n}: ${h10} can still ping ${gw}`, 'LuCI is blocked, but ICMP is not: the protocol of the rule is probably TCP+UDP (the default).', 'Edit the rule: Protocol "Any".'));
            } else {
                res.push(R[sev](`R${n}: no rule blocks ${h10} > ${gw}`, `Rule 3.3 belongs on R${n}, the router that owns ${gw}.`, `Network > Firewall > Traffic Rules > Add: protocol Any, source zone lan, source address ${h10}, destination zone Device (input), destination address ${gw}, action reject.`));
            }
            const ping11 = fwFlow(net, h11, gw, 'ping');
            if (!ping11.ok) res.push(R[sev](`R${n}: ${h11} cannot reach ${gw} either`, fwBlocker(ping11), 'The rule must match only the .10 host: source address ' + h10 + '.'));
            const far = `10.1.${L2.next(L2.next(s))}.10`, away = fwFlow(net, h10, far, 'ping');
            if (!away.unknown && !away.ok) res.push(R[sev](`R${n}: the rule also blocks ${h10} > ${far}`, fwBlocker(away), 'Only traffic to the router itself (destination zone Device, address ' + gw + ') may be blocked.'));
        }
        // the real test from this PC
        if (pc && [10, 11].includes(pc.host)) {
            const gw = `10.1.${pc.net}.2`;
            expectPing(res, ctx, gw, `${gw} (the gateway of the .10 host)`, pc.host === 11, pc.host === 10 ? 'This PC is the .10 host: the rule of 3.3 blocks it.' : 'The .11 host is not matched by the rule.');
            const far = `10.1.${L2.next(L2.next(pc.net))}.1${pc.host === 10 ? 0 : 1}`;
            expectPing(res, ctx, far, 'a host two subnets away', true, 'Routing through the router is FORWARD traffic; the rule only matches INPUT to 10.1.x.2.');
        }
        manualQuestions(res, 'Describe how you restored full connectivity, explain INPUT versus FORWARD with the two example pings, and compare REJECT and DROP (error message versus timeout).');
        return res;
    }
};

CHECKS['5.ex2'] = {
    plan: l5Plan(),
    run(ctx) {
        const res = [];
        const pc = pcLab(ctx);
        const mine = pc ? pc.net : null;
        const net = l5Routers(ctx);
        l5Base(res, ctx, net, mine);
        for (const n of seq(4)) {
            const r = net.byN(n);
            if (!r) continue;
            const t = `R${n}`, sev = l5Sev(n, mine);
            const h10 = `10.1.${n}.10`, h11 = `10.1.${n}.11`, lan1 = L2.r1(n), lan2 = L2.r2(n);
            const block = l5Rule(r.d, /block.?ssh/i), allow = l5Rule(r.d, /allow.?ssh/i);
            const forward = block && block.dest;
            if (forward) {
                // 4.4: the rule became a forward rule
                const own = fwFlow(net, h11, lan1, 'ssh');
                const right = `10.1.${L2.next(n)}.3`, fr = fwFlow(net, h11, right, 'ssh');
                res.push(R.info(`${t}: ${block.name} is a forward rule now (destination zone ${block.dest === '*' ? 'Any zone' : block.dest})`, `SSH ${h11} > ${lan1} ${own.ok ? 'works again' : 'is blocked'}: the router itself is INPUT, not FORWARD.`));
                if (!fr.unknown) res.push(fr.ok ? R.info(`${t}: SSH ${h11} > ${right} (router on the right) is not blocked`, 'Set the destination address of the rule to ' + right + ' to block it.') : R.pass(`${t}: SSH ${h11} > ${right} is blocked while it passes through ${t}`, fwBlocker(fr)));
            } else {
                const s11 = fwFlow(net, h11, lan1, 'ssh');
                if (!s11.ok) res.push(R.pass(`${t}: SSH ${h11} > ${lan1} is blocked`, fwBlocker(s11)));
                else res.push(R[sev](`${t}: SSH ${h11} > ${lan1} is not blocked`, allow && block ? `${allow.name} is above ${block.name} or the block rule does not match (first match wins).` : 'No rule matches.', `Traffic rule Block_SSH_11: protocol TCP, source zone lan, source address ${h11}, destination zone Device (input), destination address ${lan1}, destination port 22, action reject.`));
                const checks = [[h10, lan1, 'ssh', 'SSH from the .10 host'], [h11, lan1, 'ping', 'ping from the .11 host'], [h11, lan1, 'web', 'LuCI from the .11 host'], [h11, lan2, 'ssh', 'SSH from the .11 host to LAN2']];
                const broken = checks.filter(([s, d, k]) => !fwFlow(net, s, d, k).ok).map(c => c[3]);
                if (!broken.length) res.push(R.pass(`${t}: everything else keeps working (SSH from .10, ping and LuCI from .11, SSH to LAN2)`));
                else res.push(R[broken.includes('LuCI from the .11 host') && broken.length === 1 ? 'warn' : sev](`${t}: the rule blocks too much: ${broken.join(', ')}`, broken.includes('LuCI from the .11 host') ? 'No destination port: every TCP service of LAN1 is blocked for .11 (step of 4.1).' : '', 'Set destination port 22 and the exact source and destination address.'));
            }
            if (allow) res.push(R.warn(`${t}: ${allow.name} still exists`, 'Delete Allow_SSH_11 after the test of 4.2.', 'Network > Firewall > Traffic Rules: delete it, Save & Apply.'));
            if (block && r.d.fwCounters[block.name] != null) res.push(R.info(`${t}: ${block.name} matched ${r.d.fwCounters[block.name]} packet(s)`, 'Counter of nft list ruleset. Try SSH from .11 and run the check again: the counter goes up.'));
        }
        manualQuestions(res, 'Answer the questions of 4.1 to 4.4 (service filter, rule order, existing connections, nft counters, input versus forward).');
        return res;
    }
};

CHECKS['5.ex3'] = {
    plan: l5Plan({ http: seq(4).map(n => `10.1.${L2.next(n)}.10:8000`) }),
    run(ctx) {
        const res = [];
        const pc = pcLab(ctx);
        const mine = pc ? pc.net : null;
        const net = l5Routers(ctx);
        for (const n of seq(4)) {
            const r = net.byN(n);
            const sev = l5Sev(n, mine);
            if (!r) { res.push(R[sev](`Router ${n} cannot be read over SSH`, `Tried ${L2.r1(n)} and ${L2.r2(n)}.`)); continue; }
            const t = `R${n}`, d = r.d;
            const A = `10.1.${n}.11`, B = `10.1.${L2.next(n)}.10`;
            if (!d.firewallRunning) { res.push(R[sev](`${t}: the firewall is not running`, '', '/etc/init.d/firewall start')); continue; }
            const labo = d.fw.zones.find(z => z.name === 'labo');
            if (!labo) {
                res.push(R[sev](`${t}: there is no zone labo`, `Student A ${A} and student B ${B} use ${t}. If you already did the cleanup of 5.4, this is fine.`, 'Network > Firewall > Zones > Add: name labo, input/output/intra zone forward accept, covered networks lan and lan2.'));
                continue;
            }
            if (['lan', 'lan2'].every(x => labo.networks.includes(x))) res.push(R.pass(`${t}: zone labo covers lan and lan2`));
            else res.push(R[sev](`${t}: zone labo covers ${labo.networks.join(', ') || 'nothing'}`, '', 'Covered networks: lan and lan2.'));
            if (labo.input !== 'ACCEPT' || labo.output !== 'ACCEPT') res.push(R.warn(`${t}: input ${labo.input}, output ${labo.output}`, 'Keep INPUT and OUTPUT on accept, otherwise you lose LuCI and SSH on the router.'));
            const http = fwFlow(net, A, B, 'http8000'), ping = fwFlow(net, A, B, 'ping');
            if (labo.forward === 'ACCEPT') {
                res.push(R.info(`${t}: denylist (intra zone forward accept)`, 'Everything between the two networks is allowed unless a rule blocks it.'));
                if (!http.ok) res.push(R.pass(`${t}: student A ${A} cannot open http://${B}:8000`, fwBlocker(http)));
                else res.push(R[sev](`${t}: A ${A} can still open http://${B}:8000`, 'Rule Reject_A_to_B_HTTP is missing, disabled or does not match.', `Traffic rule: protocol TCP, source zone labo, source address ${A}, destination zone labo, destination address ${B}, destination port 8000, action reject.`));
                if (ping.ok) res.push(R.pass(`${t}: ping A > B still works (the rule only matches TCP port 8000)`));
                else res.push(R.warn(`${t}: ping A > B is blocked as well`, fwBlocker(ping), 'Exercise 5.1.2 blocks only the web server.'));
            } else {
                res.push(R.info(`${t}: allowlist (intra zone forward ${labo.forward.toLowerCase()})`, 'Everything forwarded between LAN1 and LAN2 is blocked unless a rule allows it, also the traffic of other pairs that passes through this router.'));
                if (http.ok) res.push(R.pass(`${t}: A ${A} can open http://${B}:8000 through an allow rule`, http.request.hops.map(h => fwWhy(h)).join(' > ')));
                else res.push(R[sev](`${t}: A ${A} cannot open http://${B}:8000`, fwBlocker(http), `Traffic rule Allow_A_to_B_HTTP: protocol TCP, source zone labo, source address ${A}, destination zone labo, destination address ${B}, destination port 8000, action accept.`));
                if (ping.ok) res.push(R.pass(`${t}: ping A > B is allowed by a rule`, ping.request.hops.map(h => fwWhy(h)).join(' > ')));
                else res.push(R.info(`${t}: ping A > B is blocked by the zone policy`, 'To allow it: protocol ICMP (type echo-request), source A, destination B, action accept. The echo reply is an established connection.'));
                const back = fwFlow(net, B, A, 'http8000');
                if (!back.ok) res.push(R.info(`${t}: B > A on port 8000 stays blocked`, 'The allow rule works in one direction; replies pass because the firewall is stateful.'));
            }
        }
        if (pc && pc.host === 11) {
            const target = `10.1.${L2.next(pc.net)}.10:8000`, h = ctx.http.get(target);
            if (h) res.push(h.ok ? R.info(`This PC (student A) opens http://${target}`, `HTTP ${h.status}`) : R.info(`This PC (student A) cannot open http://${target}`, 'Blocked by the firewall, or the Python web server of student B is not running.'));
        }
        manualQuestions(res, 'Explain what allows the page without a rule, why the reject rule blocks only the web page, two ways around it, why replies pass in the allowlist and compare both models. Clean up at the end (5.4).');
        return res;
    }
};

// Exercise 4: the policy of NetCorp, line by line. Every line is tested from both hosts of the department.
const L5_POLICIES = [
    { no: 1, text: 'IT has full access to all departments', src: 1, kind: 'ping', to: [2, 3, 4], want: true },
    { no: 2, text: 'IT can access the routers via SSH', src: 1, kind: 'ssh', to: 'routers', want: true },
    { no: 3, text: 'Finance cannot access IT systems', src: 2, kind: 'ping', to: [1], want: false },
    { no: 4, text: 'Finance cannot access the routers via SSH', src: 2, kind: 'ssh', to: 'routers', want: false },
    { no: 5, text: 'Finance can access HR', src: 2, kind: 'ping', to: [3], want: true },
    { no: 6, text: 'HR cannot use SSH to any device', src: 3, kind: 'ssh', to: 'all', want: false },
    { no: 7, text: 'HR cannot access IT', src: 3, kind: 'ping', to: [1], want: false },
    { no: 8, text: 'HR can access Finance', src: 3, kind: 'ping', to: [2], want: true },
    { no: 9, text: 'HR can access the Guest network', src: 3, kind: 'ping', to: [4], want: true },
    { no: 10, text: 'Guest cannot access IT, Finance or HR', src: 4, kind: 'ping', to: [1, 2, 3], want: false },
    { no: 11, text: 'Guest cannot use SSH to any device', src: 4, kind: 'ssh', to: 'all', want: false },
    { no: 12, text: 'Guest can only access its own subnet (router addresses in other subnets too)', src: 4, kind: 'ping', to: 'routersOutside', want: false, soft: true }
];

function l5Targets(p) {
    const hostsOf = deps => L5_HOSTS.filter(h => deps.includes(l5Net(h)));
    if (p.to === 'routers') return L5_ROUTER_IPS;
    if (p.to === 'all') return [...L5_ROUTER_IPS, ...hostsOf(seq(4).filter(x => x !== p.src))];
    if (p.to === 'routersOutside') return L5_ROUTER_IPS.filter(ip => l5Net(ip) !== p.src);
    return hostsOf(p.to);
}

CHECKS['5.ex4'] = {
    plan: l5Plan(),
    run(ctx) {
        const res = [];
        const pc = pcLab(ctx);
        const net = l5Routers(ctx);
        if (!net.routers.length) {
            res.push(pc && pc.net !== 1
                ? R.info('No router accepts SSH from this PC', `This PC is in ${L5_DEPT[pc.net]} (${pc.ip}): SSH to the routers is refused, which is what policies 4, 6 and 11 ask. Run this check on an IT host (10.1.1.10 or 10.1.1.11) to read the rules of all routers.`)
                : R.fail('No router could be read over SSH', 'IT must be able to reach every router with SSH (policy 2).', 'Check the Allow_SSH_IT rule (above the SSH block rule) on every router.'));
        } else {
            l5Base(res, ctx, net, null);
            for (const r of net.routers) {
                if (r.d.fw.zones.some(z => z.name === 'labo')) res.push(R.warn(`R${r.n}: zone labo still exists`, 'Cleanup of Exercise 3: delete it and put lan and lan2 back into zone lan.'));
                const left = r.d.fw.rules.filter(x => x.enabled && /A_to_B/i.test(x.name)).map(x => x.name);
                if (left.length) res.push(R.warn(`R${r.n}: ${left.join(', ')} still present`, 'Remove the temporary rules of Exercise 3.'));
            }
            if (net.routers.length < 4) res.push(R.warn(`Only ${net.routers.length} of the 4 routers could be read`, 'Tests whose packets cross a router that was not read are reported as unknown.'));
            // every policy line, from both hosts of the department
            const split = [];
            for (const p of L5_POLICIES) {
                const flows = [];
                for (const s of [`10.1.${p.src}.10`, `10.1.${p.src}.11`]) for (const d of l5Targets(p)) flows.push([s, d, p.kind, p.want]);
                const { wrong, unknown } = l5Expect(net, flows);
                const head = `Policy ${p.no}: ${p.text}`;
                if (!wrong.length && !unknown.length) res.push(R.pass(head, `${flows.length} ${p.kind} test(s) from 10.1.${p.src}.10 and 10.1.${p.src}.11, predicted from the rules and routes.`));
                else if (!wrong.length) res.push(R.warn(`${head}: ${unknown.length} test(s) unknown`, 'They cross a router that could not be read: ' + l5Show(unknown)));
                else res.push(R[p.soft ? 'warn' : 'fail'](`${head}: ${wrong.length} of ${flows.length} test(s) wrong`, l5Show(wrong),
                    p.want ? 'Something blocks allowed traffic. Often it is the reply: a router that never saw the request evaluates the reply as a new packet. Place the rule on the router that sees both directions, or make it more specific.'
                        : p.kind === 'ssh' ? 'SSH to a router is INPUT on that router: every router needs an accept rule for 10.1.1.0/24 above a reject rule for TCP port 22. SSH to hosts needs a forward rule on the routers the department uses as gateway.'
                            : 'Put the reject rule on a router every packet of this department passes (look at the gateways of .10 and .11 and the routes).'));
                for (const d of l5Targets(p)) {
                    const a = fwFlow(net, `10.1.${p.src}.10`, d, p.kind), b = fwFlow(net, `10.1.${p.src}.11`, d, p.kind);
                    if (!a.unknown && !b.unknown && a.ok !== b.ok) split.push(`${p.kind} > ${d}: ${a.ok ? '.10 works, .11 not' : '.11 works, .10 not'}`);
                }
            }
            if (split.length) res.push(R.info('Some tests depend on the host of the department', `${l5Show(split, 6)}. The .10 host uses 10.1.x.2 (router x-1) and the .11 host 10.1.x.3 (router x) as gateway, and the reply can take another way back than the request.`));
        }
        // the real tests of this PC
        if (pc && [10, 11].includes(pc.host)) {
            const me = pc.net;
            res.push(R.info(`This PC is in ${L5_DEPT[me]} (${pc.ip})`));
            for (const p of L5_POLICIES.filter(x => x.src === me && x.kind === 'ping' && !x.soft)) {
                for (const d of l5Targets(p).filter(x => x.endsWith('.10'))) expectPing(res, ctx, d, `${L5_DEPT[l5Net(d)]} host`, p.want, `Policy ${p.no}: ${p.text}.`);
            }
            const sshOk = L5_ROUTER_IPS.filter(ip => ctx.found.includes(ip));
            if (me === 1) res.push(sshOk.length === 8 ? R.pass('SSH from this PC to all 8 router addresses works (policy 2)') : R.fail(`SSH from this PC works to ${sshOk.length} of 8 router addresses`, `No SSH: ${L5_ROUTER_IPS.filter(ip => !sshOk.includes(ip)).join(', ')}`, 'Allow_SSH_IT (TCP 22 from 10.1.1.0/24, destination Device) must be above the SSH block rule on every router.'));
            else res.push(!sshOk.length ? R.pass('SSH from this PC to the routers is refused (policy 4, 6 or 11)') : R.fail(`SSH from this PC works to ${sshOk.join(', ')}`, 'Only IT may use SSH to a router.', 'Add the SSH reject rule (TCP 22, destination Device) on those routers, below Allow_SSH_IT.'));
        }
        manualQuestions(res, 'Fill in the table (which routers carry which rule and why), list your rules, test every policy from both hosts of each department and explain differences between the .10 and the .11 host.');
        return res;
    }
};

/* ---------- Running a check ---------- */

// Runs the check of one exercise and returns { results, counts }.
async function runCheck(labNumber, exerciseId, progress) {
    const check = CHECKS[`${labNumber}.${exerciseId}`];
    if (!check) return { results: [R.manual('No automatic check for this exercise', 'Answer the questions in the Guide tab.')], counts: { manual: 1 } };
    const plan = Object.assign({ candidates: [], sections: ['board'], pcPing: [], devPing: {}, http: [], stp: false, local: false }, check.plan);
    // ?demo=lab5: the routers of the chosen scenario are simulated in the page (demo5.js).
    const ctx = labNumber === 5 && Demo5.active ? Demo5.collect(plan) : await collect(plan, progress);
    const results = check.run(ctx);
    const counts = {};
    for (const r of results) counts[r.status] = (counts[r.status] || 0) + 1;
    return { results, counts, at: Date.now() };
}
