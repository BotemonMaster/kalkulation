"""Lokaler Server der Kalkulation: liefert die Oberfläche und speichert data/data.json.

Nur 127.0.0.1, nur Standardbibliothek. Jede Speicherung schreibt atomar (tmp + replace);
die erste Speicherung eines Tages legt vorher eine Kopie in data/backups/ ab (60 Tage).
Der Server beendet sich 15 Minuten nach dem letzten Lebenszeichen des Fensters.
"""

from __future__ import annotations

import json
import os
import shutil
import sys
import threading
import time
from datetime import date
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

ROOT = Path(__file__).resolve().parent
APP = ROOT / "app"
DATA_DIR = ROOT / "data"
DATA_FILE = DATA_DIR / "data.json"
BACKUPS = DATA_DIR / "backups"
SEED = APP / "seed.json"
HOST, PORT = "127.0.0.1", 8765
MAX_BODY = 5 * 1024 * 1024
IDLE_SECONDS = 15 * 60
KEEP_BACKUPS = 60
TYPES = {".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8",
         ".css": "text/css; charset=utf-8", ".json": "application/json; charset=utf-8",
         ".svg": "image/svg+xml", ".ico": "image/x-icon", ".png": "image/png"}

_lock = threading.Lock()
_last_seen = time.monotonic()


def load_data() -> bytes:
    if not DATA_FILE.exists():
        DATA_DIR.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(SEED, DATA_FILE)
    return DATA_FILE.read_bytes()


def current_rev() -> str:
    return str(DATA_FILE.stat().st_mtime_ns) if DATA_FILE.exists() else "0"


class Conflict(Exception):
    pass


def save_data(raw: bytes, base_rev: str | None) -> str:
    payload = json.loads(raw.decode("utf-8"))
    if not isinstance(payload, dict) or "products" not in payload or "settings" not in payload:
        raise ValueError("Kein gültiger Kalkulationsstand")
    with _lock:
        # Ein Fenster mit älterem Stand darf neuere Daten nicht überschreiben.
        if base_rev != current_rev():
            raise Conflict()
        DATA_DIR.mkdir(parents=True, exist_ok=True)
        BACKUPS.mkdir(parents=True, exist_ok=True)
        daily = BACKUPS / f"data-{date.today().isoformat()}.json"
        if DATA_FILE.exists() and not daily.exists():
            shutil.copyfile(DATA_FILE, daily)
            for old in sorted(BACKUPS.glob("data-*.json"))[:-KEEP_BACKUPS]:
                old.unlink(missing_ok=True)
        tmp = DATA_FILE.with_suffix(".tmp")
        tmp.write_text(json.dumps(payload, ensure_ascii=False, indent=1), encoding="utf-8")
        os.replace(tmp, DATA_FILE)
        return current_rev()


class Handler(BaseHTTPRequestHandler):
    def log_message(self, *_args) -> None:  # keine Konsole unter pythonw
        pass

    def _send(self, status: int, body: bytes, content_type: str = "application/json; charset=utf-8", rev: str | None = None) -> None:
        self.send_response(status)
        self.send_header("Content-Type", content_type)
        if rev is not None:
            self.send_header("X-Rev", rev)
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def _touch(self) -> None:
        global _last_seen
        _last_seen = time.monotonic()

    def do_GET(self) -> None:  # noqa: N802
        self._touch()
        path = self.path.split("?", 1)[0]
        if path == "/api/data":
            with _lock:
                body = load_data()
                return self._send(200, body, rev=current_rev())
        if path == "/api/rev":
            return self._send(200, json.dumps({"rev": current_rev()}).encode())
        if path == "/api/ping":
            return self._send(200, b'{"ok":true}')
        if path == "/api/backups":
            names = sorted((p.name for p in BACKUPS.glob("data-*.json")), reverse=True) if BACKUPS.exists() else []
            return self._send(200, json.dumps(names).encode())
        target = (APP / ("index.html" if path in ("/", "") else path.lstrip("/"))).resolve()
        if APP not in target.parents or not target.is_file() or target.suffix not in TYPES:
            return self._send(404, b'{"error":"not found"}')
        return self._send(200, target.read_bytes(), TYPES[target.suffix])

    def do_PUT(self) -> None:  # noqa: N802
        self._touch()
        if self.path != "/api/data":
            return self._send(404, b'{"error":"not found"}')
        length = int(self.headers.get("Content-Length") or 0)
        if length <= 0 or length > MAX_BODY:
            return self._send(HTTPStatus.REQUEST_ENTITY_TOO_LARGE, b'{"error":"size"}')
        body = self.rfile.read(length)
        try:
            rev = save_data(body, self.headers.get("X-Base-Rev"))
        except Conflict:
            return self._send(409, json.dumps({"error": "conflict", "rev": current_rev()}).encode())
        except (ValueError, UnicodeDecodeError) as error:
            return self._send(400, json.dumps({"error": str(error)}).encode())
        return self._send(200, json.dumps({"ok": True, "rev": rev}).encode(), rev=rev)


def serve(port: int = PORT) -> None:
    server = ThreadingHTTPServer((HOST, port), Handler)

    def watchdog() -> None:
        while True:
            time.sleep(30)
            if time.monotonic() - _last_seen > IDLE_SECONDS:
                server.shutdown()
                return

    threading.Thread(target=watchdog, daemon=True).start()
    server.serve_forever()


if __name__ == "__main__":
    serve(int(sys.argv[1]) if len(sys.argv) > 1 else PORT)
