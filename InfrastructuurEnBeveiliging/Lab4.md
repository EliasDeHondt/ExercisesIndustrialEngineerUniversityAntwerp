![logo](https://eliasdh.com/assets/media/images/logo-github.png)
# Lab 4

Uitvoeren op: `pc` = laptop/host, `switch` = Netgear (OpenWrt, via SSH), `router` = Asus (OpenWrt, via SSH).

Notatie: `N` = nummer van de switch (1 tot 4). Een access switch heeft `10.1.N.1`, een core switch `10.1.N.5`. Na Exercise 3 worden dat `10.1.1.N` (access) en `10.1.1.(N+4)` (core). Hosts zijn `10.1.N.10` en `10.1.N.11`.

### Onze waarden

| Toestel | Waarde |
|---|---|
| VLAN's | VLAN 1 geel, VLAN 2 rood, VLAN 3 groen, VLAN 4 blauw |
| Access switch N, Exercise 1 | poort 1 tot 5 = VLAN N, poort 6 tot 8 = de drie andere VLAN's (access 1: 2, 3, 4; access 2: 1, 3, 4; access 3: 1, 2, 4; access 4: 1, 2, 3) |
| Core switch N, Exercise 1 | poort 1-2 = VLAN 1, 3-4 = VLAN 2, 5-6 = VLAN 3, 7-8 = VLAN 4 |
| Poorten access switch | p1 en p2 = hosts, p3 = uplink naar een core switch |
| Poorten core 1 (`10.1.1.5`) | p1 naar access 1 (p3), p2 naar core 2 (p1), p3 naar access 2 (p3), p5 naar core 3 (p5), p7 naar core 4 (p7) |
| Poorten core 2 (`10.1.2.5`) | p1 naar core 1 (p2), p2 naar core 3 (p1), p3 naar core 4 (p3) |
| Poorten core 3 (`10.1.3.5`) | p1 naar core 2 (p2), p5 naar core 1 (p5), p6 naar access 3 (p3), p7 naar access 4 (p3), p8 naar core 4 (p8) |
| Poorten core 4 (`10.1.4.5`) | p3 naar core 2 (p3), p7 naar core 1 (p7), p8 naar core 3 (p8) |
| Trunkpoorten (Figure 3) | op elke access switch p3, op de cores alle poorten uit de rij hierboven. De overige core-poorten blijven untagged in VLAN 1 |
| Router (Exercise 3) | trunk naar een vrije poort van een core switch, `lan2.1` tot `lan2.4` met `10.1.n.254/24` |

De poortnummers uit de figuren komen overeen met `lan1` tot `lan8` op de switch. Controleer dat met `ip -br link` (of `brctl show`).

---

## Voorbereiding en uitgangssituatie

### Firewall uit, pakketten installeren en STP aan
```cli
ssh root@10.1.N.1                                      # pc
/etc/init.d/firewall stop                              # switch (tijdelijk, niet persistent)
opkg update                                            # switch (Internet nodig)
opkg install ip-full ip-bridge tc-full                 # switch (nodig voor bridge vlan show en tc)
uci set network.switch.stp='1'                         # switch (STP aan, voor je kabels verbindt)
uci commit network                                     # switch
/etc/init.d/network restart                            # switch
```
Het pakket installeren maakt een nieuwe WAN-interface aan als je de poort van het campusnetwerk gebruikt. Zet die terug naar LAN en markeer de poort opnieuw als untagged in de VLAN-instellingen, zoals de opgave zegt. Trek daarna de kabel naar het campusnetwerk uit.

---

## Exercise 1: VLAN configuration

### Build the network
Bouw Figure 1 met de poorten uit de tabel hierboven. Er zijn geen rode links meer tussen de access switches: elke access switch hangt met zijn poort 3 aan één core switch, en de vier core switches vormen een volledige mesh. STP staat aan op alle switches vóór je kabels verbindt, anders ontstaat er een broadcast storm.

### Make sure all the ports on all the switches are in VLAN1. How will you check this in the GUI, and what about the CLI?
GUI: Network, Interfaces, Devices, dan `switch` configureren en het tabblad Bridge VLAN filtering. Daar moet VLAN 1 staan met alle acht poorten op `U*` (untagged en PVID), en geen ander VLAN. CLI:
```cli
bridge vlan show        # switch (elke lanN: 1 PVID Egress Untagged)
ip -br link             # switch (namen en toestand van de poorten)
```
Als check van connectiviteit: `fping -f ~/Documents/ips.txt` vanaf de pc, met alle beheeradressen. Pas verder gaan als alles antwoordt.

### Explain why all the ports should be configured as untagged. What does this configuration imply, and what alternative options are available?
Alle poorten untagged in VLAN 1 betekent dat het netwerk zich als één gewone, niet-gesegmenteerde switch gedraagt: één broadcast domain. Untagged is het gedrag voor eindapparaten: pc's kennen geen VLAN-tags, dus de switch stuurt frames zonder tag uit en wijst binnenkomende frames zonder tag toe aan het VLAN van de poort (de PVID). Alternatieven zijn tagged (de poort stuurt frames met een 802.1Q-tag uit, bedoeld voor trunks) en niet-lid zijn van een VLAN (frames van dat VLAN gaan niet door die poort).

### 3.1 Configuring VLANs: How will you do this? Should the ports be tagged or untagged?
In LuCI per VLAN een regel onder Bridge VLAN filtering van `switch`, met de poorten als `U*`. Host- en VLAN-poorten zijn untagged, want daar hangen eindapparaten. Via UCI is dat per VLAN:
```cli
uci add network bridge-vlan                                  # switch
uci set network.@bridge-vlan[-1].device='switch'             # switch
uci set network.@bridge-vlan[-1].vlan='2'                    # switch
uci add_list network.@bridge-vlan[-1].ports='lan6:u*'        # switch (poort 6 = VLAN 2, untagged en PVID)
uci commit network                                           # switch
/etc/init.d/network restart                                  # switch
```
Haal de poorten ook uit VLAN 1 als ze naar een ander VLAN gaan. Verbind je pc voor beheer altijd met een VLAN 1-poort, want enkel VLAN 1 heeft het beheer-IP van de switch.

### Can you still ping everyone on the network?
Nee. Elk VLAN is een apart broadcast domain en de links tussen de switches zijn nog geen trunks: elke kabel hoort bij één VLAN (de kleuren in Figure 2). Je bereikt enkel de toestellen in hetzelfde VLAN langs het pad van die kleur. Het beheer-IP van een switch zit in VLAN 1, dus de switches bereik je enkel vanaf VLAN 1-poorten.

### Pair up with your partner on the access switch. Connect one of your hosts to a different VLAN of the access switch. What is the consequence in terms of reachability?
Die host zit nu in een ander broadcast domain dan zijn partner en dan het beheer-IP van de switch. Hij kan zijn partner en de switch niet meer bereiken, ook al hangen ze aan dezelfde switch. Een ARP-request van de host komt de poorten van het andere VLAN niet binnen.

### Pair up with your neighbor on the access switch next to you. Connect the .11 hosts to VLAN4, each on its own access switch. What is the consequence in terms of reachability?
Ze zitten allebei in VLAN 4, maar de uplinks tussen de switches dragen nog geen VLAN 4 voor die poort: elke link is nog maar één VLAN. De hosts kunnen elkaar daarom nog niet bereiken. Pas na Exercise 2, met trunks die alle VLAN's tagged doorgeven, kunnen hosts in hetzelfde VLAN aan verschillende access switches elkaar bereiken.

### How does a switch make sure VLANs are perfectly separated?
Elke poort heeft een VLAN-lidmaatschap. Een frame krijgt bij binnenkomst een VLAN-ID (de tag, of de PVID van de poort bij een untagged frame). De switch zoekt het bestemmings-MAC in de MAC-tabel van dat VLAN en stuurt het enkel naar poorten die lid zijn van datzelfde VLAN. Broadcasts en unknown unicast worden enkel binnen het VLAN geflood. Zo kan een frame niet in een ander VLAN terechtkomen zonder dat een router het doorgeeft.

---

## Exercise 2: VLAN trunking

### Find the IEEE 802.1Q tag format and paste a diagram of the header.
```
 Ethernet-frame met 802.1Q-tag (de tag is 4 bytes, ingevoegd na het bron-MAC)

 | Dest MAC | Src MAC |  TPID  | PCP | DEI |  VID   | EtherType |  Payload  |  FCS  |
 |  6 byte  | 6 byte  | 16 bit | 3 b | 1 b | 12 bit |  16 bit   |           |       |
                       \_______________ 802.1Q-tag (32 bit) ___/
                        0x8100
```
Voeg hier een screenshot of een eigen tekening van de header toe.

### Explain the fields of the tag and what they are used for.
- TPID (Tag Protocol Identifier, 16 bit): vaste waarde `0x8100`, geeft aan dat er een 802.1Q-tag volgt.
- PCP (Priority Code Point, 3 bit): prioriteit (Class of Service, 0 tot 7) voor Quality of Service.
- DEI (Drop Eligible Indicator, 1 bit): geeft aan dat het frame bij congestie weggegooid mag worden.
- VID (VLAN Identifier, 12 bit): het VLAN-nummer. 12 bit geven 4096 waarden, waarvan 0 en 4095 gereserveerd zijn: 4094 bruikbare VLAN's. Daarom is het aantal VLAN's begrensd.
Het frame wordt 4 byte groter (maximaal 1522 byte in plaats van 1518).

### 4.1 Configure VLAN trunking
Trunkpoorten zijn tagged (`t`) lid van alle vier de VLAN's, zonder untagged/PVID. In UCI, per VLAN:
```cli
uci add_list network.@bridge-vlan[-1].ports='lan3:t'         # switch (uplink van een access switch, voor VLAN 1, 2, 3 en 4)
```
Op een core switch doe je dat enkel voor de poorten die in de tabel bovenaan als trunk staan. De andere core-poorten zetten we terug op untagged VLAN 1 (`lanN:u*` in VLAN 1), zodat beheer van de cores gemakkelijk blijft. Op de access switches verandert voor de andere poorten niets.

### Why do uplinks between access and core switches become trunks, and the other ones stay the way they are?
Een uplink moet het verkeer van meerdere VLAN's over één kabel dragen, dus er is een tag nodig om ze te onderscheiden. Een poort naar een host draagt maar één VLAN voor een apparaat dat geen tags kent, dus die blijft een untagged access-poort.

### What does tagged mean on a switch port?
Frames van dat VLAN verlaten de poort mét 802.1Q-tag, en binnenkomende frames worden verwacht mét tag. De overkant weet zo bij welk VLAN het frame hoort.

### What does untagged mean on a switch port?
Frames van dat VLAN verlaten de poort zonder tag, en een binnenkomend frame zonder tag krijgt het VLAN van de poort (de PVID). Dat is het gedrag voor eindapparaten.

### What VLANs do you need to tag for the switch ports? What happens when you do not tag a certain VLAN?
Alle vier de VLAN's (1 tot 4) op elke trunk. Tag je een VLAN niet, dan gaat het verkeer van dat VLAN niet over die link (of het lekt in het untagged VLAN van de poort). Hosts van dat VLAN aan verschillende switches kunnen elkaar dan niet bereiken.

### 4.2 Test connectivity: Which hosts can communicate with each other, and why?
Hosts in hetzelfde VLAN kunnen elkaar bereiken, ook als ze aan verschillende access switches hangen, want de trunks dragen dat VLAN. Hosts in verschillende VLAN's kunnen elkaar niet bereiken.

### Why is there no connectivity between VLANs? I.e., VLAN 1 to VLAN 2?
Elk VLAN is een apart broadcast domain. Een Layer 2 switch stuurt frames nooit tussen VLAN's door. Een ARP-request van VLAN 1 komt VLAN 2 niet in, dus het MAC-adres van de andere host is onbekend. Hiervoor is een router (Layer 3) nodig.

### 4.3 Setting up port mirroring
Suppose you want to capture packets on your own access switch and specifically want to observe frames that contain an 802.1Q VLAN tag. Which port should you mirror, and to which port should the mirrored traffic be sent?

Mirror de trunkpoort (de uplink, `lan3`) naar een vrije poort waar de laptop met Wireshark aan hangt (bijvoorbeeld `lan2`). Op de trunk dragen de frames een tag, op de hostpoorten niet.
```cli
ip -br link                                                   # switch (namen van de poorten)
ip link set up dev lan2                                       # switch
tc qdisc del dev lan3 clsact 2>/dev/null                      # switch
tc qdisc add dev lan3 clsact                                  # switch
tc filter add dev lan3 ingress matchall action mirred egress mirror dev lan2   # switch
tc filter add dev lan3 egress matchall action mirred egress mirror dev lan2    # switch
tc qdisc del dev lan3 clsact                                  # switch (opruimen na de capture)
```
`ingress` en `egress` kopiëren verkeer in beide richtingen, `mirror dev lan2` stuurt de kopie uit via poort 2.

### Capture at least one packet containing an 802.1Q VLAN tag and paste a screenshot of your Wireshark capture below.
Screenshot: nog toe te voegen. Filter in Wireshark: `vlan`.

### Why are VLAN tags not visible on access ports?
De switch haalt de tag weg bij het uitgaan van een untagged poort. Het VLAN is dan enkel nog intern in de switch bekend. Een host ziet dus gewone Ethernet-frames.

### What VLAN ID do you observe in your captured packet? Can you relate it to your configuration?
Het VLAN-ID van de host die het frame stuurde: bijvoorbeeld VLAN 2 voor een host aan access switch 2 (poort 1 tot 5 = VLAN 2). Dat komt overeen met het VLAN dat je aan die poort gaf. Gemeten: nog in te vullen na het labo.

### What would happen if you mirrored a non-trunk (access) port instead?
Je ziet enkel untagged frames van de ene VLAN van die poort, zonder VLAN-informatie, dus geen 802.1Q-tags.

---

## Exercise 3: Inter-VLAN routing

### If a single trunk link already carries traffic for all four VLANs, why do we still need a router at all? Isn't the traffic already there?
De trunk transporteert de VLAN's enkel naast elkaar: elk VLAN blijft een apart broadcast domain met een eigen subnet. Verkeer van VLAN 2 naar VLAN 3 vraagt een Layer 3 beslissing: het pakket moet een ander netwerk in, en dat doet een router (de switch routeert niet).

### 5.1 Update the addressing plan: Why did a /16 mask work fine in Exercises 1 and 2, even though hosts in different VLANs technically shared the same /16 network on paper?
Zonder router wordt er niet gerouteerd: hosts in verschillende VLAN's konden elkaar sowieso niet bereiken, en wat telde was het broadcast domain. Op papier zaten ze in hetzelfde /16, dus de host ARP'te rechtstreeks, maar die broadcast kwam het andere VLAN niet binnen.

### Now that a router is present, what would go wrong if you left the mask at /16 on every host?
Een host in VLAN 2 ziet een host in VLAN 3 (`10.1.3.x`) nog als lokaal, in hetzelfde `/16`. Hij stuurt dus een ARP-request in plaats van het pakket naar zijn default gateway te sturen. Die broadcast komt VLAN 3 niet in, dus de ping faalt en de router wordt nooit gebruikt. Elk VLAN heeft een eigen `/24` nodig, zodat de host weet dat een ander VLAN via de gateway loopt.

### Why do the management IP addresses of the switches have to change? What would go wrong if you left them as they are?
De switches worden beheerd via VLAN 1, dus hun beheerinterface zit in het VLAN 1-broadcast domain. Een adres als `10.1.3.5` ligt in het subnet van VLAN 3 en past dus niet bij de plaats waar de interface hangt. Hosts in andere VLAN's of de router zouden het adres niet via de juiste gateway bereiken en de switch kan niet antwoorden. Daarom: `10.1.1.1` tot `10.1.1.8` met `/24`.
```cli
uci set network.lan.ipaddr='10.1.1.N'                  # switch (access N)  /  10.1.1.(N+4) voor een core switch
uci set network.lan.netmask='255.255.255.0'            # switch
uci commit network                                     # switch
/etc/init.d/network restart                            # switch (doe dit vanaf een VLAN 1-poort)
```

### What do you see in Wireshark when you ping a host in another VLAN, and why does the ping fail?
Alleen ARP-requests voor het IP van de andere host (of van de gateway) die niemand beantwoordt. Zonder router komt het request nergens aan en er komt geen ICMP. De ping faalt.

### 5.2 Configure and connect the router
Kies een core switch en een vrije poort en maak die een tagged (T) lid van VLAN 1, 2, 3 en 4, zonder untagged of PVID. Op de router:
```cli
uci del_list network.@device[0].ports='lan2'           # router (lan2 uit br-lan)
uci add network device                                 # router (herhaal voor VLAN 1 tot 4)
uci set network.@device[-1].type='8021q'               # router
uci set network.@device[-1].ifname='lan2'              # router
uci set network.@device[-1].vid='1'                    # router (en name='lan2.1')
uci set network.@device[-1].name='lan2.1'              # router
uci set network.vlan1=interface                        # router (herhaal voor vlan2 tot vlan4)
uci set network.vlan1.proto='static'                   # router
uci set network.vlan1.device='lan2.1'                  # router
uci set network.vlan1.ipaddr='10.1.1.254'              # router
uci set network.vlan1.netmask='255.255.255.0'          # router (geen gateway, geen DHCP)
uci commit network                                     # router
/etc/init.d/network restart                            # router
```
Dit kan ook allemaal in LuCI (Network, Interfaces, Devices en Interfaces), zoals de opgave beschrijft.

### Why do you remove lan2 from the bridge?
De poort wordt nu niet meer als switchpoort gebruikt maar als basis voor de 802.1Q-devices. Als hij in `br-lan` bleef, zou de bridge de frames zelf afhandelen en zouden de sub-interfaces er niet aan kunnen.

### Why do all four sub-interfaces share the same physical port and the same MAC address, yet the router still treats them as four separate networks?
Het MAC-adres hoort bij de fysieke poort. De sub-interfaces onderscheiden zich door het VLAN-ID in de tag en door hun eigen IP-subnet. De router stuurt een pakket naar de sub-interface van het juiste VLAN en tagt het frame daarmee.

### Verify your configuration on the router. What does the output of the first command tell you? How many VLAN devices do you see, and on which physical port are they created?
```cli
cat /proc/net/vlan/config
ip addr
ip route
```
`/proc/net/vlan/config` toont vier VLAN-devices (`lan2.1` tot `lan2.4`, VLAN-ID 1 tot 4) die allemaal op de fysieke poort `lan2` gemaakt zijn.

### Which routes do you see in the routing table? Did you have to add static routes or a routing protocol, like in Lab 2? Why (not)?
Vier verbonden routes, `10.1.1.0/24` tot `10.1.4.0/24`, elk via de sub-interface van dat VLAN. Statische routes of een routingprotocol zijn niet nodig, want de router is rechtstreeks met alle vier de netwerken verbonden. In Lab 2 hingen de routers maar aan twee netwerken en moesten de andere twee geleerd worden.

### 5.3 Test connectivity: Who can you reach, and why?
- De gateway van je eigen VLAN (`10.1.n.254`): ja, rechtstreeks via de sub-interface.
- De gateway van een ander VLAN (bijvoorbeeld `10.1.3.254` vanuit VLAN 2): ja, want die adressen zitten op dezelfde router. De host stuurt naar zijn eigen gateway, die het adres zelf bezit.
- Een host in hetzelfde VLAN op een andere access switch: ja, het VLAN loopt over de trunks.
- Een host in een ander VLAN: ja, via de router (router on a stick), zodra de gateway op de host staat.
- Het beheer-IP van een switch (`10.1.1.y`) vanuit VLAN 1: ja.
- Het beheer-IP van een switch vanuit VLAN 2, 3 of 4: nee, de switch heeft nog geen gateway en weet niet waar het antwoord naartoe moet.

### Fix the last problem by configuring the default gateway of the switches. Can you now reach the switches from every VLAN?
Network, Interfaces, LAN, Edit: gateway `10.1.1.254`. Daarna ja: de switch stuurt zijn antwoorden aan een host in een ander VLAN via de router terug.

### Why can one physical cable between the switch and router carry traffic for four different VLANs?
Door de 802.1Q-tags: elk frame draagt zijn VLAN-ID, dus de ontvanger kan de frames uit elkaar houden. De poort is tagged lid van alle vier de VLAN's.

### What happens if VLAN3 is not tagged on the switch port connected to the router?
Frames van VLAN 3 komen nooit bij de router aan, dus de interface `lan2.3` krijgt niets. Hosts in VLAN 3 krijgen geen antwoord van hun gateway `10.1.3.254`, en niemand bereikt VLAN 3 via de router.

### What happens if the VLAN3 interface exists on the router but has the wrong IP address or subnet mask?
De hosts in VLAN 3 kunnen hun gateway niet bereiken (het adres of masker klopt niet met wat zij verwachten), en de router kent het juiste netwerk niet. Verkeer naar of vanuit VLAN 3 faalt.

### Use traceroute from a host to a host in the same VLAN and to a host in another VLAN. How many hops do you see, and which IP addresses show up?
Binnen hetzelfde VLAN één hop: de bestemming zelf (geen router). Naar een ander VLAN twee hops: eerst de gateway `10.1.n.254`, dan de bestemming. Gemeten: nog in te vullen na het labo.

### 5.4 Analyze the traffic
Mirror de poort naar de router (bron) naar een vrije poort (bestemming), wis de ARP-cache (`sudo arp -d -a`), start de capture en ping een host in een ander VLAN. Filter bijvoorbeeld op `vlan.id == 2`.

### In which VLAN is the ARP request for the default gateway sent? Would a host in VLAN4 receive this request?
In het VLAN van de verzendende host (bijvoorbeeld VLAN 2). Een host in VLAN 4 ontvangt het niet, want een broadcast blijft binnen zijn VLAN.

### How many times do you see each ICMP echo request on the link to the router? Explain.
Twee keer: eerst getagd met het VLAN van de afzender richting de router, en na het routeren getagd met het VLAN van de bestemming weer terug over dezelfde kabel. Daarom is die ene trunk een bottleneck.

### Compare the frame that enters the router with the frame that leaves the router, and complete the table.
Voorbeeld: host A van access switch 2 (VLAN 2, `10.1.2.10`) pingt host A van access switch 3 (VLAN 3, `10.1.3.10`).

| Field | Echo request towards the router | Echo request leaving the router |
|---|---|---|
| VLAN ID | 2 | 3 |
| Source MAC | MAC van host `10.1.2.10` | MAC van de router (poort lan2) |
| Destination MAC | MAC van de router (poort lan2) | MAC van host `10.1.3.10` |
| Source IP | `10.1.2.10` | `10.1.2.10` |
| Destination IP | `10.1.3.10` | `10.1.3.10` |
| TTL | bijvoorbeeld 64 | 63 (min 1) |

Het IP-adres blijft hetzelfde, MAC-adressen en VLAN-ID veranderen bij elke hop en de TTL daalt met 1.

---

## Opruimen
Zet de switches en de router aan het einde van het labo terug op de fabrieksinstellingen (reset-knop ongeveer 10 seconden, daarna NIET uitsteken) en trek de kabel naar het campusnetwerk uit.
