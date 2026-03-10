@echo off
echo Starting BuysialPOS Offline Engine...
echo ====================================

REM Ensure dependencies are installed
if not exist "node_modules\" (
    echo Installing required dependencies...
    npm install
)

REM Initialize local database if it doesn't exist
if not exist "prisma\pos.db" (
    echo Formatting local offline database...
    npx prisma db push
)

echo.
echo Launching POS Desktop Interface...
echo Please do not close this window while using the application.
echo.

npm run dev:app
