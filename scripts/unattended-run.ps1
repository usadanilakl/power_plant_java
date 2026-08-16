#requires -Version 5.1
<#
.SYNOPSIS
    Runs Claude Code headless against a multi-phase plan file, unattended.

.DESCRIPTION
    Launched by unattended-run.bat. Creates/checks out a branch, records the
    starting commit for rollback, keeps the machine awake, and runs Claude Code
    in non-interactive mode with permission prompts disabled so nothing blocks
    while you are away.

    Output is written to logs\unattended-<timestamp>.log as well as the console.

.NOTES
    Permission prompts are bypassed for the whole run. Only launch this against
    a plan you have read.
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory)] [string] $Plan,
    [Parameter(Mandatory)] [string] $Branch,
    [ValidateSet('low', 'medium', 'high', 'xhigh', 'max')]
    [string] $Effort = 'high',

    # Skip the keep-awake call (e.g. running on a machine that never sleeps).
    [switch] $AllowSleep,

    # Leave real production credentials on disk for the run. Only for a supervised
    # session where the agent legitimately needs to reach SharePoint/Maximo.
    [switch] $KeepRealSecrets,

    # Exercise the stash/restore cycle and exit without launching anything. Verifies
    # the real credentials come back byte-identical. Run this before trusting the swap.
    [switch] $TestSecretSwap
)

$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $repoRoot

function Write-Step { param($m) Write-Host "`n== $m" -ForegroundColor Cyan }
function Write-Warn { param($m) Write-Host "!! $m" -ForegroundColor Yellow }
function Fail      { param($m) Write-Host "XX $m" -ForegroundColor Red; exit 1 }

# --- Credential neutralisation ------------------------------------------------
#
# The agent runs as you, so it can read anything you can read -- no profile setting
# stops it from lifting maximo.api-key out of the secrets file and calling Maximo
# directly, or using certificate.pfx to authenticate to SharePoint itself.
#
# The only reliable defence is for the working credential not to be on disk while
# the agent is running. For the duration of the run we stash the real secrets file
# and the SharePoint certificate outside the repo, and drop in a copy whose
# production credentials are syntactically valid but wrong.
#
# Values are INVALIDATED rather than blanked on purpose: SharePointConfig, EmailConfig
# and the Maximo beans are @ConditionalOnProperty on these keys, so a blank value
# de-registers the bean and anything hard-injecting it fails context startup. A present
# but wrong value keeps the app bootable and turns every outbound call into an auth error.
#
# JWT keys (jwt.*-path, data/jwt-*.pem) are deliberately left alone -- they sign local
# sessions and reach nothing external, and login breaks without them.

$HoldDir = Join-Path $env:LOCALAPPDATA 'pp-unattended-hold'
$SecretsRel = 'src\main\resources\application-secrets.properties'
$CertRel = @('data\certificate.pfx', 'data\certificate.pem')

# key -> replacement. Anything not listed is copied through untouched.
$Invalidate = [ordered]@{
    'maximo.api-key'          = 'INVALID-UNATTENDED-RUN'
    'maximo.base-url'         = 'http://127.0.0.1:9/maximo-disabled'
    'sharepoint.azure.client-id'     = '00000000-0000-0000-0000-000000000000'
    'sharepoint.azure.tenant-id'     = '00000000-0000-0000-0000-000000000000'
    'sharepoint.azure.pfx-password'  = 'INVALID-UNATTENDED-RUN'
    'sharepoint.azure.pfx-path'      = 'data/certificate-absent.pfx'
    'email.graph.from'        = ''
    'email.graph.fallback'    = ''
    'supabase.url'            = 'http://127.0.0.1:9'
    'supabase.anon.key'       = 'INVALID-UNATTENDED-RUN'
    'supabase.service.role.key' = 'INVALID-UNATTENDED-RUN'
    'supabase.jwt.secret'     = 'INVALID-UNATTENDED-RUN'
    'supabase.db.password'    = 'INVALID-UNATTENDED-RUN'
    'gemini.api.key'          = 'INVALID-UNATTENDED-RUN'
    'git.token'               = 'INVALID-UNATTENDED-RUN'
    'PG_PASSWORD'             = 'INVALID-UNATTENDED-RUN'
    'spring.security.oauth2.client.registration.onedrive.client-secret' = 'INVALID-UNATTENDED-RUN'
    # Power Automate flow URLs are UNAUTHENTICATED webhooks -- the URL is the credential.
    'pa.flow.work-request-url'   = ''
    'pa.flow.jha-url'            = ''
    'pa.flow.field-list-url'     = ''
    'pa.flow.inventory-url'      = ''
    'pa.flow.qualifications-url' = ''
    'pa.flow.sds-url'            = ''
}

