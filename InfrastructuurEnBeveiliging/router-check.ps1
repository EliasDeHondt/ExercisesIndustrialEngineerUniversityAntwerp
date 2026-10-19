# Draait op de PC (PowerShell): zet het check-script op de router, voert het daar uit
# en toont de gekleurde uitvoer (groen = OK, rood = NOT OK).
# Alles zit in dit ene bestand, je hebt geen ander bestand nodig.
#
# Gebruik:
#   .\router-check.ps1                          # router 2 (10.1.2.3), eenmalig
#   .\router-check.ps1 -Router 10.1.2.3 -Watch  # herhaalt elke 3 s, stoppen met Ctrl+C
#   .\router-check.ps1 -Router 10.1.1.3         # andere router (bv. na Exercise 6 vanuit een ander subnet)
#   .\router-check.ps1 -Number 2                # routernummer forceren
param(
    [string]$Router = '10.1.2.3',
    [int]$Number = 0,
    [switch]$Watch
)

# Het script dat op de router (OpenWrt, busybox sh) uitgevoerd wordt.
$remoteScript = @'
#!/bin/sh
# Lab 2 check, draait OP DE ROUTER (OpenWrt, busybox sh).
N=""
WATCH=0
while getopts "r:w" opt; do
    case $opt in
        r) N=$OPTARG ;;
        w) WATCH=1 ;;
        *) echo "Gebruik: $0 [-r routernummer] [-w]"; exit 1 ;;
    esac
done

G=$(printf '\033[32m'); R=$(printf '\033[31m'); Y=$(printf '\033[33m')
C=$(printf '\033[36m'); M=$(printf '\033[35m'); D=$(printf '\033[90m'); B=$(printf '\033[1m'); Z=$(printf '\033[0m')

ok()   { printf '%s[  OK  ]%s %s\n' "$G" "$Z" "$1"; }
bad()  { printf '%s[NOT OK]%s %s\n' "$R" "$Z" "$1"; }
warn() { printf '%s[ INFO ]%s %s\n' "$Y" "$Z" "$1"; }

