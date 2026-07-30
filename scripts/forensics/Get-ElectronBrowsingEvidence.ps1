<#
    Get-ElectronBrowsingEvidence.ps1

    Attributes third-party browsing activity in the DK Power Manager Electron app to a specific
    window, using session partitions as a natural forensic tag.

    Pre-2026-07-30 partition layout:
        default session          <- main window (localhost) AND WeatherBug  <-- the discriminator
        Partitions\perry-weather <- Perry Weather
        Partitions\gate-scraper  <- gate log site
        Partitions\pjm           <- PJM Voyager
        Partitions\webview-ams   <- AMS scraper
        Partitions\webview-sds   <- eBinder SDS
        Partitions\weatherbug    <- WeatherBug, ONLY after the hardening update lands

    WeatherBug was the only remote content on the default session, so ad-network artifacts there
    point at it by elimination. Artifacts under Partitions\<name> name the source outright.

    Run on the affected machines AND on a known-good machine. The known-good run is the baseline:
    every desktop that loads WeatherBug will show ad-exchange domains, so only what is UNIQUE to
    the affected machines is evidence of the incident.

    Usage:
        powershell -ExecutionPolicy Bypass -File .\Get-ElectronBrowsingEvidence.ps1
        powershell -ExecutionPolicy Bypass -File .\Get-ElectronBrowsingEvidence.ps1 -IncidentDate "2026-07-29"

    Close DK Power Manager first if possible — a running app holds locks on the cookie DBs.
    The script degrades gracefully if it cannot read a file.
#>

[CmdletBinding()]
param(
    [string]$OutputDir = "$env:USERPROFILE\Desktop",
    [string]$IncidentDate = "",
    [int]$MaxCacheFiles = 4000,
    [switch]$AllUsers
)

$ErrorActionPreference = 'Continue'

# Domains that indicate ad-exchange / tracker / malvertising-chain activity.
$AdPattern = 'yahoo|taboola|outbrain|doubleclick|googlesyndication|adnxs|criteo|adsystem|' +
             'rubiconproject|pubmatic|openx|casalemedia|indexexchange|smartadserver|teads|' +
             'media\.net|adform|bidswitch|everesttech|adsrvr|scorecardresearch|quantserve|' +
             'moatads|serving-sys|zemanta|revcontent|mgid|bidr\.io|id5-sync|crwdcntrl|' +
             'agkn|tapad|sharethrough|33across|onetag|sonobi|gumgum|triplelift|zeta|' +
             'browser-update|clickcease|onclicka|propellerads|popads|adsterra'

# Indicators of a tech-support-scam / browser-locker landing page.
# NOTE: an earlier version used '1-?8[0-9]{2}-?[0-9]{3}' for phone numbers. That matched digits
# inside cache-busting hashes and asset filenames (e.g. '...18429592cd7ed...') and produced pure
# noise. A toll-free number needs a real prefix AND full 10-digit shape AND non-digit boundaries.
$ScamPattern = '\bcall[-_]?now\b|\btoll[-_]?free\b|microsoft[-_]?support|windows[-_]?defender|' +
               'security[-_]?alert|virus[-_]?alert|firewall[-_]?breach|tech[-_]?support|' +
               'system[-_]?locked|your[-_]?computer[-_]?is|(?<![0-9])1?[-_. ]?8(00|33|44|55|66|77|88)[-_. ][0-9]{3}[-_. ][0-9]{4}(?![0-9])'

# The Chromium profile is NOT in C:\ProgramData\DK Power Manager — that is the app's working
# directory (configs, certificate, H2 db). There is no app.setPath('userData',...) in the code,
# so the profile stays at Electron's default, %APPDATA%\<productName>, which is PER WINDOWS USER.
# A profile only counts if it carries a Chromium marker file.
function Get-AppBases {
    param([switch]$AllUsers)

    $roots = New-Object System.Collections.ArrayList
    [void]$roots.Add("$env:APPDATA\DK Power Manager")     # packaged — expected on plant machines
    [void]$roots.Add("$env:APPDATA\electron-manager")     # dev / npm start
    [void]$roots.Add("$env:LOCALAPPDATA\DK Power Manager")
    [void]$roots.Add("$env:PROGRAMDATA\DK Power Manager") # only if userData is ever redirected here

    if ($AllUsers) {
        # Plant desktops often run under a different account than the one investigating.
        # Needs an elevated shell to read other users' profiles.
        $userDirs = Get-ChildItem 'C:\Users' -Directory -ErrorAction SilentlyContinue
        foreach ($u in $userDirs) {
            [void]$roots.Add((Join-Path $u.FullName 'AppData\Roaming\DK Power Manager'))
            [void]$roots.Add((Join-Path $u.FullName 'AppData\Roaming\electron-manager'))
        }
    }

    $found = New-Object System.Collections.ArrayList
    foreach ($r in ($roots | Select-Object -Unique)) {
        if (-not (Test-Path $r)) { continue }
        $isProfile = (Test-Path (Join-Path $r 'Network\Cookies')) -or
                     (Test-Path (Join-Path $r 'Local State'))     -or
                     (Test-Path (Join-Path $r 'Partitions'))
        if ($isProfile) { [void]$found.Add($r) }
    }
    return $found
}

