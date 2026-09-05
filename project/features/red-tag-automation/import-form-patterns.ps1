# Imports the 2026-09-03 Red Tag form screenshots into the bundled pattern set.
#
# Modes:
#   copy   - byte-for-byte copy (the crop is already a usable pattern)
#   crop   - cut the given x,y,w,h rectangle out of the source
#   swbox  - Safe Work checkbox label: normalise so the checkbox's left border sits
#            at a fixed x, then report the checkbox centre offset
#   hwrow  - Hot Work checklist row: trim off the teal Y/NA band so the pattern is
#            text only (the captured Y boxes carry an "X" and would never match a
#            blank form), and report the Y / NA centres relative to the trimmed edge
param(
  [string]$Src  = "C:\Users\usada\Downloads\OneDrive_2026-09-04\RedTag New Form Automation",
  [string]$Dest = "C:\Users\usada\my_projects\power_plant_java\src\main\resources\automation\redtag\patterns",
  [string]$Manifest
)
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

# Checkbox fill on both forms is a flat light blue; the teal band behind the Hot Work
# Y/NA boxes is a flat dark teal. Both are unblended fills, so exact-ish matching is safe.
function Test-BoxFill($p) { return ($p.B -ge 240 -and $p.R -ge 195 -and $p.R -le 240 -and ($p.B - $p.R) -ge 18) }
function Test-Teal($p)    { return ($p.R -lt 70 -and $p.G -ge 95 -and $p.G -le 165 -and [Math]::Abs($p.G - $p.B) -lt 30) }

# Contiguous column runs whose pixels are at least $MinFrac box-fill, as [start,end] pairs.
function Get-FillRuns($bmp, [int]$xMax, [double]$MinFrac = 0.35) {
  [int]$h = $bmp.Height
  [int]$need = [Math]::Max(3, [int]($h * $MinFrac))
  $isFill = New-Object 'bool[]' ($xMax + 1)
  for ([int]$cx = 0; $cx -le $xMax; $cx++) {
    [int]$n = 0
    for ([int]$cy = 0; $cy -lt $h; $cy++) {
      $px = $bmp.GetPixel($cx, $cy)
      if (Test-BoxFill $px) { $n++ }
    }
    $isFill[$cx] = ($n -ge $need)
  }
  $runs = New-Object System.Collections.ArrayList
  [int]$start = -1
  for ([int]$cx = 0; $cx -le $xMax; $cx++) {
    if ($isFill[$cx]) { if ($start -lt 0) { $start = $cx } }
    elseif ($start -ge 0) { [void]$runs.Add(@($start, ($cx - 1))); $start = -1 }
  }
  if ($start -ge 0) { [void]$runs.Add(@($start, $xMax)) }
  return ,$runs
}

function Save-Sub($bmp, $x, $y, $w, $h, $out) {
  $w = [Math]::Min($w, $bmp.Width - $x); $h = [Math]::Min($h, $bmp.Height - $y)
  $rect = New-Object System.Drawing.Rectangle($x, $y, $w, $h)
  $sub = $bmp.Clone($rect, $bmp.PixelFormat)
  $dir = Split-Path $out -Parent
  if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Force -Path $dir | Out-Null }
  $sub.Save($out, [System.Drawing.Imaging.ImageFormat]::Png)
  $sub.Dispose()
  return "$w`x$h"
}

$report = @()
foreach ($line in Get-Content $Manifest) {
  if ($line -match '^\s*#' -or $line.Trim() -eq '') { continue }
  $f = $line.Split('|')
  $srcPath = Join-Path $Src $f[0]
  $outPath = Join-Path $Dest $f[1]
  $mode = $f[2].Trim()
  if (-not (Test-Path $srcPath)) { Write-Output "MISSING SOURCE: $($f[0])"; continue }

  $bmp = New-Object System.Drawing.Bitmap($srcPath)
  try {
    switch ($mode) {
      'copy' {
        $dir = Split-Path $outPath -Parent
        if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Force -Path $dir | Out-Null }
        Copy-Item $srcPath $outPath -Force
        $report += ("{0,-46} copy   {1}x{2}" -f $f[1], $bmp.Width, $bmp.Height)
      }
      'crop' {
        $r = $f[3].Split(',')
        $dim = Save-Sub $bmp ([int]$r[0]) ([int]$r[1]) ([int]$r[2]) ([int]$r[3]) $outPath
        $report += ("{0,-46} crop   {1}" -f $f[1], $dim)
      }
      'swbox' {
        $runs = Get-FillRuns $bmp ([Math]::Min(60, $bmp.Width - 1))
        if ($runs.Count -lt 1) { throw "no checkbox found in $($f[0])" }
        $bl = $runs[0][0]; $br = $runs[0][1]
        $trim = [Math]::Max(0, $bl - 2)      # keep the 1px border + 1px of white
        $dim = Save-Sub $bmp $trim 0 ($bmp.Width - $trim) $bmp.Height $outPath
        $centre = [int](($bl + $br) / 2) - $trim
        $report += ("{0,-46} swbox  {1}   checkbox-centre-dx={2}" -f $f[1], $dim, $centre)
      }
      'hwrow' {
        $runs = Get-FillRuns $bmp ([Math]::Min(70, $bmp.Width - 1))
        if ($runs.Count -lt 2) { throw "expected Y and NA boxes in $($f[0]), found $($runs.Count)" }
        $yC  = [int](($runs[0][0] + $runs[0][1]) / 2)
        $naC = [int](($runs[1][0] + $runs[1][1]) / 2)
        # Trim just right of the teal band so the pattern is pure text.
        [int]$tealRight = 0
        [int]$scanTo = [Math]::Min(90, $bmp.Width) - 1
        for ([int]$cx = 0; $cx -le $scanTo; $cx++) {
          [int]$n = 0
          for ([int]$cy = 0; $cy -lt $bmp.Height; $cy++) {
            $px = $bmp.GetPixel($cx, $cy)
            if (Test-Teal $px) { $n++ }
          }
          if ($n -ge [int]($bmp.Height * 0.5)) { $tealRight = $cx }
        }
        $trim = $tealRight + 3
        $dim = Save-Sub $bmp $trim 0 ($bmp.Width - $trim) $bmp.Height $outPath
        $report += ("{0,-46} hwrow  {1}   Y-dx={2} NA-dx={3} (trim={4})" -f
                    $f[1], $dim, ($yC - $trim), ($naC - $trim), $trim)
      }
      default { throw "unknown mode '$mode'" }
    }
  } finally { $bmp.Dispose() }
}
$report | ForEach-Object { Write-Output $_ }
Write-Output ("--- {0} pattern(s) written" -f $report.Count)
