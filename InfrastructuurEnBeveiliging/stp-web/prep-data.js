/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 26/10/2026
**/

'use strict';

// Preparation material per lab: a knowledge base to read and a multiple-choice test (like the Blackboard test at the start of a lab).
// Labs 1 to 3 come from the old preparation.html, Lab 4 was added with the integration. The text is kept as written (Dutch notes, English questions of the real tests).
const PREP_LABS = [
  {
    n: 1,
    title: "Introduction to OpenWrt and switching",
    note: "Voor Lab 1 is er in het echte vak geen voorbereidingstest. Deze test is enkel om te oefenen.",
    kb: `
<h3>Waar gaat dit labo over</h3>
<p>In dit labo maken we kennis met OpenWrt, een Linux-besturingssysteem voor netwerktoestellen. We werken met twee toestellen die beide OpenWrt draaien: de Netgear GS108T, die we de switch noemen, en de Asus RT-AX53U, die we de router noemen. Een nieuw of gereset toestel is standaard bereikbaar op 192.168.1.1 met gebruiker root en zonder wachtwoord, wat enkel in het labo aanvaardbaar is. Je mag nooit de stroom van een toestel halen terwijl het herstart of reset, want dan kan het onherstelbaar beschadigd raken.</p>

<h3>Wat je in het labo doet</h3>
<p>Je begint met de webinterface LuCI via http://192.168.1.1. De switch heeft geen DHCP-server, dus de laptop heeft daar een statisch IP nodig, bijvoorbeeld 192.168.1.10/24 zonder gateway. De router heeft wel een DHCP-server, waardoor de laptop automatisch een IP in 192.168.1.x krijgt met 192.168.1.1 als gateway. Daarna verken je de menu's.</p>
<p>Vervolgens ga je via SSH (ssh root@192.168.1.1) op de command line en inspecteer je het toestel met commando's zoals ubus call system board, uptime, free -h, df -h, ip a, ip route, ifstatus, uci show network en logread. Er is geen onderscheid tussen een gebruikersmodus en een bevoorrechte modus zoals bij Cisco: je bent meteen root. Connectiviteit test je met ping, nslookup en fping.</p>
<p>Daarna volgt pakketbeheer met opkg: opkg update, opkg list-upgradable, opkg upgrade en opkg install tcpdump. Daarvoor moet het toestel internet hebben. Bij de router volstaat de WAN-poort, bij de switch moet je een poort uit de bridge halen en als DHCP-client-interface instellen. De systeemdatum moet kloppen, anders mislukt de controle van de HTTPS-certificaten, en je kan ze zetten met date -s. Pakketten kunnen ook via LuCI geïnstalleerd worden onder System en dan Software.</p>
<p>Dan verbind je twee hosts met elkaar via een switch en een router. De host aan de switch krijgt 10.1.1.10/16 met de switch op 10.1.1.1, de host aan de router krijgt 10.1.2.10/16 met de router op 10.1.2.1, en tussen de switch en een LAN-poort van de router loopt een kabel. De firewall zet je uit met /etc/init.d/firewall stop en het management-IP pas je aan via Network, Interfaces en LAN.</p>
<p>Als laatste maak je een backup van de configuratie en zet je die terug via System, Backup / Flash Firmware (sysupgrade -b en sysupgrade -r), en reset je het toestel met de reset-knop (ongeveer 10 seconden) of met firstboot -y &amp;&amp; reboot. Die reset doe je op het einde van elk labo.</p>

<h3>Kernpunten</h3>
<p>De configuratie van OpenWrt zit in UCI (de bestanden in /etc/config/) en kan via de GUI of de command line aangepast worden, want beide wijzigen dezelfde configuratie. Als je het IP van het toestel wijzigt, verlies je de verbinding. Je laptop moet dan ook een IP in het nieuwe subnet krijgen en je moet naar het nieuwe adres surfen. Binnen hetzelfde subnet, hier 10.1.0.0/16, is geen default gateway nodig.</p>
<p>In dit labo gebruiken we de LAN-poorten, die in een bridge zitten en dus als Layer 2 switch werken, en niet de WAN-poort, want dat is een apart gerouteerd netwerk met eigen subnet, firewall-zone en NAT. Een configuratie-backup bevat enkel instellingen, terwijl een firmware image het volledige besturingssysteem is. Na een restore kan het toestel tijdelijk onbereikbaar zijn omdat het herstart en het management-IP uit de backup kan verschillen van het adres dat je browser of host gebruikt.</p>
`,
    qs: [
      { q: "Wat zijn de standaard instellingen om een vers OpenWrt-toestel in het labo te beheren?",
        o: ["IP 10.1.1.1, gebruiker admin, wachtwoord admin", "IP 192.168.1.1, gebruiker root, geen wachtwoord", "IP 192.168.0.1, gebruiker root, wachtwoord root", "IP 192.168.1.254, gebruiker admin, geen wachtwoord"],
        a: 1, e: "Een vers of gereset toestel is bereikbaar op 192.168.1.1 met root zonder wachtwoord. Dat is enkel in het labo aanvaardbaar." },
      { q: "Waarom heeft de laptop aan de switch een statisch IP nodig, terwijl de laptop aan de router er automatisch een krijgt?",
        o: ["De switch ondersteunt geen IP-adressen", "De router draait standaard een DHCP-server op LAN, de switch niet", "De router gebruikt geen subnetmasker", "Een switch kan enkel IPv6"],
        a: 1, e: "In het labo is de DHCP-server op de switch uitgeschakeld (te zwaar voor het toestel). De router levert wel automatisch een IP in 192.168.1.x." },
      { q: "Je krijgt de waarschuwing 'host identification has changed' bij ssh. Wat doe je?",
        o: ["Het toestel resetten", "ssh-keygen -R 192.168.1.1 uitvoeren en opnieuw verbinden", "De firewall uitzetten", "Het wachtwoord van root instellen"],
        a: 1, e: "Na het reflashen of verwisselen van toestellen verandert de host key. Met ssh-keygen -R verwijder je de oude entry." },
      { q: "Waarom mislukt opkg update als de systeemdatum fout is?",
        o: ["Omdat opkg alleen op werkdagen werkt", "Omdat de HTTPS-certificaten een geldigheidsperiode hebben en de controle faalt bij een verkeerde datum", "Omdat DNS dan niet werkt", "Omdat de overlay vol zit"],
        a: 1, e: "De pakketlijsten worden via HTTPS opgehaald. Bij een verkeerde klok lijkt het certificaat ongeldig (wget: SSL verify error)." },
      { q: "Wat bevat /overlay in de uitvoer van df -h?",
        o: ["Het read-only basis-image van het besturingssysteem", "Het schrijfbare deel met configuratie en geïnstalleerde pakketten", "Tijdelijke bestanden in RAM", "De bootloader"],
        a: 1, e: "/ is een read-only squashfs en /tmp zit in RAM. De overlay bevat wijzigingen en pakketten en wordt bij een reset gewist." },
      { q: "Welk commando toont de netwerkconfiguratie in UCI-notatie?",
        o: ["ip route", "ifstatus lan", "uci show network", "logread -e network"],
        a: 2, e: "uci show network toont /etc/config/network. ifstatus geeft de runtime-status van een interface." },
      { q: "Wat doet logread -f?",
        o: ["Wist het systeemlog", "Toont enkel firewall-regels", "Volgt het systeemlog live", "Filtert op fouten"],
        a: 2, e: "-f staat voor follow, zoals tail -f. Stoppen kan met Ctrl+C. Met -e filter je op een patroon." },
      { q: "Wat doet /etc/init.d/firewall stop?",
        o: ["Verwijdert de firewall-configuratie permanent", "Stopt de firewall-service nu, maar na een herstart draait ze weer tenzij je ze disabled", "Zet alle poorten uit", "Reset het toestel"],
        a: 1, e: "Het stopt de service tijdelijk. Met /etc/init.d/firewall disable zou ze ook na een herstart uit blijven." },
      { q: "Waarom gebruikt oefening 4 LAN-poorten en niet de WAN-poort om switch en router te verbinden?",
        o: ["De WAN-poort is trager", "De LAN-poorten zitten in een bridge, waardoor de router als Layer 2 switch in hetzelfde subnet werkt; de WAN-poort is een apart gerouteerd netwerk", "De WAN-poort ondersteunt geen Ethernet", "LAN-poorten hebben geen IP nodig"],
        a: 1, e: "Alle toestellen moeten in 10.1.0.0/16 zitten. Via de WAN-poort zou je tussen twee netwerken routeren." },
      { q: "Moet je in oefening 4 een default gateway instellen op de hosts?",
        o: ["Ja, 10.1.1.1", "Ja, 192.168.1.1", "Nee, alle toestellen zitten in hetzelfde /16-subnet", "Nee, maar enkel omdat de firewall uit staat"],
        a: 2, e: "Binnen hetzelfde subnet communiceren hosts rechtstreeks (ARP). Een gateway is enkel nodig voor andere subnetten." },
      { q: "Je wijzigt het IP van de router naar 10.1.2.1/16. Wat gebeurt er met je browser?",
        o: ["Niets, de pagina blijft werken", "De verbinding valt weg, want het toestel luistert niet meer op 192.168.1.1; je laptop moet in 10.1.0.0/16 zitten en naar http://10.1.2.1 gaan", "De router herstelt automatisch het oude adres", "LuCI is niet meer bereikbaar tot een reset"],
        a: 1, e: "De laptop heeft nog zijn oude 192.168.1.x-adres en zit niet meer in hetzelfde netwerk. Pas de laptop aan en gebruik het nieuwe adres." },
      { q: "Wat is het verschil tussen een configuratie-backup en een firmware image?",
        o: ["Er is geen verschil", "Een backup bevat enkel de instellingen, een firmware image is het volledige besturingssysteem", "Een backup bevat ook de kernel", "Een firmware image bevat enkel de gebruikersinstellingen"],
        a: 1, e: "De backup (.tar.gz met o.a. /etc/config) wordt op het bestaande systeem toegepast. Een firmware image vervangt het besturingssysteem." },
      { q: "Je hebt een backup teruggezet en kan het toestel even niet bereiken. Wat is een waarschijnlijke oorzaak?",
        o: ["De backup was beschadigd", "Het toestel herstart en heeft het management-IP uit de backup, terwijl je host/browser een ander adres gebruikt", "De firewall blokkeert SSH permanent", "De restore heeft de root-gebruiker verwijderd"],
        a: 1, e: "Het IP uit de backup kan verschillen van wat je gebruikt. Wacht op de herstart, ga naar het herstelde adres en pas zo nodig je host aan." },
      { q: "Hoe reset je een toestel met de hardware-knop?",
        o: ["Kort drukken en uitsteken", "Ongeveer 10 seconden ingedrukt houden, loslaten en NIET uitsteken", "Dubbelklikken en wachten", "Stroom 10 seconden uitsteken"],
        a: 1, e: "Het toestel doet een factory reset en herstart. Tijdens de herstart mag je het niet uitsteken, anders kan het onherstelbaar beschadigd raken." },
      { q: "Wat gebeurt er met geïnstalleerde pakketten en configuratie bij een factory reset?",
        o: ["Ze blijven behouden", "Ze worden gewist doordat de schrijfbare overlay leeggemaakt wordt", "Enkel de pakketten worden gewist", "Enkel de configuratie wordt gewist"],
        a: 1, e: "Een reset maakt de overlay leeg. Het toestel keert terug naar het schone image met 192.168.1.1." }
    ]
  },
  {
    n: 2,
    title: "Layer 2 switching and Layer 3 routing",
    note: "",
    kb: `
<h3>Waar gaat dit labo over</h3>
<p>Dit labo introduceert de basis van Layer 2 switching en Layer 3 routing met een reeks hands-on oefeningen. Je leert het effect van het subnetmasker en de default gateway op de communicatie, je configureert en controleert routing tussen verschillende subnetten, je analyseert ARP-, ICMP- en routingverkeer in Wireshark, en je stelt statische routes en dynamische routing (RIP en OSPF) in. Elke groep werkt met echte switches, routers en hosts. Als je een oefening afrondt, verwittig je de lector voor je verdergaat.</p>

<h3>De oefeningen</h3>
<p>In oefening 1 bouw je een Layer 2 opstelling met switches en hosts in een /16-subnet, zonder default gateway. Je pingt je eigen switch, een andere switch, je partner en andere hosts, en je bekijkt in Wireshark wat er gebeurt: ARP, ICMP, welke adressen in het Ethernet-frame zitten en welke in de payload. Je gebruikt ook fping met een tekstbestand met IP-adressen om meerdere hosts tegelijk te testen. In oefening 2 hou je dezelfde fysieke opstelling en dezelfde IP-adressen, maar wijzig je het masker naar /24 (255.255.255.0), nog steeds zonder gateway. Je ziet welke bereikbaarheid wegvalt en waarom.</p>
<p>In oefening 3 zet je de hosts in verschillende subnetten: de host met IP 10.1.x.10 krijgt een /16, de host met 10.1.x.11 blijft in het /24 en de switches blijven op /24. Het doel is niet om te zien of het werkt, maar om uit te leggen waarom een ping wel of niet vertrekt. In oefening 4 voeg je routers toe. Je installeert de FRR-pakketten, zet de firewall uit, haalt LAN2 uit de bridge en maakt een nieuwe interface lan2 met een statisch IP. Elk duo zit in een ander /24-netwerk en er is nog geen gateway. Je merkt dat je geen volledige connectiviteit hebt.</p>
<p>In oefening 5 stel je de default gateways in: de gateway van de .10-host wijst naar de ene kant, die van de .11-host naar de andere kant. De routers blijven ongewijzigd. Je kan nu de buur bereiken, maar niet alles, want de routers kennen enkel hun directe netwerken. In oefening 6 voeg je statische routes toe op elke router (twee per router) voor volledige bereikbaarheid, controleer je de routingtabel en bekijk je in Wireshark welke MAC-adressen en IP-velden bij het doorsturen veranderen. In oefening 7 vervang je de statische routes door dynamische routing met FRR: eerst RIP, daarna OSPF. Je vergelijkt de routes (traceroute), de convergentietijd bij het loskoppelen van een kabel en je ontleedt de pakketten in Wireshark.</p>

<h3>Vorm van de test</h3>
<p>Aan het begin van het labo is er een meerkeuzetest via Blackboard. Je hebt 15 minuten om hem te starten en hij is gesloten boek, dus zonder internet en zonder AI. De voorbereidingstests tellen voor 15% van het labo en als je niet slaagt voor een test, moet je een verslag schrijven over dat labo. Volgens de labtekst moet je geen commando's, syntax of getallen zoals timerwaarden kennen. Je moet kunnen uitleggen wat er in een netwerk gebeurt en waarom.</p>

<h3>Bron voor de voorbereiding</h3>
<p>In Lab2.pdf, sectie 1 Preparation op pagina 3, staan de bronnen: de reeks Packet Traveling van Practical Networking (host-to-host, via een switch en via een router), het artikel Role of Subnet Mask, het artikel Understanding Routing in Computer Networks over statische en dynamische routing, korte video's over RIP en OSPF en een artikel dat RIP en OSPF vergelijkt. De links staan niet in de PDF. De offline referenties staan op Blackboard onder practicum en dan referenties. Wat hieronder staat komt uit mijn eigen kennis van die onderwerpen. Ik heb de artikels zelf niet kunnen lezen, dus lees ze ook zelf door.</p>

<h3>A. Hoe een pakket reist</h3>
<p>Ethernet werkt met MAC-adressen (Layer 2) en IP met IP-adressen (Layer 3). Een host kent het IP-adres van de bestemming, maar moet het MAC-adres van de volgende hop nog opzoeken met ARP. Bij ARP stuurt de host een broadcast (bestemming ff:ff:ff:ff:ff:ff) met de vraag wie een bepaald IP heeft, en de eigenaar antwoordt met een unicast. Het resultaat komt in de ARP-cache. Daarom is het eerste frame dat je in Wireshark bij een nieuwe ping ziet meestal een ARP-broadcast, en is het ICMP-verkeer erna (echo request en reply) unicast.</p>
<p>Een switch werkt op Layer 2. Hij leert uit het bronadres van binnenkomende frames welk MAC-adres aan welke poort hangt (de MAC-tabel). Frames voor een onbekende bestemming en broadcasts gaat hij naar alle andere poorten sturen (flooding), frames voor een bekende bestemming enkel naar de juiste poort. Een switch past geen MAC- of IP-adressen aan en heeft enkel een IP-adres om beheerd te worden.</p>
<p>Een router werkt op Layer 3, verbindt verschillende netwerken en kiest de volgende hop met zijn routingtabel. Als een router een pakket doorstuurt, blijven het bron-IP en bestemmings-IP hetzelfde, maar worden de MAC-adressen bij elke hop vervangen. De TTL daalt met 1 en de checksum verandert mee. Wanneer een host een pakket naar een ander subnet stuurt, is het bestemmings-MAC in het Ethernet-frame dat van de default gateway en niet dat van de eindbestemming, terwijl het bestemmings-IP wel dat van de eindbestemming blijft.</p>

<h3>B. Subnetmasker en default gateway</h3>
<p>De host past het masker toe op zijn eigen IP en op het bestemmings-IP en vergelijkt de twee resultaten. Zijn ze gelijk, dan zit de bestemming in hetzelfde subnet en verstuurt de host rechtstreeks, met ARP voor de bestemming zelf. Zijn ze verschillend, dan stuurt de host het naar de default gateway, met ARP voor de gateway. Is er geen default gateway ingesteld, dan wordt het pakket niet verstuurd. De default gateway moet zelf in het eigen subnet liggen.</p>
<p>Een /16 is 255.255.0.0, waardoor alle adressen 10.1.x.y in hetzelfde subnet zitten. Een /24 is 255.255.255.0, waardoor elke waarde van x een eigen subnet is. Als twee hosts verschillende maskers hebben, kan het gebeuren dat verkeer in de ene richting wel vertrekt en in de andere richting niet, omdat de ene host de andere als lokaal ziet en de andere niet. Het antwoord komt dan niet terug. Als je in het labo van /16 naar /24 gaat, verlies je daarom de bereikbaarheid met hosts en switches van andere groepen, want die zitten dan in een ander subnet en er is geen gateway.</p>
<p>Twee hosts met IP-adressen in verschillende bereiken, bijvoorbeeld 192.168.1.10 en 192.168.2.20, kunnen elkaar zonder gateway enkel bereiken als het masker beide adressen in hetzelfde subnet plaatst. Dat kan met 255.255.0.0 (/16), maar niet met 255.255.255.0 (/24) of 255.255.255.128 (/25), want dan liggen ze in verschillende subnetten. Dat ze aan dezelfde switch hangen, maakt niets uit: de host kijkt enkel naar het masker. Hangen ze aan dezelfde switch maar zitten ze in verschillende subnetten, dan is er altijd een router nodig.</p>

<h3>C. Statische en dynamische routing</h3>
<p>Een router kent standaard enkel zijn rechtstreeks verbonden netwerken. Voor elk ander netwerk heeft hij een route nodig. Hosts hebben een default gateway nodig, routers hebben routes nodig, en een router moet IP-forwarding aan hebben om pakketten door te geven.</p>
<p>Als een router een pakket krijgt voor een bestemming die niet in zijn routingtabel staat en hij heeft geen default route, dan gooit hij het pakket weg (discard). Hij stuurt het niet terug naar de bron, hij flood het niet naar alle interfaces en hij doet geen ARP voor een bestemming in een ander netwerk, want ARP werkt alleen op het eigen netwerk. Meestal stuurt hij wel een ICMP-bericht "destination unreachable" terug, maar het pakket zelf is weg. Een ping heeft altijd twee richtingen. Het request moet de bestemming bereiken, maar ook het antwoord moet terug raken, en dat kan via een ander pad en andere routers lopen. Een bestemming die het request ontvangt maar waarvan de gateway-router geen route naar het bronnetwerk heeft, geeft dus nog altijd een mislukte ping omdat die router het antwoord weggooit. Een host die een default gateway heeft, heeft zelf wel een route, dus dat is dan niet het probleem.</p>
<p>Statische routes stel je handmatig in als een bestemmingsprefix met een next hop. Ze zijn eenvoudig, voorspelbaar en veroorzaken geen extra verkeer, maar ze vragen veel handwerk als het netwerk groeit en passen zich niet automatisch aan als een link of router uitvalt. Bij dynamische routing wisselen routers onderling informatie uit en passen ze hun routes automatisch aan. Dat schaalt beter en past zich aan bij wijzigingen, maar het kost meer rekenkracht en geheugen, geeft extra verkeer en is complexer om te configureren. Het tijdstip waarop alle routers na een wijziging weer dezelfde, juiste kijk op het netwerk hebben, noemen we convergentie.</p>

<h3>D. RIP</h3>
<p>RIP is een distance-vector protocol. Elke router stuurt periodiek (ongeveer elke 30 seconden) zijn volledige routingtabel naar zijn buren en zo leren routers hop per hop over verre netwerken. De metric is het aantal hops, met een maximum van 15, want 16 betekent onbereikbaar. RIP versie 2 gebruikt multicast naar 224.0.0.9 (UDP-poort 520).</p>
<p>RIP convergeert traag. Slecht nieuws reist traag, omdat routes pas na timeouts verlopen (bijvoorbeeld 180 seconden), en er kunnen routing-loops en het probleem count to infinity ontstaan, waartegen mechanismen zoals split horizon en route poisoning bestaan. RIP kiest het pad met het minste aantal hops, ook als dat een trage link is, dus dat is niet altijd het beste pad. Het is eenvoudig en vraagt weinig resources, en is daarom geschikt voor kleine netwerken.</p>

<h3>E. OSPF</h3>
<p>OSPF is een link-state protocol. Elke router deelt informatie over zijn eigen links (Link State Advertisements, LSAs) met alle routers in het gebied, waardoor elke router dezelfde kaart van het netwerk krijgt, de Link State Database (LSDB). Elke router berekent daarna zelf het kortste pad met het algoritme van Dijkstra. De metric is de cost, gebaseerd op de bandbreedte van de link, en een lagere cost is beter.</p>
<p>OSPF gebruikt Hello-pakketten om buren te ontdekken en te onderhouden (multicast 224.0.0.5 en 224.0.0.6, IP-protocol 89). De toestanden van een buur zijn Down, Init, 2-Way, ExStart, Exchange, Loading en Full, waarbij Full betekent dat de databases van beide buren volledig gesynchroniseerd zijn. Area 0 is de backbone-area en elke router heeft een unieke router-ID. OSPF convergeert veel sneller dan RIP en schaalt naar grote netwerken, maar vraagt meer CPU en geheugen en is complexer.</p>

<h3>F. Verschil tussen RIP en OSPF</h3>
<p>RIP deelt zijn volledige tabel enkel met zijn directe buren en vertrouwt op wat de buren zeggen (distance-vector). OSPF deelt informatie over links met alle routers in het gebied en elke router rekent zelf het beste pad uit (link-state). RIP gebruikt hops als metric, convergeert traag en past bij kleine netwerken. OSPF gebruikt cost, convergeert snel en past bij grotere netwerken.</p>
`,
    qs: [
      { q: "Een host wil een ping sturen naar een andere host in hetzelfde subnet. Hij kent enkel het IP-adres. Wat is het eerste relevante frame dat hij verstuurt?",
        o: ["Een ICMP echo request als broadcast", "Een ARP-request als broadcast", "Een ARP-request als unicast naar de default gateway", "Een DNS-query naar de switch"],
        a: 1, e: "Het MAC-adres van de bestemming is nog onbekend. De host stuurt een ARP-broadcast (ff:ff:ff:ff:ff:ff) en de eigenaar antwoordt met een unicast." },
      { q: "Hoe wordt het ICMP-verkeer verstuurd nadat de ARP-uitwisseling is afgerond?",
        o: ["Als broadcast zodat iedereen het ziet", "Als unicast, want het MAC-adres zit nu in de ARP-cache", "Altijd via de default gateway", "Het wordt door de switch geblokkeerd"],
        a: 1, e: "Na ARP kent de host het MAC-adres en worden echo request en reply als unicast verstuurd." },
      { q: "Wat doet een switch met een frame waarvan het bestemmings-MAC niet in zijn MAC-tabel staat?",
        o: ["Hij gooit het frame weg", "Hij stuurt het naar alle andere poorten (flooding)", "Hij stuurt het enkel naar de default gateway", "Hij vervangt het bestemmings-MAC door zijn eigen MAC"],
        a: 1, e: "Een onbekende bestemming of een broadcast gaat naar alle andere poorten. De switch leert MAC-adressen uit het bronadres van binnenkomende frames." },
      { q: "Een router stuurt een pakket door naar het volgende netwerk. Wat verandert er?",
        o: ["Enkel het bestemmings-IP", "Bron-IP en bestemmings-IP", "Bron- en bestemmings-MAC en de TTL (min 1)", "Niets, de router werkt transparant"],
        a: 2, e: "De IP-adressen blijven hetzelfde, de MAC-adressen worden bij elke hop vervangen en de TTL daalt met 1 (de checksum verandert mee)." },
      { q: "Een host pingt een host in een ander subnet. Welk bestemmings-MAC staat in het Ethernet-frame?",
        o: ["Het MAC van de eindbestemming", "Het MAC van de default gateway", "ff:ff:ff:ff:ff:ff", "Het MAC van de switch"],
        a: 1, e: "De host geeft het pakket eerst aan de default gateway. Het bestemmings-IP blijft dat van de eindbestemming, maar het MAC is dat van de gateway." },
      { q: "Twee hosts zitten allebei in 10.1.0.0/16. Is er een default gateway nodig om elkaar te bereiken?",
        o: ["Ja, altijd", "Ja, maar enkel voor ICMP", "Nee, ze zitten in hetzelfde subnet en communiceren rechtstreeks via ARP", "Nee, maar enkel als er een router tussen zit"],
        a: 2, e: "Bestemming AND masker is gelijk aan het eigen netwerk, dus de host verstuurt rechtstreeks. Een gateway is enkel nodig voor andere subnetten." },
      { q: "Host 10.1.1.10/24 pingt 10.1.2.10 en heeft geen default gateway. Wat gebeurt er?",
        o: ["De ping lukt via ARP", "De ping wordt niet verstuurd, want het is een ander subnet en er is geen gateway", "De switch routeert het pakket", "De ping lukt, maar er komt geen antwoord"],
        a: 1, e: "10.1.2.10 valt buiten 10.1.1.0/24 en er is geen gateway. Het pakket vertrekt niet eens (je ziet ook geen ARP voor 10.1.2.10)." },
      { q: "Alle hosts en switches gaan van /16 naar /24 en er is geen gateway. Wat verlies je?",
        o: ["Niets, /24 en /16 gedragen zich hetzelfde", "De bereikbaarheid met toestellen van andere groepen (10.1.y.z met een andere y)", "De bereikbaarheid met de eigen switch", "De bereikbaarheid met je partner op dezelfde switch"],
        a: 1, e: "Met een /24 ligt een toestel met een ander derde octet in een ander subnet. Zonder gateway wordt er niets naartoe verstuurd. Eigen switch en partner zitten nog in hetzelfde /24." },
      { q: "Host A is 10.1.1.10/16, host B is 10.1.2.11/24 en er is geen gateway. A pingt B. Wat gebeurt er?",
        o: ["Niets vertrekt bij A", "Het echo request vertrekt en komt aan, maar B kan niet antwoorden omdat 10.1.1.10 buiten zijn /24 valt en er geen gateway is", "De ping lukt volledig", "B antwoordt via de switch met een broadcast"],
        a: 1, e: "Voor A ligt B in zijn /16, dus A verstuurt rechtstreeks. Voor B ligt A buiten zijn /24 en zonder gateway weet hij niet waar hij het antwoord naartoe moet sturen. Resultaat: timeout." },
      { q: "Waarom werkt een ping naar een ver subnet niet als de routers enkel hun direct verbonden netwerken kennen?",
        o: ["De hosts hebben geen IP-adres", "De router heeft geen route naar dat verre netwerk, dus het pakket wordt niet verder gestuurd", "ARP werkt niet over routers", "De switch blokkeert het verkeer"],
        a: 1, e: "Zonder statische of dynamische routes kent een router enkel de direct verbonden netwerken. Voor een ver netwerk is er geen route en het pakket stopt daar." },
      { q: "Wat is het belangrijkste nadeel van statische routes in een groot netwerk?",
        o: ["Ze verbruiken veel bandbreedte", "Ze moeten handmatig aangepast worden en passen zich niet automatisch aan bij uitval", "Ze werken enkel met RIP", "Ze zijn trager dan dynamische routes"],
        a: 1, e: "Statische routes zijn eenvoudig maar vragen handwerk bij elke wijziging. Als een link of router uitvalt, blijft de route bestaan en past het netwerk zich niet aan." },
      { q: "Wat is de metric van RIP?",
        o: ["Bandbreedte van de link", "Aantal hops (maximum 15)", "Vertraging in milliseconden", "De kost berekend met het algoritme van Dijkstra"],
        a: 1, e: "RIP telt hops. 16 hops betekent onbereikbaar. De snelheid van een link telt niet mee." },
      { q: "Wat is het fundamentele verschil tussen RIP en OSPF?",
        o: ["RIP is link-state, OSPF is distance-vector", "RIP deelt zijn tabel met buren (distance-vector), OSPF deelt linkinformatie met alle routers en elke router rekent zelf het kortste pad uit (link-state)", "RIP werkt enkel op Layer 2", "OSPF gebruikt geen metric"],
        a: 1, e: "RIP: distance-vector, hops, traag. OSPF: link-state, elke router bouwt de LSDB en rekent zelf met Dijkstra, snel en schaalbaar." },
      { q: "Wat betekent de OSPF-toestand Full tussen twee buren?",
        o: ["De link is volledig bezet", "De buur is gevonden, maar nog niet gesynchroniseerd", "De link-state databases van beide buren zijn volledig gesynchroniseerd", "De buur is uitgevallen"],
        a: 2, e: "Full is de eindtoestand van de adjacency: beide routers hebben dezelfde LSDB." },
      { q: "Welk protocol convergeert meestal sneller na het uitvallen van een link?",
        o: ["RIP", "OSPF", "Beide even snel", "Geen van beide, enkel statische routes passen aan"],
        a: 1, e: "OSPF detecteert het via Hello-pakketten, verspreidt een update en elke router herberekent meteen. RIP wacht op timeouts en verspreidt het nieuws hop per hop." },

      /* Vragen uit de echte Test Lab 2 (19-10-2026). Eigen score: 7/10. */
      { q: "Three routers are connected in a chain: R1 – R2 – R3. Host A (10.1.0.10/24) is connected to R1. Its default gateway is R1. Host C (10.3.0.10/24) is connected to R3. Its default gateway is R3. No dynamic routing is used. Each router knows its directly connected networks, and the administrator has added only these two static routes: on R1: 10.3.0.0/24 via R2; on R2: 10.3.0.0/24 via R3. No router has a default route. Host A pings Host C. What happens?",
        o: ["The ping fails: Host C receives the request, but R3 discards the reply, because R3 has no route to 10.1.0.0/24",
            "The ping fails: R2 discards the request, because R2 has no route to Host A's network 10.1.0.0/24",
            "The ping fails: Host C receives the request, but does not reply, because Host C itself has no route to 10.1.0.0/24",
            "The ping succeeds: Host C receives the request, and the reply travels back along the same path",
            "The ping fails: Host C receives the request, but R2 discards the reply, because R2 has no route to 10.1.0.0/24"],
        a: 0, e: "Het request komt aan: R1 en R2 hebben een route naar 10.3.0.0/24. Het antwoord gaat van Host C naar zijn gateway R3, en R3 kent 10.1.0.0/24 niet, dus R3 gooit het weg. Host C zelf heeft wel een route, want hij heeft een default gateway. R2 komt in het antwoord niet eens aan bod, want het antwoord stopt al bij R3. (Juist beantwoord in de echte test.)" },
      { q: "Which statement correctly describes what routers exchange with RIP and with OSPF?",
        o: ["RIP and OSPF: each router periodically sends its complete routing table to its neighbors",
            "RIP and OSPF: each router sends information about its own links to all routers in the area",
            "RIP: each router periodically sends its complete routing table to its neighbors. OSPF: each router sends information about its own links to all routers in the area",
            "RIP: each router sends information about its own links to all routers in the area. OSPF: each router periodically sends its complete routing table to its neighbors"],
        a: 2, e: "RIP is distance-vector: periodiek de volledige routingtabel naar de buren. OSPF is link-state: informatie over de eigen links (LSA's) naar alle routers in de area. Optie D draait die twee om. (Fout beantwoord in de echte test: optie D gekozen.)" },
      { q: "A network has redundant paths. A link fails. Why does the network switch to the alternative path faster when all routers run OSPF than when all routers run RIP?",
        o: ["OSPF always uses the path with the fewest hops, so fewer routers need to update their routing tables",
            "OSPF routers send their complete routing table to their neighbors more often than RIP routers do",
            "OSPF routers forward data packets faster than RIP routers, so traffic reaches the alternative path sooner",
            "OSPF routers send an update as soon as a change occurs, while RIP routers exchange routing information only at regular intervals"],
        a: 3, e: "OSPF verstuurt een update (LSA) meteen bij een wijziging en elke router herberekent. RIP wisselt enkel op vaste tijdstippen informatie uit en wacht op timeouts. OSPF kiest op cost en niet op hops, het stuurt niet zijn volledige tabel en doorsturen van data is even snel. (Juist beantwoord in de echte test.)" },
      { q: "Which of the following is an advantage of static routing compared with dynamic routing?",
        o: ["It requires no routing protocol, so it uses fewer router resources",
            "Routes adapt automatically when a link fails",
            "Routers automatically choose the best path based on current network conditions",
            "It scales more easily to large networks"],
        a: 0, e: "Statische routing heeft geen protocol, dus geen extra CPU, geheugen of verkeer. De andere drie opties zijn voordelen van dynamische routing. (Juist beantwoord in de echte test.)" },
      { q: "A router forwards a packet from one network to another. No address translation is used. What happens to the MAC and IP addresses in the packet?",
        o: ["MAC addresses: the router uses a new source and a new destination MAC address. IP addresses: stay the same.",
            "MAC addresses: stay the same. IP addresses: the router replaces the destination IP address with the IP address of the next router.",
            "MAC addresses: stay the same. IP addresses: stay the same.",
            "MAC addresses: only the destination MAC address changes; the source MAC address remains that of the original sender. IP addresses: stay the same.",
            "MAC addresses: stay the same. IP addresses: the router replaces the source IP address with its own IP address."],
        a: 0, e: "Het Ethernet-frame wordt bij elke hop vervangen: nieuw bron-MAC (de uitgaande interface van de router) en nieuw bestemmings-MAC (de volgende hop). De IP-adressen blijven hetzelfde zolang er geen NAT is. Enkel TTL en checksum veranderen. (Juist beantwoord in de echte test.)" },
      { q: "Host A wants to send a packet to Host B, which is in a different network. To which device does Host A send the packet, so that the packet can be forwarded to Host B's network?",
        o: ["To all hosts on its own network, because Host A does not know where Host B is",
            "To its default gateway, because Host B is outside Host A's network",
            "To the Layer 2 switch it is connected to, because the switch forwards packets based on Host B's IP address",
            "Directly to Host B, because Host A knows Host B's IP address"],
        a: 1, e: "Een bestemming buiten het eigen subnet bereik je via de default gateway. Een switch kijkt naar MAC-adressen en niet naar IP-adressen, en rechtstreeks versturen kan enkel binnen hetzelfde subnet. (Juist beantwoord in de echte test.)" },
      { q: "Router R1 has the following static route: 192.168.3.0/24 via 10.0.0.2. What does this route mean?",
        o: ["R1 forwards packets for the network 192.168.3.0/24 to the next-hop router with IP address 10.0.0.2",
            "R1 forwards packets for the network 192.168.3.0/24 to the next-hop router with IP address 10.0.0.2, and automatically uses another router if 10.0.0.2 becomes unreachable",
            "R1 forwards packets that it receives from 10.0.0.2 to the network 192.168.3.0/24",
            "R1 replaces the destination IP address of packets for the network 192.168.3.0/24 with 10.0.0.2"],
        a: 0, e: "Een statische route is een bestemmingsprefix met een next hop (de gateway). Het bestemmings-IP in het pakket blijft ongewijzigd, enkel het MAC wordt dat van de next hop. Een statische route past zich niet automatisch aan bij uitval. (Juist beantwoord in de echte test.)" },
      { q: "Host A (192.168.1.10) and Host B (192.168.2.20) are connected to the same switch. Neither host has a default gateway. Both hosts are configured with the same subnet mask. With which subnet mask can the two hosts ping each other?",
        o: ["With none of these masks, because hosts in different IP address ranges always need a router",
            "255.255.255.128",
            "255.255.255.0",
            "With any of these masks, because the hosts are connected to the same switch",
            "255.255.0.0"],
        a: 4, e: "Enkel met 255.255.0.0 (/16) liggen 192.168.1.10 en 192.168.2.20 in hetzelfde subnet (192.168.0.0/16), zodat de hosts rechtstreeks via ARP communiceren. Met /24 of /25 liggen ze in verschillende subnetten en is er zonder gateway geen verkeer. Dat ze aan dezelfde switch hangen, doet er niet toe. (Juist beantwoord in de echte test.)" },
      { q: "A router receives a packet whose destination network is not in its routing table. The router has no default route. What does the router do with the packet?",
        o: ["It floods the packet out of all its interfaces",
            "It sends the packet back to the source host",
            "It sends an ARP broadcast for the destination IP address",
            "It discards the packet"],
        a: 3, e: "Zonder route en zonder default route gooit de router het pakket weg (meestal met een ICMP destination unreachable naar de bron, maar het pakket zelf is weg). Een router flood niet, stuurt het niet terug en doet geen ARP voor een bestemming in een ander netwerk, want ARP werkt enkel op het eigen netwerk. (Fout beantwoord in de echte test: optie C gekozen.)" },
      { q: "Host A (192.168.1.10/24, default gateway 192.168.1.1) pings Host B (192.168.2.20). Host A already knows the MAC address of its default gateway. Which destination MAC address and destination IP address does Host A put in the frame that carries the ping?",
        o: ["Destination MAC: the broadcast address. Destination IP: 192.168.1.1",
            "Destination MAC: Host B's MAC address. Destination IP: 192.168.1.1",
            "Destination MAC: the broadcast address. Destination IP: 192.168.2.20",
            "Destination MAC: the gateway's MAC address. Destination IP: 192.168.1.1",
            "Destination MAC: the gateway's MAC address. Destination IP: 192.168.2.20",
            "Destination MAC: Host B's MAC address. Destination IP: 192.168.2.20"],
        a: 4, e: "Het bestemmings-IP is altijd dat van de eindbestemming (192.168.2.20), want het IP-pakket moet daar uiteindelijk aankomen. Het bestemmings-MAC is dat van de default gateway, want enkel de volgende hop is bereikbaar op Layer 2. Het gateway-IP komt nooit als bestemmings-IP van de ping te staan. (Fout beantwoord in de echte test: optie D gekozen, met het gateway-IP als bestemmings-IP.)" }
    ]
  },
  {
    n: 3,
    title: "Spanning Tree Protocol (STP)",
    note: "",
    kb: `
<h3>Waar gaat dit labo over</h3>
<p>In dit labo bouw je Layer 2 netwerken met redundante links en gebruik je het Spanning Tree Protocol (STP) om loops te voorkomen, connectiviteit te behouden en te herstellen na storingen. Je bouwt eerst een access netwerk met zes switches, daarna laat je links en switches uitvallen, en tot slot breid je uit naar een core netwerk met vier core switches in een volledige mesh. Je identificeert de root bridge en de rollen van de poorten, je beïnvloedt de uitkomst met bridge priority en path cost, en je analyseert hoe lang het netwerk nodig heeft om te herstellen. Als je een oefening afrondt, verwittig je de lector voor je verdergaat.</p>

<h3>Vorm van de test</h3>
<p>Net als bij Lab 2 is er aan het begin van het labo een korte meerkeuzetest. De opgave zegt dat het om begrip gaat en niet om memoriseren: je moet geen commando's, syntax of getallen zoals timerwaarden kennen, maar kunnen uitleggen wat er gebeurt in een geschakeld netwerk met redundante links en waarom.</p>

<h3>Bron voor de voorbereiding</h3>
<p>In Lab3.pdf, sectie 1 Preparation op pagina 3, staan de bronnen: vijf lessen van NetworkAcademy.io (Why do we need Spanning-Tree, The Spanning-Tree Algorithm, Spanning-Tree Port Roles, STP Port States and Timers en STP Topology Changes), het artikel Types of Spanning Tree Protocol van GeeksforGeeks en de video Spanning Tree Protocol van PowerCert (de eerste 8,5 minuten). Wat hieronder staat komt uit mijn eigen kennis van die onderwerpen. Ik heb de lessen zelf niet kunnen lezen, dus lees ze ook zelf door.</p>

<h3>A. Waarom is een loop een probleem</h3>
<p>Een Ethernet-frame heeft geen TTL. Een broadcast, een multicast of een frame voor een onbekend bestemmings-MAC wordt door elke switch naar alle andere poorten gestuurd. In een netwerk met een lus blijft zo'n frame eindeloos rondgaan en elke switch maakt er bij elke passage kopieën van. Dat heet een broadcast storm: de links raken vol, de CPU van de switches loopt vast en het netwerk valt uit. Een tweede gevolg is dat de MAC-tabel flapt: hetzelfde bron-MAC wordt snel na elkaar op verschillende poorten gezien, waardoor switches niet meer weten waar een toestel hangt. Een derde gevolg zijn dubbele frames bij de ontvanger. Toch wil je redundante links, want ze zorgen ervoor dat het netwerk blijft werken als een link of switch uitvalt. STP lost dit op door de redundante links logisch uit te schakelen zolang ze niet nodig zijn.</p>

<h3>B. Het algoritme</h3>
<p>STP bouwt een boom zonder lussen (de spanning tree) in drie stappen. Eerst wordt één switch gekozen als root bridge. Daarna kiest elke andere switch zijn root port, en tot slot kiest elk netwerksegment (elke link) zijn designated port. Alle poorten die geen van beide zijn, worden geblokkeerd. De switches wisselen hiervoor BPDU's (Bridge Protocol Data Units) uit, naar een multicast-adres, standaard elke 2 seconden (hello time).</p>
<p>De bridge ID bestaat uit een priority (standaard 32768, of 32767 op OpenWrt) en het MAC-adres van de switch. De switch met de laagste bridge ID wordt de root. Bij gelijke priority beslist dus het laagste MAC-adres. Elke switch begint met te denken dat hij zelf de root is en past dat aan zodra hij een BPDU met een lagere root-ID ontvangt. Met een lagere priority kan een beheerder een bepaalde switch als root afdwingen, bijvoorbeeld een core switch.</p>
<p>De kost van een link hangt af van de snelheid (klassiek: 10 Mbit/s kost 100, 100 Mbit/s kost 19, 1 Gbit/s kost 4, 10 Gbit/s kost 2: hoe sneller, hoe lager). De root path cost is de som van de kosten van alle links op het pad naar de root.</p>

<h3>C. De poortrollen</h3>
<p>De root port is op elke niet-root switch de ene poort met de laagste root path cost naar de root. De root zelf heeft geen root port. Bij gelijke kost beslist de laagste bridge ID van de buur en daarna de laagste poort-ID.</p>
<p>De designated port is op elke link de poort aan de kant met de laagste root path cost. Bij gelijkspel wint de switch met de laagste bridge ID, en dan de laagste poort-ID. Alle poorten van de root zijn designated. Een designated port stuurt BPDU's en verstuurt data.</p>
<p>De overige poorten zijn non-designated (in Cisco-termen alternate): ze zijn geblokkeerd, ontvangen wel BPDU's en kunnen overnemen als het pad uitvalt. Root ports en designated ports sturen verkeer door. In een netwerk met N switches blijven er N-1 links in de boom over, op alle andere links blokkeert één kant.</p>

<h3>D. Poortstatussen en timers</h3>
<p>Een poort in klassiek STP (802.1D) doorloopt: blocking, listening, learning, forwarding (en disabled als hij uit staat). In blocking ontvangt de poort enkel BPDU's. In listening neemt hij deel aan de verkiezing, maar leert nog geen MAC-adressen en stuurt geen data door. In learning vult hij al zijn MAC-tabel, maar stuurt nog geen data door. In forwarding werkt hij normaal. Die tussenfases bestaan om te vermijden dat er tijdelijk een lus ontstaat terwijl de boom nog niet stabiel is.</p>
<p>De drie timers zijn hello time (tijd tussen BPDU's), forward delay (duur van listening en van learning) en max age (hoelang een switch een ontvangen BPDU bewaart zonder nieuwe te zien voor hij denkt dat het pad weg is). De klassieke waarden zijn 2 s, 15 s en 20 s. Na een wijziging duurt het dan 30 tot 50 s voor een poort data doorstuurt: eventueel eerst max age (20 s) wachten als het verlies niet direct zichtbaar was, daarna 15 s listening en 15 s learning. Op de OpenWrt-switches in het labo staat de forward delay standaard op 2 s, waardoor het veel sneller gaat.</p>
<p>Als een link rechtstreeks uitvalt (link down), zie je dat meteen en begint de herberekening zonder max age. Als de link blijft bestaan maar de BPDU's wegblijven (bijvoorbeeld door een tussenliggend toestel dat uitvalt), moet eerst max age verlopen.</p>

<h3>E. Topology changes</h3>
<p>Als een poort naar of van forwarding gaat, is dat een topologiewijziging. De switch meldt dat met een TCN-BPDU (Topology Change Notification) richting de root. De root zet daarna in zijn BPDU's de Topology Change flag aan, gedurende max age plus forward delay, en alle switches verkorten hun MAC-ageing time tot de forward delay. Zo verdwijnen oude MAC-adresvermeldingen snel en worden frames weer correct verstuurd, anders sturen switches nog naar poorten die niet meer bij het toestel horen. Tijdens die periode wordt er meer geflood.</p>
<p>Een link die uitvalt en niet in de boom lag (een geblokkeerde link) veroorzaakt geen topologiewijziging. Een nieuwe switch met een lagere bridge ID neemt de rol van root altijd over: STP kent geen voorkeur voor de zittende root.</p>

<h3>F. Varianten van STP</h3>
<p>STP (802.1D) is de klassieke versie met één boom en trage convergentie (30 tot 50 s). RSTP (802.1w) heeft dezelfde basis, maar convergeert in enkele seconden doordat switches via handshakes (proposal en agreement) onderling afspreken wanneer een poort mag forwarden, in plaats van op timers te wachten. De toestanden zijn dan discarding, learning en forwarding, en er is een extra rol alternate (reserve voor de root port) en backup (reserve voor een designated port). PVST+ is de Cisco-variant met een aparte spanning tree per VLAN, zodat verkeer van verschillende VLAN's over verschillende links gespreid kan worden. MSTP (802.1s) groepeert meerdere VLAN's in een beperkt aantal instanties met elk een eigen boom, wat minder overhead geeft dan een boom per VLAN. De Linux-bridge op de OpenWrt-switches in het labo gebruikt klassiek STP.</p>

<h3>G. Wat je in het labo ziet</h3>
<p>Met brctl showstp op een switch zie je de bridge ID, de designated root, de root port en per poort de state en de designated bridge. In Wireshark (filter stp) zie je de BPDU's met onder meer Root Identifier, Root Path Cost, Bridge Identifier, Port Identifier, Hello Time, Max Age, Forward Delay en de Topology Change flag. Een switch die geen root is, gebruikt de timers van de root, niet zijn eigen instelling. Met een lagere bridge priority maak je een switch root. Zet je STP uit en sluit je een lus, dan krijg je een broadcast storm: pings falen en de switches reageren niet meer. In een volledige mesh van vier core switches hebben alle non-root core switches een gelijkspel op de onderlinge links, dat wordt opgelost met de laagste bridge ID. Hangt een access switch maar aan één core switch, dan is hij niet redundant: valt die core switch uit, dan verliest hij zijn uplink, ook al is STP perfect geconfigureerd.</p>
`,
    qs: [
      { q: "Waarom is een lus (loop) in een Ethernet-netwerk zonder STP gevaarlijk?",
        o: ["Frames hebben geen TTL, dus broadcasts blijven eindeloos ronddraaien en vermenigvuldigen zich", "Switches kunnen geen unicastframes meer doorsturen", "IP-adressen botsen met elkaar", "De switch verlaagt automatisch de linksnelheid"],
        a: 0, e: "Een Ethernet-frame heeft geen TTL. Broadcasts worden door elke switch naar alle poorten gestuurd, dus in een lus blijven ze eindeloos ronddraaien (broadcast storm) en raken de links en CPU's vol." },
      { q: "Welke twee problemen ontstaan er naast de broadcast storm in een netwerk met een lus?",
        o: ["MAC-adrestabellen die flappen en dubbele frames bij de ontvanger", "Het subnetmasker verandert vanzelf en de DHCP-server valt uit", "De routers stoppen met routeren en ARP werkt niet meer", "De switch weigert alle BPDU's"],
        a: 0, e: "Hetzelfde bron-MAC verschijnt op meerdere poorten (MAC flapping) en een ontvanger krijgt meerdere kopieën van hetzelfde frame." },
      { q: "Welke switch wordt de root bridge?",
        o: ["De switch met het hoogste MAC-adres", "De switch met de laagste bridge ID (priority en daarna MAC-adres)", "De switch met de meeste poorten", "De switch die het eerst werd opgestart"],
        a: 1, e: "De bridge ID bestaat uit priority en MAC-adres. De laagste wint. Bij gelijke priority beslist het laagste MAC-adres." },
      { q: "Hoe kan een beheerder afdwingen dat een bepaalde switch de root wordt?",
        o: ["Door die switch een lagere bridge priority te geven dan alle andere", "Door het MAC-adres van de switch te verhogen", "Door de hello time van die switch te verlagen", "Door alle andere poorten uit te schakelen"],
        a: 0, e: "De priority staat vooraan in de bridge ID, dus een lagere priority wint van het MAC-adres. Zo kan je bijvoorbeeld een core switch root maken." },
      { q: "Wat is een root port?",
        o: ["De poort van een niet-root switch met de laagste root path cost naar de root bridge", "Elke poort van de root bridge", "Een geblokkeerde poort", "De poort waar de beheerder verbinding mee maakt"],
        a: 0, e: "Elke niet-root switch heeft precies één root port: de poort met de laagste kost naar de root. De root zelf heeft er geen." },
      { q: "Op een link tussen twee switches hebben beide kanten dezelfde root path cost. Hoe wordt bepaald welke poort designated wordt?",
        o: ["De poort aan de kant van de switch met de laagste bridge ID", "De poort aan de kant van de switch met het hoogste MAC-adres", "Willekeurig, bij elke herberekening opnieuw", "Beide poorten blijven data doorsturen"],
        a: 0, e: "Bij gelijke kost wint de switch met de laagste bridge ID (en daarna de laagste poort-ID). De andere kant wordt geblokkeerd." },
      { q: "Wat doet een geblokkeerde poort (non-designated)?",
        o: ["Ze ontvangt BPDU's maar stuurt geen data door", "Ze stuurt wel data door, maar geen BPDU's", "Ze staat uit en reageert nergens op", "Ze stuurt enkel broadcasts door"],
        a: 0, e: "Een geblokkeerde poort luistert naar BPDU's, zodat ze kan overnemen als het pad uitvalt, maar stuurt geen data door." },
      { q: "Wat is het verschil tussen de listening- en de learning-toestand?",
        o: ["Listening neemt deel aan de verkiezing zonder MAC-adressen te leren, learning leert MAC-adressen maar stuurt nog geen data door", "Listening stuurt data door, learning niet", "Learning wordt overgeslagen bij een directe linkstoring", "Er is geen verschil, het zijn twee namen voor hetzelfde"],
        a: 0, e: "Pas in forwarding wordt data doorgestuurd. Listening en learning (elk één forward delay) voorkomen tijdelijke lussen terwijl de boom nog niet stabiel is." },
      { q: "Een link in de spanning tree valt rechtstreeks uit (kabel eruit). Waarom herstelt STP dan sneller dan wanneer de link blijft bestaan maar de BPDU's wegblijven?",
        o: ["Bij link down start de herberekening meteen, anders moet eerst de max age verlopen", "Bij link down wordt STP volledig uitgeschakeld", "Omdat de hello time dan automatisch naar 0 gaat", "Er is geen verschil in hersteltijd"],
        a: 0, e: "Bij link down zie je de storing direct. Als enkel de BPDU's wegblijven, wacht de switch tot de bewaarde BPDU zijn max age bereikt (klassiek 20 s) en begint dan pas." },
      { q: "Wat gebeurt er met een geblokkeerde link als een actieve link in de boom uitvalt?",
        o: ["De geblokkeerde poort gaat via listening en learning naar forwarding en neemt het verkeer over", "Hij blijft geblokkeerd tot een beheerder ingrijpt", "Hij gaat meteen naar forwarding zonder tussenfases", "Hij wordt permanent uitgeschakeld"],
        a: 0, e: "STP herberekent de boom, de redundante link wordt gebruikt en de poort doorloopt de overgangsstatussen voor hij data doorstuurt." },
      { q: "Wat gebeurt er met een host die aan precies één access switch hangt als die access switch uitvalt?",
        o: ["De host verliest zijn connectiviteit, want er is geen alternatief pad", "STP schakelt de host automatisch over op een andere switch", "De host krijgt automatisch een nieuw IP-adres", "Niets, STP lost dit altijd op"],
        a: 0, e: "STP herstelt enkel via redundante paden in het netwerk. Een host met één verbinding heeft er geen." },
      { q: "Waarom is een topology change (TCN) belangrijk?",
        o: ["De switches laten hun MAC-tabel sneller verlopen, zodat frames niet meer naar poorten gaan die niet meer correct zijn", "De root wordt automatisch vervangen", "De switch herstart", "Alle poorten worden geblokkeerd"],
        a: 0, e: "Na een wijziging kunnen MAC-vermeldingen niet meer kloppen. De root zet de Topology Change flag aan en switches verkorten hun ageing time." },
      { q: "De root bridge valt uit. Wat bepaalt wie de nieuwe root wordt?",
        o: ["De laagste bridge ID van de overgebleven switches", "De switch die het dichtst bij de oude root hing", "De switch met de meeste poorten", "De oude root, die zichzelf herstart"],
        a: 0, e: "Er wordt opnieuw een verkiezing gehouden en de laagste bridge ID wint. Daarom stel je een secundaire root in met de op een na laagste priority." },
      { q: "De oude root komt terug online en zijn bridge ID is lager dan die van de huidige root. Wat gebeurt er?",
        o: ["Hij wordt opnieuw root en de boom wordt herberekend", "Hij blijft permanent niet-root", "Hij moet wachten tot de huidige root uitvalt", "Het netwerk blijft ongewijzigd"],
        a: 0, e: "STP kent geen voorkeur voor de zittende root: de beste bridge ID wint altijd, en dat geeft een nieuwe topologiewijziging." },
      { q: "Wat is het belangrijkste voordeel van RSTP (802.1w) ten opzichte van klassiek STP (802.1D)?",
        o: ["Veel snellere convergentie via handshakes tussen switches in plaats van wachten op timers", "Het ondersteunt geen redundante links meer", "Het gebruikt geen BPDU's", "Het werkt enkel op routers"],
        a: 0, e: "RSTP herstelt in enkele seconden. Klassiek STP heeft 30 tot 50 s nodig door de timers (max age, listening, learning)." },
      { q: "Wat doet PVST+ anders dan klassiek STP?",
        o: ["Het draait een aparte spanning tree per VLAN", "Het draait enkel op Layer 3", "Het gebruikt één boom voor alle VLAN's", "Het vervangt STP door OSPF"],
        a: 0, e: "PVST+ (Cisco) heeft een boom per VLAN, zodat verkeer van verschillende VLAN's over verschillende links gespreid kan worden." },
      { q: "Waarom werkt een netwerk met veel extra loops niet goed met STP op eenvoudige switches?",
        o: ["Meer BPDU's, herberekeningen en een zwakke CPU: als BPDU's te laat komen kan een poort ten onrechte data doorsturen en ontstaat een storm", "Omdat STP maximaal één loop toelaat", "Omdat IP-adressen opraken", "Omdat de poorten dan automatisch van snelheid wisselen"],
        a: 0, e: "Elke extra loop betekent meer verwerking en meer topologiewijzigingen. Bij overbelasting gaan BPDU's verloren en kan een poort per ongeluk forwarden. Bovendien gebruikt STP maar één boom, dus extra links leveren geen extra capaciteit." }
    ]
  },
  {
    n: 4,
    title: "VLANs, VLAN trunking and VLAN routing",
    note: "",
    kb: `
<h3>Waar gaat dit labo over</h3>
<p>In dit labo segmenteer je een Layer 2 netwerk met VLAN's, transporteer je het verkeer van meerdere VLAN's over één kabel met trunkpoorten en 802.1Q-tags, en laat je de VLAN's met elkaar praten via inter-VLAN routing met een router on a stick. Je werkt met dezelfde acht switches als in Lab 3 (vier access switches en vier core switches in een volledige mesh), maar nu met VLAN's in plaats van STP als hoofdthema. STP blijft wel aan staan, anders maken de trunklinks een lus. Je analyseert de tags met port mirroring en Wireshark. Als je een oefening afrondt, verwittig je de lector voor je verdergaat.</p>

<h3>Vorm van de test</h3>
<p>Net als bij Lab 2 en Lab 3 is er aan het begin een korte meerkeuzetest. Het gaat om begrip: je moet geen commando's of syntax kennen, wel kunnen uitleggen wat er in een netwerk met VLAN's gebeurt en waarom, bijvoorbeeld waarom er geen verbinding is tussen VLAN's en hoe de tag eruitziet.</p>

<h3>Bron voor de voorbereiding</h3>
<p>In Lab4.pdf, sectie 1 Preparation op pagina 3, staan drie bronnen: het artikel Virtual Local Area Networks (VLANs) van Practical Networking (let op de woordkeuze), het artikel Routing Between VLANs &amp; Layer 3 Switches (de Cisco-commando's hoef je niet te leren) en het artikel Inter-Switch Link and IEEE 802.1Q Frame Format van Cisco (enkel het deel over 802.1Q). Wat hieronder staat komt uit mijn eigen kennis van die onderwerpen. Ik heb de artikels zelf niet kunnen lezen, dus lees ze ook zelf door.</p>

<h3>A. Wat is een VLAN en waarom</h3>
<p>Een VLAN (Virtual LAN) verdeelt één fysieke switch of één fysiek netwerk in meerdere logische Layer 2 netwerken. Elk VLAN is een eigen broadcast domain: een broadcast (bijvoorbeeld een ARP-request) bereikt enkel de poorten van hetzelfde VLAN. Daardoor kunnen hosts in verschillende VLAN's elkaar niet bereiken, ook al hangen ze aan dezelfde switch. De switch houdt per VLAN een aparte MAC-tabel bij en stuurt een frame enkel naar poorten van het VLAN waartoe het frame behoort.</p>
<p>De voordelen zijn minder broadcastverkeer, betere beveiliging (afdelingen worden gescheiden) en flexibiliteit, want de groepering hangt af van configuratie en niet van de kabels. Elk VLAN krijgt in de regel een eigen IP-subnet. Omdat de VLAN's gescheiden broadcast domains zijn, is er voor verkeer tussen twee VLAN's een router (Layer 3) nodig.</p>

<h3>B. Access- en trunkpoorten, tagged en untagged</h3>
<p>Een access-poort behoort tot één VLAN en is bedoeld voor eindapparaten zoals pc's, printers en servers. Die apparaten kennen geen VLAN-tags, dus de switch werkt in beide richtingen zonder tag: een binnenkomend untagged frame krijgt het VLAN van de poort (de PVID, Port VLAN ID), en bij het buitengaan haalt de switch de tag weg. Op OpenWrt noem je dat een untagged poort, in de GUI aangeduid met U (en U* als de poort ook de PVID is).</p>
<p>Een trunkpoort verbindt switches en transporteert meerdere VLAN's over één kabel. Daarvoor wordt elk frame voorzien van een 802.1Q-tag met het VLAN-nummer. De poort is dan een tagged (T) lid van die VLAN's. Zo weet de switch aan de andere kant bij welk VLAN een frame hoort. Tag je een VLAN niet op de trunk, dan kan dat VLAN niet over de link: hosts van dat VLAN aan verschillende switches kunnen elkaar niet bereiken, of het verkeer lekt in een ander VLAN als de poort untagged lid is. Op een trunk geef je daarom geen untagged VLAN/PVID als alle frames een tag moeten dragen.</p>
<p>Alle poorten in VLAN 1 (het default VLAN, untagged) betekent dat het netwerk zich gedraagt als één gewone, niet-gesegmenteerde switch. Het beheer-IP van de switch zit standaard enkel in VLAN 1: wil je een switch beheren, dan sluit je je pc aan op een VLAN 1 poort.</p>

<h3>C. De IEEE 802.1Q-tag</h3>
<p>De tag is 4 bytes (32 bits) en wordt in het Ethernet-frame ingevoegd tussen het bron-MAC-adres en het EtherType/lengteveld (Layer 2, MAC-sublaag). Hij bestaat uit: TPID (16 bits, waarde 0x8100, geeft aan dat het een 802.1Q-frame is), PCP (3 bits, Priority Code Point, voor Quality of Service), DEI (1 bit, Drop Eligible Indicator) en VID (12 bits, het VLAN-nummer). Doordat de tag 12 bits heeft voor het VLAN-nummer, zijn er 4096 waarden, waarvan 0 en 4095 gereserveerd zijn, dus 4094 bruikbare VLAN's (1 tot 4094). Dat is de reden van de grens op het aantal VLAN's. Door de extra 4 bytes kan het frame 1522 bytes worden in plaats van 1518.</p>

<h3>D. Inter-VLAN routing</h3>
<p>Een Layer 2 switch kan niet tussen VLAN's routeren. Er zijn twee gebruikelijke oplossingen. Bij router on a stick is de router met één trunklink verbonden en maakt hij per VLAN een logische sub-interface (op Linux lan2.1, lan2.2, ...), elk met een IP-adres in het subnet van dat VLAN. Dat adres is de default gateway van de hosts in dat VLAN. Een pakket van VLAN 2 naar VLAN 3 komt getagd met VLAN 2 aan op de router, wordt gerouteerd en gaat over dezelfde kabel terug, nu getagd met VLAN 3. Op de link naar de router zie je dus elk pakket twee keer. Alle sub-interfaces delen dezelfde fysieke poort en dus hetzelfde MAC-adres, maar het VLAN-ID scheidt de netwerken.</p>
<p>Een Layer 3 switch combineert switching en routing in één toestel, met een virtuele interface (SVI) per VLAN, en routeert meestal in hardware, wat sneller is. Router on a stick is goedkoper maar de ene trunklink is een bottleneck, omdat al het verkeer tussen VLAN's er twee keer over gaat.</p>

<h3>E. Wat je in het labo doet</h3>
<p>Je bouwt eerst de opstelling zonder VLAN's: firewall uit, de pakketten ip-full, ip-bridge en tc-full installeren (daarna de nieuwe WAN-interface terug op LAN zetten), STP aan op alle switches vóór je kabels aansluit, alle poorten untagged in VLAN 1 en pas verder gaan als je volledige connectiviteit hebt. Daarna maak je vier VLAN's: op een access switch zitten poort 1 tot 5 in het VLAN van de eigen switch en de poorten 6 tot 8 elk in een van de andere VLAN's, op een core switch zitten twee poorten per VLAN. Je doet dat in LuCI onder Network, Interfaces, Devices en dan Bridge VLAN filtering. Met bridge vlan show op de command line zie je de tabel.</p>
<p>Voor de trunks maak je de uplinks en de core-links tagged lid van alle vier de VLAN's. De hostpoorten blijven access, en op de core switches blijven de poorten die niet in een trunk zitten untagged in VLAN 1, zodat beheer makkelijk blijft. Met poortmirroring (tc met clsact en een mirred-actie) kopieer je het verkeer van een trunkpoort naar een vrije poort, waar je laptop met Wireshark hangt. Op een access-poort zie je geen tags, want die worden daar weggehaald; op een trunkpoort wel.</p>
<p>Tot slot voer je routing in. De hosts krijgen een /24-masker en als gateway 10.1.n.254. De switches krijgen een beheer-IP in het VLAN 1-subnet (10.1.1.1 tot 10.1.1.8, met /24) en als gateway 10.1.1.254. De router haalt lan2 uit de bridge, maakt de devices lan2.1 tot lan2.4 (VLAN 802.1Q) en per VLAN een interface met 10.1.n.254/24, zonder gateway en zonder DHCP. De switchpoort naar de router is tagged lid van de VLAN's 1 tot 4 zonder untagged VLAN. Met cat /proc/net/vlan/config, ip addr en ip route controleer je de router.</p>

<h3>F. Wat je in het labo ziet</h3>
<p>Een host in het ene VLAN kan geen host in een ander VLAN bereiken zolang er geen router is, ook niet via de trunks. Hosts in hetzelfde VLAN aan verschillende switches kunnen elkaar wel bereiken zolang dat VLAN op elke trunk ertussen getagd is. Een /16-masker werkt zonder router nog (alle hosts liggen op papier in hetzelfde subnet) maar met een router moet elk VLAN een eigen subnet hebben, anders denkt de host dat een host in een ander VLAN lokaal bereikbaar is en stuurt hij nooit naar de gateway. Als VLAN 3 niet getagd is op de poort naar de router, krijgt VLAN 3 geen gateway en komt er geen enkel antwoord van het 10.1.3.254-interface. Als een router-interface een verkeerd IP of masker heeft, kunnen de hosts van dat VLAN hun gateway niet bereiken. Een traceroute binnen een VLAN toont één hop, naar een ander VLAN twee hops (de router en dan de bestemming).</p>
`,
    qs: [
      { q: "Wat is een VLAN?",
        o: ["Een logisch Layer 2 netwerk (broadcast domain) op een fysieke switch of netwerk", "Een versleutelde tunnel tussen twee sites", "Een draadloos netwerk", "Een routingprotocol"],
        a: 0, e: "Een VLAN verdeelt een fysiek netwerk in meerdere logische Layer 2 netwerken. Elk VLAN is een apart broadcast domain." },
      { q: "Twee hosts hangen aan dezelfde switch maar in verschillende VLAN's. Hoe is de communicatie tussen beide?",
        o: ["Ze communiceren normaal, want ze hangen aan dezelfde switch", "Zonder router is er geen communicatie, want elk VLAN is een apart broadcast domain", "Enkel broadcasts komen door", "Enkel als het masker /16 is"],
        a: 1, e: "De switch stuurt frames enkel naar poorten van hetzelfde VLAN. Voor verkeer tussen VLAN's is een Layer 3 apparaat (router) nodig, ook als de hosts aan dezelfde switch hangen." },
      { q: "Waarom is er een router nodig voor verkeer tussen twee VLAN's?",
        o: ["Een switch kan geen frames doorsturen", "Elk VLAN is een eigen broadcast domain en subnet, en een Layer 2 switch routeert niet", "Omdat VLAN's geen MAC-adressen hebben", "Omdat de tag het pakket versleutelt"],
        a: 1, e: "Een Layer 2 switch werkt met MAC-adressen binnen één broadcast domain. Voor verkeer tussen verschillende subnetten moet een router (Layer 3) de pakketten doorsturen." },
      { q: "Hoe groot is een IEEE 802.1Q-tag en waar zit ze in het frame?",
        o: ["4 bytes, tussen het bron-MAC-adres en het EtherType", "2 bytes, na de payload", "8 bytes, voor het preamble", "4 bytes, na de CRC"],
        a: 0, e: "De tag is 4 bytes (TPID 16 bits, PCP 3, DEI 1 en VID 12 bits) en wordt ingevoegd na het bron-MAC-adres." },
      { q: "Waarom kunnen er maximaal 4094 bruikbare VLAN's zijn?",
        o: ["Het VID-veld heeft 12 bits (4096 waarden) en 0 en 4095 zijn gereserveerd", "Een switch heeft maar 4094 poorten", "Het TPID-veld heeft 12 bits", "Omdat het frame maximaal 1500 bytes mag zijn"],
        a: 0, e: "12 bits geven 4096 waarden. VID 0 (geen VLAN, enkel prioriteit) en 4095 zijn gereserveerd, dus 1 tot 4094 zijn bruikbaar." },
      { q: "Wat stelt de TPID-waarde 0x8100 in een frame voor?",
        o: ["Dat het frame een 802.1Q-tag bevat", "Dat het een ARP-pakket is", "Dat het frame een broadcast is", "Het MAC-adres van de switch"],
        a: 0, e: "De TPID (Tag Protocol Identifier) is 0x8100 en geeft aan dat er een VLAN-tag volgt." },
      { q: "Wat betekent tagged op een switchpoort?",
        o: ["De poort stuurt frames van dat VLAN met een 802.1Q-tag uit, en verwacht tags bij binnenkomst", "De poort is uitgeschakeld", "De poort verwijdert elke tag en hoort bij VLAN 1", "De poort versleutelt het verkeer"],
        a: 0, e: "Tagged: het VLAN-nummer wordt in een tag meegestuurd, zodat de overkant weet bij welk VLAN het frame hoort. Dat gebruik je op trunks." },
      { q: "Wat betekent untagged op een switchpoort?",
        o: ["Frames van dat VLAN verlaten de poort zonder tag, en binnenkomende frames zonder tag worden aan dat VLAN (de PVID) toegewezen", "De poort is lid van geen enkel VLAN", "De poort laat enkel broadcasts toe", "De poort gebruikt automatisch alle VLAN's"],
        a: 0, e: "Untagged is het gedrag voor eindapparaten: ze kennen geen tags. De switch voegt bij binnenkomst het VLAN van de poort toe en haalt de tag bij het uitgaan weg." },
      { q: "Waarom zijn de poorten naar hosts access-poorten (untagged)?",
        o: ["Eindapparaten zoals pc's begrijpen geen VLAN-tags en verwachten untagged frames in één broadcast domain", "Omdat tagged poorten trager zijn", "Omdat een pc maar één MAC-adres heeft", "Omdat tags enkel op Wi-Fi werken"],
        a: 0, e: "Pc's, printers en servers sturen en verwachten gewone Ethernet-frames zonder tag. De switch beheert de VLAN-tags." },
      { q: "Waarom worden de uplinks tussen access en core switches trunks?",
        o: ["Ze moeten verkeer van meerdere VLAN's over één kabel transporteren", "Omdat er dan geen STP nodig is", "Omdat ze sneller moeten zijn", "Omdat access switches geen untagged poorten kunnen hebben"],
        a: 0, e: "Een trunk draagt meerdere VLAN's met tags over één verbinding. Hostpoorten dragen maar één VLAN en blijven untagged." },
      { q: "Je tagt VLAN 3 niet op een trunk tussen twee switches. Wat is het gevolg?",
        o: ["Hosts in VLAN 3 aan verschillende switches kunnen elkaar niet meer bereiken over die link", "Niets, VLAN 3 loopt automatisch mee", "Alle VLAN's vallen uit", "De trunk wordt een access-poort"],
        a: 0, e: "Een VLAN dat niet op de trunk getagd is, wordt niet over die link verstuurd. Hosts van dat VLAN aan de andere kant zijn dan onbereikbaar." },
      { q: "Welke poort moet je mirroren om een frame met een 802.1Q-tag te zien?",
        o: ["Een trunkpoort", "Een access-poort van een host", "Eender welke poort, de tag is overal zichtbaar", "De poort van de laptop zelf"],
        a: 0, e: "Op trunkpoorten dragen de frames een tag. Op access-poorten is de tag weggehaald, dus daar zie je geen tags." },
      { q: "Waarom zie je geen VLAN-tags in Wireshark als je een access-poort mirrort?",
        o: ["De switch verwijdert de tag bij het uitgaan van een untagged poort", "Wireshark kan geen tags tonen", "Er worden op access-poorten geen VLAN's gebruikt", "De tags worden versleuteld"],
        a: 0, e: "Een access (untagged) poort stuurt frames zonder tag uit. Het VLAN is enkel intern in de switch bekend." },
      { q: "Wat is een PVID?",
        o: ["Het VLAN dat de switch toekent aan untagged frames die binnenkomen op de poort", "Het aantal VLAN's op een poort", "Een prioriteitsveld in de tag", "Het MAC-adres van het VLAN"],
        a: 0, e: "De Port VLAN ID is het standaard VLAN van een poort: untagged frames die binnenkomen worden daarmee gemerkt." },
      { q: "Wat is router on a stick?",
        o: ["Een router met één trunklink naar de switch en per VLAN een logische sub-interface met een IP in dat VLAN-subnet", "Een router met één fysieke poort per VLAN", "Een switch die routeert in hardware", "Een router zonder IP-adressen"],
        a: 0, e: "Eén fysieke trunk, meerdere 802.1Q-sub-interfaces. Elke sub-interface is de default gateway van zijn VLAN." },
      { q: "Je pingt van een host in VLAN 2 naar een host in VLAN 3 via een router on a stick. Hoe vaak zie je het echo request op de link naar de router?",
        o: ["Twee keer: eerst getagd met VLAN 2 naar de router, daarna getagd met VLAN 3 terug", "Eén keer, getagd met VLAN 2", "Nul keer, de router gebruikt een andere kabel", "Drie keer, met drie verschillende MAC-adressen"],
        a: 0, e: "Het pakket gaat over dezelfde kabel heen en terug. Het VLAN-ID en de MAC-adressen veranderen, de IP-adressen blijven, de TTL daalt met 1." },
      { q: "Waarom hebben alle sub-interfaces van de router hetzelfde MAC-adres, terwijl ze toch als aparte netwerken werken?",
        o: ["Ze zitten op dezelfde fysieke poort; het VLAN-ID in de tag scheidt de netwerken", "Omdat een router maar één IP-adres mag hebben", "Omdat het MAC-adres bij elke ping verandert", "Het is een fout in de configuratie"],
        a: 0, e: "Het MAC-adres hoort bij de fysieke poort. Door de 802.1Q-tag en een eigen IP-subnet per sub-interface zijn het logisch gescheiden netwerken." },
      { q: "Waarom moet je bij inter-VLAN routing het masker van /16 naar /24 veranderen?",
        o: ["Elk VLAN heeft een eigen subnet nodig; met /16 zou een host andere VLAN's als lokaal beschouwen en niet naar de gateway sturen", "Omdat /16 niet bestaat in OpenWrt", "Omdat de router enkel /24 kan", "Om meer IP-adressen te krijgen"],
        a: 0, e: "Met een /16 liggen 10.1.1.x en 10.1.3.x in hetzelfde subnet. De host zou rechtstreeks ARP'en en nooit de gateway gebruiken, terwijl een broadcast het andere VLAN niet bereikt." },
      { q: "Het beheer-IP van een switch is 10.1.3.5, je pc staat in VLAN 1 (10.1.1.x). Wat is er mis en wat is de oplossing?",
        o: ["Het beheer-IP zit in het subnet van VLAN 3 terwijl het beheer via VLAN 1 loopt; verander het naar een adres in het VLAN 1-subnet en geef een gateway", "Niets, het werkt altijd", "De pc heeft te veel poorten", "Het masker moet naar /8"],
        a: 0, e: "De switch wordt beheerd via VLAN 1, dus zijn IP moet in het VLAN 1-subnet (10.1.1.0/24) liggen, met gateway 10.1.1.254, anders kan hij hosts in andere VLAN's niet antwoorden." },
      { q: "Wat is het verschil tussen router on a stick en een Layer 3 switch?",
        o: ["Router on a stick routeert over één trunklink met sub-interfaces; een Layer 3 switch routeert zelf, meestal in hardware, met een virtuele interface per VLAN", "Er is geen verschil", "Een Layer 3 switch kent geen VLAN's", "Router on a stick werkt enkel met Wi-Fi"],
        a: 0, e: "Beide routeren tussen VLAN's. De L3 switch doet het in één toestel en meestal sneller, router on a stick heeft één trunk als bottleneck." },
      { q: "Wat gebeurt er als VLAN 3 niet getagd is op de switchpoort naar de router?",
        o: ["De router ontvangt geen VLAN 3-verkeer en hosts in VLAN 3 bereiken hun gateway 10.1.3.254 niet", "Alle VLAN's vallen uit", "De router maakt het VLAN zelf aan", "Niets, de router tagt het zelf"],
        a: 0, e: "Zonder VLAN 3 op die poort komen de frames van VLAN 3 nooit bij de sub-interface lan2.3 aan. Hosts in VLAN 3 krijgen geen antwoord van hun gateway." }
    ]
  }
];