# Read a file even while the app holds it open.
function Read-FileText {
    param([string]$Path)
    try {
        $fs = [System.IO.File]::Open($Path, [System.IO.FileMode]::Open,
                                     [System.IO.FileAccess]::Read,
                                     [System.IO.FileShare]::ReadWrite)
        try {
            $buf = New-Object byte[] $fs.Length
            [void]$fs.Read($buf, 0, $fs.Length)
            return [System.Text.Encoding]::ASCII.GetString($buf)
        } finally { $fs.Close() }
    } catch { return $null }
}

# Chromium stores cookie host_key values as plaintext inside the SQLite pages, so an ASCII
# scan recovers the domain list without needing a SQLite driver. (Cookie VALUES are DPAPI
# encrypted; we do not need them.)
function Get-CookieDomains {
    param([string]$CookiePath)
    if (-not (Test-Path $CookiePath)) { return @() }
    $text = Read-FileText -Path $CookiePath
    if ($null -eq $text) { return @() }
    $hits = [regex]::Matches($text, '(?<![A-Za-z0-9\-])[a-z0-9][a-z0-9\-]{1,62}(\.[a-z0-9][a-z0-9\-]{1,62})+')
    $domains = @{}
    foreach ($m in $hits) {
        $d = $m.Value.ToLower()
        if ($d.Length -lt 6) { continue }
        if ($d -notmatch '\.(com|net|org|io|co|tv|us|uk|de|ru|info|biz|xyz|top|site|online|club|live|app|dev|cloud|me)$') { continue }
        $domains[$d] = $true
    }
    return @($domains.Keys | Sort-Object)
}

# Pull real URLs out of the HTTP cache. These carry the strongest evidence: an actual URL,
# in a known partition, with the cache entry's write time.
function Get-CacheUrls {
    param([string]$CacheDir, [int]$Limit)
    if (-not (Test-Path $CacheDir)) { return @() }
    $results = New-Object System.Collections.ArrayList
    $files = Get-ChildItem $CacheDir -Recurse -File -ErrorAction SilentlyContinue |
             Sort-Object LastWriteTime -Descending | Select-Object -First $Limit
    foreach ($f in $files) {
        if ($f.Length -gt 6MB) { continue }
        $text = Read-FileText -Path $f.FullName
        if ($null -eq $text) { continue }
        $urls = [regex]::Matches($text, 'https?://[a-zA-Z0-9\.\-]{4,120}[/a-zA-Z0-9\.\-_%\?=&#]{0,180}')
        foreach ($u in $urls) {
            [void]$results.Add([PSCustomObject]@{
                Url      = $u.Value
                Modified = $f.LastWriteTime
            })
        }
    }
    return $results
}

function Get-SessionReport {
    param([string]$Name, [string]$Root)
    $cookiePath = Join-Path $Root 'Network\Cookies'
    $cacheDir   = Join-Path $Root 'Cache\Cache_Data'
    if (-not (Test-Path $cacheDir)) { $cacheDir = Join-Path $Root 'Cache' }

    $domains   = Get-CookieDomains -CookiePath $cookiePath
    $adDomains = @($domains | Where-Object { $_ -match $AdPattern })

    $cacheUrls = Get-CacheUrls -CacheDir $cacheDir -Limit $MaxCacheFiles
    $adUrls    = @($cacheUrls | Where-Object { $_.Url -match $AdPattern } |
                   Sort-Object Url -Unique | Select-Object -First 40)
    $scamUrls  = @($cacheUrls | Where-Object { $_.Url -match $ScamPattern } |
                   Sort-Object Url -Unique | Select-Object -First 40)

    $swDir = Join-Path $Root 'Service Worker'
    $swCount = 0
    if (Test-Path $swDir) {
        $swCount = @(Get-ChildItem $swDir -Recurse -File -ErrorAction SilentlyContinue).Count
    }

    $cookieWrite = $null
    if (Test-Path $cookiePath) { $cookieWrite = (Get-Item $cookiePath).LastWriteTime }

    return [PSCustomObject]@{
        Session          = $Name
        CookieLastWrite  = $cookieWrite
        TotalDomains     = $domains.Count
        AdDomainCount    = $adDomains.Count
        AdDomains        = $adDomains
        AdUrlSamples     = $adUrls
        ScamUrlSamples   = $scamUrls
        ServiceWorkerFiles = $swCount
    }
}

