# Schule-Intern Vertretungsplan-Updater 2.x

Desktop-Anwendung zur automatischen Übertragung von Vertretungsplan-Dateien.

## Oberfläche

Die Oberfläche folgt der README aus `schuleintern-portal/schule-intern-1.9-ui-kit` (Studio UI 1.9).
Die zentralen Styles aus `schuleintern-portal/www/style` liegen als unveränderte lokale Kopie
in `app/src/assets/schul-ui`. Dadurch funktioniert das Design auch offline im Tauri-Fenster.
Bei Aktualisierungen des UI-Kits diese Dateien erneut aus der zentralen Quelle übernehmen;
app-spezifisches Layout steht in `app/src/App.vue`.

- Übersicht, Einstellungen und Protokoll sind eigene Views; nur die Übersicht hat eine Statusleiste.
- Standard-Controls: 42 px; Sidebar: 340 px; Spaltenabstand: 12 px; Hauptbereich-Padding: 24 px.
- Unter 960 px stehen Hauptbereich und Sidebar untereinander.
- Desktop-Startgröße: 1100 × 760 px; Mindestgröße: 360 × 500 px.

## Entwicklung

```sh
cd app
npm install
npm run tauri dev
```

`npm run build` prüft und baut das Frontend. Der reine Vite-Browserbetrieb eignet sich
zur Layoutprüfung; Ordnerdialog, gespeicherte Einstellungen und Upload benötigen Tauri.

## Lokaler Upload-Verlauf

Die View „Übertragungen“ zeigt die letzten zehn erfolgreichen Datei-Uploads
(neueste zuerst). Ein Klick auf einen Eintrag öffnet die gespeicherte HTML-Vorschau.
Der Verlauf enthält Dateiname, Ziel-URL, Zeitpunkt, Byteanzahl und HTML-Inhalt
und wird unter `uploadHistory` im vorhandenen lokalen Tauri-Store `store.bin`
gespeichert. Er enthält keinen API-Schlüssel. Ab dem elften Eintrag entfällt der älteste.

Für jeden Upload wird eine temporäre Kopie erstellt und anschließend entfernt.
Die Vorschau zeigt genau diese übertragenen Bytes, dekodiert anhand der
HTML-Zeichenkodierung (Standard UTF-8). Sie ist per Sandbox und CSP isoliert;
Skripte, externe Ressourcen und Formulare sind deaktiviert. Der Upload-Verlauf
bestätigt den Datei-Upload, nicht die nachgelagerte Serververarbeitung.
Vor der Einführung übertragene Dateien lassen sich nicht rückwirkend anzeigen.
