# Pingt alle toestellen van Lab 2 en toont per toestel groen (OK) of rood (NOT OK).
#
# Gebruik (PowerShell op de pc):
#   .\ping-check.ps1              # eenmalig
#   .\ping-check.ps1 -Watch       # herhaalt elke 2 s (handig bij kabel loskoppelen, Ex 7)
#   .\ping-check.ps1 -Group 2     # markeert je eigen groep met een pijl
param(
    [int]$Group = 2,
    [int]$TimeoutMs = 1000,
    [switch]$Watch
)

# Namen en IP's volgens Figure 2: groep n heeft SWn, Rn (LAN1 = 10.1.n.3, LAN2 = 10.1.(n+1).2) en PCn.10 / PCn.11
$targets = foreach ($n in 1..4) {
    $next = if ($n -eq 4) { 1 } else { $n + 1 }
    [pscustomobject]@{ Group = $n; Name = "SW$n";      IP = "10.1.$n.1" }
    [pscustomobject]@{ Group = $n; Name = "R$n LAN1";  IP = "10.1.$n.3" }
    [pscustomobject]@{ Group = $n; Name = "R$n LAN2";  IP = "10.1.$next.2" }
    [pscustomobject]@{ Group = $n; Name = "PC$n.10";   IP = "10.1.$n.10" }
    [pscustomobject]@{ Group = $n; Name = "PC$n.11";   IP = "10.1.$n.11" }
}

function Invoke-Check {
    # Alle pings tegelijk starten, zodat het niet 1 s per toestel duurt bij een fout.
    $jobs = foreach ($t in $targets) {
        $ping = New-Object System.Net.NetworkInformation.Ping
        $task = $null
        try { $task = $ping.SendPingAsync($t.IP, $TimeoutMs) } catch { }
        [pscustomobject]@{ Target = $t; Task = $task }
    }

    $okCount = 0
    $lastGroup = 0
    foreach ($j in $jobs) {
        $t = $j.Target
        $ok = $false
        $ms = ''
        try {
            $r = $j.Task.Result
            if ($r.Status -eq 'Success') { $ok = $true; $ms = "$($r.RoundtripTime) ms" }
        } catch { }

        if ($t.Group -ne $lastGroup) {
            if ($lastGroup -ne 0) { Write-Host '' }
            $lastGroup = $t.Group
        }

        $mark = if ($t.Group -eq $Group) { '>' } else { ' ' }
        $line = '{0} {1,-8} {2,-12}' -f $mark, $t.Name, $t.IP
        if ($ok) {
            $okCount++
            Write-Host ("[  OK  ] " + $line + $ms) -ForegroundColor Green
        } else {
            Write-Host ("[NOT OK] " + $line) -ForegroundColor Red
        }
    }

    Write-Host ''
    $color = if ($okCount -eq $targets.Count) { 'Green' } elseif ($okCount -eq 0) { 'Red' } else { 'Yellow' }
    Write-Host ("{0}/{1} bereikbaar" -f $okCount, $targets.Count) -ForegroundColor $color
}

if ($Watch) {
    while ($true) {
        Clear-Host
        Write-Host ("Ping check  {0}   (Ctrl+C om te stoppen)" -f (Get-Date -Format 'HH:mm:ss'))
        Write-Host ''
        Invoke-Check
        Start-Sleep -Seconds 2
    }
} else {
    Invoke-Check
}
