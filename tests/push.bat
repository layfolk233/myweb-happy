@echo off
cd /d "%~dp0.."

if "%*"=="" (set MSG=chore: auto commit) else (set MSG=%*)

git add -A
git commit -m "%MSG%"
git push origin main
pause
