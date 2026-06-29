# EtaPro EPLog — Discovery Probe (READ-ONLY)
#
# Purpose: figure out HOW the "Refresh EPLog" button can be triggered from COM,
# so we know which implementation path to take. This script changes NOTHING —
# it only attaches to your already-open Excel and inspects it.
#
# BEFORE RUNNING:
#   1. Open Excel manually (double-click), with the EtaPro add-in loaded.
#   2. Open / build a workbook that has an EPLog set up (header + start/end date cells).
#   3. Click the EPLog header cell (or a date cell) so the probe can map the layout
#      around your selection.
#   4. Leave Excel open, then run this script (see "HOW TO RUN" at the bottom).
#
# It writes everything to a transcript file AND prints to the console.
# Paste that file back and it tells us which trigger path EtaPro exposes.

$ErrorActionPreference = "Continue"   # keep going even if one probe throws

$outFile = Join-Path $env:TEMP "etapro-eplog-probe-output.txt"
Start-Transcript -Path $outFile -Force | Out-Null

function Banner($t) {
    Write-Host ""
    Write-Host ("=" * 72)
    Write-Host "  $t"
    Write-Host ("=" * 72)
}

# ── 1. Attach to the running Excel ───────────────────────────────────────────
Banner "1. ATTACH TO RUNNING EXCEL"
$excel = $null
try {
    $excel = [Runtime.InteropServices.Marshal]::GetActiveObject("Excel.Application")
    Write-Host "Attached. Excel version: $($excel.Version)   Build: $($excel.Build)"
    Write-Host "Open workbooks: $($excel.Workbooks.Count)"
} catch {
    Write-Host "FAILED to attach to Excel: $($_.Exception.Message)"
    Write-Host "Make sure Excel is OPEN (double-clicked, not via this script) and try again."
    Write-Host "Also make sure you ran this with Windows PowerShell 5.1 ('powershell'), NOT 'pwsh'."
    Stop-Transcript | Out-Null
    return
}

# ── 2. Add-in inventory (tells us .xlam vs .xll vs COM add-in) ────────────────
Banner "2. ADD-IN INVENTORY"
Write-Host "--- Excel AddIns (.xlam / .xla / .xll) ---"
try {
    foreach ($a in $excel.AddIns) {
        try {
            Write-Host ("  Installed={0,-5}  Name={1,-30}  Path={2}" -f $a.Installed, $a.Name, $a.FullName)
        } catch {}
    }
} catch { Write-Host "  (could not enumerate AddIns: $($_.Exception.Message))" }

Write-Host ""
Write-Host "--- COM AddIns ---"
try {
    foreach ($c in $excel.COMAddIns) {
        try {
            Write-Host ("  Connect={0,-5}  ProgId={1,-40}  Desc={2}" -f $c.Connect, $c.ProgId, $c.Description)
        } catch {}
    }
} catch { Write-Host "  (could not enumerate COMAddIns: $($_.Exception.Message))" }

# ── 3. CommandBars — the OPTION-2 probe (legacy toolbar buttons) ──────────────
# If "Refresh EPLog" is an old-style CommandBar control, we can call .Execute()
# on it, and its .OnAction tells us the macro name for Application.Run (Option 1).
Banner "3. COMMANDBARS  (look for an EtaPro / EPLog / Refresh control)"

$keywords = 'eta','eplog','ep log','refresh','log','gp ','strateg'

function Dump-Controls($controls, $barName, $depth) {
    foreach ($ctl in $controls) {
        try {
            $cap = "$($ctl.Caption)"
            $tag = "$($ctl.Tag)"
            $oa  = ""
            try { $oa = "$($ctl.OnAction)" } catch {}
            $hay = ("$cap $tag $oa").ToLower()
            $match = $false
            foreach ($k in $keywords) { if ($hay.Contains($k)) { $match = $true; break } }
            if ($match) {
                $indent = "  " * ($depth + 1)
                Write-Host ("{0}* BAR='{1}'  Caption='{2}'  Id={3}  Type={4}" -f $indent, $barName, $cap, $ctl.Id, $ctl.Type)
                Write-Host ("{0}    Tag='{1}'  OnAction='{2}'" -f $indent, $tag, $oa)
            }
            # Recurse into popup menus (Type 10 = msoControlPopup)
            if ($ctl.Type -eq 10) {
                Dump-Controls $ctl.Controls $barName ($depth + 1)
            }
        } catch {}
    }
}

