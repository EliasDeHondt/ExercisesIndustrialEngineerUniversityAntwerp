![logo](https://eliasdh.com/assets/media/images/logo-github.png)
# 💙🤍Physical Network Lab2🤍💙

## 📘Table of Contents

1. [📘Table of Contents](#📘table-of-contents)
2. [🖖Introduction](#🖖introduction)
    1. [👉NAT Config](#👉nat-config)
    2. [👉NAT Check](#👉nat-check)
3. [🔗Links](#🔗links)

---

## 🖖Introduction

### 👉NAT Config

```cli
uci set firewall.wan.masq='1'
uci commit firewall
/etc/init.d/firewall restart

uci set firewall.@zone[0].network='lan lan201'
uci set firewall.@zone[0].input='ACCEPT'
uci set firewall.@zone[0].output='ACCEPT'
uci set firewall.@zone[0].forward='ACCEPT'
uci set firewall.@zone[1].network='wan'
uci set firewall.@zone[1].input='REJECT'
uci set firewall.@zone[1].output='ACCEPT'
uci set firewall.@zone[1].forward='REJECT'
uci set firewall.@zone[1].masq='1'
uci commit firewall
/etc/init.d/firewall restart

uci add firewall forwarding
uci set firewall.@forwarding[-1].src='lan'
uci set firewall.@forwarding[-1].dest='wan'
uci commit firewall
/etc/init.d/firewall restart

uci add firewall redirect
uci set firewall.@redirect[-1].name='docent_web'
uci set firewall.@redirect[-1].src='wan'
uci set firewall.@redirect[-1].src_dport='8080'
uci set firewall.@redirect[-1].dest='lan'
uci set firewall.@redirect[-1].dest_ip='192.168.201.99'
uci set firewall.@redirect[-1].dest_port='80'
uci set firewall.@redirect[-1].proto='tcp'
uci add firewall redirect
uci set firewall.@redirect[-1].name='student_ssh'
uci set firewall.@redirect[-1].src='wan'
uci set firewall.@redirect[-1].src_dport='2020'
uci set firewall.@redirect[-1].dest='lan'
uci set firewall.@redirect[-1].dest_ip='192.168.201.90'
uci set firewall.@redirect[-1].dest_port='22'
uci set firewall.@redirect[-1].proto='tcp'
uci commit firewall
/etc/init.d/firewall restart

uci add firewall rule
uci set firewall.@rule[-1].name='Expose_LuCI_WAN'
uci set firewall.@rule[-1].src='wan'
uci set firewall.@rule[-1].dest_port='80'
uci set firewall.@rule[-1].proto='tcp'
uci set firewall.@rule[-1].target='ACCEPT'
uci commit firewall
/etc/init.d/firewall restart
```
### 👉NAT Check

1. What happens when two LAN devices try to use the same external port for different services?
> When two LAN devices try to use the same external port for different services, the router will not be able to distinguish between the two requests. As a result, only one of the services will be accessible from the outside, while the other will fail to connect. This is because port forwarding rules are unique per external port, and the router cannot forward incoming traffic on that port to multiple internal IP addresses.

2. What happens if a port-forwarded service is stopped on the LAN host?
> If a port-forwarded service is stopped on the LAN host, any incoming requests to that service from the WAN will fail to connect. The router will still forward the traffic to the specified internal IP and port, but since the service is not running, there will be no response, resulting in a timeout or connection error for the client trying to access the service.

3. What happens is a rule for a forwarded port is deleted while the service is actively being used?
> If a rule for a forwarded port is deleted while the service is actively being used, any new incoming connections to that port will be blocked by the router. Existing connections that were already established before the rule was deleted may continue to function until they are closed, but no new connections can be made. This effectively makes the service inaccessible from the WAN side until the port forwarding rule is re-established.

4. What happens if the LAN’s host IP changes for a forwarded port?
> If the LAN's host IP changes for a forwarded port, the port forwarding rule will no longer point to the correct internal IP address. As a result, incoming traffic on the specified external port will not reach the intended service, leading to connection failures. To resolve this, the port forwarding rule must be updated to reflect the new internal IP address of the LAN host.


```cli
ifstatus wan
```

## 🔗Links
- 👯 Web hosting company [EliasDH.com](https://eliasdh.com).
- 📫 How to reach us elias.dehondt@outlook.com