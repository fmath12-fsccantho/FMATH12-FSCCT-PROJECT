@echo off
title FMATH12 - Website Du Lieu & Báo Cáo KHKT 2026
echo ===================================================================
echo       KHOI DONG WEBSITE DU LIEU & KHAO SAT KHKT FMATH12
echo ===================================================================
cd /d "%~dp0dulieu"
echo Dang khoi chay may chu du lieu tai: http://localhost:5174 ...
npm run dev
pause