$barCount = 0
try {
    foreach ($bar in $excel.CommandBars) {
        $barCount++
        try {
            $hay = "$($bar.Name)".ToLower()
            $barMatch = $false
            foreach ($k in $keywords) { if ($hay.Contains($k)) { $barMatch = $true; break } }
            # Print the name of any bar that itself looks EtaPro-related
            if ($barMatch) { Write-Host ("  [BAR MATCH] Name='{0}'  Visible={1}  Controls={2}" -f $bar.Name, $bar.Visible, $bar.Controls.Count) }
            Dump-Controls $bar.Controls $bar.Name 0
        } catch {}
    }
    Write-Host ""
    Write-Host "Scanned $barCount command bars. Matching controls (if any) are listed above."
    Write-Host "If NOTHING matched, the button is most likely a true Ribbon control"
    Write-Host "(not a CommandBar) -> we lean on Option 1 (named macro) or Option 4 (UI Automation)."
} catch { Write-Host "  (could not enumerate CommandBars: $($_.Exception.Message))" }

# ── 4. VBA project — the OPTION-1 probe (named macro discovery) ───────────────
# Reveals the macro the ribbon button's onAction calls. Requires Trust Center:
# File > Options > Trust Center > Macro Settings > "Trust access to the VBA project
# object model" = ON. If it's off, this section throws (harmless) and we skip it.
Banner "4. VBA PROJECT (macro names for Application.Run)"
try {
    $vbe = $excel.VBE
    foreach ($proj in $vbe.VBProjects) {
        try {
            Write-Host "  Project: $($proj.Name)   File: $($proj.FileName)"
            foreach ($comp in $proj.VBComponents) {
                try {
                    $cm = $comp.CodeModule
                    $procs = New-Object System.Collections.Generic.HashSet[string]
                    for ($ln = 1; $ln -le $cm.CountOfLines; $ln++) {
                        $line = $cm.Lines($ln, 1)
                        if ($line -match '^\s*(Public\s+|Private\s+)?(Sub|Function)\s+([A-Za-z0-9_]+)') {
                            [void]$procs.Add($matches[3])
                        }
                    }
                    if ($procs.Count -gt 0) {
                        Write-Host ("    {0}: {1}" -f $comp.Name, ($procs -join ", "))
                    }
                } catch {}
            }
        } catch {}
    }
} catch {
    Write-Host "  VBA project model not accessible: $($_.Exception.Message)"
    Write-Host "  -> Either the add-in is an XLL (no VBA), or 'Trust access to the VBA"
    Write-Host "     project object model' is OFF. Turn it on to see macro names, then re-run."
}

# ── 5. Active-sheet layout around your selection (map the EPLog header) ───────
Banner "5. EPLOG LAYOUT  (cells around your current selection)"
try {
    $wb = $excel.ActiveWorkbook
    $ws = $excel.ActiveSheet
    Write-Host "Workbook: $($wb.Name)   Sheet: $($ws.Name)"
    $sel = $excel.Selection
    Write-Host "Selection: $($sel.Address)"
    $r0 = $sel.Row
    $c0 = $sel.Column
    $rStart = [Math]::Max(1, $r0 - 3)
    $cStart = [Math]::Max(1, $c0 - 2)
    $rEnd = $rStart + 25
    $cEnd = $cStart + 8
    Write-Host "Dumping rows $rStart..$rEnd, cols $cStart..$cEnd  (Value | Formula if different):"
    for ($r = $rStart; $r -le $rEnd; $r++) {
        for ($c = $cStart; $c -le $cEnd; $c++) {
            $cell = $ws.Cells($r, $c)
            $v = "$($cell.Value2)"
            $f = "$($cell.Formula)"
            if (-not [string]::IsNullOrWhiteSpace($v) -or ($f -like "=*")) {
                $addr = $cell.Address($false, $false)
                if ($f -like "=*" -and $f -ne $v) {
                    Write-Host ("  {0,-6} = '{1}'   [formula: {2}]" -f $addr, $v, $f)
                } else {
                    Write-Host ("  {0,-6} = '{1}'" -f $addr, $v)
                }
            }
        }
    }
} catch { Write-Host "  (could not read active sheet: $($_.Exception.Message))" }

# ── 6. Window state note ─────────────────────────────────────────────────────
Banner "6. NEXT STEP"
Write-Host "If a CommandBar control matched in section 3, note its OnAction + Caption."
Write-Host "If section 4 listed macros, note any name containing 'log'/'refresh'/'eplog'."
Write-Host "Paste this whole file back:"
Write-Host "  $outFile"

Stop-Transcript | Out-Null
Write-Host ""
Write-Host "Saved probe output to: $outFile"
