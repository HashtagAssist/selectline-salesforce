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

## Schnelle Installation (empfohlen)

Für eine automatisierte Installation sowohl unter Linux als auch unter Windows Subsystem for Linux (WSL) steht ein Installationsskript zur Verfügung.

1. Repository klonen

```bash
git clone https://github.com/yourusername/erp-salesforce-middleware.git
cd erp-salesforce-middleware
```

2. Installationsskript ausführen

```bash
sudo chmod +x install.sh
sudo ./install.sh
```

Das Skript führt folgende Schritte aus:
- Erkennt automatisch, ob Sie in einer WSL-Umgebung arbeiten
- Aktualisiert System-Pakete
- Installiert MongoDB und Redis
- Installiert Node.js-Abhängigkeiten
- Richtet die .env-Datei ein

## Manuelle Installation

Falls Sie die Installation manuell durchführen möchten:

1. Repository klonen

```bash
git clone https://github.com/yourusername/erp-salesforce-middleware.git
cd erp-salesforce-middleware
```

2. Abhängigkeiten installieren

```bash
npm install
```

3. MongoDB installieren

**Für Ubuntu/Debian:**
```bash
# MongoDB-Repository hinzufügen
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu $(lsb_release -cs)/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt-get update

# MongoDB-Pakete installieren
sudo apt-get install -y mongodb-org

# MongoDB-Service starten und aktivieren
sudo systemctl start mongod
sudo systemctl enable mongod
```

**Für WSL (Windows Subsystem for Linux):**
```bash
# MongoDB-Repository hinzufügen
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu $(lsb_release -cs)/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt-get update

# MongoDB-Pakete installieren
sudo apt-get install -y mongodb-org

# Datenverzeichnis erstellen
sudo mkdir -p /data/db
sudo chown -R $USER /data/db

# MongoDB manuell starten
mongod --dbpath /data/db &
```

**Alternativ mit Docker:**
```bash
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

4. Redis installieren

**Für Ubuntu/Debian:**
```bash
sudo apt-get install redis-server
sudo systemctl start redis-server
sudo systemctl enable redis-server
```

**Für WSL:**
```bash
sudo apt-get install redis-server
# Redis manuell starten
redis-server &
```

**Alternativ mit Docker:**
```bash
docker run -d -p 6379:6379 --name redis redis:latest
```

5. Umgebungsvariablen konfigurieren

Kopieren Sie die `.env.example`-Datei zu `.env` und bearbeiten Sie sie mit Ihren Konfigurationsdetails:

```bash
cp .env.example .env
```

6. Verzeichnisstruktur erstellen

```bash
mkdir -p logs data/db data/redis
```

7. Server starten

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

### Benutzerverwaltung

- `GET /api/auth/users` - Alle Benutzer abrufen (nur für Admins)
- `GET /api/auth/users/:userId` - Einen bestimmten Benutzer abrufen (nur für Admins)
- `POST /api/auth/users` - Neuen Benutzer erstellen (nur für Admins)
- `PUT /api/auth/users/:userId` - Benutzer aktualisieren (nur für Admins)
- `PATCH /api/auth/users/:userId/status` - Benutzerstatus ändern (nur für Admins)
- `DELETE /api/auth/users/:userId` - Benutzer löschen (nur für Admins)

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

### Statistiken

- `GET /api/stats/dashboard` - Allgemeine Statistiken für das Dashboard abrufen
- `GET /api/stats/api-calls` - Detaillierte Statistiken zu API-Aufrufen abrufen
- `GET /api/stats/system` - Systemstatistiken (CPU, Speicher, Festplatte) abrufen
- `GET /api/stats/users` - Benutzerstatistiken abrufen (nur für Admins)
- `GET /api/stats/transformations` - Statistiken zu Datentransformationen abrufen
- `GET /api/stats/webhooks` - Statistiken zu Webhooks abrufen

## Fehlerbehebung

### MongoDB-Verbindungsprobleme

Wenn die Fehlermeldung `connect ECONNREFUSED 127.0.0.1:27017` erscheint, versuchen Sie Folgendes:

1. Prüfen Sie, ob MongoDB läuft:
   ```bash
   sudo systemctl status mongod  # Für Linux
   ps aux | grep mongod          # Für WSL
   ```

2. MongoDB manuell starten:
   ```bash
   # Für WSL
   mongod --dbpath /data/db &
   
   # Für Linux
   sudo systemctl start mongod
   ```

### Redis-Verbindungsprobleme

Wenn die Fehlermeldung `Redis connection failed` erscheint, versuchen Sie Folgendes:

1. Prüfen Sie, ob Redis läuft:
   ```bash
   sudo systemctl status redis-server  # Für Linux
   ps aux | grep redis-server         # Für WSL
   ```

2. Redis manuell starten:
   ```bash
   # Für WSL
   redis-server &
   
   # Für Linux
   sudo systemctl start redis-server
   ```

## Entwicklungshinweise

- Alle HTTP-Anfragen werden mit umfassendem Logging protokolliert
- Fehlerbehandlung erfolgt zentral mit einheitlichen Antwortformaten
- Der Redis-Cache wird für häufig abgerufene Daten verwendet, um die API-Anfragen zu minimieren
- Rate-Limiting schützt vor übermäßiger API-Nutzung
- Die Transformationslogik ist modular aufgebaut und kann leicht erweitert werden

## Verwendung mit Postman

Sie können die beigefügte Postman-Sammlung importieren, um die API-Endpunkte zu testen. Die Sammlung enthält vordefinierte Anfragen für alle Endpunkte und konfigurierte Umgebungsvariablen.

## Lizenz

Apache 2.0