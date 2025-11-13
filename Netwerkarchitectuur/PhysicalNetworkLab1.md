![logo](https://eliasdh.com/assets/media/images/logo-github.png)
# 💙🤍Physical Network Lab1🤍💙

## 📘Table of Contents

1. [📘Table of Contents](#📘table-of-contents)
2. [🖖Introduction](#🖖introduction)
    1. [👉Set Static IP](#👉set-static-ip)
    2. [👉DHCP Config](#👉dhcp-config)
    3. [👉DHCP Check](#👉dhcp-check)
    4. [👉DNS Config](#👉dns-config)
    5. [👉DNS Check](#👉dns-check)
3. [🔗Links](#🔗links)

---

## 🖖Introduction

Verbinden met de Router
Host windows “ipconfig” zoek ip van Router
Verbinden “ssh root@192.168.1.1“

### 👉Set Static IP
```cli
uci set network.lan201=interface
uci set network.lan201.proto='static'
uci set network.lan201.ipaddr='192.168.201.1'
uci set network.lan201.netmask='255.255.255.0'
uci commit network
/etc/init.d/network restart
```

### 👉DHCP Config
```cli
uci set dhcp.lan201=dhcp
uci set dhcp.lan201.interface='lan201'
uci set dhcp.lan201.start='100'
uci set dhcp.lan201.limit='100'
uci set dhcp.lan201.leasetime='2h'
uci commit dhcp
/etc/init.d/dnsmasq restart

uci add_list dhcp.lan201.dhcp_option='3,192.168.201.1'
uci add_list dhcp.lan201.dhcp_option='6,8.8.8.8'
uci commit dhcp
/etc/init.d/dnsmasq restart

uci set network.lan201.device='br-lan'
uci commit network
/etc/init.d/network restart

uci delete network.lan
uci commit network
/etc/init.d/network restart


uci add dhcp host
uci set dhcp.@host[-1].name='student-pc1'
uci set dhcp.@host[-1].ip='192.168.201.90'
uci set dhcp.@host[-1].mac='00:e0:4c:55:74:ba'
uci set dhcp.@host[-1].dns='1'

uci add dhcp host
uci set dhcp.@host[-1].name='docent-pc1'
uci set dhcp.@host[-1].ip='192.168.201.99'
uci set dhcp.@host[-1].mac='38:ba:f8:8a:7c:0d'
uci set dhcp.@host[-1].dns='1'

uci commit dhcp
/etc/init.d/dnsmasq restart
```

```powershell
ipconfig /release
ipconfig /renew
ipconfig /all
```

### 👉DHCP Check
1. What happens if the lease time is shorter or longer than specified? Shorter lease times cause clients to renew IPs more often; longer leases keep IPs reserved longer.
    ```cli
    uci set dhcp.lan.leasetime='30m'   # short
    uci commit dhcp
    /etc/init.d/dnsmasq restart
    uci set dhcp.lan.leasetime='4h'    # long
    uci commit dhcp
    /etc/init.d/dnsmasq restart
    cat /tmp/dhcp.leases
    ```

2. How does DHCP manage leases when clients disconnect or shut down? The DHCP server keeps the IP reserved until the lease expires, even if the client is offline.
    ```cli
    cat /tmp/dhcp.leases
    ```

3. What happens when a client reconnects after its lease has expired? The client may get a new IP from the pool, unless the server can reassign the same IP based on MAC.
    ```cli
    uci set dhcp.lan.leasetime='1m'
    uci commit dhcp
    /etc/init.d/dnsmasq restart
    # Wait for 2 minutes, reconnect client
    cat /tmp/dhcp.leases
    ```

4. What happens if two clients are configured with the same static IP? An IP conflict occurs, causing network errors and unreachable clients.
    ```cli
    uci add dhcp host
    uci set dhcp.@host[-1].ip='192.168.201.90'
    uci set dhcp.@host[-1].mac='00:e0:4c:55:74:ba'
    uci commit dhcp
    uci add dhcp host
    uci set dhcp.@host[-1].ip='192.168.201.90'
    uci set dhcp.@host[-1].mac='38:ba:f8:8a:7c:0d'
    uci commit dhcp
    /etc/init.d/dnsmasq restart
    ```

5. How can you confirm from the command line that your static lease has been correctly applied? By checking the DHCP host configuration and the active leases for the client’s MAC and IP.
    ```cli
    uci show dhcp | grep host
    cat /tmp/dhcp.leases
    ```

### 👉DNS Config
```cli
uci set dhcp.@dnsmasq[0].domain='labnet.local'
uci set dhcp.@dnsmasq[0].authoritative='1'
uci commit dhcp
/etc/init.d/dnsmasq restart

uci add_list dhcp.@dnsmasq[0].server='/ei.fti.uantwerpen.be/143.129.39.200'
uci add_list dhcp.@dnsmasq[0].server='143.169.252.201'
uci commit dhcp
/etc/init.d/dnsmasq restart

uci add dhcp domain
uci set dhcp.@domain[-1].name='router.labnet.local'
uci set dhcp.@domain[-1].ip='192.168.201.1'
uci commit dhcp
/etc/init.d/dnsmasq restart

echo "cname=cyber.ei.fti.uantwerpen.be,cybersecurity.ei.fti.uantwerpen.be" >> /etc/dnsmasq.conf
/etc/init.d/dnsmasq restart
```

```powershell
nslookup router.labnet.local 192.168.201.1
nslookup cyber.ei.fti.uantwerpen.be 192.168.201.1
nslookup google.com 192.168.201.1
```

### 👉DNS Check
1. What happens when a DNS record changes but the client cache hasn’t expired?
    - The client may still resolve the old IP until the cache expires, leading to potential connectivity issues.
    ```cli
    nslookup router.labnet.local 192.168.201.1
    ```

2. How is DNS updated when a DHCP client’s IP changes?
    - The DHCP server updates the DNS records automatically when a client gets a new IP, ensuring accurate name resolution.
    ```cli
    cat /tmp/dhcp.leases
    ```

3. When a client disconnects, how long does its DNS name stay resolvable?
    - The DNS name remains resolvable until the DHCP lease expires and the DNS record is removed.
    ```cli
    nslookup student-pc1.labnet.local 192.168.201.1
    ```

4. What happens if upstream DNS servers are unreachable?
    - DNS queries will fail, and clients may not be able to resolve domain names until the upstream servers are reachable again.
    ```cli
    nslookup google.com 192.168.201.1
    ```

5. How can you confirm a static DNS entry is correctly applied on OpenWRT?
    - By querying the DNS server for the static entry and verifying the returned IP matches the configured value.
    ```cli
    nslookup router.labnet.local 192.168.201.1
    ```

6. What happens if two DNS entries share the same hostname, but different IPs?
    - You get multiple IPs.
    ```cli
    uci add dhcp domain
    uci set dhcp.@domain[-1].name='conflict.labnet.local'
    uci set dhcp.@domain[-1].ip='192.168.201.100'
    uci commit dhcp
    uci add dhcp domain
    uci set dhcp.@domain[-1].name='conflict.labnet.local'
    uci set dhcp.@domain[-1].ip='192.168.201.101'
    uci commit dhcp
    /etc/init.d/dnsmasq restart

    nslookup conflict.labnet.local 192.168.201.1
    ```

## 🔗Links
- 👯 Web hosting company [EliasDH.com](https://eliasdh.com).
- 📫 How to reach us elias.dehondt@outlook.com