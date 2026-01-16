@echo off
:: Prevents Windows from locking/sleeping by simulating activity
:: Run this script and minimize it

echo Keep-alive script running. Press Ctrl+C to stop.
echo.

:loop
:: Send a harmless key (ScrollLock toggle) to simulate activity
powershell -command "$wsh = New-Object -ComObject WScript.Shell; $wsh.SendKeys('{SCROLLLOCK}{SCROLLLOCK}')"
:: Wait 60 seconds before next activity
timeout /t 60 /nobreak >nul
goto loop
