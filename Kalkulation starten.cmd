@echo off
rem Startet die Kalkulation mit dem mitgelieferten Python, ohne Installation.
if exist "%~dp0python\pythonw.exe" (start "" "%~dp0python\pythonw.exe" "%~dp0Kalkulation.pyw") else (start "" pythonw "%~dp0Kalkulation.pyw")
