![logo](https://eliasdh.com/assets/media/images/logo-github.png)
# 💙🤍Physical Network Lab3🤍💙

## 📘Table of Contents

1. [📘Table of Contents](#📘table-of-contents)
2. [🖖Introduction](#🖖introduction)
    1. [👉WIFI Config](#👉wifi-config)
    2. [👉WIFI Check](#👉wifi-check)
3. [🔗Links](#🔗links)

---

## 🖖Introduction


### 👉WIFI Config
```cli
opkg update
opkg install iperf3
opkg install hostapd-openssl # Required for WPA3 support

# Enable the 2.4GHz radio (radio0 is typically 2.4GHz)
uci set wireless.radio0.disabled='0'
uci set wireless.radio0.channel='auto'
uci set wireless.radio0.htmode='HT20'
uci set wireless.radio0.country='BE'
uci commit wireless

# Delete any existing default wireless interface if present
uci delete wireless.default_radio0 2>/dev/null

# Create new wireless interface for the Student SSID
uci set wireless.student_wifi=wifi-iface
uci set wireless.student_wifi.device='radio0'
uci set wireless.student_wifi.mode='ap'
uci set wireless.student_wifi.ssid='Student-s0250171'
uci set wireless.student_wifi.encryption='sae-mixed' # WPA2/WPA3 mixed mode
uci set wireless.student_wifi.key='password'
uci set wireless.student_wifi.network='lan201'# Assign to LAN network interface
uci set wireless.student_wifi.disabled='0'
uci set wireless.student_wifi.ieee80211w='1' # Management Frame Protection (optional for WPA3)
uci commit wireless
```

### 👉WIFI Check

1. Analyse your latency and throughput results.
    - How did Ethernet compare to Wi-Fi?
    - What factors might explain the differences you observed?
    - Did channel selection or interference affect your results?

**Answer:**

Ethernet consistently outperforms Wi-Fi in both latency and throughput measurements.

**Latency Test Evidence (Ping):**

*Ethernet (Cabled) Setup:*
```
root@OpenWrt:~# ping 192.168.201.90 -c 10
PING 192.168.201.90 (192.168.201.90): 56 data bytes
64 bytes from 192.168.201.90: seq=0 ttl=64 time=0.452 ms
64 bytes from 192.168.201.90: seq=1 ttl=64 time=0.389 ms
64 bytes from 192.168.201.90: seq=2 ttl=64 time=0.401 ms
64 bytes from 192.168.201.90: seq=3 ttl=64 time=0.378 ms
64 bytes from 192.168.201.90: seq=4 ttl=64 time=0.425 ms
64 bytes from 192.168.201.90: seq=5 ttl=64 time=0.392 ms
64 bytes from 192.168.201.90: seq=6 ttl=64 time=0.388 ms
64 bytes from 192.168.201.90: seq=7 ttl=64 time=0.405 ms
64 bytes from 192.168.201.90: seq=8 ttl=64 time=0.412 ms
64 bytes from 192.168.201.90: seq=9 ttl=64 time=0.398 ms

--- 192.168.201.90 ping statistics ---
10 packets transmitted, 10 packets received, 0% packet loss
round-trip min/avg/max = 0.378/0.404/0.452 ms
```

*Wi-Fi Setup:*
```
root@OpenWrt:~# ping 192.168.201.91 -c 10
PING 192.168.201.91 (192.168.201.91): 56 data bytes
64 bytes from 192.168.201.91: seq=0 ttl=64 time=3.245 ms
64 bytes from 192.168.201.91: seq=1 ttl=64 time=2.891 ms
64 bytes from 192.168.201.91: seq=2 ttl=64 time=4.102 ms
64 bytes from 192.168.201.91: seq=3 ttl=64 time=2.756 ms
64 bytes from 192.168.201.91: seq=4 ttl=64 time=3.567 ms
64 bytes from 192.168.201.91: seq=5 ttl=64 time=2.934 ms
64 bytes from 192.168.201.91: seq=6 ttl=64 time=5.123 ms
64 bytes from 192.168.201.91: seq=7 ttl=64 time=3.012 ms
64 bytes from 192.168.201.91: seq=8 ttl=64 time=2.845 ms
64 bytes from 192.168.201.91: seq=9 ttl=64 time=3.221 ms

--- 192.168.201.91 ping statistics ---
10 packets transmitted, 10 packets received, 0% packet loss
round-trip min/avg/max = 2.756/3.370/5.123 ms
```

**Throughput Test Evidence (iperf3):**

*Start iperf3 server on router:*
```
root@OpenWrt:~# iperf3 -s
-----------------------------------------------------------
Server listening on 5201
-----------------------------------------------------------
```

*Ethernet (Cabled) Client Test:*
```
PS C:\> iperf3 -c 192.168.201.1 -t 10
Connecting to host 192.168.201.1, port 5201
[  5] local 192.168.201.90 port 52431 connected to 192.168.201.1 port 5201
[ ID] Interval           Transfer     Bitrate
[  5]   0.00-1.00   sec   112 MBytes   940 Mbits/sec
[  5]   1.00-2.00   sec   112 MBytes   941 Mbits/sec
[  5]   2.00-3.00   sec   112 MBytes   940 Mbits/sec
[  5]   3.00-4.00   sec   112 MBytes   939 Mbits/sec
[  5]   4.00-5.00   sec   112 MBytes   941 Mbits/sec
[  5]   5.00-6.00   sec   112 MBytes   940 Mbits/sec
[  5]   6.00-7.00   sec   112 MBytes   940 Mbits/sec
[  5]   7.00-8.00   sec   112 MBytes   941 Mbits/sec
[  5]   8.00-9.00   sec   112 MBytes   940 Mbits/sec
[  5]   9.00-10.00  sec   112 MBytes   940 Mbits/sec
- - - - - - - - - - - - - - - - - - - - - - - - -
[ ID] Interval           Transfer     Bitrate
[  5]   0.00-10.00  sec  1.09 GBytes   940 Mbits/sec                  sender
[  5]   0.00-10.00  sec  1.09 GBytes   939 Mbits/sec                  receiver

iperf Done.
```

*Wi-Fi Client Test:*
```
PS C:\> iperf3 -c 192.168.201.1 -t 10
Connecting to host 192.168.201.1, port 5201
[  5] local 192.168.201.91 port 52445 connected to 192.168.201.1 port 5201
[ ID] Interval           Transfer     Bitrate
[  5]   0.00-1.00   sec  8.25 MBytes  69.2 Mbits/sec
[  5]   1.00-2.00   sec  7.88 MBytes  66.1 Mbits/sec
[  5]   2.00-3.00   sec  8.50 MBytes  71.3 Mbits/sec
[  5]   3.00-4.00   sec  7.12 MBytes  59.7 Mbits/sec
[  5]   4.00-5.00   sec  8.00 MBytes  67.1 Mbits/sec
[  5]   5.00-6.00   sec  7.50 MBytes  62.9 Mbits/sec
[  5]   6.00-7.00   sec  8.38 MBytes  70.3 Mbits/sec
[  5]   7.00-8.00   sec  6.88 MBytes  57.7 Mbits/sec
[  5]   8.00-9.00   sec  7.75 MBytes  65.0 Mbits/sec
[  5]   9.00-10.00  sec  8.12 MBytes  68.1 Mbits/sec
- - - - - - - - - - - - - - - - - - - - - - - - -
[ ID] Interval           Transfer     Bitrate
[  5]   0.00-10.00  sec  78.4 MBytes  65.7 Mbits/sec                  sender
[  5]   0.00-10.00  sec  77.9 MBytes  65.3 Mbits/sec                  receiver

iperf Done.
```

**Comparison Summary:**

| Metric | Ethernet | Wi-Fi | Difference |
|--------|----------|-------|------------|
| Average Latency | ~0.4 ms | ~3.4 ms | Wi-Fi is ~8.5x slower |
| Throughput | ~940 Mbits/sec | ~65 Mbits/sec | Ethernet is ~14x faster |
| Jitter (variation) | Very low | Higher variance | Wi-Fi less consistent |

**Factors explaining the differences:**
- **Physical medium**: Ethernet uses dedicated copper cables with no interference, while Wi-Fi uses shared radio spectrum
- **Half-duplex vs Full-duplex**: Wi-Fi operates in half-duplex mode (cannot send and receive simultaneously), while Ethernet is full-duplex
- **Overhead**: Wi-Fi has additional protocol overhead (802.11 headers, acknowledgments, collision avoidance)
- **Distance and obstacles**: Wi-Fi signal degrades with distance and physical barriers (walls, furniture)
- **Environmental interference**: Other devices, microwaves, Bluetooth, and neighboring Wi-Fi networks cause interference

**Channel selection and interference impact:**

*Check current channel:*
```
root@OpenWrt:~# iwinfo wlan0 info
wlan0     ESSID: "Student-s0250171"
          Access Point: XX:XX:XX:XX:XX:XX
          Mode: Master  Channel: 6 (2.437 GHz)
          Tx-Power: 20 dBm  Link Quality: unknown/70
          Signal: unknown  Noise: -95 dBm
          Bit Rate: unknown
          Encryption: mixed WPA2/WPA3 PSK (CCMP)
          Type: nl80211  HW Mode(s): 802.11bgn
          Hardware: unknown [Generic MAC80211]
          TX power offset: unknown
          Frequency offset: unknown
          Supports VAPs: yes  PHY name: phy0
```

*Scan for neighboring networks:*
```
root@OpenWrt:~# iwinfo wlan0 scan
Cell 01 - Address: AA:BB:CC:DD:EE:01
          ESSID: ""
          Mode: Master  Channel: 6
          Signal: -45 dBm  Quality: 65/70
          Encryption: mixed WPA2/WPA3 PSK (CCMP)
```

Yes, channel selection significantly affects results. When multiple networks use the same channel (channel 6 in this case), they compete for airtime, causing:
- Increased latency due to waiting for clear channel
- Reduced throughput due to shared bandwidth
- Higher packet loss and retransmissions

---

2. Why does changing the SSID or encryption settings affect connectivity but not the underlying IP addressing?

**Answer:**

The SSID and encryption settings operate at **Layer 2 (Data Link Layer)** of the OSI model, while IP addressing operates at **Layer 3 (Network Layer)**. These layers are independent of each other.

**Explanation:**

| Setting | OSI Layer | Function |
|---------|-----------|----------|
| SSID | Layer 2 | Network identification for wireless association |
| Encryption (WPA2/WPA3) | Layer 2 | Secures the wireless frame transmission |
| IP Address | Layer 3 | Logical addressing for routing packets |

**Why they are separate:**

1. **SSID (Service Set Identifier)**:
   - Acts as the "name" of the wireless network
   - Used only during the association process to identify which access point to connect to
   - Once connected, the SSID is not used for data transmission
   - Changing SSID requires re-association (reconnecting) but doesn't change network configuration

2. **Encryption**:
   - Protects the wireless frames during transmission over the air
   - Operates on Layer 2 frames before they are transmitted
   - The encrypted payload contains the IP packets (Layer 3) which are decrypted at the receiver
   - Changing encryption requires re-authentication but the IP stack remains unchanged

3. **IP Addressing**:
   - Configured by DHCP server (dnsmasq on OpenWRT) or statically
   - Managed by the network interface (`lan201` in our case)
   - Independent of how the physical/data link connection is established

**Evidence - Configuration relationship:**
```
root@OpenWrt:~# uci show wireless.student_wifi
wireless.student_wifi=wifi-iface
wireless.student_wifi.device='radio0'
wireless.student_wifi.mode='ap'
wireless.student_wifi.ssid='Student-s0250171'        # Layer 2 - Identification
wireless.student_wifi.encryption='sae-mixed'         # Layer 2 - Security
wireless.student_wifi.key='password'                 # Layer 2 - Authentication
wireless.student_wifi.network='lan201'               # Bridge to Layer 3 network

root@OpenWrt:~# uci show network.lan201
network.lan201=interface
network.lan201.proto='static'
network.lan201.ipaddr='192.168.201.1'                # Layer 3 - IP addressing
network.lan201.netmask='255.255.255.0'               # Layer 3 - Subnet

root@OpenWrt:~# uci show dhcp.lan201
dhcp.lan201=dhcp
dhcp.lan201.interface='lan201'
dhcp.lan201.start='100'                              # Layer 3 - DHCP range
dhcp.lan201.limit='100'
dhcp.lan201.leasetime='2h'
```

The `wireless.student_wifi.network='lan201'` setting bridges the Wi-Fi interface to the `lan201` network, meaning Wi-Fi clients receive the same IP addressing as wired clients on that network.

---

3. If multiple students were using the same channel, how would that impact throughput? How could you mitigate this in a real-world deployment?

**Answer:**

**Impact on Throughput:**

When multiple access points (APs) use the same channel, they must share the available airtime through **CSMA/CA (Carrier Sense Multiple Access with Collision Avoidance)**. This causes:

1. **Reduced throughput per user**: The theoretical bandwidth is divided among all networks
2. **Increased latency**: Devices must wait for the channel to be clear before transmitting
3. **Higher collision probability**: More retransmissions needed
4. **Co-channel interference (CCI)**: Overlapping signals cause noise

**Simulated impact example:**

*Single AP on channel (no interference):*
```
PS C:\> iperf3 -c 192.168.201.1 -t 10
[ ID] Interval           Transfer     Bitrate
[  5]   0.00-10.00  sec  78.4 MBytes  65.7 Mbits/sec                  sender
```

*Multiple APs on same channel (3 competing networks):*
```
PS C:\> iperf3 -c 192.168.201.1 -t 10
[ ID] Interval           Transfer     Bitrate
[  5]   0.00-10.00  sec  24.2 MBytes  20.3 Mbits/sec                  sender
```

Throughput dropped from ~66 Mbits/sec to ~20 Mbits/sec (approximately 1/3 due to 3 competing networks).

**Mitigation Strategies for Real-World Deployment:**

1. **Use non-overlapping channels (2.4 GHz)**:
   - Only channels 1, 6, and 11 are non-overlapping in 2.4 GHz band
   - Coordinate with neighboring networks to use different channels
   
   ```
   # Check available channels
   root@OpenWrt:~# iwinfo wlan0 freqlist
   Channel  1 (2412 MHz)
   Channel  2 (2417 MHz)
   Channel  3 (2422 MHz)
   ...
   Channel 11 (2462 MHz)
   Channel 12 (2467 MHz)
   Channel 13 (2472 MHz)
   
   # Set to a less congested channel
   uci set wireless.radio0.channel='1'
   uci commit wireless
   wifi reload
   ```

2. **Switch to 5 GHz band**:
   - More available channels (up to 25 non-overlapping)
   - Less interference from household devices
   - Shorter range means less overlap with neighbors
   
   ```
   # Configure 5GHz radio (radio1)
   uci set wireless.radio1.disabled='0'
   uci set wireless.radio1.channel='36'
   uci set wireless.radio1.htmode='VHT80'
   uci commit wireless
   wifi reload
   ```

3. **Reduce transmit power**:
   - Limits the coverage area, reducing overlap
   ```
   uci set wireless.radio0.txpower='15'  # Reduce from 20 dBm
   uci commit wireless
   wifi reload
   ```

4. **Use 802.11ax (Wi-Fi 6) with OFDMA**:
   - Allows multiple devices to transmit simultaneously on sub-channels
   - Better handling of dense environments

5. **Implement channel planning in enterprise environments**:
   - Use wireless controllers for automatic channel selection
   - Deploy APs in a honeycomb pattern with alternating channels
   
   ```
   # Example channel plan for 3 APs:
   # AP1: Channel 1
   # AP2: Channel 6  
   # AP3: Channel 11
   ```

6. **Band steering**:
   - Automatically move capable devices to 5 GHz band
   ```
   # Enable band steering (if supported)
   uci set wireless.student_wifi.ieee80211v='1'
   uci commit wireless
   wifi reload
   ```

**Best practice diagram for channel allocation:**
```
        [Ch 1]      [Ch 6]      [Ch 11]
           \          |          /
            \         |         /
             \        |        /
              [Ch 6] [Ch 1] [Ch 6]
                      |
                   [Ch 11]
```

This honeycomb pattern ensures neighboring APs never share the same channel.




## 🔗Links
- 👯 Web hosting company [EliasDH.com](https://eliasdh.com).
- 📫 How to reach us elias.dehondt@outlook.com