function Restore-Secrets {
    if (-not (Test-Path -LiteralPath $HoldDir)) { return $false }
    $restored = $false
    foreach ($rel in @($SecretsRel) + $CertRel) {
        $held = Join-Path $HoldDir (Split-Path -Leaf $rel)
        if (Test-Path -LiteralPath $held) {
            Move-Item -LiteralPath $held -Destination (Join-Path $repoRoot $rel) -Force
            $restored = $true
        }
    }
    Remove-Item -LiteralPath $HoldDir -Recurse -Force -ErrorAction SilentlyContinue
    return $restored
}

function Protect-Secrets {
    New-Item -ItemType Directory -Path $HoldDir -Force | Out-Null

    # Stash the certificate entirely -- there is no "invalid" form of a cert file.
    foreach ($rel in $CertRel) {
        $full = Join-Path $repoRoot $rel
        if (Test-Path -LiteralPath $full) {
            Move-Item -LiteralPath $full -Destination (Join-Path $HoldDir (Split-Path -Leaf $rel)) -Force
        }
    }

    # Stash the real secrets file, write an invalidated copy in its place.
    $secretsFull = Join-Path $repoRoot $SecretsRel
    if (-not (Test-Path -LiteralPath $secretsFull)) { return }

    $lines = Get-Content -LiteralPath $secretsFull
    Move-Item -LiteralPath $secretsFull `
              -Destination (Join-Path $HoldDir (Split-Path -Leaf $SecretsRel)) -Force

    $hits = 0
    $out = foreach ($line in $lines) {
        $key = if ($line -match '^\s*([A-Za-z0-9._-]+)\s*=') { $Matches[1] } else { $null }
        if ($key -and $Invalidate.Contains($key)) { $hits++; "$key=$($Invalidate[$key])" }
        else { $line }
    }
    Set-Content -LiteralPath $secretsFull -Value $out -Encoding UTF8
    Write-Host "   secrets : $hits production credentials invalidated, cert stashed"
    Write-Host "             held in $HoldDir"
}

# --- Secret-swap self test -----------------------------------------------------

if ($TestSecretSwap) {
    Write-Step "Secret swap self-test (nothing will be launched)"
    $watch = @($SecretsRel) + $CertRel | Where-Object { Test-Path -LiteralPath (Join-Path $repoRoot $_) }
    if (-not $watch) { Fail "None of the protected files exist -- nothing to test." }

    $before = @{}
    foreach ($rel in $watch) {
        $before[$rel] = (Get-FileHash -LiteralPath (Join-Path $repoRoot $rel) -Algorithm SHA256).Hash
    }

    Protect-Secrets

    foreach ($rel in $CertRel) {
        if (Test-Path -LiteralPath (Join-Path $repoRoot $rel)) { Fail "$rel was NOT stashed." }
    }
    $swapped = (Get-FileHash -LiteralPath (Join-Path $repoRoot $SecretsRel) -Algorithm SHA256).Hash
    if ($swapped -eq $before[$SecretsRel]) { Fail "Secrets file unchanged -- invalidation did not apply." }
    Write-Host "   stashed : certificate removed from repo, secrets file rewritten"

    [void](Restore-Secrets)

    $ok = $true
    foreach ($rel in $watch) {
        $full = Join-Path $repoRoot $rel
        if (-not (Test-Path -LiteralPath $full)) { Write-Host "   MISSING after restore: $rel" -ForegroundColor Red; $ok = $false; continue }
        $after = (Get-FileHash -LiteralPath $full -Algorithm SHA256).Hash
        if ($after -eq $before[$rel]) { Write-Host "   ok      : $rel restored byte-identical" -ForegroundColor Green }
        else { Write-Host "   CORRUPT : $rel differs after restore" -ForegroundColor Red; $ok = $false }
    }
    if ($ok) { Write-Host "`nPASS - swap is safe to use.`n" -ForegroundColor Green; exit 0 }
    Write-Host "`nFAIL - do NOT rely on the swap. Held copies are in $HoldDir`n" -ForegroundColor Red
    exit 1
}

# --- Preflight ---------------------------------------------------------------

Write-Step "Preflight"

$planPath = Join-Path $repoRoot $Plan
if (-not (Test-Path -LiteralPath $planPath)) {
    Fail "Plan file not found: $planPath`n   Edit the PLAN line in unattended-run.bat."
}
Write-Host "   plan    : $Plan"

