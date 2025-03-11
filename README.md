# ERP-Salesforce Integration Middleware

Eine leistungsstarke Middleware zur Integration zwischen dem SelectLine ERP-System und Salesforce CRM. Die Anwendung bietet RESTful-Endpunkte für Datenabruf, -transformation und -synchronisation zwischen den beiden Systemen.

## Funktionen

- Abrufen von Daten aus dem SelectLine ERP-System über dessen API
- Zwischenspeicherung von Daten in Redis zur Performance-Optimierung
- RESTful-Endpunkte für Salesforce zur Datenabfrage
- Datentransformation zwischen ERP- und Salesforce-Datenformaten
- Webhook-Handler für Salesforce-Events
- Robuste Fehlerbehandlung mit automatischen Wiederholungsversuchen
- Umfassendes Logging und Monitoring

## Technischer Stack

- **Backend**: Node.js mit Express
- **Caching**: Redis
- **Persistente Datenspeicherung**: MongoDB
- **Authentifizierung**: JWT-basiert

## Voraussetzungen

- Node.js (>= 14.0.0)
- Redis-Server
- MongoDB-Server
- SelectLine ERP-System mit API-Zugang
- Salesforce-Entwicklerkonto mit API-Zugang

## Installation

1. Repository klonen

```bash
git clone https://github.com/yourusername/erp-salesforce-middleware.git
cd erp-salesforce-middleware
```

2. Abhängigkeiten installieren

```bash
npm install
```

3. Umgebungsvariablen konfigurieren

Kopieren Sie die `.env.example`-Datei zu `.env` und bearbeiten Sie sie mit Ihren Konfigurationsdetails:

```bash
cp .env.example .env
```

4. Server starten

```bash
# Entwicklungsmodus mit automatischem Neuladen
npm run dev

# Produktionsmodus
npm start
```

## API-Endpunkte

### Authentifizierung

- `POST /api/auth/register` - Registrierung eines neuen Benutzers
- `POST /api/auth/login` - Benutzeranmeldung und Token-Erstellung
- `POST /api/auth/refresh-token` - Aktualisieren des JWT-Tokens
- `POST /api/auth/logout` - Benutzerabmeldung

### ERP-Daten

- `GET /api/erp/kunden` - Kunden aus dem ERP-System abrufen
- `GET /api/erp/kunden/:id` - Einen bestimmten Kunden abrufen
- `GET /api/erp/artikel` - Artikel aus dem ERP-System abrufen
- `GET /api/erp/artikel/:id` - Einen bestimmten Artikel abrufen
- `GET /api/erp/belege` - Belege aus dem ERP-System abrufen
- `GET /api/erp/belege/:id` - Einen bestimmten Beleg abrufen
- `GET /api/erp/auftraege` - Aufträge aus dem ERP-System abrufen
- `GET /api/erp/auftraege/:id` - Einen bestimmten Auftrag abrufen
- `POST /api/erp/cache-refresh` - Cache für ERP-Daten aktualisieren

### Datentransformation

- `GET /api/transform/kunden-zu-accounts` - Kunden in Salesforce Account-Format umwandeln
- `GET /api/transform/kunden-zu-accounts/:id` - Einen bestimmten Kunden umwandeln
- `GET /api/transform/artikel-zu-products` - Artikel in Salesforce Product-Format umwandeln
- `GET /api/transform/artikel-zu-products/:id` - Einen bestimmten Artikel umwandeln
- `GET /api/transform/auftraege-zu-opportunities` - Aufträge in Salesforce Opportunity-Format umwandeln
- `GET /api/transform/auftraege-zu-opportunities/:id` - Einen bestimmten Auftrag umwandeln
- `POST /api/transform/custom` - Benutzerdefinierte Datentransformation

### Webhooks

- `POST /api/webhooks/salesforce/account` - Verarbeiten von Salesforce Account-Events
- `POST /api/webhooks/salesforce/opportunity` - Verarbeiten von Salesforce Opportunity-Events
- `POST /api/webhooks/salesforce/product` - Verarbeiten von Salesforce Product-Events
- `POST /api/webhooks/salesforce/contact` - Verarbeiten von Salesforce Contact-Events
- `POST /api/webhooks/salesforce/custom` - Verarbeiten von benutzerdefinierten Salesforce-Events

## Verwendung mit Postman

Sie können die beigefügte Postman-Sammlung importieren, um die API-Endpunkte zu testen. Die Sammlung enthält vordefinierte Anfragen für alle Endpunkte und konfigurierte Umgebungsvariablen.

## Entwicklungshinweise

- Alle HTTP-Anfragen werden mit umfassendem Logging protokolliert
- Fehlerbehandlung erfolgt zentral mit einheitlichen Antwortformaten
- Der Redis-Cache wird für häufig abgerufene Daten verwendet, um die API-Anfragen zu minimieren
- Rate-Limiting schützt vor übermäßiger API-Nutzung

## Lizenz

MIT 