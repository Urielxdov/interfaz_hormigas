# Despierta el backend en Render (plan gratuito: se duerme tras ~15 min sin uso).
# Correr 2 minutos antes de las pruebas.
#
#   .\scripts\despertar-backend.ps1                     # despierta y termina
#   .\scripts\despertar-backend.ps1 -MantenerDespierto  # ademas lo pica cada 10 min (Ctrl+C para salir)

param(
    [string]$Url = 'https://hormigas.onrender.com',
    [int]$MaxSegundos = 240,
    [switch]$MantenerDespierto
)

$ErrorActionPreference = 'Stop'
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

# Cualquier respuesta de Spring (aunque sea 401/403/405/500) significa que ya arranco.
# 502/503/504 o sin respuesta = Render todavia lo esta levantando.
function Get-Estado {
    try {
        $r = Invoke-WebRequest -Uri "$Url/api/auth/login" -Method Post -ContentType 'application/json' `
            -Body '{"email":"ping@ping.com","password":"x"}' -UseBasicParsing -TimeoutSec 60
        return [int]$r.StatusCode
    } catch {
        if ($_.Exception.Response) { return [int]$_.Exception.Response.StatusCode }
        return 0
    }
}

function Wait-Backend {
    $inicio = Get-Date
    $intento = 0
    while ($true) {
        $intento++
        $codigo = Get-Estado
        $seg = [int]((Get-Date) - $inicio).TotalSeconds
        if ($codigo -ne 0 -and $codigo -notin 502, 503, 504) {
            Write-Host "[OK] Backend despierto (HTTP $codigo) en $seg s" -ForegroundColor Green
            return $true
        }
        Write-Host "  intento $intento : aun arrancando (HTTP $codigo, $seg s)..."
        if ($seg -ge $MaxSegundos) {
            Write-Host "[X] No respondio en $MaxSegundos s. Revisa los logs en el dashboard de Render." -ForegroundColor Red
            return $false
        }
        Start-Sleep -Seconds 5
    }
}

Write-Host "Despertando $Url (puede tardar 1-2 min)..." -ForegroundColor Cyan
if (-not (Wait-Backend)) { exit 1 }

if ($MantenerDespierto) {
    Write-Host "Manteniendolo despierto cada 10 min. Ctrl+C para salir." -ForegroundColor Cyan
    while ($true) {
        Start-Sleep -Seconds 600
        $null = Wait-Backend
    }
}
