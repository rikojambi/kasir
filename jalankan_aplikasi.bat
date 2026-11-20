@echo off
title Aplikasi Kasir UKK RPL 2023/2024
echo ==========================================================
echo        APLIKASI KASIR - UJI KOMPETENSI KEAHLIAN
echo             REKAYASA PERANGKAT LUNAK 2023/2024
echo ==========================================================
echo.
echo Menjalankan Web Server Kasir...
echo Buka browser pada alamat: http://localhost:3000
echo.
echo Akun Login:
echo - Administrator : admin   (Password: admin123)
echo - Petugas Kasir : petugas (Password: petugas123)
echo.
echo Tekan Ctrl + C di jendela ini untuk mematikan server.
echo ==========================================================
node server.js
pause
