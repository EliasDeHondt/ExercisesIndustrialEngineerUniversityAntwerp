![logo](https://eliasdh.com/assets/media/images/logo-github.png)
# Lab 3

Uitvoeren op: `pc` = laptop/host, `switch` = Netgear (OpenWrt, via SSH).

Notatie: `x` = groepsnummer (1 tot 4). Elke groep heeft twee switches: de access switch `10.1.x.1` en de core switch `10.1.x.5`. Hosts zijn `10.1.x.10` en `10.1.x.11`. Alle maskers zijn `/16`. In dit labo wordt geen router gebruikt.

### Onze waarden (groep 2)

| Toestel | Waarde |
|---|---|
| Access switch 2 | `10.1.2.1` (Exercise 1 en verder) |
| Core switch 2 | `10.1.2.5` (enkel Exercise 3) |
| Host `.10` / `.11` | `10.1.2.10` / `10.1.2.11`, masker `255.255.0.0`, geen gateway |
| Distributieswitch links (groep 1) | `10.1.1.4` in Figure 1, `10.1.1.5` in Figure 2 (zelfde toestel) |
| Poorten access switch 2 | p1 en p2 = hosts, p3 = rode link naar access switch 1 (p3), p4 = blauwe link naar de distributieswitch (p2) |
| Poorten core switch 2 (Figure 2) | p1 naar `1.5` (p5), p2 naar `3.5` (p2), p3 naar `4.5` (p1) |
| STP-instellingen | `stp` aan op alle switches. Bridge priority: Exercise 1 de distributieswitch `4096`. Exercise 3 core switch 2 `4096` (root) en core switch 4 `8192` (secundaire root), de rest `32767` |

De poortnummers uit de figuren komen overeen met de poorten `lan1` tot `lan8` op de switch. Controleer dat op je toestel met `brctl show`.

Figure 1 toont twee losse netwerken van elk 3 switches (groepen 1 en 2 links, groepen 3 en 4 rechts). Figure 2 voegt de core switches `2.5` en `4.5` toe en verbindt alles met elkaar.

---

## Voorbereiding en uitgangssituatie

### Zet de masker terug naar /16 en schakel de firewall uit
Na Lab 2 staat de switch op `/24`. Voor dit labo moet alles terug op `/16`, zodat alle toestellen in hetzelfde subnet zitten en er geen gateway nodig is.
```cli
ssh root@10.1.x.1                             # pc
/etc/init.d/firewall stop                     # switch (tijdelijk, niet persistent)
uci set network.lan.netmask='255.255.0.0'     # switch
uci commit network                            # switch
/etc/init.d/network restart                   # switch
```
```powershell
netsh interface ip set address name="Ethernet" static 10.1.x.10 255.255.0.0   # pc (10.1.x.11 voor de partner)
```
```cli
ssh root@10.1.x.1   # pc (opnieuw verbinden na de herstart)
```
Een switch die van fabrieksinstelling start (`192.168.1.1`) configureer je zoals in Lab 2 Exercise 1, bijvoorbeeld de core switch met `10.1.x.5`.

### Hoe schakel je STP in en stel je de bridge priority in
Op OpenWrt zit STP in de bridge `br-lan` (device-sectie in `/etc/config/network`). Standaard staat `stp` uit (`0`) en is de priority `32767`.
```cli
uci show network | grep "br-lan"           # switch (zoek de device-sectie, bv. network.@device[0])
uci set network.@device[0].stp='1'         # switch (STP aan)
uci set network.@device[0].priority='4096' # switch (enkel op de switch die root moet worden)
uci commit network                         # switch
/etc/init.d/network restart                # switch
```
Via de GUI kan dit ook: Network, Interfaces, Devices, `br-lan` configureren, tabblad Bridge settings: "Enable STP" en "Bridge priority".

Snelle, niet-persistente variant (verdwijnt bij een reboot):
```cli
echo 1 > /sys/class/net/br-lan/bridge/stp_state    # switch (STP aan)
echo 4096 > /sys/class/net/br-lan/bridge/priority  # switch (priority aanpassen zonder netwerk te herstarten)
```

Standaardwaarden van de timers op OpenWrt: `hello_time` 2 s, `max_age` 20 s, `forward_delay` 2 s (volgens de OpenWrt-documentatie, "set to at least 4 to work with non-OpenWrt switches"). Dat zijn dus niet de 802.1D-standaarden van een Cisco switch (hello 2, max age 20, forward delay 15). Daardoor is convergentie op deze toestellen veel sneller dan in de NetworkAcademy-voorbeelden.

---

## Exercise 1: Spanning tree in an access network

### Build the network
Bouw Figure 1 met de kleurcodering: rood voor host naar access switch en tussen access switches, blauw voor access naar distributieswitch. Laat één kabel los (bijvoorbeeld de rode link tussen de access switches). Zet STP aan op alle switches, controleer dat de firewall uit staat, en sluit pas daarna de laatste kabel. Zonder STP zou die kabel een loop maken die het netwerk overbelast.

Maak de verbinding met het campusnetwerk los voor je begint.

### Who can you reach?
Alles in het eigen netwerk van Figure 1, dus voor groep 2: de switches `10.1.1.1`, `10.1.2.1` en de distributieswitch, en de hosts `10.1.1.10`, `10.1.1.11`, `10.1.2.10` en `10.1.2.11`. Alle toestellen zitten in `10.1.0.0/16`, dus er is geen gateway nodig. Niet bereikbaar zijn groepen 3 en 4: die hangen aan een apart netwerk (de rechtse driehoek van Figure 1) dat nog niet met ons verbonden is.
```cli
fping -f ~/Documents/ips.txt   # pc (Ubuntu desktop, alle IP-adressen één per regel)
```
Net na het sluiten van de loop falen de eerste pings nog even: poorten zijn pas na de listening- en learning-fase (2 x `forward_delay`) aan het forwarden. Wacht even en ping opnieuw.

### Check the STP state. Can you identify the different states of the switches?
Een poort doorloopt: blocking, listening, learning en forwarding (plus disabled als de poort uit staat). Alleen forwarding poorten sturen data door. Blocking poorten ontvangen enkel BPDU's. Listening en learning zijn tijdelijke toestanden bij een wijziging: in listening neemt de poort deel aan de verkiezing maar leert nog geen MAC-adressen, in learning vult hij zijn MAC-tabel maar stuurt nog geen data door.
```cli
brctl show                 # switch (bridgenaam en poorten)
brctl showstp br-lan       # switch (per poort: state blocking/forwarding)
```
In een stabiel netwerk zie je enkel `forwarding` en `blocking`. In Figure 1 is dat precies één geblokkeerde poort per driehoek: een driehoek bevat één loop, dus één link moet geblokkeerd worden.

### Who is the root, and why?
De switch met de laagste bridge ID. Zijn alle priorities gelijk (standaard `32767`), dan beslist het laagste MAC-adres, dus de root is dan min of meer willekeurig en hangt van de hardware af (dat kan een access switch zijn). Wie de root is, lees je af in `brctl showstp br-lan` bij `designated root`. Op de root zelf is `designated root` gelijk aan `bridge id` en staat er geen `root port`. Gemeten: nog in te vullen na het labo.

### What command can you use to display detailed STP info for the bridge port (switch)?
```cli
brctl showstp br-lan   # switch
```
Bovenaan staan de gegevens van de bridge (`bridge id`, `designated root`, `root port`, `path cost`, `max age`, `hello time`, `forward delay`). Daaronder volgt een blok per poort (`lan1`, `lan2`, ...) met `port id`, `state`, `designated root`, `designated bridge`, `designated port` en `path cost`.

### What is the bridge ID of your switch?
Nog in te vullen na het labo, bijvoorbeeld `7fff.aabbccddeeff` (met de standaardpriority 32767 en het MAC-adres van de bridge). Opvragen met `brctl showstp br-lan`, regel `bridge id`.

### A bridge ID is made up of multiple parts. Which part corresponds to the priority, and which part corresponds to the MAC address?
Het deel voor de punt is de priority (2 bytes, 4 hex-cijfers, bv. `7fff` = 32767). Het deel na de punt is het MAC-adres van de switch (6 bytes, 12 hex-cijfers). In Wireshark staan in een BPDU dezelfde twee delen in het veld Bridge Identifier.

### Why does the switch with the lowest bridge ID win the root bridge election?
Dat is de afspraak in het protocol: elke switch begint met te claimen dat hij zelf de root is en vergelijkt in elke ontvangen BPDU de root-ID met de eigen kennis. De laagste waarde wint, dus na een paar BPDU-uitwisselingen kennen alle switches dezelfde root. Omdat het MAC-adres uniek is, is er altijd precies één winnaar, ook als alle priorities gelijk zijn. De priority staat vooraan, zodat een beheerder met een lagere waarde de root kan afdwingen.

### Compare the bridge ID of your own switch with the designated root shown in the STP output. Is your switch the root bridge? Explain why or why not.
Zijn `bridge id` en `designated root` identiek, dan is mijn switch de root: hij heeft het laagste ID en alle poorten zijn designated. Zijn ze verschillend, dan is een andere switch root, heeft mijn switch een `root port` (de poort met de laagste kost naar de root) en is mijn ID dus hoger dan dat van de root. Gemeten: nog in te vullen na het labo.

### Which ports are blocking, and which ports are forwarding? Draw this on the schematic.
Regels waarmee je de tekening maakt, elke link tussen twee switches wordt bekeken:
1. De root heeft enkel designated poorten (forwarding).
2. Elke andere switch kiest één root port: de poort met de laagste kost naar de root (alle links 1 Gbit/s, dus kost 4 per hop, bij 100 Mbit/s 19).
3. Op elke link is één kant designated: die met de laagste kost naar de root, bij gelijkspel de laagste bridge ID, daarna de laagste poort-ID.
4. Alle andere poorten blokkeren.

Dat geeft in een driehoek altijd één geblokkeerde poort, op de link waar het gelijkspel beslist wordt.

| Root | Root ports | Geblokkeerd |
|---|---|---|
| Een access switch (bv. `1.1`) | De distributieswitch en de andere access switch (`2.1`) hebben hun root port op de rechtstreekse link naar de root (kost 4). | De link distributie naar de andere access switch: beide kanten hebben kost 4, de kant met de hoogste bridge ID blokkeert. |
| De distributieswitch | Beide access switches hebben hun root port op p4 (kost 4). | De rode link tussen de access switches: beide kanten kost 4, de kant met de hoogste bridge ID blokkeert p3. |

Teken pijlen of kruisjes volgens je eigen `brctl showstp`: welke kant blokkeert hangt af van de MAC-adressen. Screenshot of foto van het schema: nog toe te voegen.

### Open Wireshark and track the packets. Capture a BPDU and analyze its fields. Note down the Hello interval and the maximum age of the packet.
Screenshot: nog toe te voegen.

Filter `stp`. De BPDU wordt verstuurd naar het multicastadres `01:80:c2:00:00:00` (Spanning Tree Protocol, via LLC). Velden: Protocol Identifier (0), Version (0 voor klassiek STP, 2 voor RSTP), BPDU type, Flags (Topology Change en Topology Change Acknowledgment), Root Identifier, Root Path Cost, Bridge Identifier, Port Identifier, Message Age, Max Age, Hello Time en Forward Delay. De Linux-bridge praat enkel klassiek STP (versie 0, geen RSTP). Verwacht Hello Time 2 s en Max Age 20 s. Gemeten: nog in te vullen na het labo.

### Do these values match what you saw in the values configured in the GUI?
Dat hangt af van de root: een niet-root switch stuurt BPDU's door met de timers van de root, en gebruikt die ook zelf in plaats van zijn eigen instelling. Een afwijkend getal kan dus komen van een andere switch dan degene die je in de GUI bekijkt. Het GUI-veld toont ook enkel wat ingesteld is. Is het leeg, dan geldt de standaardwaarde (placeholder). Gemeten: nog in te vullen na het labo.

### Find out the real values by checking with a command through SSH. What command did you use? What did you find out?
```cli
brctl showstp br-lan                                  # switch (max age, hello time en forward delay zijn de actieve waarden, de "bridge ..." waarden zijn de eigen instelling)
cat /sys/class/net/br-lan/bridge/hello_time           # switch (in honderdsten van een seconde, 200 = 2 s)
cat /sys/class/net/br-lan/bridge/max_age              # switch
cat /sys/class/net/br-lan/bridge/forward_delay        # switch
uci show network | grep -E "hello|max_age|forward"    # switch (leeg = standaardwaarde)
```
Gemeten: nog in te vullen na het labo.

### Who is the root according to the BPDU packets?
Het veld Root Identifier in de BPDU. Dat moet gelijk zijn aan `designated root` in `brctl showstp` van elke switch. Gemeten: nog in te vullen na het labo.

### Is a topology change indicated?
In een stabiel netwerk niet: de Topology Change flag is 0. Net na het sluiten van de loop of bij een ander verlies of nieuwe link kan de flag korte tijd 1 zijn (de root zet hem zolang `max_age + forward_delay`, zodat alle switches hun MAC-tabel snel laten verlopen). Gemeten: nog in te vullen na het labo.

### Now make the distribution switch the root (communicate with your peers about this event). How will you enforce this? Also, capture the packets using Wireshark!
Geef de distributieswitch een lagere priority dan alle andere (bv. `4096` tegenover `32767`), want de priority staat in de bridge ID vóór het MAC-adres. De groep die de distributieswitch beheert voert dit uit en verwittigt de anderen, zodat niet twee groepen tegelijk hun switch root maken.
```cli
uci set network.@device[0].priority='4096'   # switch (distributieswitch)
uci commit network                           # switch
/etc/init.d/network restart                  # switch
brctl showstp br-lan                         # switch (op elke switch: designated root = distributieswitch?)
```
In Wireshark verandert het Root Identifier van de BPDU's naar `1000.<MAC van de distributieswitch>` (4096 = hex `1000`) en een korte tijd staat de Topology Change flag aan. Screenshot: nog toe te voegen.

### Which ports are blocking, and which ports are forwarding? Draw this on the schematic.
Nu is de distributieswitch root, dus al zijn poorten zijn designated en forwarding. Elke access switch heeft zijn root port op p4 (rechtstreeks naar de root, kost 4). Enkel de rode link tussen de twee access switches (p3 op beide) heeft een gelijkspel op kost (beide kanten 4): de switch met de hoogste bridge ID blokkeert zijn p3, de andere is designated. Hosts (p1 en p2) zijn designated en forwarding. Schema: nog toe te voegen.

---

## Exercise 2: Spanning tree under link and switch failures

De distributieswitch is root (Exercise 1). Meet elke keer de tijd tot STP stabiel is (alle poorten forwarding of blocking, geen listening of learning meer). Handig: een doorlopende ping naar een host aan de andere kant, of `watch`-achtig herhalen:
```powershell
ping -t 10.1.1.10   # pc (zie wanneer de antwoorden wegvallen en terugkomen)
```
```cli
brctl showstp br-lan   # switch (herhaal tot er geen listening of learning meer staat)
```

### 4.1 Distribution link down

### Disconnect an active distribution link and start a stopwatch. How long does it take to complete the STP reconfiguration?
De switch aan die kant ziet meteen link-down. Hij verliest zijn root port en de geblokkeerde poort op de rode link wordt de nieuwe root port. Die loopt door listening en learning (elk `forward_delay`, 2 s) vóór ze forwarding wordt. Verwachting met de OpenWrt-timers: ongeveer 4 s, met de klassieke 802.1D-timers (forward delay 15 s) ruim 30 s. Merkt de switch het enkel doordat de BPDU's wegvallen (link blijft up), dan komt daar nog `max_age` (20 s) bij. Gemeten: nog in te vullen na het labo.

### Check the STP protocol using the command brctl showstp switch. Who is the root, and what ports are blocked?
De distributieswitch blijft root (zijn priority is niet veranderd). De access switch die zijn blauwe link verloor, heeft nu zijn root port op de rode link naar de andere access switch (root path cost 8: 4 voor de rode link en 4 voor de blauwe link van de buur). Er blokkeert geen enkele poort meer, want zonder één blauwe link is er geen loop meer. Gemeten: nog in te vullen na het labo.

### Repair the distribution link and start a stopwatch. How long does it take to complete the STP reconfiguration?
De nieuwe link doorloopt blocking, listening en learning voor hij forwardt (zelfde orde: 2 x `forward_delay`, dus ongeveer 4 s, anders 30 s). Daarna herberekent STP: de access switch kiest opnieuw de rechtstreekse blauwe link (kost 4 tegenover 8) als root port, en het loopje sluit weer. Gemeten: nog in te vullen na het labo.

### Check the STP protocol using the command brctl showstp switch. Who is the root, and what ports are blocked?
Weer de oorspronkelijke toestand: de distributieswitch is root, beide access switches hebben hun root port op p4 en op de rode link blokkeert opnieuw één poort. Gemeten: nog in te vullen na het labo.

### 4.2 Access link down

### Repeat the previous exercise, but instead disconnect an active link from an access switch. Check the timing and the STP protocol.
Er zijn twee mogelijkheden:
- Een blauwe link (access naar distributie): hetzelfde gedrag en dezelfde tijd als in 4.1.
- De rode link tussen de access switches: die ligt in de boom met één geblokkeerde poort, er loopt dus geen data over. Haal je hem weg, dan verandert er niets voor het verkeer en is er geen topology change, want er verdwijnt geen forwarding poort. De hosts merken niets en de lus is simpelweg weg.

Gemeten: nog in te vullen na het labo.

### Repair the link and check again.
De blauwe link komt terug via listening en learning (enkele seconden), daarna wordt één poort van de rode link weer geblokkeerd. Voor de rode link zelf verandert er niets in het verkeer. Gemeten: nog in te vullen na het labo.

### 4.3 Access switch down

### Repeat the previous exercise, but instead shut down an access switch. What is the difference with previous exercises?
De hosts achter die switch zijn niet meer bereikbaar, want ze hebben maar één verbinding (p1 of p2 naar één access switch): er bestaat geen alternatief pad. Bij de vorige oefeningen bleef alles bereikbaar en zocht STP enkel een omweg. De rest van het netwerk herberekent wel zijn tree (de rode link valt weg, de andere access switch blijft via zijn blauwe link aan de distributieswitch hangen). Als de switch weer opstart, doorloopt hij de listening- en learning-fases en daarna is alles weer bereikbaar. De hosts hebben dus enkel redundantie als de apparatuur gedubbeld wordt.

### 4.4 No spanning tree

### Remove the loop in the network and disable the spanning tree on all switches. Now put the loop back in there. What happens when you try to ping?
Verwijder eerst de lus, schakel dan STP uit en sluit de lus pas daarna:
```cli
uci set network.@device[0].stp='0'   # switch (op alle switches)
uci commit network                   # switch
/etc/init.d/network restart          # switch
```
Er ontstaat een broadcast storm. Een broadcast (bijvoorbeeld ARP) wordt door elke switch naar alle andere poorten gestuurd en loopt rond in de loop. Ethernet kent geen TTL, dus de frames sterven nooit uit, vermenigvuldigen zich bij elke switch en vullen alle links. De MAC-tabellen flappen (hetzelfde MAC-adres wordt telkens op een andere poort gezien), de CPU van de switches gaat naar 100%, SSH wordt traag of valt weg en de pings falen (timeouts) of krijgen veel duplicaten. Herstel door de lus-kabel te verwijderen en eventueel de switches te herstarten. Vandaar de tip om vooraf een log visualizer of Wireshark te starten. Gemeten: nog in te vullen na het labo.

---

## Exercise 3: Spanning tree in a core network

### Extend the network
Voeg de core switches toe volgens Figure 2 en maak met de vier core switches een "vierkant" met beide diagonalen (volledige mesh: elke core switch heeft een link naar alle drie de andere). Zet op de nieuwe switches IP-adres, masker `/16`, firewall uit en STP aan. De poorten van de figuur:

| Link (blauw) | Poorten |
|---|---|
| `1.5` naar `2.5` | `1.5` p5 en `2.5` p1 |
| `2.5` naar `4.5` | `2.5` p3 en `4.5` p1 |
| `4.5` naar `3.5` | `4.5` p3 en `3.5` p3 |
| `3.5` naar `1.5` | `3.5` p1 en `1.5` p3 |
| `1.5` naar `4.5` (diagonaal) | `1.5` p4 en `4.5` p2 |
| `2.5` naar `3.5` (diagonaal) | `2.5` p2 en `3.5` p2 |

De access switches hangen aan `1.5` (p1 naar `1.1`, p2 naar `2.1`) en `3.5` (p4 naar `3.1`, p5 naar `4.1`). De rode links tussen de access switches blijven (`1.1` p3 naar `2.1` p3 en `3.1` p4 naar `4.1` p3). Poort 5 van `3.1` blijft vrij in Figure 2.
```cli
ssh root@192.168.1.1                       # pc (nieuwe core switch in fabrieksinstelling)
/etc/init.d/firewall stop                  # switch
uci set network.lan.ipaddr='10.1.x.5'      # switch
uci set network.lan.netmask='255.255.0.0'  # switch
uci set network.@device[0].stp='1'         # switch
uci commit network                         # switch
/etc/init.d/network restart                # switch
```
Tip uit de opgave: niet pingen tijdens de convergentie. De switches hebben weinig processorkracht en met extra verkeer duurt het langer.

### Check the STP protocol using the command brctl showstp switch. Who is the root, which ports are forwarding/blocking/root ports/designated ports, and why?
```cli
brctl showstp br-lan   # switch
```
Bij gelijke priorities is de root de switch met het laagste MAC-adres, een willekeurige van de 8 switches. De core switches vormen een volledige mesh van 4 en de access switches hangen als eindjes onder een core switch. Een boom door 8 switches heeft 7 links, de figuur heeft er 12 (6 blauwe core-links, 4 access-links, 2 rode links), dus precies 5 links blokkeren. Hoe je de rollen herkent in `brctl showstp`:
- Root port: de poort waarvan het nummer bij `root port` bovenaan staat.
- Designated port: poort waarbij `designated bridge` gelijk is aan de eigen `bridge id`.
- Blocking: `state blocking`. Dat is een alternate poort: de designated bridge is een andere switch dan ik en het is niet mijn root port.

Antwoord voor jullie eigen opstelling: nog in te vullen na het labo.

### Draw your spanning tree on the schematic.
Schema: nog toe te voegen. Gebruik voor de tekening dezelfde vier regels als in Exercise 1 (root heeft enkel designated poorten, elke andere switch één root port met de laagste kost, per link één designated kant, de rest blokkeert).

### Make one of the core switches the root (communicate with your peers about this event). Check the reconfiguration.
Wij maken core switch 2 (`10.1.2.5`) root met priority `4096` en spreken met groep 4 af dat `4.5` de secundaire root wordt met `8192` (zie verder). Alle andere switches houden `32767`. Een pure core switch is hier een betere root dan `1.5` of `3.5`, want die twee hebben access switches onder zich die zonder hen geen uplink meer hebben.
```cli
uci set network.@device[0].priority='4096'   # switch (core switch 2 = 10.1.2.5)
uci commit network                           # switch
/etc/init.d/network restart                  # switch
brctl showstp br-lan                         # switch (op elke switch: designated root = 1000.<MAC van 2.5>)
```
Verwachte boom met root `2.5` (alle links kost 4):

| Switch | Root port | Root path cost | Designated poorten | Geblokkeerd |
|---|---|---|---|---|
| `2.5` (root) | geen | 0 | p1, p2, p3 | niets |
| `1.5` | p5 (naar `2.5`) | 4 | p1, p2 (naar `1.1`, `2.1`), en p3 als `1.5` het laagste ID heeft van `1.5`/`3.5` | p4 (naar `4.5`), en p3 als `3.5` het laagste ID heeft |
| `3.5` | p2 (naar `2.5`) | 4 | p4, p5 (naar `3.1`, `4.1`), en p1 als `3.5` het laagste ID heeft van `1.5`/`3.5` | p3 (naar `4.5`), en p1 als `1.5` het laagste ID heeft |
| `4.5` | p1 (naar `2.5`) | 4 | p2, p3 (naar `1.5`, `3.5`) | niets |
| `1.1` en `2.1` | p4 (naar `1.5`) | 8 | `1.5` is designated op p1 en p2 | de rode link: één kant blokkeert p3 |
| `3.1` en `4.1` | p3 (`3.1`) en p4 (`4.1`) naar `3.5` | 8 | `3.5` is designated op p4 en p5 | de rode link: één kant blokkeert (p4 op `3.1`, p3 op `4.1`) |

De link `1.5` naar `3.5` (p3 van `1.5`, p1 van `3.5`) heeft een gelijkspel op kost (beide kanten 4) en een gelijkspel op priority (`32767`): het laagste MAC-adres wordt designated, de andere kant blokkeert. Dat zijn 5 geblokkeerde poorten in totaal: `1.5` p4, `3.5` p3, één kant van `1.5`-`3.5`, één rode link links en één rode link rechts. Gemeten: nog in te vullen na het labo.

### Are there any paths of equal cost? If yes, why and how was a certain path chosen?
Ja. Elke core switch zit rechtstreeks aan de root vast (kost 4). De drie links tussen de niet-root core switches (`1.5`-`3.5`, `1.5`-`4.5`, `3.5`-`4.5`) hebben dus aan beide kanten dezelfde kost naar de root (4). Ook elke rode link tussen twee access switches heeft aan beide kanten dezelfde kost (4 of 8). Het gelijkspel wordt in deze volgorde opgelost: (1) laagste root path cost, (2) laagste bridge ID van de verzendende switch, (3) laagste poort-ID van de verzendende switch. Met `4.5` op priority 8192 wint die op `1.5` en `3.5` en is zijn kant van de links designated, dus blokkeren `1.5` p4 en `3.5` p3. Tussen `1.5` en `3.5` (beide 32767) beslist het MAC-adres. Gemeten: nog in te vullen na het labo.

### 5.1 Root switch down

### Imagine the root switch fails. Who becomes the new root, and how is that determined?
De switch met de laagste bridge ID van de overgebleven switches. De naburige switches verliezen BPDU's van de root (en bij link-down meteen hun root port), de opgeslagen root-informatie vervalt (maximaal na `max_age`) en ze beginnen opnieuw met zichzelf als root te claimen. Daarna wint opnieuw de laagste bridge ID. Zonder extra instellingen is dat willekeurig (laagste MAC), zodat het beter is dit zelf te kiezen.

### Make sure that before you shut down the root switch, set up the configurations such that another core switch will become the new root. How will you do this?
Geef één andere core switch de tweede laagste priority: `4.5` krijgt `8192` terwijl de root `2.5` op `4096` staat en de rest op `32767`. Dat is een gewone `uci set ...priority='8192'` met `uci commit network` en een netwerk-herstart op `4.5`. Bij voorkeur persistent via UCI (niet enkel via `/sys`), anders is de instelling na een herstart weg.
```cli
uci set network.@device[0].priority='8192'   # switch (core switch 4 = 10.1.4.5)
uci commit network                           # switch
/etc/init.d/network restart                  # switch
```

### Now shut down the root switch. How long does it take until the network converges again?
Is de link meteen down (stroom of kabel eruit), dan loopt het zoals in Exercise 2: de nieuwe verkiezing en 2 x `forward_delay`, orde enkele seconden (ongeveer 4 s, 30 s met de klassieke timers). Blijft de link up omdat het toestel softwarematig afgesloten wordt (de poort blijft elektrisch up zonder BPDU's), dan komt `max_age` (20 s) eerst, dus ongeveer 24 s. Gemeten: nog in te vullen na het labo.

### Ping all hosts and switches. Do you get all replies?
Alles antwoordt behalve de uitgevallen core switch `10.1.2.5` zelf. Alle access switches hangen aan `1.5` of `3.5`, die nog draaien, en die blijven via `4.5` en onderling verbonden. Als daarentegen `1.5` of `3.5` de root was geweest, zouden de twee access switches daaronder (en hun hosts) hun enige uplink verliezen en onbereikbaar zijn. Ping pas wanneer STP volledig geconvergeerd is, anders gaan de eerste pings nog verloren. Gemeten: nog in te vullen na het labo.

### Check the STP. Did the secondary root switch become the new root?
Ja, `4.5` (priority `8192`) is de laagste bridge ID van de overgebleven switches en wordt root. Op elke switch staat bij `designated root` nu `2000.<MAC van 4.5>` (8192 = hex `2000`). Gemeten: nog in te vullen na het labo.

### Which ports are forwarding/blocking/root ports/designated ports, and why? Draw this on the new schematic.
Met root `4.5` (kost 4 per link):

| Switch | Root port | Root path cost | Opmerking |
|---|---|---|---|
| `4.5` (root) | geen | 0 | p2 (naar `1.5`) en p3 (naar `3.5`) designated |
| `1.5` | p4 (naar `4.5`) | 4 | designated naar `1.1` en `2.1` (p1, p2) |
| `3.5` | p3 (naar `4.5`) | 4 | designated naar `3.1` en `4.1` (p4, p5) |
| `1.1`, `2.1` | p4 naar `1.5` | 8 | de rode link: één kant blokkeert p3 |
| `3.1`, `4.1` | p3 (`3.1`) en p4 (`4.1`) naar `3.5` | 8 | de rode link: één kant blokkeert |

De link `1.5` naar `3.5` is de enige core-link die overblijft met een gelijkspel (kost 4 en 4): de kant met de laagste bridge ID (MAC bij gelijke priority) is designated, de andere blokkeert. Dat zijn 3 geblokkeerde poorten: één op `1.5`-`3.5` en één per rode link. 7 switches hebben 6 links in de boom, er zijn 9 links, dus 3 blokkeren. Schema: nog toe te voegen.

### Reboot the original root switch. What happens? Who becomes the new root?
Zodra `2.5` opstart en BPDU's met root-ID `1000.<MAC van 2.5>` verstuurt, is zijn ID lager dan dat van `4.5`. STP heeft geen preempt-instelling of voorkeur voor de zittende root: de beste bridge ID wint altijd. `2.5` wordt dus weer root en alle switches herberekenen hun tree, met opnieuw een topology change en dezelfde korte onderbreking als bij een nieuwe link (listening en learning). Dit werkt alleen als de priority `4096` met `uci commit` is opgeslagen. Stond ze enkel in `/sys`, dan start `2.5` op met `32767` en blijft `4.5` root. Gemeten: nog in te vullen na het labo.

### Extra exercise: add more loops (Figure 3). Why do you think the bridges cannot handle too many loops?
- Elke extra loop betekent extra BPDU's en extra herberekeningen, en elke topologiewijziging laat de MAC-tabellen verlopen waardoor frames tijdelijk geflood worden. De goedkope switch-CPU's raken verzadigd.
- STP doet in de tussentijd (listening, learning) niets voor bescherming. Als BPDU's door CPU-overbelasting te laat aankomen of verdwijnen, gaat een poort ten onrechte naar forwarding en ontstaat er een tijdelijke lus: een broadcast storm die de CPU verder belast, waardoor nog meer BPDU's verloren gaan (een negatieve spiraal).
- De timers (`max_age`, `forward_delay`) gaan uit van een beperkte diameter (802.1D rekent met maximaal 7 switches tussen twee punten). Bij meer lussen en een langere paden kan de boom niet meer binnen de timers convergeren.
- Het levert niets op: STP gebruikt maar één boom, dus extra links liggen geblokkeerd en geven geen extra capaciteit, enkel meer complexiteit.

---

## Verschil tussen de varianten van STP (uit de voorbereiding)

| Variant | Kenmerk |
|---|---|
| STP (802.1D) | Eén boom voor het hele netwerk, convergentie 30 tot 50 s met de standaardtimers (blocking, listening, learning, forwarding). Wat de Linux-bridge hier gebruikt. |
| RSTP (802.1w) | Zelfde basis, maar snelle convergentie (enkele seconden) via handshakes tussen switches; rollen root, designated, alternate, backup; toestanden discarding, learning, forwarding. |
| PVST+ / Rapid PVST+ | Cisco: een aparte boom per VLAN. Zo kan verkeer van verschillende VLAN's over verschillende links verdeeld worden. |
| MSTP (802.1s) | VLAN's worden aan een beperkt aantal instanties gekoppeld, elke instantie heeft een eigen boom; minder overhead dan een boom per VLAN. |
