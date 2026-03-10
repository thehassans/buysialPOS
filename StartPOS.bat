@echo off
title BuysialPOS Local Server
cd /d "c:\Users\kjh\Desktop\buysialErp"

:: Clean any hung background processes first
taskkill /F /IM node.exe >nul 2>&1

:: Start Next.js silently in the background
start "NextJSServer" /b cmd /c "npm run start"

:: Give it 3 seconds to boot
timeout /t 3 >nul

:: Launch the Native Electron Window
call npx electron .

:: Once the electron window is closed, cleanly shut down the server
taskkill /F /IM node.exe >nul 2>&1
