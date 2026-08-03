@echo off
REM ===========================================================================
REM  Unattended multi-phase implementation run.
REM  Edit the three settings below, save, then double-click this file.
REM  See scripts\unattended-run.ps1 for what it actually does.
REM ===========================================================================

REM Path to the plan file, relative to the repo root.
set "PLAN=project\plans\my-feature.md"

REM Branch the run works on. Created if it does not exist.
set "BRANCH=feat/my-feature"

REM Reasoning effort: low | medium | high | xhigh | max
REM high is a good default for a long mechanical build; xhigh for design-heavy work.
set "EFFORT=high"

REM ===========================================================================

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0unattended-run.ps1" -Plan "%PLAN%" -Branch "%BRANCH%" -Effort "%EFFORT%"

echo.
pause
