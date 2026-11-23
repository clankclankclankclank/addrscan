@echo off
setlocal
pushd "%~dp0" || exit /b 1

where node.exe >nul 2>&1
if errorlevel 1 goto node_required

node.exe -e "const [major, minor] = process.versions.node.split('.').map(Number); process.exit(major > 22 || (major === 22 && minor >= 9) ? 0 : 1);"
if errorlevel 1 goto node_required

if /i "%~1"=="--nfts" goto nfts
node.exe --env-file-if-exists=.env server.js %*
goto finish

:nfts
if "%~2"=="" (
  node.exe --env-file-if-exists=.env alchemy-nfts.js
) else (
  node.exe --env-file-if-exists=.env alchemy-nfts.js "%~2"
)
goto finish

:node_required
echo Addrscan needs Node.js 22.9 or later on PATH.
echo Install it from https://nodejs.org, then reopen this launcher.
popd
pause
exit /b 1

:finish
set "ADDRSCAN_EXIT=%errorlevel%"
popd
if not "%ADDRSCAN_EXIT%"=="0" pause
exit /b %ADDRSCAN_EXIT%
