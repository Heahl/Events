# Events - Terminverwaltung

Eine Webanwendung zur Verwaltung von Terminanmeldungen. Interessent:innen können sich über einen Link zu Terminen
anmelden, Anbieter:innen können Termine erstellen und die Anmeldeliste einsehen.

## Teammitglieder

- Yurii Gruzevych
- Hendrik Ahlborn

## Installation & Start

1. **Repo klonen**

```bash
git clone <repo-url>
cd events
```

2. **Abhängigkeiten installieren**

```bash
bun install
```

3. **Environment variables konfigurieren**

```bash
touch .env;
echo -e "MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/events?retryWrites=true&w=majority\nSESSION_SECRET=dein-sehr-langes-geheimes-schluesselpaerchen\nPORT=3000" > .env
```

4. **Anwendung im Entwicklermodus starten**

```bash
bun run dev 
```

Die Anwendung ist dann unter [localhost:3000](http://localhost:3000) erreichbar

## Deployment

Die Anwendung wurde auf einer AWS EC2 Instanz (Ubuntu) deployed.
- Die EC2-Instanz stellt die Laufzeitumgebung bereit
- Abhängigkeiten werden mit Bun installiert
- Der Server wird mit Node.js gestartet
- Die Anwendung läuft auf Port 3000 und ist über die öffentliche IP der EC2-Instanz per HTTP erreichbar
- Sensible Konfigurationswerte (z. B. Datenbank-Zugangsdaten) werden über eine .env-Datei gesetzt und nicht im Repository gespeichert
- Der Serverprozess wird in einer persistenten Screen-Session ausgeführt, sodass die Anwendung auch nach dem Schließen der SSH-Verbindung weiterläuft.