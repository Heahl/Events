@todo [Frontend]

# Passwort-Stärke-Anzeige

Um die Benutzerfreundlichkeit zu verbessern, könntest du auf der Registrierungsseite
eine Live-Anzeige zur Passwortstärke einbauen.

### Beispiel:

- HTML: <div id="password-strength">Passwortstärke: Schlecht</div>
- JS (clientseitig): Überwache Input-Feld, prüfe gegen RegEx, aktualisiere Text/Farbe

### Beispiel-Logik:

- Min. 12 Zeichen: "Schwach"
- +1 Großbuchstabe: "Mittel"
- +1 Sonderzeichen: "Stark"

---

# Formular für Termin-Erstellung

Beim Erstellen eines neuen Termins über das Admin-Formular (`/admin/event/create`) ist auf folgende Punkte zu achten, um
die korrekten Daten für das Backend-Modell zu übermitteln:

### date (Datum des Termins):

- Dieses Feld repräsentiert das Hauptdatum des Termins (zB. 2025-03-20).
- Es muss separat vom Start- und Endzeitpunkt erfasst werden.
- Beim Speichern:
    - date sollte auf das gleiche Datum wie startDate gesetzt werden (sofern der Termin nur einen Tag dauert).
    - Beispiel: Wenn startDate 2025-03-20T10:00:00Z ist, dann sollte date 2025-03-20T00:00:00Z entsprechen (oder als
      Date-Objekt mit Mitternacht).

### startDate (Datum und Startzeit):

- Dieses Feld kombiniert Datum und Uhrzeit des Beginns des Termins (zB. 2025-03-20T10:00:00Z).
- Nutze ein datetime-local-Input-Feld im HTML, um Datum und Zeit gleichzeitig zu erfassen.
- Validierung:
    - Stelle sicher, dass startDate vor endDate liegt.

### endDate (Datum und Endzeit):

- Dieses Feld kombiniert Datum und Uhrzeit des Endes des Termins (zB. 2025-03-20T20:00:00Z).
- Nutze ebenfalls ein datetime-local-Input-Feld.
- Validierung:
    - Stelle sicher, dass endDate nach startDate liegt.

### registrationDeadline (Anmeldefrist):

- Dieses Feld kombiniert Datum und Uhrzeit, bis zu der eine Anmeldung möglich ist.
- Nutze ein datetime-local-Input-Feld.
- **Wichtig**: Die registrationDeadline muss spätestens zum Beginn des Termins (startDate) liegen. Sie darf nicht danach
  liegen.
- Beispiel-Logik: registrationDeadline <= startDate (im Backend validiert).

### Zeitzone:

- Die datetime-local-Felder im Browser liefern einen String ohne Zeitzone (zB. 2025-03-20T10:00). Das Backend (Node.js)
  interpretiert diesen Wert standardmäßig als lokale Zeit des Servers.
- Um Missverständnisse zu vermeiden, sollte die Anwendung in der UI klar kommunizieren, welche Zeitzone gemeint ist (
  zB. "Zeiten in deutscher Zeitzone").
- Falls eine einheitliche Zeitzone (zB. UTC) gewünscht ist, müssen die Werte vor dem Senden an das Backend entsprechend
  umgerechnet werden.

### Voreinstellungen (UX):

- Wenn ein Nutzer startDate ändert, kann endDate automatisch auf denselben Tag gesetzt werden, mit einer
  Standard-Endzeit (zB. 18:00), aber nur, wenn endDate noch leer ist.
- Ähnlich: date kann automatisch auf das Datum von startDate gesetzt werden. Dies vereinfacht die Eingabe, wenn der
  Termin am selben Tag startet und endet.

### Validierung im Frontend:

- Ergänze clientseitige Validierung, um dem Nutzer direkt Feedback zu geben, wenn z. B. startDate > endDate oder
  registrationDeadline > startDate.

---