# Resolve claude.exe: explicit override, then a standalone install on PATH, then the
# VS Code extension copy. The extension folder is version-stamped and changes on every
# update, so it is the last resort and is picked by version number, not file date.
$claudeExe = $env:CLAUDE_EXE
if (-not $claudeExe) {
    $claudeExe = (Get-Command claude -CommandType Application -ErrorAction SilentlyContinue |
                  Select-Object -First 1).Source
}
if (-not $claudeExe) {
    $claudeExe = Get-ChildItem (Join-Path $env:USERPROFILE '.vscode\extensions') `
                    -Directory -Filter 'anthropic.claude-code-*' -ErrorAction SilentlyContinue |
                 ForEach-Object {
                     $v = if ($_.Name -match 'claude-code-(\d+(?:\.\d+)*)') { [version]$Matches[1] } else { [version]'0.0.0' }
                     [pscustomobject]@{ Version = $v; Path = Join-Path $_.FullName 'resources\native-binary\claude.exe' }
                 } |
                 Where-Object { Test-Path -LiteralPath $_.Path } |
                 Sort-Object Version -Descending |
                 Select-Object -First 1 -ExpandProperty Path
}
if (-not $claudeExe -or -not (Test-Path -LiteralPath $claudeExe)) {
    Fail ("Could not find claude.exe.`n" +
          "   Install a standalone build so it lands on PATH:`n" +
          "     <extension path>\resources\native-binary\claude.exe install stable`n" +
          "   Or set CLAUDE_EXE to its full path and retry.")
}
Write-Host "   claude  : $claudeExe"
Write-Host "   effort  : $Effort"

# A populated hold dir means a previous run died before restoring. Put the real
# credentials back before doing anything else, or this run stashes the fake ones.
if (Restore-Secrets) {
    Write-Warn "A previous run left credentials stashed. Restored them before continuing."
    Write-Warn "Check 'git diff -- $SecretsRel' -- it should be empty."
}

# --- Branch ------------------------------------------------------------------

Write-Step "Branch"

git rev-parse --verify --quiet $Branch > $null
if ($LASTEXITCODE -eq 0) {
    git checkout $Branch
    if ($LASTEXITCODE -ne 0) { Fail "Could not check out existing branch '$Branch'." }
    Write-Host "   checked out existing $Branch"
} else {
    git checkout -b $Branch
    if ($LASTEXITCODE -ne 0) { Fail "Could not create branch '$Branch'." }
    Write-Host "   created $Branch"
}

$startSha = (git rev-parse HEAD).Trim()
Write-Host "   start   : $startSha"

$dirty = git status --porcelain --untracked-files=no
if ($dirty) {
    Write-Warn "Working tree has uncommitted tracked changes. They will be mixed into the run's commits."
}

# --- Keep awake --------------------------------------------------------------
# SetThreadExecutionState keeps the system from sleeping for the life of this
# process and reverts on exit -- no power-scheme settings are modified.
# It does not override a closing laptop lid or a manual sleep.

if (-not $AllowSleep) {
    try {
        Add-Type -Name Power -Namespace Win32 -MemberDefinition @'
[DllImport("kernel32.dll", SetLastError = true)]
public static extern uint SetThreadExecutionState(uint esFlags);
'@ -ErrorAction Stop
        $ES_CONTINUOUS = [uint32]0x80000000
        $ES_SYSTEM_REQUIRED = [uint32]0x00000001
        [void][Win32.Power]::SetThreadExecutionState($ES_CONTINUOUS -bor $ES_SYSTEM_REQUIRED)
        Write-Host "   sleep   : suppressed for this run"
    } catch {
        Write-Warn "Could not suppress sleep: $($_.Exception.Message)"
        Write-Warn "If the machine sleeps, the run dies with it."
    }
}

# --- Run ---------------------------------------------------------------------

$logDir = Join-Path $repoRoot 'logs'
if (-not (Test-Path -LiteralPath $logDir)) { New-Item -ItemType Directory -Path $logDir | Out-Null }
$log = Join-Path $logDir ("unattended-{0:yyyyMMdd-HHmmss}.log" -f (Get-Date))

$prompt = @"
Implement the plan in $Plan, working phase by phase in order.

