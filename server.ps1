# Servidor Centralizado POS & KDS para Bull Market
param(
    [int]$Port = 8080
)

$baseDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
if (-not $baseDir) { $baseDir = "c:\Users\pauli\OneDrive\Desktop\Apps" }

$ip = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.InterfaceAlias -notmatch 'Loopback' -and $_.IPAddress -notmatch '^169' } | Select-Object -First 1).IPAddress
if (-not $ip) { $ip = "127.0.0.1" }

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$Port/")
$listener.Prefixes.Add("http://127.0.0.1:$Port/")
try {
    $listener.Prefixes.Add("http://${ip}:$Port/")
} catch {}

try {
    $listener.Start()
} catch {
    Write-Host "Error iniciando HttpListener: $_" -ForegroundColor Red
    exit 1
}

Write-Host "==========================================================" -ForegroundColor Green
Write-Host "   BULL MARKET POS & KDS - SERVIDOR CENTRAL EN VIVO       " -ForegroundColor Yellow
Write-Host "==========================================================" -ForegroundColor Green
Write-Host " Acceso desde esta PC:           http://localhost:$Port/" -ForegroundColor Cyan
Write-Host " Acceso desde Celulares/Tablets:    http://${ip}:$Port/" -ForegroundColor Magenta
Write-Host "==========================================================" -ForegroundColor Green
Write-Host " Presiona Ctrl+C para detener el servidor.`n" -ForegroundColor Gray

$dataFile = Join-Path $baseDir "kds_central_data.json"

while ($listener.IsListening) {
    try {
        $context = $listener.GetContext()
        $req = $context.Request
        $res = $context.Response

        $res.Headers.Add("Access-Control-Allow-Origin", "*")
        $res.Headers.Add("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        $res.Headers.Add("Access-Control-Allow-Headers", "Content-Type")

        if ($req.HttpMethod -eq "OPTIONS") {
            $res.StatusCode = 204
            $res.Close()
            continue
        }

        $path = $req.Url.AbsolutePath

        if ($path -eq "/api/state" -and $req.HttpMethod -eq "GET") {
            $content = "{}"
            if (Test-Path $dataFile) {
                $content = [System.IO.File]::ReadAllText($dataFile, [System.Text.Encoding]::UTF8)
            }
            $bytes = [System.Text.Encoding]::UTF8.GetBytes($content)
            $res.ContentType = "application/json; charset=utf-8"
            $res.ContentLength64 = $bytes.Length
            $res.OutputStream.Write($bytes, 0, $bytes.Length)
            $res.Close()
            continue
        }

        if ($path -eq "/api/state" -and $req.HttpMethod -eq "POST") {
            $reader = New-Object System.IO.StreamReader($req.InputStream, [System.Text.Encoding]::UTF8)
            $body = $reader.ReadToEnd()
            [System.IO.File]::WriteAllText($dataFile, $body, [System.Text.Encoding]::UTF8)

            $reply = [System.Text.Encoding]::UTF8.GetBytes('{"ok":true}')
            $res.ContentType = "application/json"
            $res.ContentLength64 = $reply.Length
            $res.OutputStream.Write($reply, 0, $reply.Length)
            $res.Close()
            continue
        }

        $rel = $path.TrimStart('/')
        if (-not $rel) { $rel = "index.html" }
        $target = Join-Path $baseDir $rel

        if (Test-Path $target -PathType Leaf) {
            $ext = [System.IO.Path]::GetExtension($target).ToLower()
            $mime = "application/octet-stream"
            if ($ext -eq ".html") { $mime = "text/html; charset=utf-8" }
            elseif ($ext -eq ".js") { $mime = "application/javascript" }
            elseif ($ext -eq ".css") { $mime = "text/css" }
            elseif ($ext -eq ".png") { $mime = "image/png" }
            elseif ($ext -eq ".jpg" -or $ext -eq ".jpeg") { $mime = "image/jpeg" }
            elseif ($ext -eq ".svg") { $mime = "image/svg+xml" }
            elseif ($ext -eq ".json") { $mime = "application/json" }

            $fbytes = [System.IO.File]::ReadAllBytes($target)
            $res.ContentType = $mime
            $res.ContentLength64 = $fbytes.Length
            $res.OutputStream.Write($fbytes, 0, $fbytes.Length)
            $res.Close()
        } else {
            $res.StatusCode = 404
            $res.Close()
        }
    } catch {
        if (-not $listener.IsListening) { break }
    }
}
