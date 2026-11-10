"""Startet die Kalkulation: Server im Hintergrund (falls nicht schon aktiv) und App-Fenster.

Windows: pythonw Kalkulation.pyw (legt beim ersten Start eine Desktop-Verknüpfung an).
Mac:     python3 Kalkulation.pyw (über "Kalkulation starten.command").
"""

import os
import subprocess
import sys
import threading
import time
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT))
import server  # noqa: E402

URL = f"http://{server.HOST}:{server.PORT}/"
LOCAL = Path(os.environ.get("LOCALAPPDATA", ""))
BROWSERS = {
    "win32": [
        Path(r"C:\Program Files\Google\Chrome\Application\chrome.exe"),
        Path(r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"),
        LOCAL / "Google" / "Chrome" / "Application" / "chrome.exe",
        Path(r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"),
        Path(r"C:\Program Files\Microsoft\Edge\Application\msedge.exe"),
    ],
    "darwin": [
        Path("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"),
        Path("/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge"),
    ],
}


def running() -> bool:
    try:
        with urllib.request.urlopen(URL + "api/ping", timeout=1) as response:
            return response.status == 200
    except OSError:
        return False


def open_window() -> None:
    browser = next((path for path in BROWSERS.get(sys.platform, []) if path.exists()), None)
    if browser:
        subprocess.Popen([str(browser), f"--app={URL}", "--window-size=1440,920"])
    else:
        import webbrowser
        webbrowser.open(URL)


def desktop_shortcut() -> None:
    """Einmalig unter Windows: Verknüpfung "Kalkulation" auf dem Desktop, falls keine da ist."""
    if sys.platform != "win32":
        return
    pythonw = Path(sys.executable).with_name("pythonw.exe")
    script = (
        "$d=[Environment]::GetFolderPath('Desktop'); $p=Join-Path $d 'Kalkulation.lnk';"
        "if (-not (Test-Path $p)) { $s=(New-Object -ComObject WScript.Shell).CreateShortcut($p);"
        f"$s.TargetPath='{pythonw}'; $s.Arguments='\"{ROOT / 'Kalkulation.pyw'}\"'; $s.WorkingDirectory='{ROOT}';"
        f"$s.IconLocation='{ROOT / 'app' / 'icon.ico'}'; $s.Save() }}"
    )
    flags = getattr(subprocess, "CREATE_NO_WINDOW", 0)
    subprocess.Popen(["powershell", "-NoProfile", "-NonInteractive", "-Command", script], creationflags=flags)


if running():
    open_window()
else:
    threading.Thread(target=server.serve, daemon=False).start()
    for _ in range(50):
        if running():
            break
        time.sleep(0.1)
    open_window()
    if (ROOT / "python").is_dir():
        desktop_shortcut()
