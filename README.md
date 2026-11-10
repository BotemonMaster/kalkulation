# Kalkulation

Kosten, Preise und Angebote für Textildruck: Produktions- und Fixkosten, Lieferanten je Textil,
Marktplatzgebühren, Angebotsrechner mit B2B-Staffel und Angebote als PDF mit deinem Logo.
Läuft nur auf deinem Rechner, ohne Internet und ohne Konto.

## Start

**Windows:** Ordner `Kalkulation` an einen festen Platz kopieren (z. B. `Dokumente`) und
`Kalkulation starten.cmd` doppelklicken (Download-Paket unter „Releases“). Beim ersten Start legt die App die Verknüpfung
„Kalkulation“ auf dem Desktop an. Python ist dabei, es muss nichts installiert werden.
Schöner wird das Fenster mit Google Chrome oder Microsoft Edge (ist auf jedem Windows).

**Mac:** Ordner in `Programme` oder `Dokumente` legen, dann `Kalkulation starten.command`
mit **Rechtsklick → Öffnen** starten (nur beim ersten Mal, sonst blockiert macOS die Datei).
Fehlt Python 3, bietet macOS die Entwicklerwerkzeuge an: installieren und erneut starten.
Mit Google Chrome öffnet sich ein eigenes Fenster, sonst der Standardbrowser.

Beim ersten Start öffnen sich die Einstellungen: Firma, Logo, Bankdaten und Umsatzsteuer
eintragen, „Fertig“ drücken. Dann Lieferanten, Material & Druck, Fixkosten, Textilien und
Produkte pflegen.

## Daten

- Alles liegt in `data/data.json` im Ordner, jeden Tag eine Sicherung in `data/backups` (60 Tage).
- Gespeichert wird automatisch. Einstellungen → Daten → Exportieren sichert den Stand als Datei.
- Neue Version: nur die Ordner `app` und `python` sowie die Startdateien ersetzen,
  `data` behalten.
- Der Ordner `data` liegt nur auf deinem Rechner. Für eine Sicherung außerhalb ihn regelmäßig
  in deinen Cloud-Speicher kopieren.

## Weiterentwickeln

- Kein Framework, keine Pakete: Python-Standardbibliothek (`server.py`) und Vanilla-JavaScript
  (`app/`). Rechenkern in `app/calc.js`, Oberfläche in `app/app.js`, Aussehen in `app/styles.css`.
- Server: `127.0.0.1:8765`, `GET/PUT /api/data` (Versionsschutz über `X-Rev` / `X-Base-Rev`).
- Startstand für neue Daten: `app/seed.json`.
- Aus dem Quellcode starten (ohne Download-Paket): Python 3.9 oder neuer, dann `python Kalkulation.pyw`.
- Tests: `node --test app/calc.test.mjs`.
- Lizenz: MIT, siehe `LICENSE`. Nutzung auf eigenes Risiko; Preise und Gebühren vor Angeboten selbst prüfen.
