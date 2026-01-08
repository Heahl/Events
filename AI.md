# Wie wir AI-Tools zum Absolvieren der Aufgabe genutzt haben

----

### Hilfe bei Erstellung von Tickets:

Prompt [ChatGPT](chat.openai.com):

```
Übersetze die folgende Aufgabenstellung in actionable Items, 
die wir als Tickets abarbeiten können.

[Aufgabenstellung]
```

Diese haben wir nach Prüfung auf logische Konsistenz und folgender Anpassung in [Trello](www.trello.com) übernommen.
Hier ein Screenshot unsere Kanban-Boards:

![img.png](img.png)

---

### Hilfe bei Erstellung von RegEx's:

Prompt [ChatGPT](chat.openai.com):

```
Schreibe regex, um gefährliche Zeichen aus einem String input eines Formulars zu entfernen
```

```
Schreibe RegEx, um die Validität eines Mailinputs zu testen
```

---

### Farbschema für das Frontend generieren:

```
Generiere ein Farbschema für die Seite
```

Primärfarben:
Blau-Gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%) - für primäre Buttons und Highlights
Blau-Töne: #667eea - Hauptfarbe für Links und Aktionen
Grün-Töne: #27ae60 - für erfolgreiche Aktionen und positive Zustände
Rot-Töne: #e74c3c - für Logout-Button und Fehler
Grau-Töne: #2c3e50 - für Haupttexte und Titel
Farbpalette:
Hintergrund: #f8f9fa (Helles Grau)
Text: #333 (Dunkelgrau) und #2c3e50 (Dunkelblau)
Subtile Farben: #7f8c8d (Subtitles), #95a5a6 (deaktivierte Elemente)

---

### Versuch, die App abzusichern

```
Welche Sicherheitsmaßnahmen außer Rate limiting kannst du noch empfehlen?
```

Gute Frage! Hier sind die wichtigsten Sicherheitsmaßnahmen, die du zusätzlich zum Rate Limiting implementieren solltest:
#Gute Frage! Hier sind die wichtigsten Sicherheitsmaßnahmen, die du zusätzlich zum Rate Limiting implementieren
solltest:

1. Rate Limiting
   Installiere express-rate-limit:

bash
1
npm install express-rate-limit
Füge es zu deinem app.js hinzu:

javascript
12345678910111213141516171819202122232425
import rateLimit from 'express-rate-limit';

// Rate limiter für alle Anfragen
const generalLimiter = rateLimit({
windowMs: 15 * 60 * 1000, // 15 Minuten
max: 100, // Begrenze jeden IP auf 100 Anfragen pro Fenster
message: { error: 'Zu viele Anfragen, bitte versuchen Sie es später erneut.' },
standardHeaders: true,
legacyHeaders: false,
});

2. CSRF Protection
   Installiere csurf:

bash
1
Füge es zu deinem app.js hinzu:

javascript
123456789101112131415161718
import csrf from 'csurf';

const csrfProtection = csrf({
cookie: {
httpOnly: true,
secure: isProd,
sameSite: 'strict'
}
});

3. CORS Konfiguration
   javascript
   2345678
   import cors from 'cors';

app.use(cors({
origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
credentials: true,
methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}));

4. Helmet für grundlegende Sicherheit
   bash
   1
   npm install helmet
   javascript
   1234567891011121314151617
   import helmet from 'helmet';

app.use(helmet({
contentSecurityPolicy: {
directives: {
defaultSrc: ["'self'"],
styleSrc: ["'self'", "'unsafe-inline'"],
scriptSrc: ["'self'"],
imgSrc: ["'self'", "data:", "https:"],
},

5. Input Validation & Sanitization
   Installiere express-validator:

bash
1
Verwende es in deinen Controllern:

javascript
12345678910111213141516171819202122
import { body, validationResult } from 'express-validator';

// Beispiel für Event-Erstellung
export const validateEvent = [
body('title')
.trim()
.isLength({ min: 1, max: 100 })
.withMessage('Titel muss zwischen 1 und 100 Zeichen lang sein'),
body('email')
.isEmail()

6. Secure Headers Middleware
   javascript
   12345678910
   // Füge eine benutzerdefinierte Middleware hinzu
   app.use((req, res, next) => {
   // Verhindere Clickjacking
   res.setHeader('X-Frame-Options', 'DENY');
   // XSS-Schutz
   res.setHeader('X-XSS-Protection', '1; mode=block');
   // MIME-Type-Schutz
   res.setHeader('X-Content-Type-Options', 'nosniff');
   next();
   });
7. Session-Sicherheit
   javascript
   12345678910111213
   pp.use(session({
   secret: process.env.SESSION_SECRET || 'dein-sicheres-geheimnis',
   resave: false,
   saveUninitialized: false,
   cookie: {
   secure: isProd, // Nur über HTTPS in Produktion
   httpOnly: true, // Nicht über JavaScript zugänglich
   sameSite: 'strict', // CSRF-Schutz
   maxAge: 1000 * 60 * 60 * 24 // 24 Stunden
   },

8. API Key oder JWT für externe Clients (optional)
   Wenn du API-Zugriff für externe Clients planst, implementiere API-Keys oder JWT-Tokens.

Die wichtigsten Maßnahmen für deine Anwendung sind:

✅ Rate Limiting (vor allem für Authentifizierung)
✅ CSRF Protection für Formulare
✅ Input Validation für alle Eingaben
✅ Secure Session Handling
✅ Helmet für grundlegende Header-Sicherheit
Beginne mit Rate Limiting und Input Validation - das bringt dir am meisten für deinen Anwendungsfall!

> Nach einigen Versuchen haben wir uns allerdings entschieden, vorerst nur rate limiting einzubauen, da wir dieses
> verstehen.

---

### Doku (wie in der Vorlesung vorgeschlagen) generieren lassen

```
Generiere die Swagger Api Dokumentation auf Basis dieser Dateien [Dateien aus /controllers/** und /routes/**]
```

Output ist 1:1 vom LLM Output übernommen.
---

### Setup zum hosten der Swaggerdocs

```
Schreibe die zu unserer app.js passende swaggerOptions.js Datei [/app.js]
```

Auch dieser Output ist 1:1 übernommen und in der Datei "/swaggerOptions.js" einsehbar