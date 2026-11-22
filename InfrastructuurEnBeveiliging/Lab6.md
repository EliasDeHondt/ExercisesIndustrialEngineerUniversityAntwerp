![logo](https://eliasdh.com/assets/media/images/logo-github.png)
# Lab 6

Uitvoeren op: `A` = laptop van Student A (client), `B` = Student B (aanvaller), `C` = Student C (photo server), `D` = Student D (observer), `router` = Asus (OpenWrt, via SSH of LuCI), `switch 1` en `switch 2` = Netgear (OpenWrt).

Elke groep van vier bouwt zijn eigen, losstaande opstelling. Alle adressen zijn `/24`. De router zit tussen twee netwerken: LAN1 (`br-lan`) in `10.1.1.0/24` aan de kant van de client, LAN2 (`lan2`) in `10.1.2.0/24` aan de kant van de server. In Exercise 2 komt daar een derde netwerk bij: het tunnelnetwerk `10.99.0.0/24` op de interface `wg0`.

### Waarden (Figure 1 en Figure 2)

| Toestel | Adres | Gateway | Rol |
|---|---|---|---|
| Switch 1 | `10.1.1.1/24` | - | Kant van de client (onvertrouwd netwerk), port mirroring naar B |
| Router LAN1 (`br-lan`) | `10.1.1.2/24` | - | VPN-endpoint, luistert op UDP `51820` |
| Router LAN2 (`lan2`) | `10.1.2.2/24` | - | Kant van de server (vertrouwd netwerk) |
| Router `wg0` | `10.99.0.1/24` | - | Adres van de router in de tunnel |
| Switch 2 | `10.1.2.1/24` | - | Kant van de server, port mirroring naar D |
| Student A | `10.1.1.10/24`, in de tunnel `10.99.0.2/24` | `10.1.1.2` | Client, vraagt de foto op |
| Student B | `10.1.1.11/24` | `10.1.1.2` | Aanvaller, capture vóór de router |
| Student C | `10.1.2.11/24` | `10.1.2.2` | HTTP-server op poort `8000` met `secret-photo.jpg` |
| Student D | `10.1.2.10/24` | `10.1.2.2` | Observer, capture na de router |

Poorten in de voorbeelden hieronder (pas aan aan je eigen bekabeling): op elke switch hangt de host (A of C) aan `lan1`, de observer (B of D) aan `lan2` en de router aan `lan3`. Op de router hangt switch 1 aan LAN1 en switch 2 aan LAN2.

---

## Voorbereiding en uitgangssituatie

### Switches
Firewall uit en een vast adres, zoals in Lab 2:
```cli
/etc/init.d/firewall stop                        # switch 1 en switch 2
uci set network.lan.ipaddr='10.1.1.1'            # switch 1 (switch 2: 10.1.2.1)
uci set network.lan.netmask='255.255.255.0'      # switch 1 en switch 2
uci commit network                               # switch 1 en switch 2
/etc/init.d/network restart                      # switch 1 en switch 2
```

### Router
Eerst de pakketten installeren (de router heeft internet nodig: campuskabel in de WAN-poort, datum controleren met `date`), dan LAN2 uit de bridge halen zoals in Lab 2.
```cli
opkg update                                      # router
opkg install wireguard-tools luci-proto-wireguard   # router
uci del_list network.@device[0].ports='lan2'     # router (LAN2 uit br-lan)
uci set network.lan2=interface                   # router
uci set network.lan2.proto='static'              # router
uci set network.lan2.device='lan2'               # router
uci set network.lan2.ipaddr='10.1.2.2'           # router
uci set network.lan2.netmask='255.255.255.0'     # router
uci set network.lan.ipaddr='10.1.1.2'            # router (LAN1 / br-lan)
uci set network.lan.netmask='255.255.255.0'      # router
uci commit network                               # router
/etc/init.d/network restart                      # router (laadt ook het nieuwe protocol wireguard)
/etc/init.d/firewall stop                        # router
/etc/init.d/firewall disable                     # router (blijft uit na een herstart)
```
De firewall mag uit, want dit labo gaat over de tunnel en niet over filtering. Laat je hem aan, dan moet `wg0` in een zone met forwarding naar de zone van `lan2`, en moet UDP `51820` op INPUT open staan.

Controle: `cat /proc/sys/net/ipv4/ip_forward` moet `1` geven (standaard in OpenWrt), anders routeert de router niet.

### Hosts
```powershell
netsh interface ip set address name="Ethernet" static 10.1.1.10 255.255.255.0 10.1.1.2   # A
netsh interface ip set address name="Ethernet" static 10.1.1.11 255.255.255.0 10.1.1.2   # B
netsh interface ip set address name="Ethernet" static 10.1.2.11 255.255.255.0 10.1.2.2   # C
netsh interface ip set address name="Ethernet" static 10.1.2.10 255.255.255.0 10.1.2.2   # D
```
Op Linux: `sudo ip addr add 10.1.1.10/24 dev eth0` en `sudo ip route add default via 10.1.1.2`. Een gateway is hier wel nodig: A en C zitten in een ander subnet. Op Windows moet ICMP soms toegelaten worden in de Windows Firewall, anders antwoorden de hosts niet op ping.

### WireGuard op de client (Student A)
Installeer WireGuard via https://www.wireguard.com/install/ (Windows: het installatieprogramma, Linux: `sudo apt install wireguard`, macOS: App Store). Het wordt pas in Exercise 2 gebruikt.

### Port mirroring (zie Lab 4)
B moet het verkeer tussen A en de router zien, D het verkeer tussen de router en C. Een switch stuurt unicast enkel naar de poort van het bestemmings-MAC, dus zonder mirroring zien B en D niets. Mirror de poort naar de router (`lan3`) naar de poort van de observer (`lan2`), in beide richtingen:
```cli
ip link set up dev lan2                                                       # switch 1 en switch 2
tc qdisc del dev lan3 clsact 2>/dev/null                                      # switch 1 en switch 2
tc qdisc add dev lan3 clsact                                                  # switch 1 en switch 2
tc filter add dev lan3 ingress matchall action mirred egress mirror dev lan2  # switch 1 en switch 2
tc filter add dev lan3 egress matchall action mirred egress mirror dev lan2   # switch 1 en switch 2
```
Controle: B start Wireshark, A pingt `10.1.1.2`: B moet de echo requests en replies zien. Idem D terwijl de router `10.1.2.11` pingt. Volledige connectiviteit testen vanaf elke host met `ping` naar alle andere adressen.

---

## Exercise 1: Observing unencrypted network traffic

### 4.2 Start the HTTP server
```cli
mkdir photo-server                               # C
cd photo-server                                  # C (plaats er een foto in en hernoem ze naar secret-photo.jpg)
python3 -m http.server 8000                      # C (op Windows: python -m http.server 8000)
```
De server deelt alle bestanden van de map op `http://10.1.2.11:8000/`. Controle vanaf de router: `wget -O /dev/null http://10.1.2.11:8000/secret-photo.jpg` (moet de download tonen). Laat Windows Python toe in de firewall als C een Windows-laptop is.

### 4.3 Check this first with a ping. Can Student A reach Student C?
Ja. A stuurt het pakket naar zijn gateway `10.1.1.2` (de router), de router kent `10.1.2.0/24` als direct verbonden netwerk op `lan2` en stuurt het door naar C. C antwoordt via zijn gateway `10.1.2.2`. Er zijn geen statische routes nodig, want de router hangt aan beide netwerken.
```cli
ping 10.1.2.11                                   # A
```

### 4.4 Capture the communication
B en D starten Wireshark op de interface naar de switch, vóór A iets stuurt. Daarna:
```cli
curl http://10.1.2.11:8000/secret-photo.jpg --output secret-photo.jpg   # A (of in de browser)
```
Op Windows PowerShell is `curl` een alias van `Invoke-WebRequest`: gebruik `curl.exe`.

### Can you see the TCP traffic?
Ja, B en D zien allebei de volledige TCP-sessie tussen `10.1.1.10` en `10.1.2.11` op poort `8000`: handshake, request, de data van de foto en het afsluiten (FIN). Dat werkt enkel dankzij port mirroring.

### Student B applies the correct filters in Wireshark to only see the relevant packets. Which filter did you use?
`ip.addr == 10.1.2.11 && tcp.port == 8000` (of `ip.addr == 10.1.1.10 && ip.addr == 10.1.2.11`). Enkel HTTP: `http`. Toont Wireshark de pakketten niet als HTTP, dan via rechtsklik, Decode As, TCP-poort `8000` als HTTP.

### Can you identify the TCP three-way handshake?
Ja: de eerste drie pakketten van de sessie. `SYN` van A (`10.1.1.10`, willekeurige hoge poort) naar C (`10.1.2.11:8000`), `SYN, ACK` van C terug, en `ACK` van A. Filter: `tcp.flags.syn == 1`.

### Find the HTTP request. Which HTTP method is used?
`GET`.

### Which object does Student A request?
`/secret-photo.jpg` op host `10.1.2.11:8000`.

### Can you find the following request in the capture: GET /secret-photo.jpg
Ja, in klare tekst: `GET /secret-photo.jpg HTTP/1.1`. Filter: `http.request.method == "GET"` of `http.request.uri contains "secret"`.

### Can you read the HTTP headers?
Ja, alles staat in klare tekst. Request: `Host: 10.1.2.11:8000`, `User-Agent` (bijvoorbeeld `curl/8.x` of de browser), `Accept`. Response: `HTTP/1.0 200 OK`, `Server: SimpleHTTP/0.6 Python/3.x`, `Date`, `Content-type: image/jpeg`, `Content-Length` en `Last-Modified`.

### Can you see data belonging to the JPEG image?
Ja. Na de response-headers volgen de bytes van de foto, verdeeld over vele TCP-segmenten. Wireshark zet ze samen en toont `JPEG File Interchange Format` (het begint met de bytes `FF D8 FF`). Rechtsklik, Follow, TCP Stream toont de hele sessie.

### Can Student B open the image? And should he be able to?
Ja: via File, Export Objects, HTTP, `secret-photo.jpg`, Save krijgt B exact dezelfde foto. Dat zou niet mogen: B is geen deelnemer aan de communicatie, en de foto is vertrouwelijk.

### Why could Student B reconstruct the transferred file?
HTTP versleutelt niets. Alle pakketten, inclusief de volledige inhoud van het bestand, gaan in klare tekst over het netwerk. Wie een kopie van de pakketten heeft (hier via port mirroring, in het echt via een gedeeld wifi-netwerk, een gehackte switch of een provider) kan de TCP-stroom terug samenstellen en het bestand eruit halen.

### Do the Ethernet source and destination MAC addresses remain the same? Explain any differences that you observe.
Nee. Bij B (vóór de router): bron = MAC van A, bestemming = MAC van LAN1 van de router (de gateway van A). Bij D (na de router): bron = MAC van LAN2 van de router, bestemming = MAC van C. Een router maakt voor elke hop een nieuw Ethernet-frame: het MAC-adres geldt enkel binnen één netwerk (Layer 2).

### Do the source and destination IP addresses remain the same? Explain any differences that you observe.
Ja: bij B en D is het bron-IP `10.1.1.10` en het bestemmings-IP `10.1.2.11`. Een router verandert de IP-adressen niet (er is geen NAT): ze beschrijven de begin- en eindbestemming van het pakket.

### What happens to the IP TTL? Explain why this happens.
De TTL is bij D één lager dan bij B, bijvoorbeeld `128` bij B en `127` bij D als A een Windows-laptop is (Linux en macOS: `64` en `63`). Elke router verlaagt de TTL met 1 bij het doorsturen (en herberekent de checksum van de IP-header), zodat een pakket in een routinglus niet eeuwig blijft rondgaan. Bij TTL 0 gooit de router het weg en stuurt een ICMP Time Exceeded.

| Field | Student B (voor de router) | Student D (na de router) |
|---|---|---|
| Bron-MAC | A | Router LAN2 |
| Bestemmings-MAC | Router LAN1 | C |
| Bron-IP | `10.1.1.10` | `10.1.1.10` |
| Bestemmings-IP | `10.1.2.11` | `10.1.2.11` |
| TTL | `128` (Windows) | `127` |

---

## Exercise 2: Deploying a WireGuard tunnel

### 5.1 Why does Student A need a separate IP address for the WireGuard tunnel?
De tunnel is een eigen (virtueel) Layer 3 netwerk met een eigen interface (`wg0` of de tunnel-adapter op Windows). Een interface heeft een IP-adres nodig om pakketten te sturen en te ontvangen. Met het adres `10.99.0.2` maakt A de inner packets: dat is het bron-IP binnen de tunnel en het adres waarop de router en C antwoorden. Het fysieke adres `10.1.1.10` blijft nodig voor het outer packet: dat brengt de versleutelde UDP-pakketten over het onvertrouwde netwerk naar het endpoint. Door een apart netwerk te gebruiken weet de router ook welk verkeer via de tunnel terug moet (alles naar `10.99.0.0/24` gaat via `wg0`), en kan de router het tunnelverkeer los van het fysieke netwerk behandelen.

### What commands did you use to generate the key pairs?
Router:
```cli
mkdir -p /etc/wireguard && cd /etc/wireguard     # router
umask 077                                        # router (sleutelbestanden enkel leesbaar voor root)
wg genkey | tee server.key | wg pubkey > server.pub   # router
cat server.pub                                   # router (publieke sleutel, mag gedeeld worden)
```
Client (Windows, PowerShell als administrator):
```powershell
cd "C:\Program Files\WireGuard"                  # A
.\wg.exe genkey | Tee-Object -FilePath $env:USERPROFILE\client.key | .\wg.exe pubkey   # A (toont de publieke sleutel)
```
Op Linux of macOS: `wg genkey | tee client.key | wg pubkey > client.pub`. In de WireGuard-app op Windows kan het ook met "Add Tunnel, Add empty tunnel": die maakt zelf een sleutelpaar en toont de publieke sleutel bovenaan.

`wg genkey` maakt een willekeurige private key (Curve25519, base64), `wg pubkey` berekent de bijhorende public key.

### Note down the server's public key:
In te vullen in het labo: inhoud van `/etc/wireguard/server.pub` (44 tekens base64, eindigt op `=`).

### Note down the client's public key:
In te vullen in het labo: uitvoer van `wg pubkey` op A, of de "Public key" in de WireGuard-app.

### Why does each peer need its own key pair?
De sleutel is de identiteit van een peer: WireGuard heeft geen gebruikersnamen of certificaten. De router herkent A aan zijn public key en koppelt er de toegelaten adressen aan. Elk toestel bewijst met zijn eigen private key wie het is, en de sessiesleutels worden afgeleid uit de sleutels van beide kanten. Zou iedereen dezelfde sleutel delen, dan kan je peers niet uit elkaar houden, geen enkele peer apart intrekken, en kan elke deelnemer zich als een andere voordoen.

### Why can the public key be shared, while the private key must remain secret?
Uit de private key bereken je eenvoudig de public key, maar omgekeerd is dat praktisch onmogelijk. De public key gebruikt de andere kant enkel om te controleren dat het echt met die peer praat en om samen sleutels af te spreken: wie hem kent, kan er niets mee ontcijferen of vervalsen. Wie de private key heeft, kan zich als dat toestel voordoen en de tunnel opzetten. Daarom verlaat de private key het toestel nooit.

### 5.2 Configure the WireGuard tunnel
Router, met UCI (in LuCI: Network, Interfaces, Add new interface, protocol WireGuard VPN, en de peer in het tabblad Peers):
```cli
uci set network.wg0=interface                                       # router
uci set network.wg0.proto='wireguard'                               # router
uci set network.wg0.private_key="$(cat /etc/wireguard/server.key)"  # router
uci set network.wg0.listen_port='51820'                             # router
uci add_list network.wg0.addresses='10.99.0.1/24'                   # router
uci add network wireguard_wg0                                       # router (peer van wg0)
uci set network.@wireguard_wg0[-1].description='StudentA'           # router
uci set network.@wireguard_wg0[-1].public_key='<STUDENT A PUBLIC KEY>'   # router
uci add_list network.@wireguard_wg0[-1].allowed_ips='10.99.0.2/32'  # router
uci commit network                                                  # router
/etc/init.d/network reload                                          # router (of: ifup wg0)
wg show                                                             # router (controle)
```

### Why does the OpenWrt router associate 10.99.0.2/32 with Student A's public key?
AllowedIPs werkt in twee richtingen (cryptokey routing):
- Uitgaand: een pakket van de router met bestemming `10.99.0.2` wordt met de sleutels van A versleuteld en naar A gestuurd. Zo weet de router via welke peer het antwoord aan A (of het antwoord van C) terug moet.
- Inkomend: na het ontcijferen van een pakket van A controleert de router dat het bron-IP van het inner packet `10.99.0.2` is. Een ander bronadres wordt weggegooid. A kan dus geen andere adressen vervalsen, en het adres `10.99.0.2` is gegarandeerd van de houder van die private key.

`/32` is precies één adres: A is één toestel. Met meer clients krijgt elke peer een ander `/32`.

Client (Student A). In de WireGuard-app op Windows: Add Tunnel, Add empty tunnel, naam `lab6`, en de configuratie aanvullen:
```ini
[Interface]
PrivateKey = <CLIENT PRIVATE KEY>
Address = 10.99.0.2/24

[Peer]
PublicKey = <SERVER PUBLIC KEY>
Endpoint = 10.1.1.2:51820
AllowedIPs = 10.99.0.1/32, 10.1.2.0/24
```
Daarna Save en Activate. Op Linux: bestand `/etc/wireguard/lab6.conf` en `sudo wg-quick up lab6`. Geen `PersistentKeepalive`, zodat de eerste pakketten van een handshake pas vertrekken als er echt verkeer is.

### What does Endpoint = 10.1.1.2:51820 represent?
Het echte (fysieke) adres en de UDP-poort waar de versleutelde pakketten naartoe gaan: LAN1 van de router, waar WireGuard luistert op poort `51820`. Dat is het bestemmings-IP en de bestemmingspoort van het outer packet. Het staat enkel op de client: de router leert het endpoint van A vanzelf uit het bronadres van een geldig pakket (roaming), daarom heeft de peer op de router geen endpoint.

### What does AllowedIPs = 10.99.0.1/32, 10.1.2.0/24 mean?
Uitgaand: verkeer van A naar `10.99.0.1` (de router in de tunnel) en naar het netwerk `10.1.2.0/24` (de server-kant, met C en D) gaat via de tunnel naar deze peer. De WireGuard-client zet daarvoor routes via de tunnel-interface. Inkomend: A aanvaardt uit de tunnel enkel pakketten met een bron-IP in die bereiken.

### Which traffic from Student A is sent through the WireGuard tunnel with the current configuration, and which traffic is not?
Door de tunnel: enkel verkeer naar `10.99.0.1` en naar `10.1.2.0/24` (C op `10.1.2.11`, D op `10.1.2.10` en LAN2 van de router `10.1.2.2`). Niet door de tunnel: al de rest. Verkeer binnen het eigen netwerk `10.1.1.0/24` (B, switch 1, LAN1 van de router `10.1.1.2`, en dus ook de versleutelde pakketten naar het endpoint zelf) en verkeer naar het internet of andere netwerken gaan gewoon via de fysieke interface, onversleuteld.

### What would AllowedIPs = 0.0.0.0/0 mean on Student A?
Een full tunnel: al het IPv4-verkeer van A (ook naar het internet) gaat via de router. Het outer packet naar het endpoint `10.1.1.2` gaat uiteraard niet in de tunnel zelf (de client zet daarvoor een uitzondering). Gevolgen: de router moet al dat verkeer kunnen doorsturen (en in het echt NATten naar het internet), alles wat A doet loopt via de VPN, en zonder route naar het internet op de router heeft A geen internet meer. Inkomend aanvaardt A dan uit de tunnel pakketten van elk bronadres.

### Why might we prefer split tunneling in this lab?
- Enkel het verkeer naar het interne netwerk gaat door de tunnel, zodat de capture overzichtelijk blijft: B ziet de WireGuard-pakketten, de rest (DNS, updates, internet) blijft erbuiten.
- De router in het labo heeft geen internet aan de LAN-kant en doet geen NAT: met `0.0.0.0/0` verliest A zijn internet en eventueel zijn verbinding met andere toestellen.
- Minder belasting op de VPN-gateway, en A blijft de eigen switch en LAN1 van de router gewoon bereiken (beheer via SSH op `10.1.1.2`).

Nadeel in het echt: verkeer buiten de tunnel is niet beschermd en niet gecontroleerd door de organisatie.

### 5.3 What information can you identify? Paste the screenshot here!
```cli
wg show                                          # router en A (op Windows: & "C:\Program Files\WireGuard\wg.exe" show)
```
Screenshot: nog toe te voegen. Je ziet per interface: de naam (`wg0`), de eigen public key (de private key wordt verborgen getoond), de listening port (`51820` op de router, een willekeurige poort op A). Per peer: de public key van de andere kant, het endpoint (op A `10.1.1.2:51820`, op de router nog geen endpoint) en de allowed ips (`10.99.0.2/32` op de router, `10.99.0.1/32, 10.1.2.0/24` op A). Er staat nog geen `latest handshake` en geen `transfer`.

### Do you already see a recent handshake before Student A sends any traffic? Why?
Nee. WireGuard is stil: een handshake gebeurt enkel op aanvraag, wanneer er een pakket voor de tunnel klaarstaat. Zonder verkeer (en zonder `PersistentKeepalive`) wordt er niets verstuurd, en de router kan zelf geen handshake starten, want hij kent het endpoint van A nog niet.

### Student A now sends a ping to the router's tunnel address (10.99.0.1). Does this work?
Ja. Het eerste pakket start de handshake en wacht tot die klaar is (de eerste ping kan iets trager zijn), daarna komen de antwoorden gewoon terug.
```cli
ping 10.99.0.1                                   # A
```

### Next, ping Student C (10.1.2.11). Does this work?
Ja. A stuurt het pakket via de tunnel (want `10.1.2.0/24` staat in AllowedIPs) met bron `10.99.0.2`. De router ontcijfert het, controleert het bronadres en routeert het via `lan2` naar C. C antwoordt aan `10.99.0.2` via zijn gateway `10.1.2.2`. De router kent `10.99.0.0/24` op `wg0` en stuurt het antwoord via de peer met `10.99.0.2/32` versleuteld terug naar A. C heeft zelf geen VPN-software nodig.
```cli
ping 10.1.2.11                                   # A
```

### Check wg show again. What changed? Paste the output here and explain.
Output: nog toe te voegen. Nieuw is:
- `latest handshake: x seconds ago`: de handshake is gelukt en er zijn sessiesleutels.
- `transfer: x KiB received, y KiB sent`: er is verkeer door de tunnel gegaan.
- Op de router staat nu bij de peer `endpoint: 10.1.1.10:<poort>`: de router heeft het adres van A geleerd uit het eerste geldige pakket (roaming).

### 5.4 Capture the WireGuard handshake
1. Stop alle pings en HTTP-verkeer.
2. Zet de tunnel van A uit (Deactivate in de app, of `sudo wg-quick down lab6`). Op de router eventueel ook `ifdown wg0 && ifup wg0` zodat de oude sessie zeker weg is.
3. B en D starten Wireshark.
4. Filter bij B: `udp.port == 51820` (Wireshark herkent deze poort als WireGuard, filter ook `wg`).
5. Zet de tunnel van A weer aan.

### Do you immediately see WireGuard packets? Why is that?
Nee. Een WireGuard-interface aanzetten stuurt niets: er wordt pas een handshake gedaan als er een IP-pakket voor de tunnel moet vertrekken. Zonder verkeer en zonder `PersistentKeepalive` is de tunnel stil (en voor een scanner onzichtbaar, want WireGuard antwoordt niet op ongeldige pakketten).

Nu één ping naar C en de capture na een paar seconden stoppen:
```cli
ping -n 1 10.1.2.11                              # A (Linux/macOS: ping -c 1 10.1.2.11)
```

### What is the first WireGuard message sent by Student A?
Een Handshake Initiation (type 1).

### Which direction does it travel?
Van A naar de router: `10.1.1.10` (willekeurige UDP-poort) naar `10.1.1.2:51820`. De client start de handshake, want hij heeft verkeer te versturen.

### What is the next WireGuard message?
Een Handshake Response (type 2).

### Which direction does it travel?
Van de router naar A: `10.1.1.2:51820` naar `10.1.1.10:<poort van A>`.

### What appears after the handshake?
Transport Data-pakketten (type 4): eerst het ICMP echo request van A naar de router, daarna het echo reply van de router naar A, allebei versleuteld. Na de handshake stuurt de initiator (A) als eerste data, want de responder mag pas data sturen nadat hij een eerste geldig datapakket van de initiator ontving. Soms volgt er ook een lege Transport Data (keepalive) om de handshake te bevestigen. Een Cookie Reply (type 3) komt enkel voor als de router onder zware belasting staat (bescherming tegen denial of service).

### Take a closer look at the Type 1 packet. What is the outer source IP address?
`10.1.1.10`, het fysieke adres van A.

### What is the outer destination IP address?
`10.1.1.2`, het endpoint: LAN1 van de router.

### Which Layer-4 protocol is used?
UDP, bestemmingspoort `51820`. WireGuard gebruikt enkel UDP (geen TCP), want TCP in TCP geeft problemen met dubbele hertransmissies.

### Can Student B see the original destination (10.1.2.11) inside the encrypted tunnel during the handshake? What about Student D?
B: nee. De handshake bevat geen gebruikersdata: het IP-pakket naar `10.1.2.11` wacht bij A tot de handshake klaar is en gaat daarna versleuteld in een Transport Data-pakket. B ziet enkel `10.1.1.10` en `10.1.1.2`. D: D ziet de handshake helemaal niet, want die eindigt op de router (UDP naar `10.1.1.2`) en gaat nooit naar het netwerk `10.1.2.0/24`. Pas na de handshake ziet D het ontcijferde ping-pakket `10.99.0.2` naar `10.1.2.11` in klare tekst.

### Can Student B see Student A's private key in the handshake? What about Student D?
Geen van beiden. Een private key wordt nooit verstuurd, ook niet versleuteld. Elke kant gebruikt zijn private key enkel lokaal in de berekeningen van de handshake (Diffie-Hellman). D ziet bovendien de handshake niet.

### Can Student B see the public keys in the handshake? What about Student D?
B: niet de vaste (statische) public keys. De public key van A zit enkel versleuteld in het veld `encrypted_static`, de public key van de router wordt helemaal niet verstuurd (A kende hem al uit de configuratie). Wel zichtbaar in klare tekst is de ephemeral public key (`unencrypted_ephemeral`): een tijdelijke sleutel die voor elke handshake nieuw is en niets zegt over wie A is. D ziet de handshake niet, dus ook geen sleutels.

### Which fields does Wireshark decode in the Handshake Initiation packet?
`Type` (1, Handshake Initiation), `Reserved`, `Sender` (de sender index, een willekeurig nummer dat de sessie aanduidt), `Ephemeral` (de tijdelijke public key, onversleuteld), `Static` (encrypted static: de versleutelde public key van A), `Timestamp` (encrypted timestamp: tegen replay), `mac1` en `mac2` (`mac2` is nul zonder cookie). De Handshake Response heeft `Sender`, `Receiver` (de index van A), `Ephemeral`, `Empty` (versleuteld leeg veld), `mac1` en `mac2`. Een Transport Data-pakket toont enkel `Receiver`, `Counter` en `Encrypted Packet`.

---

## Exercise 3: Analyzing traffic through a VPN tunnel

### 6.1 Repeat the HTTP transfer through WireGuard
B en D starten een nieuwe capture, A haalt de foto opnieuw op (de tunnel is actief):
```cli
curl.exe http://10.1.2.11:8000/secret-photo.jpg --output secret-photo.jpg   # A
```
Filters: bij B `udp.port == 51820` (of `wg`), bij D `tcp.port == 8000` of `http`.

### 6.2 Can Student B find the original HTTP conversation? Why (not)?
Nee. Het volledige inner IP-pakket (IP-header, TCP-header en HTTP) is versleuteld en zit als payload in een WireGuard Transport Data-pakket. Filters zoals `http` of `tcp.port == 8000` geven niets.

### What protocol does Student B observe?
WireGuard over UDP (Transport Data, type 4), en bij een nieuwe sessie de handshake (type 1 en 2).

### Which source and destination IP addresses are visible?
Enkel de outer adressen: `10.1.1.10` (A, fysiek) en `10.1.1.2` (endpoint, LAN1 van de router), in beide richtingen. UDP-poorten: de poort van A en `51820`.

### Can Student B determine the destination TCP port used by the application? Why (not)?
Nee. De TCP-header zit in het versleutelde inner packet. B ziet enkel de UDP-poort `51820` van de tunnel. Hij kan hooguit afleiden dat er veel data in één richting gaat (grootte en timing van de pakketten).

### Can Student B find the HTTP request GET /secret-photo? Why (not)?
Nee, het request is versleuteld (ChaCha20-Poly1305 met een sessiesleutel die B niet kent). Zoeken naar `secret` in de bytes (`frame contains "secret"`) vindt niets.

### Can Student B reconstruct secret-photo this time?
Nee. File, Export Objects, HTTP is leeg, en zonder de sessiesleutels zijn de bytes onbruikbaar. Elk datapakket is ook geauthenticeerd: B kan er niets aan veranderen of opnieuw afspelen zonder dat de router het weggooit.

### 6.3 Can Student D find the HTTP conversation? Why (not)?
Ja. D zit na het VPN-endpoint: de router heeft het pakket al ontcijferd en routeert het gewone inner IP-pakket in klare tekst via `lan2` naar C. Vanaf daar is het gewoon HTTP.

### What protocol does Student D observe?
TCP en HTTP (zoals in Exercise 1), geen WireGuard.

### Which source and destination IP addresses are visible?
Bron `10.99.0.2` (het tunneladres van A) en bestemming `10.1.2.11` (C), en omgekeerd voor de antwoorden.

### Can Student D determine the destination TCP port used by the application? Why (not)?
Ja, `8000`. De TCP-header van het inner packet is na het ontcijferen weer leesbaar.

### Can Student D find the HTTP request GET /secret-photo.jpg? Why (not)?
Ja, `GET /secret-photo.jpg HTTP/1.1` met alle headers, want HTTP zelf versleutelt niets en de tunnel stopt op de router.

### Can Student D reconstruct secret-photo this time?
Ja, via File, Export Objects, HTTP, net zoals in Exercise 1.

### 6.4 Paste the HTTP request of Student B here.
Screenshot: nog toe te voegen. Voorbeeld van wat B ziet:
```text
Ethernet II, Src: <MAC A>, Dst: <MAC router LAN1>
Internet Protocol Version 4, Src: 10.1.1.10, Dst: 10.1.1.2
User Datagram Protocol, Src Port: 5xxxx, Dst Port: 51820
WireGuard Protocol
    Type: Transport Data (4)
    Reserved: 000000
    Receiver: 0x........
    Counter: n
    Encrypted Packet (… bytes)
```

### Paste the HTTP request of Student D here.
Screenshot: nog toe te voegen. Voorbeeld van wat D ziet:
```text
Ethernet II, Src: <MAC router LAN2>, Dst: <MAC C>
Internet Protocol Version 4, Src: 10.99.0.2, Dst: 10.1.2.11
Transmission Control Protocol, Src Port: 5xxxx, Dst Port: 8000
Hypertext Transfer Protocol
    GET /secret-photo.jpg HTTP/1.1
    Host: 10.1.2.11:8000
    User-Agent: curl/8.x
    Accept: */*
```

### Complete the following table:

| Field | Student B - Outside tunnel | Student D - After tunnel |
|---|---|---|
| Source IP | `10.1.1.10` (fysiek adres van A) | `10.99.0.2` (tunneladres van A) |
| Destination IP | `10.1.1.2` (endpoint, router LAN1) | `10.1.2.11` (C) |
| L4 protocol | UDP | TCP |
| Destination Port | `51820` (WireGuard) | `8000` (HTTP-server) |
| Protocol visible | WireGuard (Transport Data) | HTTP |
| HTTP GET visible | Nee | Ja |
| JPEG recoverable | Nee | Ja |

### Which IP header is required to route the packet across the untrusted network?
De outer IP-header (`10.1.1.10` naar `10.1.1.2`, met UDP `51820`). Die moet in klare tekst staan, want de toestellen onderweg moeten het pakket kunnen afleveren bij het VPN-endpoint.

### Which IP header is used to route the packet from the VPN endpoint toward Student C?
De inner IP-header (`10.99.0.2` naar `10.1.2.11`). Na het ontcijferen haalt de router de outer headers weg en routeert hij het inner packet zoals elk ander pakket, op basis van het bestemmings-IP `10.1.2.11`, via `lan2`.

### Can Student B determine that the final destination is 10.1.2.11?
Nee. Dat adres staat enkel in de versleutelde inner header. B weet enkel dat A met het VPN-endpoint `10.1.1.2` praat. Hij kan hooguit vermoeden dat het om iets achter de router gaat.

### What is the source IP observed by Student D? Explain why it is not Student A's physical address 10.1.1.10?
`10.99.0.2`. A stuurt verkeer naar `10.1.2.0/24` via de tunnel-interface, en het bronadres van een pakket is het adres van de interface waarlangs het vertrekt: `10.99.0.2`. Het fysieke adres `10.1.1.10` staat enkel in de outer header, en die haalt de router bij het ontcijferen weg. De router kijkt bovendien na dat `10.99.0.2` in de AllowedIPs van de peer staat. Er is geen NAT, dus de router verandert het adres ook niet. Daarom antwoordt C ook aan `10.99.0.2`, en dat antwoord gaat via de tunnel terug.

### Is the image protected along the entire path from Student A to Student C?
Nee. De foto is enkel beschermd tussen A en de router (de tunnel, op het onvertrouwde netwerk). Tussen de router en C gaat ze in klare tekst over het netwerk: D kan ze reconstrueren, net als de router zelf. Een VPN is geen end-to-end versleuteling, enkel tussen de twee endpoints.

### What information is protected by the VPN tunnel?
Het volledige inner IP-pakket: de echte bron- en bestemmingsadressen (`10.99.0.2` en `10.1.2.11`), het protocol (TCP), de poorten (`8000`), het HTTP-request met de bestandsnaam en de headers, en de inhoud van de foto. Het is versleuteld (vertrouwelijkheid) en geauthenticeerd (niemand kan het ongemerkt aanpassen of opnieuw afspelen).

### What information remains visible to an observer outside the tunnel?
- De outer IP-adressen: wie (A, `10.1.1.10`) met welk VPN-endpoint (`10.1.1.2`) praat.
- UDP en de poort `51820`, en dat het WireGuard is.
- De MAC-adressen van het lokale netwerk.
- Het tijdstip, de grootte en het aantal pakketten (en dus ongeveer hoeveel data er gaat).
- In de handshake: de sender/receiver index en de ephemeral public key (niet de identiteit).

### How could we also protect the communication after it leaves the VPN tunnel?
- Versleuteling op de applicatielaag, end-to-end tussen A en C: HTTPS (TLS) in plaats van HTTP, of SFTP en SSH voor bestanden.
- De tunnel tot bij de server laten lopen: WireGuard ook op C (C als peer, of een site-to-site tunnel), zodat er geen onversleuteld stuk meer is.
- Het interne netwerk zelf beveiligen: geen port mirroring of onbekende toestellen, segmenteren met VLAN's en een firewall, enkel vertrouwde beheerders.

### If the web server used HTTPS instead of HTTP, could Student D still reconstruct the image?
Nee. Met HTTPS versleutelt TLS het request (inclusief het pad `/secret-photo.jpg` en de headers) en de foto tussen de browser van A en de server C. D ziet nog wel de IP-adressen, TCP-poort `443` (of `8000`), de TLS-handshake (met eventueel de servernaam in de SNI) en de hoeveelheid data, maar niet de inhoud. Export Objects HTTP blijft leeg. Enkel wie de privésleutel van de server heeft (of een sessiesleutel) kan het ontcijferen.

---

## Opruimen
```cli
tc qdisc del dev lan3 clsact                     # switch 1 en switch 2 (port mirroring weg)
```
Stop de webserver op C met `Ctrl+C`, zet de tunnel op A uit (Deactivate of `sudo wg-quick down lab6`) en verwijder de tunnel en de sleutelbestanden van A. Zet de routers en switches aan het einde van het labo terug op de fabrieksinstellingen (reset-knop ongeveer 10 seconden, daarna NIET uitsteken).
