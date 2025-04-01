#!/bin/bash

# Farbdefinitionen für Ausgaben
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Funktion zum Ausgeben von Überschriften
print_heading() {
    echo -e "\n${BLUE}==== $1 ====${NC}\n"
}

# Funktion zum Ausgeben von Statusmeldungen
print_status() {
    echo -e "${GREEN}✓ $1${NC}"
}

# Funktion zum Ausgeben von Warnungen
print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

# Funktion zum Ausgeben von Fehlern
print_error() {
    echo -e "${RED}✗ $1${NC}"
}

# Prüfen, ob das Skript mit Root-Rechten ausgeführt wird
check_root() {
    if [ "$EUID" -ne 0 ]; then
        print_error "Dieses Skript benötigt Root-Rechte."
        echo "Bitte mit 'sudo $0' erneut ausführen."
        exit 1
    fi
}

# Verzeichnisstruktur erstellen
create_directories() {
    print_heading "Verzeichnisstruktur erstellen"
    
    mkdir -p logs data/db data/redis
    chmod -R 755 logs data
    
    print_status "Verzeichnisstruktur erstellt"
}

# Abhängigkeiten installieren
install_dependencies() {
    print_heading "Node.js-Abhängigkeiten installieren"
    
    if command -v npm > /dev/null; then
        npm install
        print_status "Node.js-Abhängigkeiten installiert"
    else
        print_error "npm ist nicht installiert. Bitte installieren Sie Node.js und npm."
        exit 1
    fi
}

# Umgebungsvariablen einrichten
setup_env() {
    print_heading "Umgebungsvariablen einrichten"
    
    if [ ! -f .env ]; then
        if [ -f .env.example ]; then
            cp .env.example .env
            print_status ".env-Datei aus .env.example erstellt"
            print_warning "Bitte bearbeiten Sie die .env-Datei und passen Sie die Werte an"
        else
            print_error ".env.example nicht gefunden"
        fi
    else
        print_status ".env-Datei existiert bereits"
    fi
}

# MongoDB in WSL installieren
install_mongodb_wsl() {
    print_heading "MongoDB in WSL installieren"
    
    # MongoDB-Repository hinzufügen
    wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | apt-key add -
    echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu $(lsb_release -cs)/mongodb-org/6.0 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-6.0.list
    apt-get update
    
    # MongoDB-Pakete installieren
    apt-get install -y mongodb-org
    
    # Datenverzeichnis erstellen
    mkdir -p /data/db
    chown -R $SUDO_USER:$SUDO_USER /data/db
    
    print_status "MongoDB installiert"
    print_warning "In WSL müssen Sie MongoDB manuell starten mit: mongod --dbpath /data/db"
}

# MongoDB in Standard-Linux installieren
install_mongodb_linux() {
    print_heading "MongoDB in Linux installieren"
    
    # MongoDB-Repository hinzufügen
    wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | apt-key add -
    echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu $(lsb_release -cs)/mongodb-org/6.0 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-6.0.list
    apt-get update
    
    # MongoDB-Pakete installieren
    apt-get install -y mongodb-org

    # Service-Datei erstellen
    cat > /etc/systemd/system/mongod.service <<EOF
[Unit]
Description=MongoDB Database Server
Documentation=https://docs.mongodb.org/manual
After=network.target

[Service]
User=mongodb
Group=mongodb
ExecStart=/usr/bin/mongod --config /etc/mongod.conf
PIDFile=/var/run/mongodb/mongod.pid
RuntimeDirectory=mongodb
RuntimeDirectoryMode=0755

[Install]
WantedBy=multi-user.target
EOF

    # Systemd neu laden und MongoDB starten
    systemctl daemon-reload
    systemctl start mongod
    systemctl enable mongod
    
    print_status "MongoDB installiert und gestartet"
}

# Redis installieren
install_redis() {
    print_heading "Redis installieren"
    
    apt-get install -y redis-server
    
    if [ "$is_wsl" = true ]; then
        # Startskript für Redis in WSL erstellen
        cat > /usr/local/bin/start-redis-wsl <<EOF
#!/bin/bash
redis-server --daemonize yes
echo "Redis-Server wurde im Hintergrund gestartet."
EOF
        chmod +x /usr/local/bin/start-redis-wsl
        
        # Redis direkt starten
        redis-server --daemonize yes
        
        print_status "Redis-Server installiert und gestartet"
        print_warning "In Zukunft können Sie Redis mit dem Befehl 'start-redis-wsl' starten"
    else
        systemctl start redis-server
        systemctl enable redis-server
        print_status "Redis-Server installiert und gestartet"
    fi
}

# Hauptprogramm
main() {
    print_heading "ERP-Salesforce Middleware Installationsskript"
    
    # Root-Rechte prüfen
    check_root
    
    # Prüfen, ob wir in WSL laufen
    is_wsl=false
    if grep -q Microsoft /proc/version; then
        is_wsl=true
        print_status "WSL-Umgebung erkannt"
    fi
    
    # Benutzer fragen, ob er in WSL arbeitet (falls nicht automatisch erkannt)
    if [ "$is_wsl" = false ]; then
        read -p "Arbeiten Sie in einer WSL-Umgebung? (j/n): " wsl_answer
        if [[ $wsl_answer =~ ^[Jj]$ ]]; then
            is_wsl=true
            print_status "WSL-Umgebung manuell ausgewählt"
        fi
    fi
    
    # System-Pakete aktualisieren
    print_heading "System-Pakete aktualisieren"
    apt-get update
    apt-get upgrade -y
    print_status "System-Pakete aktualisiert"
    
    # Verzeichnisstruktur erstellen
    create_directories
    
    # MongoDB installieren
    if [ "$is_wsl" = true ]; then
        install_mongodb_wsl
    else
        install_mongodb_linux
    fi
    
    # Redis installieren
    install_redis
    
    # Abhängigkeiten installieren
    su $SUDO_USER -c "bash -c 'cd $PWD && install_dependencies'"
    
    # Umgebungsvariablen einrichten
    setup_env
    
    print_heading "Installation abgeschlossen"
    
    if [ "$is_wsl" = true ]; then
        echo -e "${GREEN}Um die Anwendung zu starten:${NC}"
        echo "1. MongoDB starten: mongod --dbpath /data/db &"
        echo "2. Redis starten: redis-server &"
        echo "3. Anwendung starten: npm run dev"
    else
        echo -e "${GREEN}Um die Anwendung zu starten:${NC}"
        echo "1. npm run dev"
    fi
}

# Skript ausführen
main 