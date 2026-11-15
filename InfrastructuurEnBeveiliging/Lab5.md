![logo](https://eliasdh.com/assets/media/images/logo-github.png)
# Lab 5

Uitvoeren op: `pc` = laptop/host, `router` = Asus (OpenWrt, via SSH of LuCI).

Notatie: `x` = groepsnummer (1 tot 4). `x+1` en `x-1` rekenen modulo 4 (dus 4+1 = 1 en 1-1 = 4). Het netwerk is dat van Lab 2: switch `10.1.x.1`, router x heeft LAN1 `10.1.x.3` (`br-lan`) en LAN2 `10.1.(x+1).2` (`lan2`), alles `/24`. De `.10`-host gebruikt `10.1.x.2` (router x-1) als gateway, de `.11`-host `10.1.x.3` (router x).

### Onze waarden (groep 2, router 2)

| Toestel | Waarde |
|---|---|
| Router 2 (R2) | LAN1 `10.1.2.3/24` op `br-lan`, LAN2 `10.1.3.2/24` op `lan2` |
| Host `.10` / `.11` | `10.1.2.10` (gateway `10.1.2.2` = R1) / `10.1.2.11` (gateway `10.1.2.3` = R2) |
| Statische routes R2 (uit Lab 2) | `10.1.4.0/24` via `10.1.3.3`, `10.1.1.0/24` via `10.1.2.2` |
| Regel Exercise 1 op R2 | subnet `10.1.3.0/24`: blokkeer `10.1.3.10` naar `10.1.3.2` |
| Regel Exercise 2 op R2 | `Block_SSH_11`: `10.1.2.11` naar `10.1.2.3`, TCP 22 |
| Exercise 3 op R2 | student A = `10.1.2.11`, student B = `10.1.3.10` (beide hebben R2 als gateway) |
| Exercise 4 | ons subnet `10.1.2.0/24` is Finance |

In het algemeen geldt in deze ring: router n kent `10.1.(n+2).0/24` via router n+1 en `10.1.(n-1).0/24` via router n-1. Met OSPF krijg je dezelfde routes (dat zijn de kortste paden). Die routes zijn belangrijk in Exercise 4.

Alle regels kunnen in LuCI (Network, Firewall, Traffic Rules, Add, daarna Save & Apply) of met UCI op de router. Na `uci commit firewall` laad je de firewall opnieuw met `/etc/init.d/firewall reload`.

---

## Voorbereiding en uitgangssituatie

### Firewall aan en de configuratie van Lab 2 terug
```cli
ssh root@10.1.2.3                                        # pc
/etc/init.d/firewall enable                              # router (ook na een herstart aan)
/etc/init.d/firewall start                               # router
uci show firewall                                        # router (zones, forwardings en regels)
```
Zet de router op zoals in Lab 2: `br-lan` met `10.1.x.3/24`, `lan2` uit de bridge met een eigen interface `lan2` en `10.1.(x+1).2/24`, en de statische routes (of OSPF). De hosts krijgen `/24` en de gateway uit de tabel hierboven.

---

## Exercise 1: Initial connectivity and basic filtering

### What steps did you take to regain full connectivity? Were there any issues you encountered?
1. De opstelling van Lab 2 opnieuw gebouwd: adressen, `lan2` uit de bridge, statische routes naar de twee netwerken waar de router niet aan hangt.
2. De firewall aangezet (`/etc/init.d/firewall enable` en `start`).
3. Het probleem: de interface `lan2` zat in geen enkele firewall-zone. Verkeer dat via LAN2 binnenkomt of buitengaat valt dan terug op de globale policies van de firewall (input en forward `REJECT`). Pings naar en via het LAN2-netwerk faalden, en LuCI en SSH op `10.1.(x+1).2` werden geweigerd.
4. Oplossing: `lan2` toegevoegd aan de zone `lan` (Network, Firewall, Zones, lan, Edit, Covered networks: `lan` en `lan2`). Daarna is er weer volledige connectiviteit, want binnen de zone `lan` staan INPUT, OUTPUT en FORWARD op `ACCEPT`.
```cli
uci add_list firewall.@zone[0].network='lan2'            # router (zone[0] is lan in de standaardconfiguratie)
uci commit firewall                                      # router
/etc/init.d/firewall reload                              # router
```
Controle vanaf de pc: `fping -f ~/Documents/ips.txt` met alle adressen.

### A host sends a ping to one of the OpenWrt router's own IP addresses, for example, 10.1.1.10 → 10.1.1.2. Is this packet going through the router, or is the router itself the final destination? What rules would apply to this packet?
De router zelf is de eindbestemming (`10.1.1.2` is LAN2 van R4). Het is dus INPUT-verkeer. Eerst wordt gekeken of het pakket bij een bestaande verbinding hoort, dan de regels met bestemmingszone "Device (input)" voor de zone `lan` (van boven naar onder), en als geen regel matcht de INPUT-policy van de zone `lan` (`ACCEPT`). Het antwoord van de router is OUTPUT-verkeer (policy `ACCEPT`).

### A host sends a ping to a host in another subnet, for example, 10.1.1.10 → 10.1.3.10. Is this packet going through the router? What rules apply?
Ja, het bestemmings-IP is een andere host: de routers sturen het pakket door, dus FORWARD. Het gateway-adres `10.1.1.2` staat enkel als bestemmings-MAC in het frame. Het request gaat via R4 (gateway van `10.1.1.10`) naar R3 (R4 kent `10.1.3.0/24` via `10.1.4.2`). Op elke router gelden de forward-regels (bestemmingszone een zone of "Any zone") en, als geen regel matcht, de Intra zone forward-policy van `lan` (`ACCEPT`), want LAN1 en LAN2 zitten in dezelfde zone. Het antwoord van `10.1.3.10` gaat via zijn eigen gateway `10.1.3.2` (R2) en R1 terug: een andere weg dan het request.

### Where are all the firewall settings contained?
In `/etc/config/firewall` (UCI), in LuCI onder Network, Firewall. Daar staan de defaults (globale policies), de zones met hun interfaces en policies, de forwardings tussen zones, de traffic rules en de port forwards. De service `/etc/init.d/firewall` (fw4) zet die configuratie om naar nftables-regels in de tabel `inet fw4` in de kernel.

### 3.3 How should the firewall rule be configured? Specify the required fields and their values.

| Field | Value |
|---|---|
| Protocol | Any (niet de standaard TCP+UDP, anders blijft ping (ICMP) werken) |
| Source zone | `lan` |
| Source address | `10.1.x.10` |
| Destination zone | Device (input) |
| Destination address | `10.1.x.2` |
| Action | reject |

De regel komt op de router die `10.1.x.2` bezit: subnet 1 op R4, subnet 2 op R1, subnet 3 op R2, subnet 4 op R3. Wij (R2) zetten de regel voor subnet 3:
```cli
uci add firewall rule                                    # router
uci set firewall.@rule[-1].name='Block_10_to_GW'         # router
uci set firewall.@rule[-1].src='lan'                     # router (geen dest = Device (input))
uci set firewall.@rule[-1].src_ip='10.1.3.10'            # router
uci set firewall.@rule[-1].dest_ip='10.1.3.2'            # router
uci set firewall.@rule[-1].proto='all'                   # router
uci set firewall.@rule[-1].target='REJECT'               # router
uci commit firewall                                      # router
/etc/init.d/firewall reload                              # router
```

### After saving the rule, let the .10 host ping 10.1.x.2 and open LuCI at http://10.1.x.2. What happens, and what message do you get?
Beide falen meteen. De ping geeft `Reply from 10.1.x.2: Destination port unreachable` (de router stuurt een ICMP-fout terug), de browser toont meteen `ERR_CONNECTION_REFUSED` ("10.1.x.2 heeft de verbinding geweigerd"), want op TCP antwoordt REJECT met een reset.

### How does the result for the .10 host differ between REJECT and DROP? Which action would you choose inside your LAN, and which on the WAN side of a router?
Met DROP gooit de router het pakket stil weg: de ping geeft `Request timed out` en de browser blijft laden tot `ERR_CONNECTION_TIMED_OUT`. Met REJECT komt er meteen een fout terug. In het LAN kies je REJECT: eigen gebruikers krijgen snel een duidelijke fout en troubleshooten is makkelijker. Aan de WAN-kant kies je DROP: een aanvaller krijgt geen informatie (de poort lijkt niet te bestaan), poortscans worden traag en de router stuurt geen antwoorden naar vervalste bronadressen.

### What happens when you try to reach other subnets from the .10 host?
Dat werkt. Pakketten naar een ander subnet hebben als bestemmings-IP de andere host, niet `10.1.x.2`. Ze zijn FORWARD-verkeer op de router en de regel geldt enkel voor INPUT naar `10.1.x.2`. De router blijft dus gewoon de gateway van de `.10`-host (ook ARP voor de gateway werkt, want ARP wordt door deze IP-firewall niet gefilterd).

### Can the .10 host still ping other hosts in the same subnet? Why?
Ja. Verkeer binnen hetzelfde subnet gaat enkel via de switch (Layer 2) en komt nooit bij de router of zijn firewall.

### Can the .11 host still reach the router via that interface? Why?
Ja. Het bronadres `10.1.x.11` matcht de regel niet, dus geen enkele regel matcht en de INPUT-policy van zone `lan` (`ACCEPT`) beslist.

### Explain, from a firewall point of view: what happens when the .11 packet arrives and what happens when the .10 packet arrives?
Beide pakketten komen binnen op de interface van zone `lan`, met de router als bestemming: de input-keten van zone `lan`. Het zijn nieuwe verbindingen (niet established), dus de regels worden van boven naar onder overlopen.
- `.11`: geen regel matcht (bronadres is niet `10.1.x.10`), dus de zone-policy INPUT `ACCEPT`: het pakket wordt toegelaten en de router antwoordt.
- `.10`: de regel matcht (bron `10.1.x.10`, bestemming `10.1.x.2`, elk protocol) en de actie wordt meteen uitgevoerd: REJECT stuurt een ICMP- of TCP-fout terug (DROP: stil weggooien). Verdere regels en de policy worden niet meer bekeken.

### Why would this rule be easy for the host to circumvent?
De regel kijkt enkel naar het bronadres, en dat kiest de host zelf. Met een ander IP-adres in hetzelfde subnet (bijvoorbeeld `10.1.x.12`) matcht de regel niet meer. Er is geen authenticatie. Bovendien beschermt de regel enkel het adres `10.1.x.2`: de `.10`-host bereikt dezelfde router (LuCI, SSH) nog via zijn andere adres `10.1.(x-1).3`, want ook dat pakket gaat naar de router en heeft een ander bestemmingsadres.

---

## Exercise 2: Service-based blocking

### 4.1 How should the firewall rule be configured? Specify the required fields and their values.

| Field | Value |
|---|---|
| Protocol | TCP |
| Source zone | `lan` |
| Source address | `10.1.x.11` (wij: `10.1.2.11`) |
| Source port | leeg (any): de client gebruikt een willekeurige hoge poort |
| Destination zone | Device (input) |
| Destination address | `10.1.x.3` (wij: `10.1.2.3`) |
| Destination port | `22` |
| Action | reject |

```cli
uci add firewall rule                                    # router
uci set firewall.@rule[-1].name='Block_SSH_11'           # router
uci set firewall.@rule[-1].src='lan'                     # router
uci set firewall.@rule[-1].src_ip='10.1.2.11'            # router
uci set firewall.@rule[-1].dest_ip='10.1.2.3'            # router
uci set firewall.@rule[-1].proto='tcp'                   # router
uci set firewall.@rule[-1].dest_port='22'                # router
uci set firewall.@rule[-1].target='REJECT'               # router
uci commit firewall                                      # router
/etc/init.d/firewall reload                              # router
```

### Why is this a service-specific filter? How does the firewall recognize "SSH"?
De regel matcht niet al het verkeer van een host, maar één dienst: TCP met bestemmingspoort 22. De firewall herkent SSH enkel aan het protocol en het poortnummer (Layer 4), niet aan de inhoud van de pakketten. Een SSH-server op een andere poort wordt door deze regel niet tegengehouden, en een andere dienst op poort 22 wel.

### After applying the filter, try to open an SSH connection to LAN1 of the router from the .11 host. What does the SSH client report?
`ssh: connect to host 10.1.2.3 port 22: Connection refused`, meteen, want REJECT antwoordt op de SYN met een TCP-reset.

### What happens if the .11 host tries to open an SSH connection to the LAN2 interface of the router?
Dat werkt. De regel matcht enkel het bestemmingsadres `10.1.x.3`. Een pakket naar `10.1.(x+1).2` gaat naar dezelfde router (INPUT) maar heeft een ander bestemmingsadres, dus geen regel matcht en de INPUT-policy `ACCEPT` beslist.

### Can the .11 host still ping the router? Why?
Ja. Ping is ICMP, de regel matcht enkel TCP met poort 22.

### Can the .10 host still access the router via LAN 1 interface?
Ja, zowel met SSH als met LuCI: het bronadres `10.1.x.10` matcht niet.

### Try to access your neighbor's router on the LAN1 interface with SSH. Why is this (not) possible?
Het is mogelijk. SSH van onze `.11` naar `10.1.(x+1).3` gaat door onze router (zijn gateway `10.1.x.3`) als FORWARD-verkeer: de bestemming is niet onze router. Onze regel is een input-regel en matcht dat niet. Op de router van de buur is het INPUT, maar diens regel blokkeert enkel zijn eigen `.11`-host (`10.1.(x+1).11`), niet de onze.

### Which services on LAN1 can the .11 host still use now (e.g. SSH, LuCI, ping)?
Zonder bestemmingspoort matcht de regel alle TCP van `.11` naar `10.1.x.3`: SSH (22) en LuCI (HTTP 80 en HTTPS 443) zijn geblokkeerd. Ping (ICMP) werkt nog, want het protocol staat op TCP. Daarom doe je deze wijziging vanaf de `.10`-host. Zet daarna poort 22 terug.

### 4.2 What do you observe, and what does this tell you about how the firewall evaluates its rules?
Met `Allow_SSH_11` onderaan wordt SSH nog steeds geweigerd. Na het slepen van `Allow_SSH_11` boven `Block_SSH_11` werkt SSH. De firewall overloopt de regels van boven naar onder en de eerste regel die matcht beslist (first match wins). De regels eronder worden niet meer bekeken. Een uitzondering (ACCEPT) moet daarom boven de algemene regel (REJECT) staan.

### The open session keeps working, but the new connection is refused. Explain.
De firewall is stateful. De open sessie is een bekende verbinding in de connection tracking (`established`). Zulke pakketten worden bovenaan de ketting meteen toegelaten, nog voor de regels bekeken worden. Een nieuwe sessie begint met een SYN (state `new`), gaat wel door de regels en matcht nu eerst `Block_SSH_11`: geweigerd.

### What happens to a packet that matches none of the rules, and where is this behavior defined?
Dan beslist de policy van de zone: INPUT, OUTPUT of (Intra zone) FORWARD van de zone waar het pakket binnenkomt. Dat staat in de zone-instellingen (Network, Firewall, General Settings, Zones, in `/etc/config/firewall` de opties `input`, `output` en `forward` van de `zone`). Verkeer tussen twee zones zonder forwarding, of van een interface zonder zone, valt terug op de globale defaults (`config defaults`). Er is dus geen zichtbare "permit any" of "deny all" onderaan de lijst.

Verwijder `Allow_SSH_11` daarna.

### 4.3 What commands can you use on the router to display the active firewall ruleset, and to check whether your rule is actually being matched?
```cli
fw4 print                                       # router (de nftables-regels die fw4 uit /etc/config/firewall maakt)
nft list ruleset                                # router (de actieve regels in de kernel, met tellers)
nft list chain inet fw4 input_lan               # router (enkel de input-regels van zone lan)
nft list ruleset | grep -i block_ssh            # router (enkel onze regel)
```
Op een oudere OpenWrt met fw3 (iptables) is dat `iptables -L -v -n --line-numbers`.

### Find Block_SSH_11 in the output of the last command. How do you recognize it? Try SSH from .11 a few times and run the command again. What changes?
Aan het commentaar met de naam van de regel en aan de match, in de ketting `input_lan`, ongeveer zo:
```
ip saddr 10.1.2.11 ip daddr 10.1.2.3 tcp dport 22 counter packets 0 bytes 0 jump reject_from_lan comment "!fw4: Block_SSH_11"
```
Na een paar SSH-pogingen stijgt de teller (`counter packets` en `bytes`): elke poging is één SYN-pakket dat de regel matcht. Zo zie je dat de regel echt gebruikt wordt. Pings of SSH van `.10` laten de teller ongemoeid.

### 4.4 What changes, and why?
SSH van `.11` naar `10.1.x.3` werkt weer. Met "Any zone (forward)" wordt de regel een forward-regel: ze geldt enkel voor verkeer dat door de router gaat. SSH naar de router zelf is INPUT-verkeer, en een doorgestuurd pakket heeft nooit `10.1.x.3` (een adres van de router zelf) als bestemming. De regel matcht dus niets meer.

### What else must you change to block SSH from the .11 host to the router on your right (10.1.(x+1).3)? Why does this only work because that traffic passes through your router?
Het bestemmingsadres aanpassen naar `10.1.(x+1).3` (wij: `10.1.3.3`) en de bestemmingszone op forward laten. Dat pakket heeft onze router als gateway (`10.1.x.3`) en gaat via LAN2 naar het subnet van de buur, dus het passeert de forward-ketting van onze router. Een firewall kan enkel verkeer filteren dat door hem gaat: een pakket dat langs een andere router naar `10.1.(x+1).3` zou gaan, ziet onze router nooit.

---

## Exercise 3: Default zone policy versus specific firewall rules

Schakel eerst de regels van Exercise 1 en 2 uit (of verwijder ze) en controleer de volledige connectiviteit. Per router: student A = `10.1.x.11`, student B = `10.1.(x+1).10`. Beide gebruiken router x als gateway, dus al hun verkeer gaat door die ene router. Wij: A = `10.1.2.11`, B = `10.1.3.10`, router R2.

### 5.1 Zone labo
Network, Firewall, Zones, Add: name `labo`, Input/Output/Intra zone forward `accept`, Covered networks `lan` en `lan2` (LuCI haalt ze uit de zone `lan`). Met UCI:
```cli
uci del_list firewall.@zone[0].network='lan'             # router
uci del_list firewall.@zone[0].network='lan2'            # router
uci add firewall zone                                    # router
uci set firewall.@zone[-1].name='labo'                   # router
uci set firewall.@zone[-1].input='ACCEPT'                # router
uci set firewall.@zone[-1].output='ACCEPT'               # router
uci set firewall.@zone[-1].forward='ACCEPT'              # router
uci add_list firewall.@zone[-1].network='lan'            # router
uci add_list firewall.@zone[-1].network='lan2'           # router
uci commit firewall                                      # router
/etc/init.d/firewall reload                              # router
```

### 5.1.1 Start a temporary web server
Op de pc van student B (Windows PowerShell):
```cli
mkdir firewall-test                                                           # pc (student B)
cd firewall-test                                                              # pc (student B)
Set-Content -Path index.html -Value "Hello from Student B" -Encoding ascii    # pc (student B)
python -m http.server 8000                                                    # pc (student B)
```
Eerst lokaal testen op `http://localhost:8000`. Werkt dat maar komt student A er niet aan, kijk dan naar de Windows Firewall (Python toelaten op privé/openbaar netwerk). Student A opent `http://10.1.3.10:8000` en ziet `Hello from Student B`.

### Student A can open the page, but your firewall contains no rule that allows this traffic. What decides that it is allowed?
De zone-policy. A en B zitten in twee netwerken (LAN1 en LAN2) van dezelfde zone `labo`, dus het verkeer gaat door de router als FORWARD binnen de zone. Geen enkele regel matcht, dus beslist de Intra zone forward-policy van `labo`: `ACCEPT`. Dat is een denylist: alles mag, tenzij een regel het verbiedt.

### 5.1.2 What rule did you set?

| Field | Value |
|---|---|
| Protocol | TCP |
| Source zone | `labo` |
| Source address | `10.1.x.11` (A, wij: `10.1.2.11`) |
| Source port | leeg (any) |
| Destination zone | `labo` |
| Destination address | `10.1.(x+1).10` (B, wij: `10.1.3.10`) |
| Destination port | `8000` |
| Action | reject |

```cli
uci add firewall rule                                    # router
uci set firewall.@rule[-1].name='Reject_A_to_B_HTTP'     # router
uci set firewall.@rule[-1].src='labo'                    # router
uci set firewall.@rule[-1].dest='labo'                   # router (een dest = forward-regel)
uci set firewall.@rule[-1].src_ip='10.1.2.11'            # router
uci set firewall.@rule[-1].dest_ip='10.1.3.10'           # router
uci set firewall.@rule[-1].proto='tcp'                   # router
uci set firewall.@rule[-1].dest_port='8000'              # router
uci set firewall.@rule[-1].target='REJECT'               # router
uci commit firewall                                      # router
/etc/init.d/firewall reload                              # router
```

### When you refresh the browser page, what happens then?
De pagina laadt niet meer: meteen `ERR_CONNECTION_REFUSED` (de router antwoordt met een TCP-reset). Gebruik Ctrl+F5, anders toont de browser misschien nog de pagina uit de cache.

### Why does this rule block the webpage but not necessarily all other traffic?
De regel matcht enkel TCP van A naar B met bestemmingspoort 8000. Ping (ICMP), andere poorten, verkeer van B naar A en verkeer van andere hosts matchen niet en vallen terug op de zone-policy `ACCEPT`.

### Name two ways in which Student A could still reach the content of Student B's web server, despite the REJECT rule.
1. Een andere poort: B start de server op een andere poort (`python -m http.server 8080`), of A gebruikt een andere dienst om het bestand op te halen. De regel kent enkel poort 8000.
2. Een ander bronadres: A geeft zichzelf een ander IP in zijn subnet (bijvoorbeeld `10.1.2.12`), of A haalt de pagina op via een andere host (de `.10`-host van zijn eigen subnet, of een SSH-tunnel/proxy via een host die wel mag). De regel kent enkel het adres `10.1.x.11`.

### 5.2 Which traffic does this setting affect?
Al het verkeer dat de router doorstuurt tussen de netwerken van de zone `labo`, dus tussen LAN1 en LAN2, in beide richtingen. Ook het verkeer van andere groepen dat via onze router passeert (daarom de andere groepen verwittigen). Verkeer naar de router zelf (INPUT: LuCI, SSH, ping naar de router), verkeer van de router (OUTPUT) en verkeer binnen één subnet (switch) zijn niet getroffen. Bestaande verbindingen blijven werken.

### Does the webpage still open? Does the ping work? Explain.
Nee en nee. De regel `Reject_A_to_B_HTTP` staat uit, er is geen andere regel die matcht, dus beslist de policy Intra zone forward `REJECT`. De browser geeft `ERR_CONNECTION_REFUSED`, de ping `Destination port unreachable`.

### What rule did you add?

| Field | Value |
|---|---|
| Protocol | TCP |
| Source zone | `labo` |
| Source address | `10.1.x.11` (A) |
| Source port | leeg (any) |
| Destination zone | `labo` |
| Destination address | `10.1.(x+1).10` (B) |
| Destination port | `8000` |
| Action | accept |

Met UCI zoals hierboven, met `name='Allow_A_to_B_HTTP'` en `target='ACCEPT'`.

### Your rule only allows traffic from Student A to Student B. The replies from Student B to Student A also pass through the router, yet they are not blocked. Why?
De firewall is stateful. Het eerste pakket (SYN van A) wordt door de regel toegelaten en de verbinding komt in de connection tracking. De antwoorden van B horen bij die verbinding (`established`) en worden bovenaan de ketting toegelaten, nog voor de regels en de zone-policy. Dat werkt omdat het antwoord langs dezelfde router terugkomt (B heeft R2 als gateway). Een nieuwe verbinding van B naar A blijft wel geblokkeerd.

### What rule would you add so that Student A can also ping Student B?
`Allow_A_to_B_ICMP`: protocol ICMP (ICMP type `echo-request`), source zone `labo`, source `10.1.x.11`, destination zone `labo`, destination `10.1.(x+1).10`, action accept. Het `echo-reply` is weer een established verbinding.
```cli
uci add firewall rule                                    # router
uci set firewall.@rule[-1].name='Allow_A_to_B_ICMP'      # router
uci set firewall.@rule[-1].src='labo'                    # router
uci set firewall.@rule[-1].dest='labo'                   # router
uci set firewall.@rule[-1].src_ip='10.1.2.11'            # router
uci set firewall.@rule[-1].dest_ip='10.1.3.10'           # router
uci set firewall.@rule[-1].proto='icmp'                  # router
uci set firewall.@rule[-1].icmp_type='echo-request'      # router
uci set firewall.@rule[-1].target='ACCEPT'               # router
uci commit firewall                                      # router
/etc/init.d/firewall reload                              # router
```

### 5.3 Which model is safer when you forget a rule? In which model will the new service be reachable by default? Which model is safer in a real network, and why?
In het denylist-model is de nieuwe dienst meteen bereikbaar: alles mag tenzij een regel het verbiedt, en niemand heeft een regel toegevoegd (fail open). In het allowlist-model blijft de dienst dicht tot iemand een accept-regel maakt (fail closed). De allowlist is veiliger in een echt netwerk: ze volgt het principe van least privilege, een vergeten regel of een onbekende dienst (een vergeten testserver, malware die een poort opent) is niet bereikbaar, en het aanvalsoppervlak blijft klein.

### Why is the allowlist mode more work?
Je moet vooraf elke nodige verkeersstroom kennen en beschrijven: welke host, welk protocol, welke poort, ook de "onzichtbare" zoals DNS, DHCP, ICMP en NTP. Bij elke nieuwe dienst of wijziging moet de regelset mee aangepast worden. Vergeet je iets, dan breekt er iets en moet je zoeken welke regel ontbreekt (de tellers van `nft list ruleset` en de logs helpen daarbij).

### Which model would you use for the guest network of a company, and why? Can you think of a situation in which a denylist is a reasonable choice?
Voor een gastennetwerk een allowlist: gasten zijn onbekende, onbetrouwbare toestellen. Ze mogen enkel wat ze nodig hebben (DHCP, DNS, internet via de WAN) en alles naar de interne netwerken blijft dicht. Een denylist is redelijk waar beschikbaarheid en eenvoud belangrijker zijn dan strikte controle en de gebruikers vertrouwd zijn: een thuisnetwerk, een lab- of testnetwerk zoals hier, of uitgaand internetverkeer van werknemers waar je enkel gekende slechte bestemmingen of een aanvallend IP-adres blokkeert.

### 5.4 Cleanup
Zone `labo` verwijderen, `lan` en `lan2` terug in de zone `lan`, de regels `Reject_A_to_B_HTTP`, `Allow_A_to_B_HTTP` (en `Allow_A_to_B_ICMP`) verwijderen. De webserver stoppen met `Ctrl + C`.

---

## Exercise 4: Company network security

NetCorp: `10.1.1.0/24` IT, `10.1.2.0/24` Finance, `10.1.3.0/24` HR, `10.1.4.0/24` Guest. Elk subnet hangt aan twee routers, en de twee hosts gebruiken elk een andere router als gateway:

| Subnet | Routers erop | Gateway `.10` | Gateway `.11` |
|---|---|---|---|
| IT `10.1.1.0/24` | R1 (LAN1), R4 (LAN2) | R4 (`10.1.1.2`) | R1 (`10.1.1.3`) |
| Finance `10.1.2.0/24` | R2 (LAN1), R1 (LAN2) | R1 (`10.1.2.2`) | R2 (`10.1.2.3`) |
| HR `10.1.3.0/24` | R3 (LAN1), R2 (LAN2) | R2 (`10.1.3.2`) | R3 (`10.1.3.3`) |
| Guest `10.1.4.0/24` | R4 (LAN1), R3 (LAN2) | R3 (`10.1.4.2`) | R4 (`10.1.4.3`) |

Twee dingen bepalen waar een regel moet staan:
1. Een router filtert enkel verkeer dat door hem gaat. Alle verkeer van een afdeling vertrekt via de gateway van `.10` of van `.11`, en volgt daarna de routes (router n: `10.1.(n+2).0/24` via router n+1, `10.1.(n-1).0/24` via router n-1).
2. De firewall is stateful per router. Het antwoord kan een andere weg terug nemen dan het request (asymmetrische routing). Een router die het request nooit zag, beoordeelt het antwoord als een nieuw pakket. Een blokkeerregel met protocol Any op zo'n router blokkeert dan ook het antwoord op verkeer dat wel mag. Voorbeeld: IT `10.1.1.10` pingt Finance `10.1.2.11`: het request gaat via R4 en R1, het antwoord via R2 (de gateway van `10.1.2.11`) en R1. Staat "Finance naar IT" ook op R2, dan stopt R2 dat antwoord.

### Before you configure anything, fill in the table: for each policy below, which routers must carry the rule, and why?

| Policy | Routers that must carry the rule | Why |
|---|---|---|
| Finance → IT blocked | R1 | R1 hangt aan Finance en aan IT. `10.1.2.10` heeft R1 als gateway, `10.1.2.11` gaat via R2, die IT via R1 bereikt: al het verkeer van Finance naar IT passeert R1. Ook alle verkeer van IT naar Finance en de antwoorden gaan door R1, dus R1 ziet beide richtingen en de stateful firewall laat de antwoorden van Finance op verkeer van IT door. Op R2 (de gateway van `.11`) zou de regel de antwoorden aan IT blokkeren. |
| HR → IT blocked | R2 en R3 | HR en IT liggen niet naast elkaar. `10.1.3.10` gaat via R2 (en R1), `10.1.3.11` via R3 (en R4): enkel de eerste routers (de gateways) zien al het verkeer van HR. De antwoorden op pings van IT naar HR gaan ook via R2 en R3 terug zonder dat die het request zagen (`10.1.1.10` naar `10.1.3.10`: request R4 en R3, antwoord R2 en R1). Daarom matcht deze regel enkel een nieuwe ping (ICMP `echo-request`), niet de antwoorden. SSH van HR wordt door de SSH-regels tegengehouden. |
| Guest → IT, Finance, HR blocked | R4 (naar IT), R3 (naar HR), R3 en R4 (naar Finance) | R4 hangt aan Guest en IT, R3 aan Guest en HR: alle verkeer tussen die paren gaat in beide richtingen door die router (zoals R1 voor Finance). Finance ligt niet naast Guest: daar gebruiken we de gateways van beide gasthosts (R3 en R4). Een regel naar alle drie de netwerken op R3 en R4 zou de antwoorden blokkeren op pings van IT en HR naar Guest, die wel mogen. |
| Nobody except IT may use SSH to a router | R1, R2, R3 en R4 | SSH naar een adres van de router is INPUT-verkeer op die router zelf. Elke router is vanuit elk subnet bereikbaar (ook op zijn tweede adres), dus elke router moet zichzelf beschermen: een accept-regel voor IT boven een reject-regel voor TCP 22. |

### List the rules you configured and explain your choice.
De regelnamen zijn op elke router dezelfde. Alle regels hebben source zone `lan`. Input-regels hebben destination zone Device (input), forward-regels Any zone. De regels staan in deze volgorde, ACCEPT boven de REJECT die het een uitzondering op maakt.

| Router(s) | Name | Protocol | Source address | Destination zone | Destination address | Port | Action |
|---|---|---|---|---|---|---|---|
| R1, R2, R3, R4 | `Allow_SSH_IT` | TCP | `10.1.1.0/24` | Device (input) | (leeg) | 22 | accept |
| R1, R2, R3, R4 | `Block_SSH_Routers` | TCP | (leeg) | Device (input) | (leeg) | 22 | reject |
| R1 | `Fin_to_IT` | Any | `10.1.2.0/24` | Any zone | `10.1.1.0/24` | | reject |
| R2, R3 | `HR_to_IT` | ICMP, type `echo-request` | `10.1.3.0/24` | Any zone | `10.1.1.0/24` | | reject |
| R2, R3 | `HR_no_SSH` | TCP | `10.1.3.0/24` | Any zone | (leeg) | 22 | reject |
| R4 | `Guest_to_IT` | Any | `10.1.4.0/24` | Any zone | `10.1.1.0/24` | | reject |
| R3 | `Guest_to_HR` | Any | `10.1.4.0/24` | Any zone | `10.1.3.0/24` | | reject |
| R3, R4 | `Guest_to_Fin` | Any | `10.1.4.0/24` | Any zone | `10.1.2.0/24` | | reject |
| R3 | `Guest_to_Router` | Any | `10.1.4.0/24` | Device (input) | `10.1.3.3` | | reject |
| R4 | `Guest_to_Router` | Any | `10.1.4.0/24` | Device (input) | `10.1.1.2` | | reject |

Uitleg per policy:
- Policy 1 (IT volledige toegang): geen enkele regel blokkeert verkeer met bron `10.1.1.0/24`, en alle blokkeerregels staan zo dat de antwoorden aan IT niet gestopt worden (zie de tabel hierboven).
- Policy 2 (IT SSH naar de routers): `Allow_SSH_IT` staat boven `Block_SSH_Routers` (first match wins).
- Policy 3 en 7 (Finance en HR naar IT): `Fin_to_IT` op R1, `HR_to_IT` op R2 en R3.
- Policy 4, 6 en 11 (SSH): `Block_SSH_Routers` stopt SSH naar elke router voor iedereen behalve IT. `HR_no_SSH` stopt SSH van HR naar hosts in andere subnetten (forward). Gasten bereiken geen enkele host buiten hun subnet, dus voor hen volstaat `Block_SSH_Routers`. SSH binnen hetzelfde subnet gaat enkel via de switch, en dat kan geen router tegenhouden.
- Policy 5, 8 en 9 (Finance naar HR, HR naar Finance en HR naar Guest): geen regel, de zone-policy `ACCEPT` laat het toe.
- Policy 10 (Guest naar IT, Finance en HR): `Guest_to_IT`, `Guest_to_HR` en `Guest_to_Fin`.
- Policy 12 (Guest enkel het eigen subnet): de forward-regels hierboven, en `Guest_to_Router` voor de adressen van R3 en R4 in een ander subnet. Een ping van een gast naar `10.1.3.3` is INPUT op R3 (zijn eigen gateway) en geen FORWARD, dus de forward-regels houden die niet tegen. De gateway-adressen in het eigen subnet (`10.1.4.2`, `10.1.4.3`) blijven bereikbaar.

Voorbeeld met UCI (een forward-regel en de SSH-regels):
```cli
uci add firewall rule                                    # router (R1, R2, R3 en R4)
uci set firewall.@rule[-1].name='Allow_SSH_IT'           # router
uci set firewall.@rule[-1].src='lan'                     # router
uci set firewall.@rule[-1].src_ip='10.1.1.0/24'          # router
uci set firewall.@rule[-1].proto='tcp'                   # router
uci set firewall.@rule[-1].dest_port='22'                # router
uci set firewall.@rule[-1].target='ACCEPT'               # router
uci add firewall rule                                    # router (R1, R2, R3 en R4, na Allow_SSH_IT)
uci set firewall.@rule[-1].name='Block_SSH_Routers'      # router
uci set firewall.@rule[-1].src='lan'                     # router
uci set firewall.@rule[-1].proto='tcp'                   # router
uci set firewall.@rule[-1].dest_port='22'                # router
uci set firewall.@rule[-1].target='REJECT'               # router
uci add firewall rule                                    # router (R1)
uci set firewall.@rule[-1].name='Fin_to_IT'              # router
uci set firewall.@rule[-1].src='lan'                     # router
uci set firewall.@rule[-1].dest='*'                      # router (Any zone = forward)
uci set firewall.@rule[-1].src_ip='10.1.2.0/24'          # router
uci set firewall.@rule[-1].dest_ip='10.1.1.0/24'         # router
uci set firewall.@rule[-1].proto='all'                   # router
uci set firewall.@rule[-1].target='REJECT'               # router
uci commit firewall                                      # router
/etc/init.d/firewall reload                              # router
```
Let op: wie `Block_SSH_Routers` toepast vanaf een pc buiten IT, verliest zelf de SSH-toegang tot die router. Configureer de SSH-regels vanaf een IT-host of via LuCI (HTTP blijft open).

### Do all tests give the expected result? If a test succeeds from one host but fails from the other host of the same department, explain why.
Met de regels hierboven geven alle tests (ping en SSH, vanaf `.10` en `.11` van elke afdeling) het verwachte resultaat. De checker van de Lab Companion voorspelt dat ook uit de regels en routes van de vier routers.

Verschillen tussen de `.10`- en de `.11`-host ontstaan omdat ze een andere gateway gebruiken, en dus andere routers:
- De regel staat enkel op de gateway van één van de twee hosts. Bijvoorbeeld `HR_to_IT` enkel op R3: `10.1.3.11` (gateway R3) wordt tegengehouden, maar `10.1.3.10` (gateway R2, daarna R1) bereikt IT nog, want zijn pakketten komen nooit langs R3.
- Het antwoord neemt een andere weg dan het request en wordt gestopt op een router die het request nooit zag. Bijvoorbeeld met "Finance naar IT" (protocol Any) op R1 en R2: IT pingt `10.1.2.10` wel (antwoord via R1, die het request zag), maar `10.1.2.11` niet (antwoord via R2, die het als nieuw pakket van Finance naar IT ziet en weigert). Daarom staat `Fin_to_IT` enkel op R1 en matcht `HR_to_IT` enkel een `echo-request`.

Beperking: `HR_to_IT` houdt enkel pings tegen (en SSH via `HR_no_SSH`), geen andere TCP- of UDP-diensten van HR naar IT. Met deze asymmetrische routing kan geen enkele router alle verkeer tussen HR en IT in beide richtingen zien. Voor een volledige blokkade moet de routing symmetrisch worden (bijvoorbeeld beide hosts van een afdeling dezelfde gateway) of moet er één centrale firewall komen waar al het verkeer tussen de afdelingen door gaat.

---

## Opruimen
Zet de routers en switches aan het einde van het labo terug op de fabrieksinstellingen (reset-knop ongeveer 10 seconden, daarna NIET uitsteken).
