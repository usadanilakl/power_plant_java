<#
    AXIS speaker API tester - local proxy + static server (PowerShell edition).

    Same job as server.js, for machines with no Node installed. Windows PowerShell
    5.1 is enough - nothing to install, no admin rights needed.

        powershell -ExecutionPolicy Bypass -File server.ps1
        powershell -ExecutionPolicy Bypass -File server.ps1 -Port 9000

    Then open http://127.0.0.1:8099 in a browser on the same machine.

    Digest is computed by hand rather than handed to .NET's CredentialCache, so
    this behaves identically to the Node version and also copes with SHA-256
    digest, which the built-in module does not implement.
#>

[CmdletBinding()]
param(
    [int]$Port = 8099,
    [string]$Bind = "127.0.0.1"
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $MyInvocation.MyCommand.Definition
$MaxBody = 8MB

try {
    [Net.ServicePointManager]::SecurityProtocol =
        [Net.SecurityProtocolType]::Tls12 -bor [Net.SecurityProtocolType]::Tls11 -bor [Net.SecurityProtocolType]::Tls
} catch { Write-Verbose "Could not widen TLS protocol list" }

# --------------------------------------------------------------------- digest --

function Get-HashHex {
    param([string]$Algorithm, [string]$Text)
    if ($Algorithm -match 'sha-?256') { $h = [System.Security.Cryptography.SHA256]::Create() }
    else { $h = [System.Security.Cryptography.MD5]::Create() }
    try {
        $bytes = $h.ComputeHash([System.Text.Encoding]::UTF8.GetBytes($Text))
    } finally { $h.Dispose() }
    return (($bytes | ForEach-Object { $_.ToString("x2") }) -join "")
}

# Pulls the Digest challenge out of a WWW-Authenticate header that may also
# advertise Basic/Negotiate alongside it.
function Get-DigestChallenge {
    param([string]$Header)
    if ([string]::IsNullOrWhiteSpace($Header)) { return $null }
    $idx = $Header.IndexOf("Digest", [StringComparison]::OrdinalIgnoreCase)
    if ($idx -lt 0) { return $null }
    $scope = $Header.Substring($idx + 6)
    $cut = [regex]::Match($scope, ',\s*(Basic|Negotiate|NTLM)\b', 'IgnoreCase')
    if ($cut.Success) { $scope = $scope.Substring(0, $cut.Index) }
    $out = @{}
    foreach ($m in [regex]::Matches($scope, '([a-zA-Z0-9_-]+)\s*=\s*(?:"([^"]*)"|([^,\s]+))')) {
        if ($m.Groups[2].Success) { $val = $m.Groups[2].Value } else { $val = $m.Groups[3].Value }
        $out[$m.Groups[1].Value.ToLower()] = $val
    }
    return $out
}

function Test-BasicChallenge {
    param([string]$Header)
    if ([string]::IsNullOrWhiteSpace($Header)) { return $false }
    return [regex]::IsMatch($Header, '(^|,)\s*Basic\b', 'IgnoreCase')
}

function New-BasicHeader {
    param([string]$Username, [string]$Password)
    $raw = [System.Text.Encoding]::UTF8.GetBytes(($Username + ":" + $Password))
    return "Basic " + [Convert]::ToBase64String($raw)
}

function New-DigestHeader {
    param($Challenge, [string]$Username, [string]$Password, [string]$Method, [string]$Uri, [string]$Body)

    $algorithm = "MD5"
    if ($Challenge.ContainsKey("algorithm")) { $algorithm = $Challenge["algorithm"] }
    $isSess = $algorithm -match '-sess$'

    $nb = New-Object byte[] 8
    $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
    try { $rng.GetBytes($nb) } finally { $rng.Dispose() }
    $cnonce = (($nb | ForEach-Object { $_.ToString("x2") }) -join "")
    $nc = "00000001"

    $qop = $null
    if ($Challenge.ContainsKey("qop") -and $Challenge["qop"]) {
        $offered = $Challenge["qop"].Split(",") | ForEach-Object { $_.Trim().ToLower() }
        if ($offered -contains "auth") { $qop = "auth" }
        elseif ($offered -contains "auth-int") { $qop = "auth-int" }
        else { $qop = $offered[0] }
    }

    $realm = ""
    if ($Challenge.ContainsKey("realm")) { $realm = $Challenge["realm"] }
    $nonce = ""
    if ($Challenge.ContainsKey("nonce")) { $nonce = $Challenge["nonce"] }

    $ha1 = Get-HashHex $algorithm ("{0}:{1}:{2}" -f $Username, $realm, $Password)
    if ($isSess) { $ha1 = Get-HashHex $algorithm ("{0}:{1}:{2}" -f $ha1, $nonce, $cnonce) }

    if ($qop -eq "auth-int") {
        $bodyHash = Get-HashHex $algorithm $Body
        $ha2 = Get-HashHex $algorithm ("{0}:{1}:{2}" -f $Method, $Uri, $bodyHash)
    } else {
        $ha2 = Get-HashHex $algorithm ("{0}:{1}" -f $Method, $Uri)
    }

    if ($qop) {
        $response = Get-HashHex $algorithm (@($ha1, $nonce, $nc, $cnonce, $qop, $ha2) -join ":")
    } else {
        $response = Get-HashHex $algorithm (@($ha1, $nonce, $ha2) -join ":")
    }

    $parts = @(
        ('username="{0}"' -f $Username),
        ('realm="{0}"' -f $realm),
        ('nonce="{0}"' -f $nonce),
        ('uri="{0}"' -f $Uri),
        ('response="{0}"' -f $response)
    )
    if ($Challenge.ContainsKey("algorithm")) { $parts += ('algorithm={0}' -f $Challenge["algorithm"]) }
    if ($Challenge.ContainsKey("opaque")) { $parts += ('opaque="{0}"' -f $Challenge["opaque"]) }
    if ($qop) { $parts += ('qop={0}' -f $qop); $parts += ('nc={0}' -f $nc); $parts += ('cnonce="{0}"' -f $cnonce) }
    return "Digest " + ($parts -join ", ")
}

# -------------------------------------------------------------------- request --

function Invoke-DeviceRequest {
    param([string]$Url, [string]$Method, $Headers, [string]$Body, [string]$AuthHeader, [int]$TimeoutMs, [bool]$Insecure)

    if ($Insecure) { [Net.ServicePointManager]::ServerCertificateValidationCallback = { $true } }
    else { [Net.ServicePointManager]::ServerCertificateValidationCallback = $null }

    $req = [System.Net.WebRequest]::Create($Url)
    $req.Method = $Method
    $req.Timeout = $TimeoutMs
    $req.ReadWriteTimeout = $TimeoutMs
    $req.AllowAutoRedirect = $false
    $req.KeepAlive = $false
    $req.Credentials = $null
    $req.Accept = "*/*"
    $req.UserAgent = "axis-speaker-tester/1.0"

    if ($Headers) {
        foreach ($prop in $Headers.PSObject.Properties) {
            $name = $prop.Name
            $value = [string]$prop.Value
            # Restricted headers must go through their typed property.
            switch -Regex ($name) {
                '^(?i)content-type$' { $req.ContentType = $value }
                '^(?i)accept$'       { $req.Accept = $value }
                '^(?i)user-agent$'   { $req.UserAgent = $value }
                '^(?i)content-length$' { }
                default { try { $req.Headers.Add($name, $value) } catch { Write-Verbose "skipped header $name" } }
            }
        }
    }
    if ($AuthHeader) { $req.Headers.Add("Authorization", $AuthHeader) }

    if ($Body) {
        $bytes = [System.Text.Encoding]::UTF8.GetBytes($Body)
        $req.ContentLength = $bytes.Length
        $rs = $req.GetRequestStream()
        try { $rs.Write($bytes, 0, $bytes.Length) } finally { $rs.Close() }
    } elseif ($Method -match '^(POST|PUT|PATCH)$') {
        # Be explicit rather than letting .NET omit the header entirely.
        $req.ContentLength = 0
        $req.GetRequestStream().Close()
    }

    $resp = $null
    try {
        $resp = $req.GetResponse()
    } catch [System.Net.WebException] {
        $resp = $_.Exception.Response
        if ($null -eq $resp) { throw }
    }

    $status = [int]$resp.StatusCode
    $statusText = [string]$resp.StatusDescription
    $hdrs = @{}
    foreach ($k in $resp.Headers.AllKeys) { $hdrs[$k.ToLower()] = $resp.Headers[$k] }

    $ms = New-Object System.IO.MemoryStream
    $stream = $resp.GetResponseStream()
    if ($stream) {
        try { $stream.CopyTo($ms) } finally { $stream.Close() }
    }
    $raw = $ms.ToArray()
    $ms.Dispose()
    $resp.Close()

    return [pscustomobject]@{
        Status = $status; StatusText = $statusText; Headers = $hdrs; Bytes = $raw
    }
}

function Invoke-Proxy {
    param($Cfg)

    $scheme = "http"
    if ($Cfg.scheme -eq "https") { $scheme = "https" }

    $port = $null
    if ($Cfg.PSObject.Properties.Name -contains "port" -and $Cfg.port) { $port = [int]$Cfg.port }
    if (-not $port) { if ($scheme -eq "https") { $port = 443 } else { $port = 80 } }

    $method = "GET"
    if ($Cfg.method) { $method = ([string]$Cfg.method).ToUpper() }

    $path = "/"
    if ($Cfg.path) { $path = [string]$Cfg.path }
    if (-not $path.StartsWith("/")) { $path = "/" + $path }

    $timeout = 15000
    if ($Cfg.timeoutMs) { $timeout = [int]$Cfg.timeoutMs }

    $authMode = "auto"
    if ($Cfg.authMode) { $authMode = [string]$Cfg.authMode }

    $insecure = $false
    if ($Cfg.insecure) { $insecure = [bool]$Cfg.insecure }

    $body = $null
    if ($Cfg.PSObject.Properties.Name -contains "body" -and $Cfg.body) { $body = [string]$Cfg.body }

    $username = ""
    if ($Cfg.username) { $username = [string]$Cfg.username }
    $password = ""
    if ($Cfg.password) { $password = [string]$Cfg.password }
    $haveCreds = -not ([string]::IsNullOrEmpty($username) -and [string]::IsNullOrEmpty($password))

    $url = "{0}://{1}:{2}{3}" -f $scheme, $Cfg.host, $port, $path
    $attempts = New-Object System.Collections.ArrayList
    $sw = [System.Diagnostics.Stopwatch]::StartNew()

    # Basic mode can authenticate immediately; no challenge round-trip needed.
    $authHeader = $null
    $authUsed = "none"
    if ($authMode -eq "basic" -and $haveCreds) {
        $authHeader = New-BasicHeader $username $password
        $authUsed = "basic"
    }
    $wantsChallenge = $haveCreds -and ($authMode -eq "auto" -or $authMode -eq "digest")

    if ($wantsChallenge -and $body) {
        # Harvest the challenge with a body-less probe first. Posting the payload
        # unauthenticated makes servers that answer 401 without draining the
        # request stream reset the connection mid-write, and it would submit the
        # same payload twice for no reason.
        $probe = Invoke-DeviceRequest -Url $url -Method $method -Headers $Cfg.headers -Body $null `
                                      -AuthHeader $null -TimeoutMs $timeout -Insecure $insecure
        [void]$attempts.Add(@{ auth = "challenge probe (no body)"; status = $probe.Status })
        if ($probe.Status -eq 401) {
            $www = $probe.Headers["www-authenticate"]
            $challenge = Get-DigestChallenge $www
            if ($challenge) {
                $authHeader = New-DigestHeader -Challenge $challenge -Username $username -Password $password `
                                               -Method $method -Uri $path -Body $body
                $authUsed = "digest"
            } elseif ((Test-BasicChallenge $www) -and $authMode -eq "auto") {
                $authHeader = New-BasicHeader $username $password
                $authUsed = "basic"
            }
        }
        $res = Invoke-DeviceRequest -Url $url -Method $method -Headers $Cfg.headers -Body $body `
                                    -AuthHeader $authHeader -TimeoutMs $timeout -Insecure $insecure
        [void]$attempts.Add(@{ auth = $authUsed; status = $res.Status })
    }
    else {
        $res = Invoke-DeviceRequest -Url $url -Method $method -Headers $Cfg.headers -Body $body `
                                    -AuthHeader $authHeader -TimeoutMs $timeout -Insecure $insecure
        [void]$attempts.Add(@{ auth = $authUsed; status = $res.Status })

        if ($res.Status -eq 401 -and $wantsChallenge) {
            $www = $res.Headers["www-authenticate"]
            $challenge = Get-DigestChallenge $www
            if ($challenge) {
                $hdr = New-DigestHeader -Challenge $challenge -Username $username -Password $password `
                                        -Method $method -Uri $path -Body $body
                $res = Invoke-DeviceRequest -Url $url -Method $method -Headers $Cfg.headers -Body $body `
                                            -AuthHeader $hdr -TimeoutMs $timeout -Insecure $insecure
                $authUsed = "digest"
                [void]$attempts.Add(@{ auth = "digest"; status = $res.Status })
            } elseif ((Test-BasicChallenge $www) -and $authMode -eq "auto") {
                $hdr = New-BasicHeader $username $password
                $res = Invoke-DeviceRequest -Url $url -Method $method -Headers $Cfg.headers -Body $body `
                                            -AuthHeader $hdr -TimeoutMs $timeout -Insecure $insecure
                $authUsed = "basic"
                [void]$attempts.Add(@{ auth = "basic"; status = $res.Status })
            }
        }
    }

    # A stale nonce earns exactly one more go.
    if ($res.Status -eq 401 -and $wantsChallenge) {
        $again = Get-DigestChallenge $res.Headers["www-authenticate"]
        if ($again -and $again.ContainsKey("stale") -and $again["stale"].ToLower() -eq "true") {
            $hdr2 = New-DigestHeader -Challenge $again -Username $username -Password $password `
                                     -Method $method -Uri $path -Body $body
            $res = Invoke-DeviceRequest -Url $url -Method $method -Headers $Cfg.headers -Body $body `
                                        -AuthHeader $hdr2 -TimeoutMs $timeout -Insecure $insecure
            [void]$attempts.Add(@{ auth = "digest (stale retry)"; status = $res.Status })
        }
    }
    $sw.Stop()

    $ct = ""
    if ($res.Headers.ContainsKey("content-type")) { $ct = $res.Headers["content-type"] }
    if ($ct -match '^(image|audio|video|application/octet-stream)') {
        $text = [Convert]::ToBase64String($res.Bytes); $encoding = "base64"
    } else {
        $text = [System.Text.Encoding]::UTF8.GetString($res.Bytes); $encoding = "utf8"
    }

    return [pscustomobject]@{
        ok = $true
        status = $res.Status
        statusText = $res.StatusText
        headers = $res.Headers
        body = $text
        encoding = $encoding
        truncated = $false
        bytes = $res.Bytes.Length
        timeMs = [int]$sw.ElapsedMilliseconds
        authUsed = $authUsed
        attempts = $attempts.ToArray()
    }
}

# --------------------------------------------------------------------- server --

$Mime = @{
    ".html" = "text/html; charset=utf-8"
    ".js"   = "text/javascript; charset=utf-8"
    ".css"  = "text/css; charset=utf-8"
    ".json" = "application/json; charset=utf-8"
    ".md"   = "text/plain; charset=utf-8"
}

function Write-Bytes {
    param($Context, [int]$Status, [string]$ContentType, [byte[]]$Bytes)
    $Context.Response.StatusCode = $Status
    $Context.Response.ContentType = $ContentType
    $Context.Response.Headers.Add("Cache-Control", "no-store")
    $Context.Response.ContentLength64 = $Bytes.Length
    $Context.Response.OutputStream.Write($Bytes, 0, $Bytes.Length)
    $Context.Response.OutputStream.Close()
}

function Write-Text {
    param($Context, [int]$Status, [string]$ContentType, [string]$Text)
    Write-Bytes $Context $Status $ContentType ([System.Text.Encoding]::UTF8.GetBytes($Text))
}

function Send-Static {
    param($Context)
    $rel = [Uri]::UnescapeDataString($Context.Request.Url.AbsolutePath)
    if ($rel -eq "/") { $file = "index.html" } else { $file = $rel.TrimStart("/") }
    $full = Join-Path $root $file
    $resolvedRoot = [System.IO.Path]::GetFullPath($root)
    try { $resolved = [System.IO.Path]::GetFullPath($full) } catch { $resolved = "" }
    if (-not $resolved.StartsWith($resolvedRoot) -or -not (Test-Path -LiteralPath $resolved -PathType Leaf)) {
        Write-Text $Context 404 "text/plain" "Not found"
        return
    }
    $ext = [System.IO.Path]::GetExtension($resolved).ToLower()
    $type = "application/octet-stream"
    if ($Mime.ContainsKey($ext)) { $type = $Mime[$ext] }
    Write-Bytes $Context 200 $type ([System.IO.File]::ReadAllBytes($resolved))
}

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add(("http://{0}:{1}/" -f $Bind, $Port))
try {
    $listener.Start()
} catch {
    Write-Host "Could not bind http://${Bind}:${Port}/ - $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "A non-localhost -Bind needs an elevated prompt or a netsh urlacl reservation." -ForegroundColor Yellow
    exit 1
}

Write-Host ("AXIS speaker tester -> http://{0}:{1}" -f $Bind, $Port) -ForegroundColor Green
if ($Bind -ne "127.0.0.1" -and $Bind -ne "localhost") {
    Write-Host ("WARNING: bound to {0} - reachable from the network." -f $Bind) -ForegroundColor Yellow
}
Write-Host "Ctrl+C to stop."

try {
    while ($listener.IsListening) {
        # Async accept with a short poll so Ctrl+C still breaks the loop.
        $async = $listener.BeginGetContext($null, $null)
        while (-not $async.AsyncWaitHandle.WaitOne(200)) { }
        $ctx = $listener.EndGetContext($async)

        try {
            if ($ctx.Request.Url.AbsolutePath -eq "/api/proxy" -and $ctx.Request.HttpMethod -eq "POST") {
                $reader = New-Object System.IO.StreamReader($ctx.Request.InputStream, [System.Text.Encoding]::UTF8)
                try { $rawBody = $reader.ReadToEnd() } finally { $reader.Dispose() }

                $cfg = $null
                try { $cfg = $rawBody | ConvertFrom-Json }
                catch {
                    Write-Text $ctx 400 "application/json" (@{ ok = $false; error = "Invalid JSON: $($_.Exception.Message)" } | ConvertTo-Json -Compress)
                    continue
                }
                if (-not $cfg.host) {
                    Write-Text $ctx 200 "application/json" (@{ ok = $false; error = "No device host set. Fill in the Device field." } | ConvertTo-Json -Compress)
                    continue
                }
                try {
                    $out = Invoke-Proxy $cfg
                    Write-Text $ctx 200 "application/json" ($out | ConvertTo-Json -Depth 6 -Compress)
                } catch {
                    # PowerShell wraps .NET failures in MethodInvocationException;
                    # dig out the WebException so the UI shows "Timeout" /
                    # "ConnectFailure" instead of a call-site stack wrapper.
                    $inner = $_.Exception
                    while ($inner.InnerException -and -not ($inner -is [System.Net.WebException])) {
                        $inner = $inner.InnerException
                    }
                    $code = $null
                    if ($inner -is [System.Net.WebException]) { $code = [string]$inner.Status }
                    $payload = @{ ok = $false; error = $inner.Message; code = $code } | ConvertTo-Json -Compress
                    Write-Text $ctx 200 "application/json" $payload
                }
            } else {
                Send-Static $ctx
            }
        } catch {
            Write-Host "request error: $($_.Exception.Message)" -ForegroundColor DarkYellow
            try { $ctx.Response.Abort() } catch { Write-Verbose "response already closed" }
        }
    }
} finally {
    $listener.Stop()
    $listener.Close()
    Write-Host "Stopped."
}
