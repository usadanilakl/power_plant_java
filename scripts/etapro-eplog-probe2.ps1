# EtaPro EPLog - Discovery Probe #2 (READ-ONLY)
#
# Probe #1 showed EtaPRO is a VSTO/COM add-in (no VBA, no CommandBar button).
# This probe checks the two remaining trigger paths:
#   A. COMAddIns(...).Object  -> does EtaPRO expose a callable automation object
#                                with a Refresh method? (cleanest, headless)
#   B. UI Automation          -> find the "Refresh EPLog" ribbon button and confirm
#                                it can be invoked (the realistic fallback)
#
# This changes NOTHING. It does not click refresh - it only inspects.
#
# BEFORE RUNNING:
#   1. Keep Excel open with the LOG.xlsx workbook and the EtaPRO add-in loaded.
#   2. *** Click the EtaPRO ribbon TAB *** (the one that has the "Refresh EPLog"
#      button) so its controls are realized in the UI Automation tree. Leave that
#      tab showing, then run this script.
#
# NOTE: this file is intentionally pure ASCII so it survives being copied between
# machines without character corruption.

$ErrorActionPreference = "Continue"

$outFile = Join-Path $env:TEMP "etapro-eplog-probe2-output.txt"
Start-Transcript -Path $outFile -Force | Out-Null

function Banner($t) {
    Write-Host ""
    Write-Host ("=" * 72)
    Write-Host "  $t"
    Write-Host ("=" * 72)
}

# --- Attach ------------------------------------------------------------------
Banner "ATTACH TO RUNNING EXCEL"
$excel = $null
try {
    $excel = [Runtime.InteropServices.Marshal]::GetActiveObject("Excel.Application")
    Write-Host "Attached. Excel $($excel.Version), workbooks: $($excel.Workbooks.Count)"
} catch {
    Write-Host "FAILED to attach: $($_.Exception.Message)"
    Write-Host "Open Excel (double-click) first, run with 'powershell' (5.1) not 'pwsh'."
    Stop-Transcript | Out-Null
    return
}

# --- A. COM add-in automation object -----------------------------------------
Banner "A. COM ADD-IN AUTOMATION OBJECTS (look for a Refresh method)"
$targets = "EtaPRO.ExcelAddIn", "GPCALCS.ExcelAddIn", "VP.ExcelAddIn"
foreach ($progId in $targets) {
    Write-Host ""
    Write-Host "--- $progId ---"
    try {
        $addin = $excel.COMAddIns.Item($progId)
        $obj = $null
        try { $obj = $addin.Object } catch {}
        if ($null -eq $obj) {
            Write-Host "  .Object is NULL  -> no automation interface exposed (cannot call directly)."
            continue
        }
        Write-Host "  .Object EXISTS -> automation interface present. Type: $($obj.GetType().FullName)"
        Write-Host "  Members (methods/properties it exposes):"
        try {
            $members = $obj | Get-Member -ErrorAction SilentlyContinue | Where-Object { $_.MemberType -match 'Method|Property' }
            if ($members) {
                foreach ($m in $members) { Write-Host ("    {0,-12} {1}" -f $m.MemberType, $m.Name) }
            } else {
                Write-Host "    (Get-Member returned nothing useful - IDispatch without type info)"
            }
        } catch {
            Write-Host "    (could not enumerate members: $($_.Exception.Message))"
        }
    } catch {
        Write-Host "  Not found / not accessible: $($_.Exception.Message)"
    }
}
Write-Host ""
Write-Host "If any object above lists a method like Refresh / RefreshLog / Execute,"
Write-Host "that is our clean COM trigger (Option A)."

# --- B. UI Automation: find the ribbon button --------------------------------
Banner "B. UI AUTOMATION - find the 'Refresh EPLog' ribbon button"
try {
    Add-Type -AssemblyName UIAutomationClient
    Add-Type -AssemblyName UIAutomationTypes
    $AE = [System.Windows.Automation.AutomationElement]
    $TS = [System.Windows.Automation.TreeScope]
    $CT = [System.Windows.Automation.ControlType]

    $proc = Get-Process EXCEL -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowHandle -ne 0 } | Select-Object -First 1
    if ($null -eq $proc) { throw "No Excel window with a handle found (is it minimized to tray?)" }
    $root = $AE::FromHandle($proc.MainWindowHandle)
    Write-Host "Excel window: '$($root.Current.Name)'  (PID $($proc.Id))"

    # List ribbon tabs so we can see the EtaPRO tab's exact name
    Write-Host ""
    Write-Host "--- Ribbon tabs ---"
    $tabCond = New-Object System.Windows.Automation.PropertyCondition($AE::ControlTypeProperty, $CT::TabItem)
    $tabs = $root.FindAll($TS::Descendants, $tabCond)
    foreach ($t in $tabs) {
        try { Write-Host ("  Tab: '{0}'" -f $t.Current.Name) } catch {}
    }

    # Enumerate all buttons; print those that look EtaPRO/log/refresh related
    Write-Host ""
    Write-Host "--- Buttons matching eta/eplog/log/refresh ---"
    $btnCond = New-Object System.Windows.Automation.PropertyCondition($AE::ControlTypeProperty, $CT::Button)
    $btns = $root.FindAll($TS::Descendants, $btnCond)
    Write-Host "  (scanned $($btns.Count) buttons total)"
    $keywords = 'eta','eplog','ep log','log','refresh'
    $hits = 0
    foreach ($b in $btns) {
        try {
            $name = "$($b.Current.Name)"
            if ([string]::IsNullOrWhiteSpace($name)) { continue }
            $low = $name.ToLower()
            $match = $false
            foreach ($k in $keywords) { if ($low.Contains($k)) { $match = $true; break } }
            if (-not $match) { continue }
            $autoId = "$($b.Current.AutomationId)"
            $ip = $null
            $canInvoke = $b.TryGetCurrentPattern([System.Windows.Automation.InvokePattern]::Pattern, [ref]$ip)
            Write-Host ("  * Name='{0}'  AutomationId='{1}'  Invokable={2}" -f $name, $autoId, $canInvoke)
            $hits++
        } catch {}
    }
    if ($hits -eq 0) {
        Write-Host "  No matching buttons found. Make sure you clicked the EtaPRO ribbon TAB"
        Write-Host "  before running (controls on inactive tabs may not appear in the tree)."
    }
} catch {
    Write-Host "UI Automation probe failed: $($_.Exception.Message)"
}

Banner "NEXT STEP"
Write-Host "Paste this file back:"
Write-Host "  $outFile"
Stop-Transcript | Out-Null
Write-Host ""
Write-Host "Saved to: $outFile"
