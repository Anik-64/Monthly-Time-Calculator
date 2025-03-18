@echo off
echo Installing Node.js dependencies...
if not exist package.json (
    echo Error: package.json not found in current directory!
    pause
    exit /b 1
)
npm install
if %ERRORLEVEL% NEQ 0 (
    echo Error: Failed to install dependencies!
    pause
    exit /b %ERRORLEVEL%
)
echo Dependencies installed successfully!
echo Starting the application...
npm start
if %ERRORLEVEL% NEQ 0 (
    echo Error: Failed to start the application! Check package.json for a "start" script.
    pause
    exit /b %ERRORLEVEL%
)
pause