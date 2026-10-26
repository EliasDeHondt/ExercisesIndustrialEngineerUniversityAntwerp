/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 26/10/2026
**/

'use strict';

// The guide of every lab, taken from Lab1.pdf to Lab4.pdf: goals, preparation, devices and the exercises with their questions.
// Text between `backticks` is shown as code. `monitor` says which live view the lab has.

const LABS = [
    {
        n: 1,
        title: 'Introduction to OpenWrt and switching',
        short: 'OpenWrt basics',
        icon: 'terminal',
        summary: 'Get to know OpenWrt on the Netgear GS108T switch and the Asus RT-AX53U router: the web interface (LuCI), SSH and the command line, packages, connecting two hosts through a switch and a router, backup and reset.',
        goals: [
            'Access and navigate the OpenWrt LuCI web interface.',
            'Connect to an OpenWrt device using SSH and perform basic system inspection.',
            'Configure basic network connectivity.',
            'Compare the default networking behavior of an OpenWrt switch and router.',
            'Update OpenWrt package repositories and install software packages.',
            'Back up and restore OpenWrt configurations.',
            'Reset an OpenWrt device to its default state.'
        ],
        reading: [
            'No preparation test for Lab 1. Read the introduction in Lab1.pdf: OpenWrt, UCI (/etc/config), LuCI and the two devices.',
            'A new or reset device is reachable on 192.168.1.1 with user `root` and no password.'
        ],
        devices: [
            ['Switch', 'Netgear GS108T (GS108Tv3), 8 gigabit ports, OpenWrt. No DHCP server in the lab.'],
            ['Router', 'Asus RT-AX53U, 1 WAN and 3 LAN ports, OpenWrt. Runs a DHCP server on LAN.'],
            ['Default', '192.168.1.1, user root, no password. NEVER remove the power while a device reboots or resets.']
        ],
        exercises: [
            {
                id: 'ex1', title: 'Exercise 1: Getting started with the GUI',
                intro: 'Pair up. One of you connects a laptop to the switch, the other to the router (LAN port, not WAN) and opens LuCI on http://192.168.1.1.',
                steps: [
                    'Switch: give your laptop a static address in the switch subnet, for example `192.168.1.10` with mask `255.255.255.0`, no gateway, and browse to http://192.168.1.1 (user root, empty password).',
                    'Router: leave your laptop on DHCP. It receives an address in 192.168.1.x and the gateway 192.168.1.1. If not, use a temporary static address.',
                    'Explore the tabs and menus and see what is in the standard configuration.'
                ],
                questions: ['How does the IP address allocation differ between the switch and the router?']
            },
            {
                id: 'ex2', title: 'Exercise 2: Getting started with the command line',
                intro: 'Connect to the device with SSH and try the warm-up commands. There is no user/privileged mode like on Cisco: you are root.',
                steps: [
                    '`ssh root@192.168.1.1` (type `yes` for the host key). If you see "host identification has changed": `ssh-keygen -R 192.168.1.1`.',
                    'Run `ubus call system board`, `cat /etc/openwrt_release`, `uptime`, `free -h`, `df -h`, `ip a`, `ip route`, `ifstatus lan`, `ifstatus wan`, `uci show network`, `logread`, `logread -f`, `logread -e dnsmasq`, `logread -e firewall` and explain each output.',
                    'Connectivity commands: `ping -c 4 <ip>`, `ping 8.8.8.8`, `nslookup openwrt.org`, `fping -g 10.1.1.0/24`.'
                ],
                questions: ['Fill in the table: for every command, what is the output and what is its function?']
            },
            {
                id: 'ex3', title: 'Exercise 3: Package management',
                intro: 'Update the package lists and install software with opkg. The device needs Internet for this.',
                steps: [
                    'Router: plug the campus cable into WAN. Switch: plug it into a free port, then Network > Interfaces > Add new interface (DHCP client on that port) and remove the port from the bridge in the Devices tab. Save & apply.',
                    'Check the date with `date`. If it is wrong, set it: `date -s "2026-03-10 14:00:00"` (use today). A wrong date breaks HTTPS ("SSL verify error").',
                    '`opkg update`, `opkg list-upgradable`, `opkg update && opkg install tcpdump`, then `opkg list-installed | grep tcpdump`. Also try System > Software in LuCI (install vim).',
                    'When you are done, unplug the device from the Internet.'
                ],
                questions: []
            },
            {
                id: 'ex4', title: 'Exercise 4: Connecting to your neighbor',
                intro: 'Connect two hosts with one switch and one router, both acting as Layer 2 devices, in one /16. Do not connect the devices to each other until both IPs are changed. Switch off the firewall: `/etc/init.d/firewall stop`.',
                steps: [
                    'Switch: Network > Interfaces > LAN > Edit, IPv4 `10.1.1.1`, netmask `255.255.0.0`. Router: `10.1.2.1`, netmask `255.255.0.0`. Save & Apply.',
                    'Hosts: switch side `10.1.1.10/16`, router side `10.1.2.10/16`, no gateway.',
                    'Cable: host to the switch, host to a LAN port of the router and one cable between the switch and another LAN port of the router (LAN to LAN, not WAN).',
                    'Test: each host pings both management IPs and the other host; open http://10.1.1.1 and http://10.1.2.1 in a browser.'
                ],
                questions: [
                    'What happens to your browser connection the moment you change the router\'s IP address, and which URL do you need afterwards?',
                    'What changed on your laptop side when the IP changed? Did your laptop remain on the correct network to reach 10.1.x.1?',
                    'Do you need a default gateway for host-to-host connectivity inside this /16?',
                    'Do you want the OpenWrt WAN port involved at all, or should this be LAN-to-LAN? Why?',
                    'Did you encounter any problems along the way, and how did you solve them?'
                ]
            },
            {
                id: 'ex5', title: 'Exercise 5: Storing and loading configurations',
                intro: 'Back up the configuration, restore it, and reset the device. Reset the device at the end of every lab.',
                steps: [
                    'System > Backup / Flash Firmware > Generate archive. Rename the file clearly, for example `Group<n>_DeviceA_OpenWrt_24.10.2_backup_YYYY-MM-DD.tar.gz`.',
                    'Restore the same archive in the Restore backup section. The device applies it and may reboot.',
                    'Reset: hold the reset button about 10 seconds, release, and DO NOT UNPLUG. Or use Perform reset in LuCI. At the end of the lab, wait for the reboot and put everything back in the boxes.'
                ],
                questions: [
                    'What is the difference between a configuration backup archive and a firmware image?',
                    'After restoring the backup, why might you temporarily lose access to the device? Do you need to change anything on your hosts?'
                ]
            }
        ]
    },
    {
        n: 2,
        title: 'Layer 2 switching and Layer 3 routing',
        short: 'Switching and routing',
        icon: 'route',
        summary: 'Build four switches with hosts, add routers and make the networks reach each other with the right masks, default gateways, static routes and finally RIP and OSPF.',
        goals: [
            'Configure and verify Layer 2 switching connectivity.',
            'Explain the effect of subnet masks and default gateways on network communication.',
            'Configure and verify Layer 3 routing between multiple subnets.',
            'Analyze ARP, ICMP, and routing traffic using Wireshark.',
            'Configure and validate static routes.',
            'Configure and compare dynamic routing using RIP and OSPF.'
        ],
        reading: [
            'Practical Networking, Packet Traveling series: host-to-host, through a switch and through a router.',
            'Role of Subnet Mask, and Understanding Routing in Computer Networks (static versus dynamic routing).',
            'Short videos on RIP and OSPF and a comparison of RIP and OSPF. You will not be asked for commands or timer values, but for what happens and why.'
        ],
        devices: [
            ['Switch n', 'Management address `10.1.n.1`, hosts `10.1.n.10` and `10.1.n.11`. Each pair of students configures one switch.'],
            ['Router n', 'LAN1 `10.1.n.3` on switch n, LAN2 `10.1.(n+1).2` on switch n+1 (router 4 connects to switch 1). Packages: `frr frr-ripd frr-ospfd frr-zebra frr-watchfrr frr-vtysh`.'],
            ['Firewall', 'Off on every device: `/etc/init.d/firewall stop`. Check the connections with `fping -f ~/Documents/ips.txt`.']
        ],
        exercises: [
            {
                id: 'ex1', title: 'Exercise 1: Switching with /16-subnet mask',
                intro: 'Four switches in a row with two hosts each. Configure all hosts and switch management interfaces with a /16 mask, no default gateway, then cable everything.',
                steps: [
                    'Switch n: `10.1.n.1/16`. Hosts `10.1.n.10/16` and `10.1.n.11/16`. No gateways. Firewall off.',
                    'Connect the switches and hosts like Figure 1 and verify that every link is up.',
                    'Ping with `fping -f ~/Documents/ips.txt` (one address per line). Analyse a ping in Wireshark: ARP request, ARP reply, ICMP.'
                ],
                questions: [
                    'Ping your own switch, another switch, your partner and other hosts: what do you get?',
                    'When a host starts a ping inside the subnet, what does it already know and what does it still need?',
                    'What is the first relevant frame in Wireshark? Is it addressed to one device or to multiple devices?',
                    'Which addresses appear at the Ethernet level and which inside the payload? Does ICMP use the same destination addressing as the first frame?',
                    'Which information is learned or cached after the first exchange? Which parts belong to Layer 2 and which to Layer 3?',
                    'Why is no default gateway needed in this topology? What would break if the mask were /24?'
                ]
            },
            {
                id: 'ex2', title: 'Exercise 2: Switching with /24-subnet mask',
                intro: 'Same hardware, same addresses, but every device now uses /24 (255.255.255.0). No default gateway anywhere. Student 2 configures the switch.',
                steps: ['Change the mask of the hosts and of the switch to 255.255.255.0.', 'Ping your switch, another switch, your partner and hosts of other groups.', 'Try SSH to a switch of another group and watch Wireshark while you ping a host of another group.'],
                questions: ['Can you reach your own switch, other switches, your partner and other groups?', 'Can you SSH to a different switch? Why (not)?', 'What do you see in Wireshark when you ping a host of another group, and why?']
            },
            {
                id: 'ex3', title: 'Exercise 3: Switching with different subnets for hosts',
                intro: 'The goal is to explain why a ping is or is not transmitted. Use the same topology. Do not configure a default gateway.',
                steps: ['Host `10.1.x.10` gets a /16 mask. Host `10.1.x.11` stays in the /24. The switches stay on /24.', 'Analyse who can reach whom, with Wireshark.'],
                questions: ['Can you reach your partner on the same switch (.10 and .11)?', 'Can you reach your switch?', 'Can you reach your neighbor on a different switch (.10 and .11) and the neighbor\'s switch? Why?']
            },
            {
                id: 'ex4', title: 'Exercise 4: Routing without default gateway and no IP routing',
                intro: 'Add routers. Student 2 configures the router. Install the FRR packages (`opkg update && opkg install frr frr-ripd frr-ospfd frr-zebra frr-watchfrr frr-vtysh`) and stop the firewall.',
                steps: [
                    'Remove LAN2 from the bridge device (Network > Interfaces > Devices > br-lan), create a new interface named `lan2` with a static address on LAN2.',
                    'Router n: br-lan (LAN1) `10.1.n.3/24`, lan2 `10.1.(n+1).2/24`. All masks 255.255.255.0 and no default gateway. Save & apply.',
                    'Connect like Figure 2: LAN1 of router n to switch n, LAN2 of router n to switch n+1.'
                ],
                questions: [
                    'Who can you reach, and why? (partner, your switch, router LAN1, router LAN2, the neighbor\'s router interface, neighbor\'s switch and router)',
                    'Check Wireshark: which packets are sent and which are not, and why?',
                    'Why don\'t you have full connectivity?'
                ]
            },
            {
                id: 'ex5', title: 'Exercise 5: Routing with default gateway and no IP routing',
                intro: 'Configure the default gateways of the hosts. The routers stay unchanged.',
                steps: ['The `.10` host gets the router on its left side (`10.1.x.2`) as gateway, the `.11` host the router on its right (`10.1.x.3`).', 'Ping the neighbours, and open Wireshark and ping the far side of the router you can reach.'],
                questions: ['Who can you reach (partner, switch, both router interfaces, closest neighbor and its switch, farther neighbor)?', 'What do you learn from Wireshark?', 'Why don\'t you have full connectivity?']
            },
            {
                id: 'ex6', title: 'Exercise 6: Routing with default gateway and IP routing',
                intro: 'Keep the topology and the host gateways. Add static routes on the routers so packets can reach the distant subnets.',
                steps: [
                    'On each router add two static routes (Network > Routing > Static IPv4 Routes): the two networks it is not connected to, each via the neighbouring router on a directly connected network.',
                    'Check with `ip route`. IP forwarding must be on (default).',
                    'Ping all hosts, switches and routers. In Wireshark, compare the packet on both sides of a router.'
                ],
                questions: [
                    'How did you add the static route, on which interface, what is the target and the gateway?',
                    'Which command shows the routing table and what do you see?',
                    'What is a disadvantage of static routes? What happens when a link or router fails?',
                    'Which destination MAC does your host use for a remote ping, and why?',
                    'Which IP fields stay the same on both sides of the router and which may change?'
                ]
            },
            {
                id: 'ex7', title: 'Exercise 7: Routing with default gateway, IP routing, and routing protocol',
                intro: 'Replace the static routes by dynamic routing with FRR: first RIP, then OSPF. Remove the static routes first (Network > Routing).',
                steps: [
                    'RIP: `vi /etc/frr/daemons` set `ripd=yes`, then `/etc/init.d/frr enable` and `/etc/init.d/frr restart`. In `vtysh`: `conf t`, `router rip`, `version 2`, `network 10.1.x.0/24`, `network 10.1.(x+1).0/24`, `no passive-interface br-lan`, `no passive-interface lan2`, `end`, `write memory`.',
                    'OSPF: set `ripd=no` and `ospfd=yes`, restart FRR. In `vtysh`: `router ospf`, `ospf router-id 10.1.x.3`, `network 10.1.x.0/24 area 0`, `network 10.1.(x+1).0/24 area 0`, `end`, `write memory`.',
                    'For both: ping everything, `traceroute`, unplug and replug a link and measure how long the network needs, capture the update packets.'
                ],
                questions: [
                    'Which commands debug the setup and show the routing table? What metric does a network two hops away have?',
                    'Until where do you have connectivity? Which route is taken to the closest neighbours and to the neighbours of your neighbours? Are they always the best?',
                    'What happens when you disconnect and reconnect a link, and how long does it take (bad news and good news)?',
                    'Which destination IP do RIP updates use and why is it significant?',
                    'OSPF: which states do you see in `show ip ospf neighbor` and what does Full mean? Which LSA types are in `show ip ospf database`?',
                    'How does OSPF convergence compare to RIP, how does OSPF choose the best path, and what is the fundamental difference in how RIP and OSPF share information?'
                ]
            }
        ]
    },
    {
        n: 3,
        title: 'Spanning tree',
        short: 'Spanning Tree Protocol',
        icon: 'tree',
        summary: 'Build redundant Layer 2 networks, see what a loop does, and let the Spanning Tree Protocol build a loop-free tree. Find the root, read the port roles and measure how the network recovers from failures.',
        goals: [
            'Build and verify a redundant Layer 2 network.',
            'Explain the effects of Ethernet loops and broadcast storms.',
            'Configure and validate the Spanning Tree Protocol (STP).',
            'Identify the root bridge and the roles of STP ports.',
            'Influence spanning-tree operation using bridge priority and path cost.',
            'Analyze STP behavior and convergence during topology changes and failures.'
        ],
        reading: [
            'NetworkAcademy.io: Why do we need Spanning-Tree?, The Spanning-Tree Algorithm, Spanning-Tree Port Roles, STP Port States and Timers, STP Topology Changes.',
            'Types of Spanning Tree Protocol, and the Spanning Tree Protocol video (first 8.5 minutes).'
        ],
        devices: [
            ['Access switch x', '`10.1.x.1`: p1 and p2 hosts, p3 red link to the other access switch, p4 blue link to the distribution switch.'],
            ['Core switch x', '`10.1.x.5` (Exercise 3). Distribution switch of group 1: `10.1.1.4` in Figure 1, `10.1.1.5` in Figure 2 (same device).'],
            ['Settings', 'All masks /16, firewall off, STP on every switch. The bridge is called `switch`: `brctl showstp switch`.']
        ],
        exercises: [
            {
                id: 'ex1', title: 'Exercise 1: Spanning tree in an access network',
                intro: 'Build Figure 1: six switches, distribution switches on top, access switches below. Red cables between hosts and access switches and between access switches, blue cables from access to distribution. Leave one cable (the red link between the access switches) out until STP is on, then close the loop. Disconnect from the campus network first.',
                steps: [
                    'Enable STP on every switch: `uci set network.switch.stp=\'1\'; uci commit network; /etc/init.d/network restart` (or LuCI: Network > Interfaces > Devices > switch > Configure > Bridge settings > Enable STP). Stop the firewall.',
                    'Connect the last cable. Wait for the ports to leave listening and learning, then ping everything with `fping`.',
                    'Inspect with `brctl showstp switch`: bridge ID (priority.MAC), designated root, root port and per port the state. Capture a BPDU in Wireshark (filter `stp`): hello time and max age, root identifier, topology change flag.',
                    'Make the distribution switch the root: lower its priority to 4096 (`uci set network.switch.priority=\'4096\'`). Capture again and draw blocking and forwarding ports on the schematic.'
                ],
                questions: [
                    'Who can you reach? Check the STP state: can you identify the different states?',
                    'Who is the root, and why? Which command displays detailed STP info?',
                    'What is the bridge ID of your switch? Which part is the priority and which part is the MAC address? Why does the lowest bridge ID win?',
                    'Compare your bridge ID with the designated root. Is your switch the root?',
                    'Which ports are blocking and which are forwarding? Draw it on the schematic.',
                    'BPDU: hello interval and maximum age? Do they match the GUI? Which command shows the real values? Who is the root in the BPDUs? Is a topology change indicated?',
                    'How do you make the distribution switch the root? Which ports block now?'
                ]
            },
            {
                id: 'ex2', title: 'Exercise 2: Spanning tree under link and switch failures',
                intro: 'The distribution switch is root. Measure the time until STP is stable (all ports forwarding or blocking, no listening or learning). The Monitor tab has a stopwatch that does this for you.',
                steps: [
                    '4.1: disconnect an active distribution link and start a stopwatch. Check `brctl showstp switch`. Repair the link and measure again.',
                    '4.2: repeat with an active link of an access switch (a blue link, and the red link between the access switches).',
                    '4.3: shut down an access switch.',
                    '4.4: remove the loop, disable STP on all switches, then put the loop back. Watch what happens to your pings.'
                ],
                questions: [
                    'How long does the STP reconfiguration take after a link goes down and after it is repaired? Who is root and which ports block each time?',
                    'What is different when you shut down an access switch?',
                    'What happens when you try to ping without spanning tree and with a loop?'
                ]
            },
            {
                id: 'ex3', title: 'Exercise 3: Spanning tree in a core network',
                intro: 'Add the core switches (Figure 2) and connect the four core switches in a full mesh. Same settings: IP, /16, firewall off, STP on.',
                steps: [
                    'Check the STP state on all switches: who is root, which ports are forwarding, blocking, root and designated, and why? Draw it.',
                    'Make core switch 2 (`10.1.2.5`) the root with priority 4096 and core switch 4 (`10.1.4.5`) the secondary root with 8192; the rest stays at 32767.',
                    'Shut down the root, check who becomes root, and bring the old root back.',
                    'Extra: add the extra loops of Figure 3 and explain why bridges cannot handle too many loops.'
                ],
                questions: [
                    'Who is the root, which ports are forwarding, blocking, root or designated, and why? Which links block?',
                    'Does a shutdown of the root keep everything reachable? Does the secondary root take over? What happens when the original root returns?',
                    'Why can bridges not handle too many loops?'
                ]
            },
            {
                id: 'extra', title: 'Extra: Figure 3 with extra loops',
                intro: 'Figure 3 adds one extra link from every access switch to a core switch: 16 links, 9 loops.',
                steps: ['Connect the four extra cables with STP enabled everywhere.', 'Look at the Monitor tab: nine links should be blocked.'],
                questions: ['Why do you think the bridges cannot handle too many loops?']
            }
        ]
    },
    {
        n: 4,
        title: 'VLAN trunking and routing',
        short: 'VLANs and inter-VLAN routing',
        icon: 'layers',
        summary: 'Segment the network of Lab 3 with four VLANs, carry them over trunk links with 802.1Q tags, look at the tags with port mirroring, and let the VLANs talk to each other with a router on a stick.',
        goals: [
            'Configure and verify VLANs on OpenWrt switches.',
            'Explain how VLANs provide logical network separation.',
            'Configure and validate access ports and trunk ports.',
            'Explain and analyze IEEE 802.1Q VLAN tagging.',
            'Verify connectivity within and between VLANs and explain the observed behavior.',
            'Configure and verify inter-VLAN routing.'
        ],
        reading: [
            'Practical Networking: Virtual Local Area Networks (VLANs). Pay attention to the wording.',
            'Practical Networking: Routing Between VLANs & Layer 3 Switches (the Cisco commands are not needed).',
            'Cisco: Inter-Switch Link and IEEE 802.1Q Frame Format, only the 802.1Q part: structure, position in the stack, why VLAN numbers are limited.'
        ],
        devices: [
            ['Access switch N', '`10.1.N.1`. Ports 1 and 2 hosts, port 3 uplink to a core switch.'],
            ['Core switch N', '`10.1.N.5`, full mesh of four. After Exercise 3 the management addresses become `10.1.1.N` (access) and `10.1.1.(N+4)` (core), mask /24.'],
            ['Router', 'Asus, one trunk link to a core switch, sub-interfaces `lan2.1` to `lan2.4` with `10.1.n.254/24`.'],
            ['Packages', 'On every switch: `opkg update && opkg install ip-full ip-bridge tc-full`. Afterwards revert the new WAN interface to LAN and mark it untagged again in the VLAN settings.']
        ],
        exercises: [
            {
                id: 'ex1', title: 'Exercise 1: VLAN configuration - step 1, everything in VLAN 1',
                intro: 'Prepare the switches (firewall off, packages) and build Figure 1. One IP network per group (10.1.x.x, /16). Turn on STP on all switches before any physical connection.',
                steps: [
                    'Install `ip-full ip-bridge tc-full` on every switch.',
                    'Build Figure 1: cores 1.5 and 3.5 in the middle, 2.5 and 4.5 on top, in a full mesh; every access switch has its uplink on port 3 and hosts on ports 1 and 2.',
                    'Make sure all ports are in VLAN 1 (untagged). Only continue if you have full connectivity.'
                ],
                questions: [
                    'How will you check this in the GUI, and what about the CLI?',
                    'Explain why all ports should be configured as untagged. What does this imply, and what alternatives exist?'
                ]
            },
            {
                id: 'ex1b', title: 'Exercise 1: VLAN configuration - 3.1 Configuring VLANs',
                intro: 'Configure the VLANs of Figure 2. Only VLAN 1 has the switch management IP, so always plug your PC into a VLAN 1 port to manage the switches.',
                steps: [
                    'Access switch N: ports 1 to 5 in VLAN N, the other three ports each in one of the other VLANs (access 1: p6 VLAN 2, p7 VLAN 3, p8 VLAN 4; access 2: p6 VLAN 1, p7 VLAN 3, p8 VLAN 4; access 3: p6 VLAN 1, p7 VLAN 2, p8 VLAN 4; access 4: p6 VLAN 1, p7 VLAN 2, p8 VLAN 3).',
                    'Core switches: ports 1-2 VLAN 1, 3-4 VLAN 2, 5-6 VLAN 3, 7-8 VLAN 4.',
                    'LuCI: Network > Interfaces > Devices > switch > Configure > Bridge VLAN filtering. Mark the host ports and the VLAN ports `U*` (untagged and PVID).'
                ],
                questions: [
                    'How will you do this? Should the ports be tagged or untagged?',
                    'Can you still ping everyone on the network?',
                    'Connect one of your hosts to a different VLAN of the access switch. What is the consequence for reachability?',
                    'Connect the .11 hosts to VLAN 4, each on its own access switch. What is the consequence?',
                    'How does a switch make sure VLANs are perfectly separated?'
                ]
            },
            {
                id: 'ex2', title: 'Exercise 2: VLAN trunking',
                intro: 'Host ports stay access ports. The uplinks from the access switches to the core and the links between the core switches become trunks (Figure 3).',
                steps: [
                    'Trunk ports: tagged (T) member of VLAN 1, 2, 3 and 4. Do not change the other ports of the access switches.',
                    'Core switches: trunk only the ports indicated in the figure (core 1.5: ports 1, 2, 3, 5, 7; 2.5: 1, 2, 3; 3.5: 1, 5, 6, 7, 8; 4.5: 3, 7, 8). The remaining ports stay untagged in VLAN 1 so you can manage them.',
                    'Test connectivity: same VLAN on the same switch, same VLAN on different switches, and different VLANs.',
                    'Port mirroring (software SPAN with tc): `ip link set up dev lan2`, `tc qdisc del dev lan3 clsact 2>/dev/null`, `tc qdisc add dev lan3 clsact`, `tc filter add dev lan3 ingress matchall action mirred egress mirror dev lan2`, `tc filter add dev lan3 egress matchall action mirred egress mirror dev lan2`. Capture with Wireshark on the laptop at lan2. Remove with `tc qdisc del dev lan3 clsact`.'
                ],
                questions: [
                    'Find the IEEE 802.1Q tag format and paste a diagram of the header. Explain the fields.',
                    'Why do uplinks become trunks while the other ports stay as they are? What does tagged mean and what does untagged mean?',
                    'Which VLANs do you need to tag on the switch ports? What happens when you do not tag a certain VLAN?',
                    'Which hosts can communicate, and why? Why is there no connectivity between VLANs?',
                    'Which port do you mirror to see 802.1Q tags, and to which port? Why are tags not visible on access ports? What VLAN ID do you see and how does it relate to your configuration? What if you mirrored an access port?'
                ]
            },
            {
                id: 'ex3', title: 'Exercise 3: Inter-VLAN routing',
                intro: 'Router on a stick: one trunk link to the router, one logical sub-interface per VLAN, each the default gateway of its VLAN. Every VLAN gets its own /24.',
                steps: [
                    '5.1: hosts get mask /24 and gateway `10.1.n.254` (VLAN n). Change the management address of every switch to the VLAN 1 subnet with /24: access N `10.1.1.N`, core N `10.1.1.(N+4)`. Do this from a VLAN 1 port.',
                    '5.2: pick a core switch and a free port, make it a tagged member of VLAN 1, 2, 3 and 4 without untagged/PVID, and cable it to a LAN port of the router. On the router remove `lan2` from br-lan, add 802.1Q devices `lan2.1` to `lan2.4` (Devices tab) and create interfaces `vlan1` to `vlan4` (static, device `lan2.n`, `10.1.n.254`, 255.255.255.0, no gateway, no DHCP).',
                    'Verify on the router: `cat /proc/net/vlan/config`, `ip addr`, `ip route`.',
                    '5.3: test with ping and `fping`. Set the default gateway of the switches (Network > Interfaces > LAN > Edit) to `10.1.1.254`. Use `traceroute` inside a VLAN and between VLANs.',
                    '5.4: mirror the router port with tc, clear the ARP cache (`sudo arp -d -a`), ping a host in another VLAN and filter `vlan.id == 2` in Wireshark.'
                ],
                questions: [
                    'If a single trunk link already carries all four VLANs, why do we still need a router?',
                    'Why did a /16 mask work in Exercises 1 and 2, and what goes wrong with /16 now? Why do the management IPs of the switches have to change?',
                    'What do you see in Wireshark when you ping a host in another VLAN without a router, and why does it fail?',
                    'Why do you remove lan2 from the bridge? Why do four sub-interfaces share one port and one MAC, yet act as four networks? What does /proc/net/vlan/config tell you? Which routes do you see, and why no static routes or routing protocol?',
                    'Who can you reach and why (gateways, same VLAN on another switch, other VLAN, switch management IP from VLAN 1 and from other VLANs)? Can you reach the switches from every VLAN after setting their gateway?',
                    'What happens if VLAN 3 is not tagged on the router port, or if a VLAN interface has a wrong IP or mask? How many hops does traceroute show?',
                    'In which VLAN is the ARP request for the gateway sent, and would a host in VLAN 4 receive it? How many times do you see each echo request on the link to the router? Complete the table (VLAN ID, MACs, IPs, TTL) of the frame entering and leaving the router.'
                ]
            }
        ]
    }
];

const labByNumber = n => LABS.find(l => l.n === Number(n));