# ---------------------------------------------------------------- main

# Admin is NOT required to read your own profile — everything this script touches by default lives
# under the current user's %APPDATA%. Elevation is only needed for -AllUsers, which reads OTHER
# users' profiles under C:\Users\<other>\AppData.
$isElevated = ([Security.Principal.WindowsPrincipal] `
    [Security.Principal.WindowsIdentity]::GetCurrent()
    ).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if ($AllUsers -and -not $isElevated) {
    Write-Host "WARNING: -AllUsers needs an elevated shell to read other users' profiles." -ForegroundColor Yellow
    Write-Host "         Without it you will only see your own, and other users' folders will be skipped."
    Write-Host "         Re-run from an Administrator PowerShell, or just log in as the account that"
    Write-Host "         runs DK Power Manager and drop the -AllUsers switch.`n"
}

if ($ExecutionContext.SessionState.LanguageMode -ne 'FullLanguage') {
    Write-Host "WARNING: PowerShell is in $($ExecutionContext.SessionState.LanguageMode) mode." -ForegroundColor Yellow
    Write-Host "         AppLocker/WDAC policy blocks the .NET calls this script needs to read the"
    Write-Host "         cookie and cache files. It will report empty results rather than fail loudly.`n"
}

$bases = Get-AppBases -AllUsers:$AllUsers
if ($bases.Count -eq 0) {
    Write-Host "ERROR: no Electron browsing profile found." -ForegroundColor Red
    Write-Host "Looked under %APPDATA%, %LOCALAPPDATA% and %PROGRAMDATA% for 'DK Power Manager'."
    Write-Host ""
    Write-Host "NOTE: C:\ProgramData\DK Power Manager is the app's WORKING dir (configs, cert, db)."
    Write-Host "      The browsing profile is per-user: C:\Users\<user>\AppData\Roaming\DK Power Manager"
    Write-Host "      If the app runs under a different account, re-run elevated with -AllUsers."
    exit 1
}
if ($bases.Count -gt 1) {
    Write-Host "Found $($bases.Count) profiles; reporting on each." -ForegroundColor Yellow
}
$base = $bases[0]

$running = @(Get-Process -Name 'DK Power Manager','electron' -ErrorAction SilentlyContinue)
if ($running.Count -gt 0) {
    Write-Host "NOTE: the app is running - cookie DBs may be locked or partially flushed." -ForegroundColor Yellow
    Write-Host "      For the cleanest read, close DK Power Manager and re-run.`n" -ForegroundColor Yellow
}

Write-Host "=== Electron browsing evidence ===" -ForegroundColor Cyan
Write-Host "Machine  : $env:COMPUTERNAME"
Write-Host "User     : $env:USERNAME"
Write-Host "Profiles : $($bases -join '; ')"
Write-Host "Scanned  : $(Get-Date)"
Write-Host ""

$reports = New-Object System.Collections.ArrayList

foreach ($b in $bases) {
    $label = ''
    if ($bases.Count -gt 1) { $label = " [$b]" }

    # Default session — pre-update, WeatherBug was the ONLY remote content here.
    [void]$reports.Add((Get-SessionReport -Name "DEFAULT (main window + WeatherBug pre-update)$label" -Root $b))

    $partRoot = Join-Path $b 'Partitions'
    if (Test-Path $partRoot) {
        foreach ($p in (Get-ChildItem $partRoot -Directory -ErrorAction SilentlyContinue)) {
            [void]$reports.Add((Get-SessionReport -Name "Partitions\$($p.Name)$label" -Root $p.FullName))
        }
    } else {
        Write-Host "($b : no Partitions folder - only the default session has been used)`n" -ForegroundColor DarkGray
    }
}

