![logo](https://eliasdh.com/assets/media/images/logo-github.png)
# Lab 2

Uitvoeren op: `pc` = laptop/host, `router` = Asus, `switch` = Netgear, `router/switch` = beide OpenWrt-toestellen (via SSH).

Notatie: `x` = groepsnummer (1 tot 4). `x+1` en `x-1` rekenen modulo 4 (dus 4+1 = 1 en 1-1 = 4). Hosts zijn `10.1.x.10` en `10.1.x.11`, de switch is `10.1.x.1`, de router is `10.1.x.3` (LAN1) en `10.1.(x+1).2` (LAN2).

### Onze waarden (groep 2, router 2)

| Toestel | Waarde |
|---|---|
| Switch 2 | `10.1.2.1` |
| Host `.10` / `.11` | `10.1.2.10` / `10.1.2.11` |
| Router 2, LAN1 (`br-lan`) | `10.1.2.3/24` |
| Router 2, LAN2 (`lan2`) | `10.1.3.2/24` |
| Default gateway host `.10` / `.11` (Ex 5) | `10.1.2.2` (LAN2 van router 1) / `10.1.2.3` |
| Statische routes router 2 (Ex 6) | `10.1.4.0/24` via `10.1.3.3` op `lan2`, en `10.1.1.0/24` via `10.1.2.2` op `lan` |
| RIP netwerken (Ex 7.1) | `10.1.2.0/24` en `10.1.3.0/24` |
| OSPF router-id en netwerken (Ex 7.2) | `10.1.2.3`, `10.1.2.0/24` en `10.1.3.0/24` in area 0 |

---

## Connect via SSH

Alle configuratie in dit labo gebeurt via SSH op de OpenWrt-toestellen (user `root`, geen wachtwoord, of het wachtwoord uit Lab 1). De pc moet daarvoor in hetzelfde subnet zitten als het toestel.

| Toestel | Adres | Wanneer |
|---|---|---|
| Switch (fabrieksinstelling of na reset) | `192.168.1.1` | Begin van Exercise 1, pc op `192.168.1.10/24` |
| Switch (na Exercise 1) | `10.1.x.1` | Pc in 10.1.x.0/16 (Ex 1) of 10.1.x.0/24 (Ex 2 en verder) |
| Router (fabrieksinstelling of na reset) | `192.168.1.1` | Begin van Exercise 4, pc op DHCP of `192.168.1.10/24` |
| Router (na Exercise 4) | `10.1.x.3` | Pc in subnet x, en vanaf Exercise 6 ook `10.1.y.3` van andere groepen |

```cli
ssh root@192.168.1.1     # pc (toestel in fabrieksinstelling)
ssh root@10.1.x.1        # pc (switch)
ssh root@10.1.x.3        # pc (router)
exit                     # router/switch (sluit de SSH-sessie)
```

Omdat dezelfde IP-adressen op verschillende toestellen gebruikt worden, krijg je vaak "REMOTE HOST IDENTIFICATION HAS CHANGED". Oplossen met:
```cli
ssh-keygen -R 10.1.x.1   # pc (verwijder de oude host key voor dit IP)
ssh root@10.1.x.1        # pc
```

Verandert het management-IP terwijl je via SSH verbonden bent, dan valt de sessie weg bij `/etc/init.d/network restart`. Zet daarna het IP van de pc in het nieuwe subnet en verbind opnieuw op het nieuwe adres.

---

## Exercise 1: Switching with /16-Subnet mask

### Configure the switch and the hosts
Firewall uit, management-IP van de switch en het IP van de host met /16 masker, nergens een default gateway. Eerst met de pc op `192.168.1.10/24` via SSH verbinden met de switch op `192.168.1.1`.
```powershell
netsh interface ip set address name="Ethernet" static 192.168.1.10 255.255.255.0   # pc (tijdelijk, om te kunnen configureren)
```
```cli
ssh root@192.168.1.1                       # pc
/etc/init.d/firewall stop                  # switch
uci set network.lan.ipaddr='10.1.x.1'      # switch
uci set network.lan.netmask='255.255.0.0'  # switch
uci commit network                         # switch
/etc/init.d/network restart                # switch
```
```powershell
netsh interface ip set address name="Ethernet" static 10.1.x.10 255.255.0.0   # pc (10.1.x.11 voor de partner)
```
Na het herstarten van het netwerk valt de SSH-sessie weg. Test de verbinding op het nieuwe adres:
```cli
ssh root@10.1.x.1   # pc
```

### Test with fping
Alle IP-adressen (één per regel) in `~/Documents/ips.txt`, daarna in één keer testen.
```cli
fping -f ~/Documents/ips.txt   # pc (Ubuntu desktop)
```

### Ping your own switch management IP. Can you reach it?
Ja. De switch zit in hetzelfde subnet (10.1.0.0/16), dus de host stuurt rechtstreeks via ARP.

### Ping another switch management IP. What do you get?
Een echo reply. Alle switches hangen aan elkaar in hetzelfde Layer 2 netwerk en alle management-IP's zitten in dezelfde /16, dus er is geen router nodig.

### Ping the IP of your partner. What is the result?
Ja, bereikbaar. Zelfde switch en zelfde subnet.

### Ping a few other hosts in your created network. Can you reach them?
Ja. Alle hosts zitten in 10.1.0.0/16 en de switches sturen de frames door op basis van MAC-adres.

### When a host starts a ping to another host in the same subnet, what information does it already know, and what information does it still need before it can send the Ethernet frame?
Bekend: het eigen IP en masker, het doel-IP en (via IP AND masker) dat het doel in het eigen subnet zit, dus rechtstreeks bereikbaar is. Nog nodig: het MAC-adres van het doel. Ethernet werkt enkel met MAC-adressen, dat haalt de host op met ARP.

### What is the very first relevant frame you observe in Wireshark when the ping starts? Note you might have to clear the table or ping a new host or switch.
Een ARP request: "Who has 10.1.y.z? Tell 10.1.x.10". Eerst `arp -d *` (Windows) of `sudo ip neigh flush all` (Linux) uitvoeren, of een nieuwe host pingen.

### Is that first frame addressed to a single device, or to multiple devices in the local network?
Naar alle toestellen: het is een broadcast met bestemmings-MAC `ff:ff:ff:ff:ff:ff`. De switch stuurt hem uit op alle poorten, enkel de eigenaar van het gevraagde IP antwoordt.

### Paste a screenshot of the first packet you observe. Which addresses can you identify in that frame at the Ethernet level, and which addresses appear inside the protocol payload?
Screenshot: nog toe te voegen.

Ethernet-niveau: bron-MAC (de eigen host) en bestemmings-MAC `ff:ff:ff:ff:ff:ff`, type 0x0806 (ARP). In de ARP-payload: sender MAC en sender IP (eigen host) en target IP (gezocht toestel), target MAC is nog `00:00:00:00:00:00` (onbekend).

### Paste a screenshot of the ICMP packet you observe. What can you find inside it?
Screenshot: nog toe te voegen.

Ethernet-header (unicast bron- en bestemmings-MAC), IP-header (bron-IP, doel-IP, TTL, protocol 1 = ICMP, checksum) en de ICMP-header: type 8 (echo request) of type 0 (echo reply), code, checksum, identifier, sequence number en de data (padding van de ping).

### Does the ICMP traffic use the same type of Ethernet destination addressing as the first frame you observed?
Nee. ICMP gaat unicast naar het MAC-adres van het doel dat via ARP geleerd is. De ARP request was een broadcast.

### Which information seems to have been learned or cached after the first exchange?
De host heeft de koppeling IP naar MAC opgeslagen in zijn ARP-cache (`arp -a` of `ip neigh`). De switch heeft de bron-MAC's en de poorten waarop ze gezien zijn opgeslagen in zijn MAC address table, waardoor volgende frames niet meer overal naartoe gestuurd worden.

### In this experiment, which parts of the communication belong to Layer 2, and which parts to Layer 3?
Layer 2: Ethernet-frames, MAC-adressen, ARP (hoort tussen 2 en 3, vertaalt IP naar MAC) en het doorsturen door de switch. Layer 3: IP-adressen, het subnetmasker (lokaal of niet) en ICMP (ping).

### Explain why no default gateway is needed in this topology?
Alle toestellen zitten in hetzelfde subnet (10.1.0.0/16). Elke bestemming is dus rechtstreeks bereikbaar via ARP en een Layer 2 switch. Een gateway is enkel nodig voor bestemmingen buiten het eigen subnet.

### What would you expect to break if the subnet mask were changed to /24?
Enkel toestellen met hetzelfde derde octet blijven elkaar zien (dezelfde 10.1.x.0/24). Voor alle andere groepen valt de bestemming buiten het subnet, de host probeert de default gateway te gebruiken, maar die is er niet, dus er wordt niets verstuurd en de ping faalt.

---

## Exercise 2: Switching with /24-Subnet mask

### Change the mask to /24
IP-adressen blijven hetzelfde, nog steeds geen default gateway.
```cli
ssh root@10.1.x.1                             # pc
uci set network.lan.netmask='255.255.255.0'   # switch
uci commit network                            # switch
/etc/init.d/network restart                   # switch
```
```powershell
netsh interface ip set address name="Ethernet" static 10.1.x.10 255.255.255.0   # pc
```
```cli
ssh root@10.1.x.1   # pc (opnieuw verbinden na de herstart)
```

### Ping your own switch management IP. Can you reach it?
Ja, zelfde /24.

### Ping another switch management IP. What do you get?
Niets: "Network is unreachable" (Linux) of "General failure" (Windows). 10.1.y.1 ligt buiten 10.1.x.0/24 en er is geen gateway, dus de host stuurt niets uit.

### Ping the IP of your partner. What is the result?
Ja, bereikbaar. Zelfde switch en zelfde /24.

### Ping a few other hosts in your created network (other groups). Can you reach them?
Nee, om dezelfde reden: andere groepen zitten in een ander /24 subnet en er is geen gateway.

### Connect physically to a different switch. Can you access the device via SSH? Why (not)?
```cli
ssh root@10.1.y.1   # pc (op een switch van een andere groep): time out of "Network is unreachable"
```
Nee. De pc heeft nog 10.1.x.10/24, de andere switch heeft 10.1.y.1/24: ander subnet, geen route. SSH (TCP) kan geen verbinding opbouwen, want er wordt niet eens een pakket verstuurd. Het werkt pas als de pc een IP in 10.1.y.0/24 krijgt.

### Now open Wireshark on your devices. What do you see when you ping a host of another group? And why is this the case?
Niets. Geen ARP en geen ICMP. De host past het masker toe, ziet dat het doel buiten het eigen subnet ligt, vindt geen route (geen default gateway) en weigert lokaal te versturen. Er verlaat dus geen enkel pakket de netwerkkaart.

---

## Exercise 3: Switching with different subnets for hosts

### Configure the hosts
Host `.10` krijgt /16, host `.11` blijft /24, switches blijven /24, geen default gateway.
```powershell
netsh interface ip set address name="Ethernet" static 10.1.x.10 255.255.0.0     # pc .10
netsh interface ip set address name="Ethernet" static 10.1.x.11 255.255.255.0   # pc .11
```

### Who can you reach, and why?
Het cruciale punt: een host beslist met zijn eigen masker of hij zendt, en het antwoord hangt af van het masker van de ontvanger. Een ARP request bereikt iedereen op Layer 2 en wordt altijd beantwoord, maar de ICMP reply (of elk antwoord) kan enkel terug als de ontvanger de bron als "lokaal" ziet.

| Bestemming | Vanaf host `.10` (/16) | Vanaf host `.11` (/24) |
|---|---|---|
| Your partner on the same switch `10.1.x.10`/`.11`? | Ja | Ja (partner zit in 10.1.x.0/24, beide richtingen kloppen) |
| Your switch `10.1.x.1`? | Ja | Ja |
| Your neighbor on a different switch `10.1.y.10`? | Ja: beide kanten /16, request en reply zijn lokaal | Nee: `10.1.y.10` ligt buiten mijn /24, er wordt niets verstuurd |
| Your neighbor on a different switch `10.1.y.11`? | Nee: ARP en echo request komen aan, maar de buur (/24) kan niet antwoorden omdat 10.1.x.10 voor hem buiten zijn subnet ligt | Nee: buiten mijn /24 |
| Your neighbor's switch `10.1.y.1`? | Nee: request komt aan, maar de switch (/24, geen gateway) kan niet terug naar 10.1.x.10 | Nee: buiten mijn /24 |

Wireshark toont bij de "Nee" van host `.10` wel ARP request, ARP reply en een reeks echo requests zonder reply. Bij host `.11` is er niets te zien. Conclusie: connectiviteit is niet automatisch symmetrisch, beide kanten moeten het andere toestel als lokaal zien.

---

## Exercise 4: Routing without default gateway and no IP routing

### Install the packages and turn off the firewall
De router heeft internet nodig voor `opkg` (kabel van het campusnetwerk in de WAN-poort, zie Lab 1). Verbind met SSH op `192.168.1.1` (na een reset) of op het IP dat je eerder instelde.
```cli
ssh root@192.168.1.1                                                     # pc
opkg update                                                              # router
opkg install frr frr-ripd frr-ospfd frr-zebra frr-watchfrr               # router
which vtysh                                                              # router (moet /usr/bin/vtysh tonen)
/etc/init.d/firewall stop                                                # router
```
In OpenWrt 24.10.2 bestaat er geen apart pakket `frr-vtysh` meer (de opgave noemt het nog wel, daardoor "Unknown package 'frr-vtysh'"). `vtysh` zit in het pakket `frr` zelf. De melding "cannot start staticd: daemon binary not installed" is onschuldig: `staticd` is niet nodig, enkel `zebra` en later `ripd`/`ospfd`.

#### Troubleshooting: "SSL verify error" bij `opkg update`
Meestal staat de klok van het toestel fout (na een reset of reboot is de datum oud). Dan beschouwt `wget` het certificaat van `downloads.openwrt.org` als nog niet geldig, en omdat de lijsten niet binnenkomen zijn `frr` en co "Unknown package". Eerst controleren of de verbinding werkt, dan de datum zetten (zie Lab 1) en opnieuw proberen:
```cli
ping -c 4 openwrt.org                    # router (moet werken, anders is er geen internet of DNS)
date                                     # router (staat de datum fout?)
ntpd -q -p pool.ntp.org                  # router (datum via NTP, of handmatig met de volgende regel)
date -s "YYYY-MM-DD HH:MM:SS"            # router (vul de huidige datum en tijd in)
opkg update                              # router
opkg install frr frr-ripd frr-ospfd frr-zebra frr-watchfrr             # router
```
Blijft de fout bestaan terwijl de datum klopt, controleer dan of `ca-bundle` geïnstalleerd is met `opkg list-installed | grep ca-bundle`.

### Configure the router
Topologie: router `x` met LAN1 aan switch `x` en LAN2 aan switch `x+1`, dus elke router verbindt twee subnetten. Eerst LAN2 uit de bridge halen, dan een nieuwe interface `lan2` maken en daarna het IP van `br-lan` instellen. Alle maskers `255.255.255.0`, geen default gateway. Poortnamen eerst nakijken met `uci show network`.
```cli
uci show network                                  # router
uci del_list network.@device[0].ports='lan2'      # router (LAN2 uit br-lan)
uci set network.lan2=interface                    # router
uci set network.lan2.proto='static'               # router
uci set network.lan2.device='lan2'                # router
uci set network.lan2.ipaddr='10.1.(x+1).2'        # router, bv. 10.1.2.2 voor router 1
uci set network.lan2.netmask='255.255.255.0'      # router
uci set network.lan.ipaddr='10.1.x.3'             # router (LAN1 / br-lan)
uci set network.lan.netmask='255.255.255.0'       # router
uci commit network                                # router
/etc/init.d/network restart                       # router
```
Hosts terug naar /24 en nog altijd zonder gateway:
```powershell
netsh interface ip set address name="Ethernet" static 10.1.x.10 255.255.255.0   # pc
```
De SSH-sessie valt weg bij de herstart. Verbind opnieuw op het nieuwe adres van `br-lan` (de pc en de router zitten nu allebei in 10.1.x.0/24):
```cli
ssh root@10.1.x.3   # pc
```

### Who can you reach, and why?

| Bestemming | Bereikbaar | Reden |
|---|---|---|
| Your partner on the same switch `10.1.x.10`/`.11`? | Ja | Zelfde /24, ARP en switch. |
| Your switch `10.1.x.1`? | Ja | Zelfde /24. |
| Your router on the physically connected interface (LAN1) `10.1.x.3`? | Ja | `br-lan` van de router zit in subnet x. |
| Your router on the other interface (LAN2) `10.1.(x+1).2`? | Nee | Ander subnet, de host heeft geen gateway en dus geen next hop. |
| Your neighbor's router on the physically connected interface (LAN2) `10.1.x.2`? | Ja | LAN2 van router `x-1` hangt aan mijn switch en zit in subnet x. |
| Your neighbor's switch? | Nee | Ander subnet, geen gateway. |
| Your neighbor's router? | Nee | Ander subnet, geen gateway. Enkel `10.1.x.2` (LAN2) is lokaal, de rest (bv. `10.1.(x-1).3`) niet. |

### Open Wireshark and check what packets are sent and which are not. Why are some packets not sent?
Voor bereikbare bestemmingen zie je ARP request en reply gevolgd door ICMP echo request en reply. Voor de rest zie je niets: de host berekent dat het doel buiten het subnet ligt, heeft geen route en geeft zelf een foutmelding ("Network is unreachable" of "General failure"). Er is geen ARP en geen ICMP.

### Draw a conclusion: why don't you have full connectivity?
Elk /24 is een eiland. De hosts hebben geen default gateway, dus weten ze niet naar wie ze verkeer voor andere subnetten moeten sturen. De routers staan er wel, maar worden niet gebruikt. Bovendien kennen ze enkel hun twee rechtstreeks verbonden netwerken. Er zijn dus twee dingen nodig: een gateway op de hosts en routes op de routers.

---

## Exercise 5: Routing with default gateway and no IP routing

### Configure the default gateways
Host `.10` gebruikt de router links (`10.1.x.2`, LAN2 van router `x-1`), host `.11` de router rechts (`10.1.x.3`, LAN1 van router `x`). De routers blijven ongewijzigd.
```powershell
netsh interface ip set address name="Ethernet" static 10.1.x.10 255.255.255.0 10.1.x.2   # pc .10
netsh interface ip set address name="Ethernet" static 10.1.x.11 255.255.255.0 10.1.x.3   # pc .11
```

### Who can you reach, and why?
Een router kent enkel zijn eigen twee netwerken: router `x-1` kent x-1 en x, router `x` kent x en x+1. Voor host `.10` (gateway links) is de dichtste buur groep `x-1`, voor host `.11` (gateway rechts) is dat groep `x+1`. Het antwoord moet ook terug raken, en dat gaat via de eigen gateway van het doel.

| Bestemming | Vanaf host `.10` | Vanaf host `.11` |
|---|---|---|
| Your partner on the same switch `10.1.x.10`/`.11`? | Ja | Ja |
| Your switch `10.1.x.1`? | Ja | Ja |
| Your router on the physically connected interface (LAN1) `10.1.x.3`? | Ja | Ja |
| Your router on the other interface (LAN2) `10.1.x.2`? (`10.1.x.2` is LAN2 van router `x-1`, mijn eigen LAN2 is `10.1.(x+1).2`) | `10.1.x.2`: Ja. `10.1.(x+1).2`: Nee, mijn gateway (router `x-1`) kent netwerk x+1 niet | `10.1.x.2`: Ja. `10.1.(x+1).2`: Ja, mijn gateway is deze router zelf |
| Your closest neighbor `.10`/`.11`? | Enkel `.11` van groep `x-1`: zijn gateway is router `x-1`, dezelfde als de mijne, dus het antwoord komt terug. `.10` niet: zijn gateway is router `x-2`, die netwerk x niet kent | Enkel `.10` van groep `x+1`: zijn gateway `10.1.(x+1).2` is router `x`. `.11` niet: zijn gateway is router `x+1`, die netwerk x niet kent |
| Your closest neighbor's switch? | Nee: de request komt aan, maar de switch heeft geen default gateway en kan niet antwoorden | Nee, zelfde reden |
| Your farther neighbor's switch? | Nee: mijn gateway kent dat netwerk niet | Nee, zelfde reden |
| Your farther neighbor's router? | Nee: geen route naar dat netwerk | Nee, zelfde reden |

### Open Wireshark on your host device and send a ping to the far side of the router you can reach. What do you learn from this?
Screenshot: nog toe te voegen.

Bv. host `.10` pingt `10.1.(x-1).10`. Eerst een ARP voor de gateway (`10.1.x.2`), dan een echo request met het MAC-adres van de gateway als bestemming maar het IP van het doel. De router stuurt het door (hij is rechtstreeks verbonden), maar er komt geen reply. Routing is dus tweerichtingsverkeer: heen en terug moeten elk een route hebben. Het antwoord gaat via de gateway van het doel, en die router kent mijn netwerk niet en dropt het pakket.

### Draw a conclusion: why don't you have full connectivity?
De hosts weten nu wel naar wie ze moeten sturen (default gateway), maar de routers kennen enkel hun twee rechtstreeks verbonden netwerken. Ze hebben geen informatie over netwerken die twee of meer routers verder liggen, en de switches hebben zelf geen gateway. Zonder (statische of dynamische) routes tussen de routers kan verkeer niet voorbij de buren komen, en verdwijnt het antwoord onderweg.

---

## Exercise 6: Routing with default gateway and IP routing

### Add the static routes
Elke router is direct verbonden met 2 netwerken en heeft 2 statische routes nodig voor de andere twee. Afspraak voor de groep: router `x` bereikt netwerk `x+2` via router `x+1` (LAN1 van die router, `10.1.(x+1).3`, op interface `lan2`) en netwerk `x-1` via router `x-1` (LAN2 van die router, `10.1.x.2`, op interface `lan`).

| Router | Target | Gateway | Interface |
|---|---|---|---|
| 1 | `10.1.3.0/24` | `10.1.2.3` | `lan2` |
| 1 | `10.1.4.0/24` | `10.1.1.2` | `lan` |
| 2 | `10.1.4.0/24` | `10.1.3.3` | `lan2` |
| 2 | `10.1.1.0/24` | `10.1.2.2` | `lan` |
| 3 | `10.1.1.0/24` | `10.1.4.3` | `lan2` |
| 3 | `10.1.2.0/24` | `10.1.3.2` | `lan` |
| 4 | `10.1.2.0/24` | `10.1.1.3` | `lan2` |
| 4 | `10.1.3.0/24` | `10.1.4.2` | `lan` |

GUI: Network > Routing > Static IPv4 Routes > Add. Zelfde in CLI (voorbeeld router 1):
```cli
ssh root@10.1.1.3                                  # pc (in subnet 1)
uci add network route                              # router
uci set network.@route[-1].interface='lan2'        # router
uci set network.@route[-1].target='10.1.3.0'       # router
uci set network.@route[-1].netmask='255.255.255.0' # router
uci set network.@route[-1].gateway='10.1.2.3'      # router
uci add network route                              # router
uci set network.@route[-1].interface='lan'         # router
uci set network.@route[-1].target='10.1.4.0'       # router
uci set network.@route[-1].netmask='255.255.255.0' # router
uci set network.@route[-1].gateway='10.1.1.2'      # router
uci commit network                                 # router
/etc/init.d/network restart                        # router
```

### How did you add the static route, and on which interface? What IP address will be the target, and what will be the gateway?
Via Network > Routing > Static IPv4 Routes (of `uci add network route`), op de interface waarop de next hop rechtstreeks bereikbaar is (`lan2` of `lan`). Target = het netwerk dat nog niet bekend is (bv. `10.1.3.0/24`), gateway = het IP van de buur-router op het gedeelde netwerk (bv. `10.1.2.3`). De gateway moet altijd in een rechtstreeks verbonden subnet liggen.

### With what command can you check the routing table? Explain what you see
```cli
ip route   # router (of: route -n)
```
Voorbeeld voor router 1:
```
10.1.1.0/24 dev br-lan proto kernel scope link src 10.1.1.3
10.1.2.0/24 dev lan2 proto kernel scope link src 10.1.2.2
10.1.3.0/24 via 10.1.2.3 dev lan2 proto static
10.1.4.0/24 via 10.1.1.2 dev br-lan proto static
```
De eerste twee zijn connected routes (`proto kernel`), die de kernel zelf aanmaakt zodra een interface een IP heeft. De laatste twee zijn de statische routes (`via` = next hop). Een router met een WAN-verbinding heeft daarnaast nog een default route.

### Who can you reach, and why?
Nu kent elke router alle vier de netwerken en kunnen heen- en terugweg overal gerouteerd worden.

| Bestemming | Bereikbaar | Reden |
|---|---|---|
| Your partner on the same switch `10.1.x.10`/`.11`? | Ja | Zelfde subnet. |
| Your switch `10.1.x.1`? | Ja | Zelfde subnet. |
| Your router on the physically connected interface (LAN1) `10.1.x.3`? | Ja | Zelfde subnet. |
| Your router on the other interface (LAN2) `10.1.x.2`? | Ja | Via de gateway, en de routers kennen alle netwerken (geldt voor `10.1.x.2` en `10.1.(x+1).2`). |
| Your closest neighbor `.10`/`.11`? | Ja, beide | Hun gateway-router kent mijn netwerk nu via een statische route. |
| Your closest neighbor's switch? | Nee | Request komt aan, maar de switch heeft geen default gateway en kan niet terug. |
| Your farther neighbor's switch? | Nee | Zelfde reden. |
| Your farther neighbor's router? | Ja | Elke router kent alle netwerken en antwoordt zelf. |

De switches zijn enkel bereikbaar vanuit hun eigen subnet. Dit is op te lossen met een default gateway op de switch, bv. `uci set network.lan.gateway='10.1.x.3'` gevolgd door `uci commit network` en `/etc/init.d/network restart`.

### What would be a disadvantage of static routes for real networks?
Alles is handwerk. Het aantal routes groeit snel met het netwerk, elke wijziging moet op elke router aangepast worden, en fouten (typo, vergeten route, lus) zijn makkelijk gemaakt en moeilijk te vinden. Het schaalt niet.

### Let's say we have full connectivity by adding all static routes. If a link or router fails, what happens to the static routes that use that path? Will the network adapt automatically? Why or why not?
Nee. Statische routes blijven in de tabel staan zolang de uitgaande interface up is, ook al ligt de rest van het pad eruit. Pakketten gaan dan naar een dode next hop en verdwijnen (een black hole). Routers wisselen geen informatie uit, dus er is geen automatische omweg: iemand moet handmatig een andere route toevoegen.

### Open Wireshark on your host and ping a host in a remote subnet. Which MAC address does your host use as destination in the Ethernet frame: the MAC address of the final host, or the MAC address of the default gateway? Why?
Screenshot: nog toe te voegen.

Het MAC-adres van de default gateway, niet dat van de eindhost. Het doel ligt buiten het subnet, dus de host doet ARP voor het IP van de gateway en geeft het pakket daaraan. MAC-adressen gelden enkel voor één hop op één Layer 2 netwerk, het doel-IP in het pakket blijft het IP van de eindhost.

### Inspect the IP packet in Wireshark on both sides of the router. Which fields stay the same, and which field(s) may change when the router forwards the packet?
Hetzelfde: bron-IP, doel-IP (er is geen NAT en de firewall staat uit), protocol, en de ICMP-inhoud (type, identifier, sequence, data). Veranderd: de TTL gaat met 1 omlaag en daardoor ook de IP header checksum. De Ethernet-header wordt per hop volledig vervangen (nieuw bron-MAC = interface van de router, nieuw doel-MAC = volgende hop of eindhost).

---

## Exercise 7: Routing with default gateway, IP routing, and routing protocol

### Remove the static routes
GUI: Network > Routing > Static IPv4 Routes > Delete > Save & Apply. Zelfde in CLI:
```cli
ssh root@10.1.x.3                                    # pc
while uci -q delete network.@route[0]; do :; done   # router
uci commit network                                   # router
/etc/init.d/network restart                          # router
```

### 7.1 RIP (Routing Information Protocol)

#### Step 1: Enable the RIP daemon on every router
```cli
sed -i 's/^ripd=no/ripd=yes/' /etc/frr/daemons   # router (of met vi /etc/frr/daemons)
/etc/init.d/frr enable                            # router
/etc/init.d/frr restart                           # router
```

#### Step 2: Configure RIP on every router
Voorbeeld voor router 1 (netwerken `10.1.1.0/24` en `10.1.2.0/24`):
```cli
vtysh                           # router
conf t                          # router (vtysh)
router rip                      # router (vtysh)
 version 2                      # router (vtysh)
 network 10.1.1.0/24            # router (vtysh)
 network 10.1.2.0/24            # router (vtysh)
 no passive-interface br-lan    # router (vtysh)
 no passive-interface lan2      # router (vtysh)
end                             # router (vtysh)
write memory                    # router (vtysh)
exit                            # router (verlaat vtysh)
```

#### What commands can you find to debug this setup and analyze the routing table?
| Command | Uitvoeren op | Output and function |
|---|---|---|
| `show ip rip` | router (vtysh) | RIP-database: per netwerk de next hop, metric en hoe lang geleden het geleerd is. |
| `show ip rip status` | router (vtysh) | RIP-parameters: versie, timers (update, timeout, garbage collection), interfaces en buren. |
| `show ip route` | router (vtysh) | Alle routes met bron (`C` connected, `R` RIP, `K` kernel) en `[120/metric]`. |
| `show ip route rip` | router (vtysh) | Enkel de door RIP geleerde routes. |
| `show running-config` | router (vtysh) | Huidige FRR-configuratie. |
| `debug rip events` / `debug rip packet` | router (vtysh) | Live debug van RIP-berichten (verschijnt in `logread`). |
| `ip route` | router | Kernel routing tabel, hier staan de routes die FRR geïnstalleerd heeft. |

#### Explain the output of the commands. What metric does it show for a network two hops away? What does this number represent?
`show ip rip` toont per netwerk de code (`C(i)` voor een connected netwerk, `R(n)` voor een geleerd netwerk), de next hop, de metric en de bron. Een rechtstreeks verbonden netwerk heeft metric 1, een netwerk achter één buur-router metric 2. In deze topologie liggen de twee verdere netwerken elk achter één buur-router, dus ze tonen metric 2 (`[120/2]` in `show ip route`, waarbij 120 de administrative distance van RIP is). De metric is het aantal hops: het aantal routers dat een pakket moet passeren. Maximum is 15, 16 betekent onbereikbaar.

#### Ping all hosts, switches, and routers. Until where do you have connectivity?
Alle hosts en alle routers zijn bereikbaar. Van de switches enkel de eigen, want die hebben geen default gateway en kunnen niet naar een ander subnet antwoorden.

#### Determine the route the packets travel using traceroute.
```cli
traceroute 10.1.y.10   # pc (Ubuntu), tracert op Windows
```
Via SSH kan je ook de tabel van een router van een andere groep bekijken, bv. `ssh root@10.1.y.3` en dan `vtysh -c 'show ip route'`.

#### What route is taken to the closest neighbors?
Host `.10` naar groep `x-1`: host, `10.1.x.2` (router `x-1`), doel. Host `.11` naar groep `x+1`: host, `10.1.x.3` (router `x`), doel. Eén router in het pad.

#### What route is taken to the neighbors of your neighbors?
Twee routers in het pad. Host `.10`: `10.1.x.2` (router `x-1`), `10.1.(x-1).2` (router `x-2`), doel. Host `.11`: `10.1.x.3` (router `x`), `10.1.(x+1).3` (router `x+1`), doel. Traceroute toont telkens het IP van de interface waarop het pakket binnenkomt.

#### Are these always the best possible routes?
Niet noodzakelijk. RIP telt enkel hops en kijkt niet naar bandbreedte, vertraging of belasting. Een pad via één trage link wint dan van een pad met twee snelle links. In dit lab zijn alle links even snel, dus hier is het kortste pad ook het beste. Een host kan ook een extra hop maken doordat zijn gateway aan de ene kant zit (host `.11` naar groep `x-1` gaat via 2 routers).

#### Now, disconnect a link between a switch and a router. What happens? How long does it take ("bad news travels slow/fast?")
De router aan die link ziet meteen de interface-down, haalt de connected route weg en meldt het netwerk als onbereikbaar (metric 16). Routers die de link niet zelf zien, merken het enkel via RIP: een route die niet meer ververst wordt, verloopt pas na de timeout (standaard 180 s, update elke 30 s, daarna nog 120 s garbage collection). Bad news travels slow. Gemeten tijd: nog in te vullen na het labo.

#### Reconnect the link. What happens? ("good news travels slow/fast?")
De router ziet de interface weer up, neemt het netwerk op in zijn tabel en stuurt het door in zijn eerstvolgende update (hooguit 30 s per hop). Good news travels fast. Gemeten tijd: nog in te vullen na het labo.

#### Open Wireshark on the inter-router link. What destination IP address do RIP update packets use, and why is this significant?
Screenshot: nog toe te voegen.

`224.0.0.9`, het RIPv2 multicast-adres (UDP poort 520, TTL 1, Ethernet-bestemming `01:00:5e:00:00:09`). Enkel RIPv2-routers luisteren ernaar, en hosts en andere toestellen worden niet belast zoals bij RIPv1 dat naar de broadcast `255.255.255.255` stuurt. TTL 1 betekent dat de update nooit voorbij de eerstvolgende router gaat.

#### What is the convergence behavior if you unplug the cable between two routers? How long until RIP detects the failure and updates its routing table? This is called the convergence time.
Is er geen link-down op een router (bv. de kabel hangt tussen switches of de buur zit achter een switch), dan merkt de router het enkel doordat de updates van de buur wegblijven. Na de timeout van 180 s wordt de route als onbereikbaar (metric 16) gemarkeerd en na nog 120 s verwijderd, daarna leert hij de omweg via de andere kant van de ring. Convergentie duurt dus meerdere minuten. Gemeten tijd: nog in te vullen na het labo.

#### Open Wireshark and sniff between the routers. Can you find out what is being transmitted? Capture it and dissect the packet!
Screenshot: nog toe te voegen.

Filter `rip` of `udp.port == 520`. Elk pakket is een RIPv2 Response (command 2, version 2) met per route (max 25 per pakket) een entry van 20 bytes: address family (IP), route tag, IP-adres, subnetmasker, next hop (0.0.0.0 = via de afzender) en metric (1 tot 16). Elke router stuurt periodiek (30 s) zijn volledige routingtabel naar zijn buren, in leesbare vorm.

### 7.2 OSPF (Open Shortest Path First)

#### Step 1: Disable RIP and enable OSPF on every router
```cli
sed -i 's/^ripd=yes/ripd=no/; s/^ospfd=no/ospfd=yes/' /etc/frr/daemons   # router (of met vi)
/etc/init.d/frr restart                                                   # router
```

#### Step 2: Configure OSPF via vtysh on every router
Voorbeeld voor router 1 (router-id = LAN1-IP):
```cli
vtysh                           # router
conf t                          # router (vtysh)
router ospf                     # router (vtysh)
 ospf router-id 10.1.1.3        # router (vtysh)
 network 10.1.1.0/24 area 0     # router (vtysh)
 network 10.1.2.0/24 area 0     # router (vtysh)
end                             # router (vtysh)
write memory                    # router (vtysh)
exit                            # router (verlaat vtysh)
```

#### Ping all hosts, switches, and routers. Until where do you have connectivity?
Hetzelfde als bij RIP: alle hosts en routers zijn bereikbaar, van de switches enkel de eigen (geen default gateway).

#### Determine the route the packets travel using traceroute.
```cli
traceroute 10.1.y.10   # pc (Ubuntu), tracert op Windows
```

#### What route is taken to the closest neighbors?
Zelfde als bij RIP: één router in het pad (host `.10` via `10.1.x.2`, host `.11` via `10.1.x.3`).

#### What route is taken to the neighbors of your neighbors?
Zelfde als bij RIP: twee routers in het pad. Bij gelijke linksnelheid kiest OSPF hetzelfde kortste pad.

#### Are these always the best possible routes?
Veel vaker wel, want OSPF kiest op basis van cost (afgeleid van de bandbreedte van de interface) en niet van hopcount. Een pad met twee snelle links wint dus van een pad met één trage link. Het blijft de beste route voor de metric die ingesteld is, de cost kan handmatig aangepast worden.

#### Now, disconnect a link between a switch and a router. What happens? How long does it take ("bad news travels slow/fast?")
De router ziet de interface-down, haalt zijn link uit zijn Router LSA en floodt de nieuwe LSA meteen naar alle routers. Iedereen draait opnieuw Dijkstra en past zijn tabel aan, dus meestal binnen enkele seconden. Bad news travels fast. Zonder link-down (de buur verdwijnt achter een switch) duurt het tot het verstrijken van de dead interval (standaard 40 s). Gemeten tijd: nog in te vullen na het labo.

#### Reconnect the link. What happens? ("good news travels slow/fast?")
Er worden opnieuw Hello's uitgewisseld en de adjacency doorloopt Down, Init, 2-Way, ExStart, Exchange, Loading, Full. Op een broadcast-netwerk komt daar de DR/BDR-verkiezing bij met een wachttijd tot 40 s, dus de adjacency kan even duren en de route kan trager terugkomen dan bij RIP. Gemeten tijd: nog in te vullen na het labo.

#### Run show ip ospf neighbor: what states do you see? What does the Full state mean?
```cli
vtysh -c 'show ip ospf neighbor'   # router
```
Elke router heeft twee buren, met de staten `Full/DR` of `Full/Backup`. Op een netwerk met slechts twee routers wordt de ene DR en de andere BDR. Full betekent dat de adjacency volledig is: Hello's zijn uitgewisseld en de link-state databases zijn gesynchroniseerd, zodat beide routers dezelfde kaart hebben en routes berekenen.

#### Run show ip ospf database: what types of LSAs (Link State Advertisements) can you identify? What information does each one carry?
```cli
vtysh -c 'show ip ospf database'   # router
```
Type 1, Router LSA: per router (router-id), met zijn links, de netwerken waarmee hij verbonden is en de cost ervan (4 stuks). Type 2, Network LSA: aangemaakt door de DR van een broadcast-netwerk, met de lijst van routers op dat netwerk (4 stuks, één per transitnetwerk). Type 3 (Summary) en type 5 (External) zie je hier niet, want alles zit in één area en er is geen redistributie.

#### Compare convergence time to RIP: unplug the same cable as before. How quickly does OSPF detect the failure and reroute?
Veel sneller dan RIP: seconden bij link-down en maximaal de dead interval (40 s) zonder link-down, tegenover meerdere minuten bij RIP. Gemeten tijd: nog in te vullen na het labo.

#### Look at the routes installed by OSPF with show ip route. How does OSPF decide which path is best when there are multiple paths to the same destination?
```cli
vtysh -c 'show ip route ospf'   # router
```
OSPF-routes staan als `O` met `[110/cost]` (110 = administrative distance). Over de volledige LSDB rekent elke router met Dijkstra de kortste-pad-boom uit, met als metric de som van de cost van alle uitgaande interfaces op het pad. De laagste totale cost wint, bij gelijke cost worden meerdere next hops gebruikt (ECMP).

#### What is the fundamental difference in how RIP and OSPF routers share information with each other?
RIP is distance-vector: elke router stuurt periodiek zijn hele routingtabel (netwerk en metric) enkel naar zijn directe buren en vertrouwt op wat de buren zeggen (routing by rumor). OSPF is link-state: elke router floodt enkel informatie over zijn eigen links (LSA's) naar alle routers in de area, waardoor iedereen dezelfde LSDB heeft en zelf zijn kortste paden berekent. OSPF stuurt enkel bij wijzigingen en is daardoor sneller en schaalbaarder.

---

## Commando's per router (kopieer-klaar)

Verbind eerst met de router (`ssh root@192.168.1.1` voor Exercise 4, daarna `ssh root@10.1.n.3`). Controleer de poortnaam en device-index met `uci show network`: onderstaande commando's gaan uit van poort `lan2` in `@device[0]`.

### Exercise 4: interfaces

| Router | `br-lan` (LAN1) | `lan2` (LAN2) |
|---|---|---|
| 1 | `10.1.1.3` | `10.1.2.2` |
| 2 | `10.1.2.3` | `10.1.3.2` |
| 3 | `10.1.3.3` | `10.1.4.2` |
| 4 | `10.1.4.3` | `10.1.1.2` |

Router 1:
```cli
uci del_list network.@device[0].ports='lan2'
uci set network.lan2=interface
uci set network.lan2.proto='static'
uci set network.lan2.device='lan2'
uci set network.lan2.ipaddr='10.1.2.2'
uci set network.lan2.netmask='255.255.255.0'
uci set network.lan.ipaddr='10.1.1.3'
uci set network.lan.netmask='255.255.255.0'
uci commit network
/etc/init.d/network restart
```
Router 2:
```cli
uci del_list network.@device[0].ports='lan2'
uci set network.lan2=interface
uci set network.lan2.proto='static'
uci set network.lan2.device='lan2'
uci set network.lan2.ipaddr='10.1.3.2'
uci set network.lan2.netmask='255.255.255.0'
uci set network.lan.ipaddr='10.1.2.3'
uci set network.lan.netmask='255.255.255.0'
uci commit network
/etc/init.d/network restart
```
Router 3:
```cli
uci del_list network.@device[0].ports='lan2'
uci set network.lan2=interface
uci set network.lan2.proto='static'
uci set network.lan2.device='lan2'
uci set network.lan2.ipaddr='10.1.4.2'
uci set network.lan2.netmask='255.255.255.0'
uci set network.lan.ipaddr='10.1.3.3'
uci set network.lan.netmask='255.255.255.0'
uci commit network
/etc/init.d/network restart
```
Router 4:
```cli
uci del_list network.@device[0].ports='lan2'
uci set network.lan2=interface
uci set network.lan2.proto='static'
uci set network.lan2.device='lan2'
uci set network.lan2.ipaddr='10.1.1.2'
uci set network.lan2.netmask='255.255.255.0'
uci set network.lan.ipaddr='10.1.4.3'
uci set network.lan.netmask='255.255.255.0'
uci commit network
/etc/init.d/network restart
```

### Exercise 6: statische routes

Router 1:
```cli
uci add network route
uci set network.@route[-1].interface='lan2'
uci set network.@route[-1].target='10.1.3.0'
uci set network.@route[-1].netmask='255.255.255.0'
uci set network.@route[-1].gateway='10.1.2.3'
uci add network route
uci set network.@route[-1].interface='lan'
uci set network.@route[-1].target='10.1.4.0'
uci set network.@route[-1].netmask='255.255.255.0'
uci set network.@route[-1].gateway='10.1.1.2'
uci commit network
/etc/init.d/network restart
```
Router 2:
```cli
uci add network route
uci set network.@route[-1].interface='lan2'
uci set network.@route[-1].target='10.1.4.0'
uci set network.@route[-1].netmask='255.255.255.0'
uci set network.@route[-1].gateway='10.1.3.3'
uci add network route
uci set network.@route[-1].interface='lan'
uci set network.@route[-1].target='10.1.1.0'
uci set network.@route[-1].netmask='255.255.255.0'
uci set network.@route[-1].gateway='10.1.2.2'
uci commit network
/etc/init.d/network restart
```
Router 3:
```cli
uci add network route
uci set network.@route[-1].interface='lan2'
uci set network.@route[-1].target='10.1.1.0'
uci set network.@route[-1].netmask='255.255.255.0'
uci set network.@route[-1].gateway='10.1.4.3'
uci add network route
uci set network.@route[-1].interface='lan'
uci set network.@route[-1].target='10.1.2.0'
uci set network.@route[-1].netmask='255.255.255.0'
uci set network.@route[-1].gateway='10.1.3.2'
uci commit network
/etc/init.d/network restart
```
Router 4:
```cli
uci add network route
uci set network.@route[-1].interface='lan2'
uci set network.@route[-1].target='10.1.2.0'
uci set network.@route[-1].netmask='255.255.255.0'
uci set network.@route[-1].gateway='10.1.1.3'
uci add network route
uci set network.@route[-1].interface='lan'
uci set network.@route[-1].target='10.1.3.0'
uci set network.@route[-1].netmask='255.255.255.0'
uci set network.@route[-1].gateway='10.1.4.2'
uci commit network
/etc/init.d/network restart
```
Controle op elke router met `ip route` en `uci show network | grep route` (om dubbele routes te zien).

### Exercise 7: RIP en OSPF

| Router | RIP-netwerken | OSPF router-id | OSPF-netwerken (area 0) |
|---|---|---|---|
| 1 | `10.1.1.0/24`, `10.1.2.0/24` | `10.1.1.3` | `10.1.1.0/24`, `10.1.2.0/24` |
| 2 | `10.1.2.0/24`, `10.1.3.0/24` | `10.1.2.3` | `10.1.2.0/24`, `10.1.3.0/24` |
| 3 | `10.1.3.0/24`, `10.1.4.0/24` | `10.1.3.3` | `10.1.3.0/24`, `10.1.4.0/24` |
| 4 | `10.1.4.0/24`, `10.1.1.0/24` | `10.1.4.3` | `10.1.4.0/24`, `10.1.1.0/24` |
