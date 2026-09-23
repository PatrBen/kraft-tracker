# Kraft-Tracker

Web-App zum Tracken von Krafttraining – React 18 + TypeScript + Vite. Offline-first: Alle Daten
liegen im Browser (IndexedDB via Dexie) und werden optional über Dexie Cloud zwischen Geräten
synchronisiert.

```bash
npm install
npm run dev        # Entwicklungsserver auf http://localhost:5173
npm run dev:phone  # dito, aber im WLAN erreichbar (zum Ausprobieren am Handy)
npm test           # Unit-Tests (1RM, Achsen-Ticks, Backup-Format)
npm run build      # Typecheck + Produktions-Build nach dist/
npm run icons      # PNG-Icons aus public/icon.svg neu erzeugen
```

## Am Handy nutzen

Die App ist eine PWA: installierbar auf dem Home-Bildschirm, offline nutzbar (Service Worker
cached alle Dateien), und während eines laufenden Trainings bleibt das Display an (Wake Lock).

**Veröffentlichung:** Jeder Push auf `main` baut die App per GitHub Actions
(`.github/workflows/deploy.yml`) und veröffentlicht sie auf GitHub Pages. Dank relativer Pfade
(`base: './'`) und Hash-Router läuft sie auch im Unterordner `https://<name>.github.io/kraft-tracker/`.

Auf dem iPhone die App zum Home-Bildschirm hinzufügen – sonst löscht Safari lokale Daten nach
7 Nutzungstagen ohne Besuch der Seite.

## Synchronisierung (Dexie Cloud)

Ohne Konfiguration läuft die App rein lokal. Einrichtung:

1. `npx dexie-cloud create` – legt die Cloud-Datenbank an (Login per E-Mail-Code) und schreibt
   `dexie-cloud.json` und `dexie-cloud.key`. **Beide Dateien nie committen** (stehen in `.gitignore`).
2. Erlaubte Adressen freischalten:
   `npx dexie-cloud whitelist http://localhost:5173 http://localhost:4173 https://<name>.github.io`
3. Die Datenbank-URL in `.env` eintragen: `VITE_DEXIE_CLOUD_URL=https://xxxxxxxx.dexie.cloud`
   (die URL ist nicht geheim – sie steht ohnehin im ausgelieferten JavaScript).
4. In der App unter **Daten → Anmelden** auf jedem Gerät mit derselben E-Mail anmelden.

Neue Nutzer sind bei Dexie Cloud zunächst "Evaluation"-Nutzer: 30 aktive Tage Sync, danach
pausiert er. Im kostenlosen Tarif lassen sich 3 Nutzer in der Dexie-Cloud-Verwaltung dauerhaft
auf "Production" umstellen.

## Backup

**Daten → Backup herunterladen** speichert alles als JSON-Datei. **Backup importieren** stellt
Einträge anhand ihrer ID wieder her (einfügen oder überschreiben) und löscht nie etwas.

## Struktur

```
src/
  db/          Dexie-Schema + Cloud-Konfiguration (db.ts), Typen, Datenzugriff, Backup
  hooks/       React-Anbindung: Live-Queries, Hash-Router, Pausentimer, Sync-Status, Wake Lock
  utils/       1RM (Epley), Zeiträume (Tag/Woche/Monat/Jahr), Formatierung, Achsen-Ticks,
               Backup-Format, Trainings-Text für Claude, Ton/Vibration
  components/
    plans/     Plan-Verwaltung (inkl. Umschalter Wiederholungen ↔ Sekunden)
    daily/     Liegestütz-Zähler und Körpergewicht (auf der Pläne-Seite)
    journal/   Tagebuch: Übersicht, Session, Satz-Eingabe, Nachtragen, Text-Export
    timer/     Pausentimer (Provider, Leiste, Einstellungen)
    charts/    Linien- und Säulendiagramm, gemeinsamer Tooltip
    stats/     Statistik: Übungen (1RM / Haltezeit), Liegestütze, Körpergewicht
    data/      Sync-Status, Anmeldung, Backup
    cloud/     Login-Dialog (E-Mail → Code)
```

## Datenschema

| Tabelle           | Indizes                                                          |
| ----------------- | ---------------------------------------------------------------- |
| `exercises`       | `@id, name`                                                      |
| `workoutPlans`    | `@id, name` – Übungen + Ziel-Sätze als Array im Plan             |
| `workoutSessions` | `@id, planId, startedAt` – Snapshot der Plan-Übungen beim Start  |
| `sets`            | `@id, sessionId, exerciseId, [sessionId+exerciseId], [exerciseId+createdAt]` |
| `pushups`         | `@id, doneAt` – ein Eintrag pro "+1" mit Anzahl (seit v2)        |
| `bodyWeights`     | `@id, measuredAt` – Körpergewicht in kg (seit v2)                |

`@id` sind global eindeutige String-IDs, damit Einträge verschiedener Geräte nie kollidieren.
Das 1RM wird nicht gespeichert, sondern bei Bedarf aus Gewicht und Wiederholungen berechnet.
Halteübungen (`exercises.measure = 'time'`, z. B. Deadhang) speichern die Sekunden im Feld `reps`.
