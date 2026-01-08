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

TODO: Deployment beschreiben