run_check() {
    # Routernummer afleiden uit het IP van br-lan (10.1.n.3)
    n=$N
    if [ -z "$n" ]; then
        n=$(ip -4 -o addr show dev br-lan 2>/dev/null | sed -n 's/.*inet 10\.1\.\([0-9]\)\.3\/.*/\1/p' | head -n 1)
    fi
    if [ -z "$n" ]; then
        bad "Routernummer niet gevonden: br-lan heeft geen 10.1.n.3 (gebruik -r <nummer>)"
        return
    fi
    next=$(( n % 4 + 1 ))
    far=$(( (n + 1) % 4 + 1 ))
    prev=$(( (n + 2) % 4 + 1 ))

    printf '%s%sRouter %s%s   LAN1 = 10.1.%s.3   LAN2 = 10.1.%s.2\n\n' "$B" "$C" "$n" "$Z" "$n" "$next"

    # ---------- 1. Configuratie ----------
    printf '%s== Configuratie ==%s\n' "$B" "$Z"
    if ip -4 addr show dev br-lan 2>/dev/null | grep -q "inet 10\.1\.$n\.3/24"; then
        ok "br-lan (LAN1) heeft 10.1.$n.3/24"
    else
        bad "br-lan (LAN1) heeft NIET 10.1.$n.3/24"
    fi
    if ip -4 addr show dev lan2 2>/dev/null | grep -q "inet 10\.1\.$next\.2/24"; then
        ok "lan2 (LAN2) heeft 10.1.$next.2/24"
    else
        bad "lan2 (LAN2) heeft NIET 10.1.$next.2/24 (interface lan2 aangemaakt en LAN2 uit de bridge gehaald?)"
    fi
    if ip link show dev lan2 2>/dev/null | grep -q "master br-lan"; then
        bad "poort lan2 zit nog in de bridge br-lan"
    fi
    if [ "$(cat /proc/sys/net/ipv4/ip_forward 2>/dev/null)" = "1" ]; then
        ok "IP forwarding staat aan"
    else
        bad "IP forwarding staat uit"
    fi
    if nft list tables 2>/dev/null | grep -q fw4; then
        bad "firewall draait nog (/etc/init.d/firewall stop)"
    else
        ok "firewall staat uit"
    fi
    for d in ripd ospfd; do
        if pidof "$d" >/dev/null 2>&1; then
            warn "$d draait (dynamisch routeren actief)"
        fi
    done

    # ---------- 2. Routes ----------
    printf '\n%s== Routes (de twee netwerken waar deze router niet aan hangt) ==%s\n' "$B" "$Z"
    for y in "$far" "$prev"; do
        line=$(ip route show 10.1.$y.0/24 2>/dev/null | head -n 1)
        case "$line" in
            *via*) ok "route naar 10.1.$y.0/24: $line" ;;
            *)     bad "geen route naar 10.1.$y.0/24" ;;
        esac
    done

    # ---------- 3. Pings ----------
    printf '\n%s== Ping ==%s\n' "$B" "$Z"
    T=$(mktemp -d)
    : > "$T/list"
    for g in 1 2 3 4; do
        gn=$(( g % 4 + 1 ))
        echo "sw|SW$g|10.1.$g.1|$g"        >> "$T/list"
        echo "rt|R$g LAN1|10.1.$g.3|$g"    >> "$T/list"
        echo "rt|R$g LAN2|10.1.$gn.2|$g"   >> "$T/list"
        echo "pc|PC$g.10|10.1.$g.10|$g"    >> "$T/list"
        echo "pc|PC$g.11|10.1.$g.11|$g"    >> "$T/list"
    done

    # Alle pings tegelijk starten.
    i=0
    while IFS='|' read -r type name ip grp; do
        i=$((i + 1))
        ( ping -c 1 -W 1 "$ip" >/dev/null 2>&1 && : > "$T/$i.ok" ) &
    done < "$T/list"
    wait

    total=0; good=0; last=0; i=0
    while IFS='|' read -r type name ip grp; do
        i=$((i + 1))
        if [ "$grp" != "$last" ]; then
            last=$grp
            if [ "$grp" = "$n" ]; then
                printf '\n%s%s Groep %s (deze router) %s\n' "$B" "$Y" "$grp" "$Z"
            else
                printf '\n%s Groep %s %s\n' "$D" "$grp" "$Z"
            fi
        fi
        # Switches hebben geen default gateway: ze antwoorden enkel in hun eigen subnet.
        # Vanaf deze router zijn dus alleen de switches in netwerk n en n+1 bereikbaar.
        expected=1
        if [ "$type" = "sw" ] && [ "$grp" != "$n" ] && [ "$grp" != "$next" ]; then
            expected=0
        fi
        case $type in sw) col=$C ;; rt) col=$M ;; *) col= ;; esac
        if [ -e "$T/$i.ok" ]; then
            [ $expected = 1 ] && { total=$((total + 1)); good=$((good + 1)); }
            printf '%s[  OK  ]%s %s%-8s%s %s%s%s\n' "$G" "$Z" "$col" "$name" "$Z" "$D" "$ip" "$Z"
        elif [ $expected = 1 ]; then
            total=$((total + 1))
            printf '%s[NOT OK]%s %s%-8s%s %s%s%s\n' "$R" "$Z" "$col" "$name" "$Z" "$D" "$ip" "$Z"
        else
            printf '%s[ n.v.t.]%s %s%-8s%s %s%s  (switch zonder gateway, verwacht geen antwoord)%s\n' "$Y" "$Z" "$col" "$name" "$Z" "$D" "$ip" "$Z"
        fi
    done < "$T/list"
    rm -rf "$T"

    printf '\n'
    if [ "$good" -eq "$total" ]; then c=$G; elif [ "$good" -eq 0 ]; then c=$R; else c=$Y; fi
    printf '%s%s %s/%s bereikbaar %s\n' "$B" "$c" "$good" "$total" "$Z"
}

if [ "$WATCH" = 1 ]; then
    while true; do
        clear
        printf 'Router check  %s   (Ctrl+C om te stoppen)\n\n' "$(date +%H:%M:%S)"
        run_check
        sleep 3
    done
else
    run_check
fi
'@

# Naar een tijdelijk bestand schrijven met Unix-regeleinden (LF), anders werkt het niet op de router.
$tmp = Join-Path $env:TEMP 'router-check.sh'
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($tmp, $remoteScript.Replace("`r`n", "`n"), $utf8NoBom)

# Hosts keys negeren: dezelfde IP's worden op verschillende toestellen hergebruikt (anders "HOST IDENTIFICATION HAS CHANGED").
$sshOpts = @('-o', 'StrictHostKeyChecking=no', '-o', 'UserKnownHostsFile=NUL', '-o', 'LogLevel=ERROR', '-o', 'ConnectTimeout=5')

# 1. Script naar de router kopieren (-O = oud SCP-protocol, zoals in Lab 1)
Write-Host "Script kopieren naar root@$Router ..." -ForegroundColor DarkGray
& scp -O @sshOpts $tmp "root@${Router}:/tmp/router-check.sh"
if ($LASTEXITCODE -ne 0) {
    Write-Host "Kopieren mislukt: is $Router bereikbaar en zit je pc in het juiste subnet?" -ForegroundColor Red
    Remove-Item $tmp -ErrorAction SilentlyContinue
    exit 1
}
Remove-Item $tmp -ErrorAction SilentlyContinue

# 2. Uitvoeren (-t geeft een terminal, nodig voor kleuren en het scherm wissen bij -Watch)
$remoteArgs = ''
if ($Number -gt 0) { $remoteArgs += " -r $Number" }
if ($Watch) { $remoteArgs += ' -w' }
& ssh -t @sshOpts "root@$Router" "sh /tmp/router-check.sh$remoteArgs"
