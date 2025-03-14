# Frontend für SFSLSync

Dieses Frontend-Projekt bietet eine Benutzeroberfläche für das SFSLSync Backend, welches als Middleware zwischen SelectLine und Salesforce fungiert.

## Funktionen

- **Login-System**: Sichere Authentifizierung mit JWT
- **Benutzerbereich**: Zugriff auf alle Funktionen außer Benutzerverwaltung
- **Admin-Bereich**: Vollständiger Zugriff einschließlich Benutzerverwaltung
- **Dashboard**: Anzeige von wichtigen Statistiken und Logs
- **API-Monitoring**: Überwachung der Aufrufe an die SelectLine API

## Technologien

- React (v18)
- Material-UI (v5)
- React Router
- React Query für Datenabfragen
- Chart.js für Visualisierungen
- JWT für Authentifizierung

## Installation

```bash
# Im Frontend-Verzeichnis
npm install
```

## Entwicklung

```bash
# Starten des Entwicklungsservers
npm start
```

Der Server läuft dann unter http://localhost:3001 und kommuniziert mit dem Backend, das unter Port 3000 läuft.

## Build

```bash
# Erstellen einer produktionsfertigen Version
npm run build
```

Die Build-Dateien werden im `build`-Verzeichnis erstellt und können auf einem Webserver bereitgestellt werden.

## Struktur

- `/src/components` - Wiederverwendbare UI-Komponenten
- `/src/pages` - Hauptseiten der Anwendung
- `/src/contexts` - React Context für globalen Zustand
- `/src/services` - API-Dienste und Hilfsfunktionen
- `/src/utils` - Utility-Funktionen 