After each phase, run that phase's verification gates as written in the plan.
Do not advance to the next phase while a gate is red -- fix it first.
Tick each checkbox in $Plan as you complete it, and commit after each phase
whose gates pass.

You are running unattended. Nobody can answer questions, so do not stop to ask.
If a phase is genuinely blocked, write a BLOCKED line into $Plan naming the
phase and the reason, skip that phase, and continue to the next one.

When every phase is done or blocked, append a short summary section to $Plan
covering what shipped, what was skipped and why, and what still needs manual
verification (anything needing the GUI, live hub sync, SharePoint, or a device).

PRODUCTION SAFETY -- this machine has live credentials on disk and is on the plant
network. application.properties ships spring.profiles.active=prod,hub,server, so the
DEFAULT profile is production: the ./db/proddb H2 file, the hub at 10.10.190.123:8090
(which broadcasts to every desktop over SSE), the real Graph mailbox, Maximo, SharePoint
and Supabase.

For the duration of this run the production credentials on disk have been replaced with
invalid values and the SharePoint certificate has been moved out of the repo. This is
deliberate. Therefore:

- Starting the app locally is allowed. Outbound calls to SharePoint, Maximo, Supabase and
  Graph will fail authentication -- that is expected, not a bug to fix. Do not attempt to
  repair, work around, or restore those credentials, and do not go looking for the real
  ones elsewhere on the filesystem. An auth failure against an external system is a
  successful guard, so treat it as "verified as far as possible offline" and move on.
- Do not read, print, copy, or transmit application-secrets.properties, any *.pfx or
  *.pem, or any credential value, and never write one into a source file, test, log,
  commit message or the plan file.
- Do not call SharePoint, Maximo, Supabase, Power Automate or the Graph mailbox from a
  test, a script, or an ad-hoc command (curl, Invoke-WebRequest, jshell, a scratch main).
  Mock the collaborator instead. Power Automate flow URLs are unauthenticated webhooks --
  posting to one writes to real SharePoint with no credential required.
- Run tests ONLY through the test profile, which is airgapped in
  application-test.properties. Any new @SpringBootTest you add MUST carry
  @ActiveProfiles("test"). Never delete or weaken anything in the AIRGAP block.
- Do not push, open a PR, or touch any remote. Local commits only.
- Do not write to the J: network share.

If a phase cannot be completed without reaching a live external system, that phase is
BLOCKED -- record it in the plan file and move on to the next one.
"@

# Backstops, not the primary control -- the credential swap is. These only close the
# obvious doors: publishing an unreviewed overnight branch, and reading the stashed
# real credentials back out of the hold directory.
$denied = @(
    'Bash(git push*)',
    'Bash(gh pr create*)',
    "Read($HoldDir\**)"
)

Write-Step "Running (log: $log)"
Write-Host "   denied  : git push, gh pr create, reads of the credential hold dir"
Write-Host "   Ctrl+C to stop. Safe to leave this window unattended.`n"

$started = Get-Date
$exitCode = 1

try {
    if (-not $KeepRealSecrets) { Protect-Secrets }
    else { Write-Warn "Running with REAL production credentials on disk (-KeepRealSecrets)." }

    & $claudeExe `
        -p $prompt `
        --permission-mode bypassPermissions `
        --effort $Effort `
        --disallowed-tools $denied |
        Tee-Object -FilePath $log

    $exitCode = $LASTEXITCODE
}
finally {
    # Runs on normal exit, on error, and on Ctrl+C. If the process is hard-killed
    # instead, the next launch detects the hold dir and restores at preflight.
    if (-not $KeepRealSecrets) {
        if (Restore-Secrets) { Write-Host "`n   secrets : real credentials restored" }
        else { Write-Warn "Nothing to restore -- verify $SecretsRel and data\certificate.pfx by hand." }
    }
}

$elapsed = (Get-Date) - $started

# --- Summary -----------------------------------------------------------------

Write-Step "Done"
Write-Host ("   elapsed : {0:hh\:mm\:ss}" -f $elapsed)
Write-Host "   exit    : $exitCode"
Write-Host "   log     : $log"

Write-Host "`n   Commits on this run:"
git --no-pager log --oneline "$startSha..HEAD"

Write-Host "`n   Changes vs start:"
git --no-pager diff --stat $startSha

Write-Host "`n   Review : git diff $startSha"
Write-Host "   Undo   : git reset --hard $startSha" -ForegroundColor Yellow
Write-Host "   Read the BLOCKED lines and the summary in $Plan before anything else."

exit $exitCode