foreach ($r in $reports) {
    $colour = 'Gray'
    if ($r.AdDomainCount -gt 0) { $colour = 'Yellow' }
    if ($r.ScamUrlSamples.Count -gt 0) { $colour = 'Red' }

    Write-Host ("-" * 78)
    Write-Host $r.Session -ForegroundColor $colour
    Write-Host ("  cookies last written : {0}" -f $r.CookieLastWrite)
    Write-Host ("  distinct domains     : {0}" -f $r.TotalDomains)
    Write-Host ("  ad/tracker domains   : {0}" -f $r.AdDomainCount) -ForegroundColor $colour
    Write-Host ("  service worker files : {0}" -f $r.ServiceWorkerFiles)

    if ($r.AdDomainCount -gt 0) {
        Write-Host "  ad/tracker domains present:"
        foreach ($d in $r.AdDomains) { Write-Host "    - $d" }
    }
    if ($r.AdUrlSamples.Count -gt 0) {
        Write-Host "  ad URLs found in cache (newest first):"
        foreach ($u in $r.AdUrlSamples) {
            Write-Host ("    [{0:yyyy-MM-dd HH:mm}] {1}" -f $u.Modified, $u.Url)
        }
    }
    if ($r.ScamUrlSamples.Count -gt 0) {
        Write-Host "  *** SCAM-PATTERN URLs IN CACHE ***" -ForegroundColor Red
        foreach ($u in $r.ScamUrlSamples) {
            Write-Host ("    [{0:yyyy-MM-dd HH:mm}] {1}" -f $u.Modified, $u.Url) -ForegroundColor Red
        }
    }
    Write-Host ""
}

# ---- verdict

Write-Host ("=" * 78)
Write-Host "VERDICT" -ForegroundColor Cyan

$defaultReport = $reports | Where-Object { $_.Session -like 'DEFAULT*' }
$partsWithAds  = @($reports | Where-Object { $_.Session -like 'Partitions*' -and $_.AdDomainCount -gt 0 })
$anyScam       = @($reports | Where-Object { $_.ScamUrlSamples.Count -gt 0 })

if ($anyScam.Count -gt 0) {
    Write-Host "SCAM-PATTERN URLS FOUND in: $($anyScam.Session -join ', ')" -ForegroundColor Red
    Write-Host "That names the source window directly. Note the timestamps above."
} elseif ($defaultReport.AdDomainCount -gt 0 -and $partsWithAds.Count -eq 0) {
    Write-Host "Ad/tracker activity is confined to the DEFAULT session." -ForegroundColor Yellow
    Write-Host "Pre-update, WeatherBug was the only remote content there => consistent with WeatherBug."
} elseif ($partsWithAds.Count -gt 0) {
    Write-Host "Ad/tracker activity found in named partitions: $($partsWithAds.Session -join ', ')" -ForegroundColor Yellow
    Write-Host "Those partitions name their own source - WeatherBug is NOT the only candidate."
} else {
    Write-Host "No ad/tracker artifacts found. Either the profile was cleared, or the source is elsewhere."
}

Write-Host ""
Write-Host "IMPORTANT: ad domains alone are NOT proof - WeatherBug serves ads on every machine."
Write-Host "Compare this output against a KNOWN-GOOD machine. What appears ONLY on the affected"
Write-Host "machines is the real evidence."

# ---- machine-comparable dump

if (-not (Test-Path $OutputDir)) { New-Item -ItemType Directory -Path $OutputDir -Force | Out-Null }
$stamp   = Get-Date -Format 'yyyyMMdd-HHmmss'
$outFile = Join-Path $OutputDir ("electron-evidence-{0}-{1}.json" -f $env:COMPUTERNAME, $stamp)

$dump = [PSCustomObject]@{
    Machine      = $env:COMPUTERNAME
    User         = $env:USERNAME
    BasePaths    = $bases
    ScannedAt    = (Get-Date).ToString('s')
    IncidentDate = $IncidentDate
    Sessions     = $reports
}
$dump | ConvertTo-Json -Depth 6 | Out-File -FilePath $outFile -Encoding utf8

Write-Host ""
Write-Host "Full dump written to: $outFile" -ForegroundColor Green
Write-Host "Collect this file from all three machines (2 affected + 1 known-good) and compare."
