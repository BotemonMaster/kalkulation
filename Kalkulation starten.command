#!/bin/bash
# Startet die Kalkulation auf dem Mac mit dem System-Python (python3).
cd "$(dirname "$0")" || exit 1
if ! /usr/bin/env python3 -c "import sys; sys.exit(sys.version_info < (3, 9))" >/dev/null 2>&1; then
  osascript -e 'display dialog "Python 3 fehlt. Bitte die Entwicklerwerkzeuge installieren, die macOS gleich anbietet (oder python.org), und dann erneut starten." buttons {"OK"}'
  exit 1
fi
nohup python3 Kalkulation.pyw >/dev/null 2>&1 &
echo "Kalkulation läuft. Dieses Fenster kannst du schließen."
