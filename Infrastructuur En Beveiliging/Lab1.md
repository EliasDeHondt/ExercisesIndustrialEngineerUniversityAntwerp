![logo](https://eliasdh.com/assets/media/images/logo-github.png)
# Lab 1

Uitvoeren op: `pc` = laptop/host, `router` = Asus, `switch` = Netgear, `router/switch` = beide OpenWrt-toestellen (via SSH).

## Exercise 1: Getting started with the GUI

### Connect to the switch
Static IP op de laptop (geen gateway), daarna `http://192.168.1.1`, user `root`, geen wachtwoord.
```powershell
netsh interface ip set address name="Ethernet" static 192.168.1.10 255.255.255.0   # pc
```

### Connect to the router
Laptop op DHCP, daarna `http://192.168.1.1`, user `root`, geen wachtwoord.
```powershell
netsh interface ip set address name="Ethernet" dhcp   # pc
ipconfig /renew                                       # pc
ipconfig /all                                         # pc
```

### How does the IP address allocation differ between the switch and the router?
De switch heeft geen DHCP-server, dus de laptop heeft een statisch IP nodig. De router heeft wel een DHCP-server op de LAN-interface, dus de laptop krijgt automatisch een IP in 192.168.1.x met gateway 192.168.1.1.

### Explore the GUI
Geen commando's.

---

## Exercise 2: Getting started with the command line

### Connect via SSH
```cli
ssh root@192.168.1.1   # pc
exit                   # router/switch (sluit de SSH-sessie)
```

Bij "host identification has changed":
```cli
ssh-keygen -R 192.168.1.1   # pc
ssh root@192.168.1.1        # pc
```

### OpenWrt CLI warm-up

| Command | Uitvoeren op | Output and function |
|---|---|---|
| `ubus call system board` | router/switch | JSON met hardware- en firmware-info: kernel, hostname, CPU, model, board_name, rootfs_type en release (distribution, version, revision, target). |
| `cat /etc/openwrt_release` | router/switch | Release-info van de firmware: DISTRIB_ID, DISTRIB_RELEASE, DISTRIB_REVISION, DISTRIB_TARGET, DISTRIB_ARCH, DISTRIB_DESCRIPTION. |
| `uptime` | router/switch | Huidige tijd, hoelang het toestel draait, aantal gebruikers en de load average (1, 5, 15 min). |
| `free -h` | router/switch | Geheugengebruik: total, used, free, shared, buff/cache, available. |
| `df -h` | router/switch | Schijfgebruik per filesystem. `/` is read-only squashfs, `/overlay` is het schrijfbare deel (config en pakketten), `/tmp` is tmpfs in RAM. |
| `ip a` | router/switch | Alle interfaces met status, MAC en IP-adressen (lo, poorten, br-lan met 192.168.1.1/24, op de router ook wan). |
| `ip route` | router/switch | Kernel routing tabel: connected route `192.168.1.0/24 dev br-lan`, op de router met uplink ook een default route via wan. |
| `ifstatus lan` | router/switch | JSON-status van de logische interface lan: up, proto static, device br-lan, ipv4-address, routes, DNS. |
| `ifstatus wan` | router (op de switch bestaat geen wan) | Zelfde voor wan. Router: DHCP-client met IP, gateway en DNS van het campusnetwerk. Switch: geen wan-interface ("Interface not found"). |
| `uci show network` | router/switch | Toont `/etc/config/network`: loopback, globals, device br-lan met poorten, lan (static, 192.168.1.1, 255.255.255.0) en op de router wan/wan6 (dhcp). |
| `logread` | router/switch | Toont het systeemlog (boot, netifd, dnsmasq, dropbear, firewall). |
| `logread -f` | router/switch | Volgt het log live (zoals `tail -f`), stoppen met Ctrl+C. |
| `logread -e dnsmasq` | router/switch | Enkel logregels met "dnsmasq": DHCP- en DNS-activiteit. |
| `logread -e firewall` | router/switch | Enkel firewall-gerelateerde logregels. |

### Connectivity commands

| Command | Uitvoeren op | Output and function |
|---|---|---|
| `ping -c 4 XXX.XXX.XXX.XXX` | pc of router/switch | Stuurt precies 4 ICMP echo requests en toont per pakket de tijd plus statistieken (verzonden, ontvangen, verlies, min/avg/max). Test bereikbaarheid. |
| `ping 8.8.8.8` | pc of router/switch | Continue ping naar Google DNS tot Ctrl+C. Test internetverbinding zonder DNS. |
| `nslookup openwrt.org` | pc of router/switch | Vraagt de DNS-server om de naam om te zetten en toont server en IP-adres. Test DNS. |
| `fping -g 10.1.1.0/24` | pc (Ubuntu desktop) | Ping sweep over het hele bereik, toont per host "is alive" of "is unreachable". |

---

## Exercise 3: Package management

### Connect to the internet
Router: kabel van het campusnetwerk in de WAN-poort.

Switch (GUI): Network > Interfaces > Add new interface (poort kiezen, protocol DHCP Client), daarna Network > Devices > Configure, poort uit de bridge halen, Save & Apply. Zelfde in CLI (poortnaam en device-index eerst nakijken):
```cli
uci show network                                # switch
uci del_list network.@device[0].ports='lan8'    # switch
uci set network.wan=interface                   # switch
uci set network.wan.device='lan8'               # switch
uci set network.wan.proto='dhcp'                # switch
uci commit network                              # switch
/etc/init.d/network restart                     # switch
```

Test:
```cli
ping -c 4 openwrt.org   # router/switch
```

### Check the system date
```cli
date                           # router/switch
date -s "YYYY-MM-DD HH:MM:SS"  # router/switch
```

### Updating the package lists
```cli
opkg update   # router/switch
```

### Upgrading installed packages
```cli
opkg list-upgradable      # router/switch
opkg upgrade <packagename>  # router/switch
```

### Installing new packages
```cli
opkg update && opkg install tcpdump   # router/switch
opkg list-installed | grep tcpdump    # router/switch
```

### Installing packages via the GUI
System > Software > Update lists. Filter op `tcpdump` bij Installed packages om de installatie te controleren. Zoek `vim` en klik Install. (LuCI in de browser van de pc, het pakket wordt op de router/switch geïnstalleerd.)

---

## Exercise 4: Connecting to your neighbor

### Turn off the firewall
```cli
/etc/init.d/firewall stop   # router en switch
```

### Change the management IP
GUI: Network > Interfaces > LAN > Edit > IPv4 address `10.1.1.1` (switch) of `10.1.2.1` (router), netmask `255.255.0.0`, Save & Apply. Zelfde in CLI (voorbeeld switch):
```cli
uci set network.lan.ipaddr='10.1.1.1'      # switch (op de router: 10.1.2.1)
uci set network.lan.netmask='255.255.0.0'  # switch/router
uci commit network                         # switch/router
/etc/init.d/network restart                # switch/router
```

### Configure the hosts
```powershell
netsh interface ip set address name="Ethernet" static 10.1.1.10 255.255.0.0   # pc aan de switch
netsh interface ip set address name="Ethernet" static 10.1.2.10 255.255.0.0   # pc aan de router
```

### Verify connectivity
```cli
ping -c 4 10.1.1.1    # pc (switch-management)
ping -c 4 10.1.2.1    # pc (router-management)
ping -c 4 10.1.2.10   # pc aan de switch (de andere host)
```
Browser op de pc: `http://10.1.1.1` (Netgear) en `http://10.1.2.1` (Asus).

### What will happen to your browser connection the moment you change the router's IP address, and what exact URL will you need to use afterwards to reach LuCI again?
De verbinding valt weg, want het toestel luistert niet meer op 192.168.1.1. Daarna is LuCI bereikbaar via `http://10.1.2.1` (router) of `http://10.1.1.1` (switch).

### What changed on your laptop side when the IP changed? Did your laptop remain on the correct network to reach 10.1.x.1?
Op de laptop is niets veranderd, hij heeft nog zijn 192.168.1.x/24-adres. Hij zit dus niet meer in hetzelfde netwerk als 10.1.x.1 en moet een statisch IP in 10.1.0.0/16 krijgen (10.1.1.10 of 10.1.2.10).

### Since both hosts are in 10.1.0.0/16, do you need a default gateway for host-to-host connectivity inside this lab network?
Nee. Beide hosts zitten in hetzelfde subnet, dus de host stuurt rechtstreeks naar het MAC-adres van de bestemming (via ARP). Een gateway is enkel nodig voor bestemmingen buiten het eigen subnet.

### If everything must live inside one /16 subnet, do you want the OpenWrt WAN port involved at all, or should this be LAN-to-LAN? Why?
LAN-to-LAN. De LAN-poorten zitten in de bridge br-lan, dus de router werkt als Layer 2 switch in hetzelfde subnet. De WAN-poort is een aparte gerouteerde interface (eigen subnet, firewall-zone, NAT), waardoor de hosts niet meer in één /16 zouden zitten zonder extra routing.

### Did you encounter any problems along the way, and how did you solve them?
Nog in te vullen na het labo.

---

## Exercise 5: Storing and loading configurations

### Back up (download) your current configuration
GUI: System > Backup / Flash Firmware > Generate archive. Bestandsnaam: `Group<n>_DeviceA_OpenWrt_24.10.2_backup_YYYY-MM-DD.tar.gz`. Zelfde in CLI:
```cli
sysupgrade -b /tmp/backup.tar.gz                  # router/switch
scp -O root@10.1.1.1:/tmp/backup.tar.gz .         # pc
```

### Restore (upload) a previous configuration archive
GUI: System > Backup / Flash Firmware > Restore backup > archief kiezen > upload en bevestigen. Zelfde in CLI:
```cli
scp -O backup.tar.gz root@10.1.1.1:/tmp/   # pc
sysupgrade -r /tmp/backup.tar.gz           # router/switch
reboot                                     # router/switch
```

### Resetting the device
Hardware: toestel aan, reset-knop ongeveer 10 seconden ingedrukt houden, loslaten, niet uitsteken. Software: System > Backup / Flash Firmware > Perform reset. Zelfde in CLI:
```cli
firstboot -y && reboot   # router/switch
```

### What is the difference between a configuration backup archive and a firmware image?
Een configuratie-archief bevat enkel de instellingen (bestanden onder `/etc/`, zoals `/etc/config/`) en wordt toegepast op het reeds geïnstalleerde besturingssysteem. Een firmware image is het volledige besturingssysteem (kernel en root filesystem) en vervangt dat bij het flashen.

### After restoring the backup, why might you temporarily lose access to the device even though the restore action succeeded? Do you need to change anything on your hosts?
Het toestel herstart en neemt het management-IP uit de backup over (bv. 10.1.1.1/16), terwijl de browser nog naar het oude adres (bv. 192.168.1.1) wijst. Ja: de host moet een IP in het subnet van het herstelde adres hebben (bv. 10.1.1.10/16) en de browser moet naar dat adres gaan.
