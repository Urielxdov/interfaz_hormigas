@echo off
rem Doble clic para despertar el backend y mantenerlo despierto durante la prueba.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0despertar-backend.ps1" -MantenerDespierto %*
pause
