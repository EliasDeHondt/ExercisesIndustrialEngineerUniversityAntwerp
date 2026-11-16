param([int]$Port = 8000)

Write-Host "Test page on http://localhost:$Port"
Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue |
    Where-Object { $_.IPAddress -like '10.1.*' } |
    ForEach-Object { Write-Host "Other hosts:      http://$($_.IPAddress):$Port" }
Write-Host "Not reachable from another host? Allow Python in the Windows Firewall (private and public network)."

python -m http.server $Port --bind 0.0.0.0 --directory $PSScriptRoot