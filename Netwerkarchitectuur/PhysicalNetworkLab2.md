![logo](https://eliasdh.com/assets/media/images/logo-github.png)
# 💙🤍Physical Network Lab2🤍💙

## 📘Table of Contents

1. [📘Table of Contents](#📘table-of-contents)
2. [🖖Introduction](#🖖introduction)
    1. [👉NAT Config](#👉nat-config)
    2. [👉NAT Check](#👉nat-check)
    3. [👉Firewall Config](#👉firewall-config)
    4. [👉Firewall Check](#👉firewall-check)
3. [🔗Links](#🔗links)

---

## 🖖Introduction

Verbinden met de Router
Host windows “ipconfig” zoek ip van Router
Verbinden “ssh root@192.168.1.1“

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

### 👉Firewall Config

```cli
uci add firewall rule # Only LAN IP 192.168.201.90 is allowed to SSH to the router
uci set firewall.@rule[-1].name='Allow_SSH_from_90'
uci set firewall.@rule[-1].src='lan'
uci set firewall.@rule[-1].src_ip='192.168.201.90'
uci set firewall.@rule[-1].dest_port='22'
uci set firewall.@rule[-1].proto='tcp'
uci set firewall.@rule[-1].target='ACCEPT'
uci add firewall rule
uci set firewall.@rule[-1].name='Deny_SSH_others'
uci set firewall.@rule[-1].src='lan'
uci set firewall.@rule[-1].dest_port='22'
uci set firewall.@rule[-1].proto='tcp'
uci set firewall.@rule[-1].target='DROP'
uci commit firewall
/etc/init.d/firewall restart

uci add firewall rule # Block ICMP on WAN
uci set firewall.@rule[-1].name='Block_ICMP_WAN'
uci set firewall.@rule[-1].src='wan'
uci set firewall.@rule[-1].proto='icmp'
uci set firewall.@rule[-1].target='DROP'
uci commit firewall
/etc/init.d/firewall restart

uci add firewall rule # Log ALL dropped WAN traffic
uci set firewall.@rule[-1].name='Log_Dropped_WAN'
uci set firewall.@rule[-1].src='wan'
uci set firewall.@rule[-1].proto='all'
uci set firewall.@rule[-1].target='DROP'
uci set firewall.@rule[-1].log='1'
uci commit firewall
/etc/init.d/firewall restart

uci delete firewall.@rule[Expose_LuCI_WAN] # Restrict exposed LuCI on WAN to 143.129.40.0/24
uci add firewall rule
uci set firewall.@rule[-1].name='Allow_LuCI_From_UAntwerp'
uci set firewall.@rule[-1].src='wan'
uci set firewall.@rule[-1].src_ip='143.129.40.0/24'
uci set firewall.@rule[-1].dest_port='80'
uci set firewall.@rule[-1].proto='tcp'
uci set firewall.@rule[-1].target='ACCEPT'
uci add firewall rule
uci set firewall.@rule[-1].name='Block_LuCI_Others'
uci set firewall.@rule[-1].src='wan'
uci set firewall.@rule[-1].dest_port='80'
uci set firewall.@rule[-1].proto='tcp'
uci set firewall.@rule[-1].target='DROP'
uci commit firewall
/etc/init.d/firewall restart

uci add firewall rule # Allow ICMP within LAN, but ICMP to router
uci set firewall.@rule[-1].name='Allow_ICMP_LAN_internal'
uci set firewall.@rule[-1].src='lan'
uci set firewall.@rule[-1].dest='lan'
uci set firewall.@rule[-1].proto='icmp'
uci set firewall.@rule[-1].target='ACCEPT'
uci add firewall rule
uci set firewall.@rule[-1].name='Block_ICMP_to_router'
uci set firewall.@rule[-1].src='lan'
uci set firewall.@rule[-1].proto='icmp'
uci set firewall.@rule[-1].target='DROP'
uci commit firewall
/etc/init.d/firewall restart
```


### 👉Firewall Check

1. Explain the difference between inbound, outbound, and forwarded traffic. Include examples (firewall rules) from your setup.
> Inbound traffic is traffic coming from an external network (e.g., WAN) to the router itself.
> - Example: Someone on the internet trying to access your router.
```cli
uci add firewall rule
uci set firewall.@rule[-1].name='Drop_Inbound_WAN'
uci set firewall.@rule[-1].src='wan'
uci set firewall.@rule[-1].target='DROP'
uci commit firewall
```

> Outbound traffic is traffic sent by the router itself to another network.
> - Example: The router contacting an NTP or DNS server.
```cli
uci add firewall rule
uci set firewall.@rule[-1].name='Allow_Router_NTP'
uci set firewall.@rule[-1].proto='udp'
uci set firewall.@rule[-1].dest_port='123'
uci set firewall.@rule[-1].target='ACCEPT'
uci commit firewall
```

> Forwarded traffic is traffic that passes through the router, from one interface to another.
> - Example: A LAN device accessing the internet through the router.
```cli
uci add firewall rule
uci set firewall.@rule[-1].name='Allow_LAN_to_WAN'
uci set firewall.@rule[-1].src='lan'
uci set firewall.@rule[-1].dest='wan'
uci set firewall.@rule[-1].target='ACCEPT'
uci commit firewall
```

2. Why does blocking SSH to the router not affect SSH that is port forwarded to a LAN device?
> Blocking SSH to the router does not affect SSH that is port forwarded to a LAN device because the firewall rules for the router itself and the port forwarding rules operate independently. When you block SSH to the router, you are preventing direct access to the router's own SSH service. However, port forwarding allows incoming SSH requests on a specific external port to be redirected to a different internal IP address and port on the LAN device. Therefore, as long as the port forwarding rule is in place, users can still access the LAN device via SSH without being affected by the router's SSH restrictions.

3. What rule that you needed to configure for the objective was the easiest to verify? Which was the hardest? Why?
> Easiest ICMP block on WAN, because you can simply ping from WAN side.
> Hardest was the LuCI restriction, because you need to test from specific IP range.

4. If this were a production environment, what additional firewall measures would you recommend?
> Disable LuCI on WAN completely
> Protect against spoofing
> Disable unneeded services

## 🔗Links
- 👯 Web hosting company [EliasDH.com](https://eliasdh.com).
- 📫 How to reach us elias.dehondt@outlook.com