// __tests__/public.event.routes.bun.test.js
import {describe, test, expect, beforeAll, afterAll, afterEach} from 'bun:test';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../../app.js';
import User from '../../models/User.js';
import Event from '../../models/Event.js';

/**
 * @test {GET /event/:id} - Öffentliche Termin-Detailseite
 *
 * Szenario: Interessent ruft die Detailseite eines Termins auf
 *
 * Akzeptanzkriterien:
 * - Die Seite ist öffentlich zugänglich (keine Authentifizierung)
 * - Die Seite zeigt Titel, Beschreibung, Ort, Datum/Uhrzeit, Frist an
 * - Wenn die Anmeldefrist nicht abgelaufen ist, wird ein Anmeldeformular angezeigt
 * - Wenn die Anmeldefrist abgelaufen ist, wird kein Anmeldeformular angezeigt
 */
describe('Public Event Routes - GET /event/:id', () => {
    let testProviderId;
    let testEventId;
    let testEventIdExpired;

    beforeAll(async () => {
        // Stelle sicher, dass die Datenbankverbindung steht
        if (mongoose.connection.readyState !== 1) {
            await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/test');
            await new Promise(resolve => setTimeout(resolve, 1000)); // Kurze Wartezeit nach Verbindung
        }

        // Test-User erstellen
        // Hashen erfolgt im User-Model, daher Klartext-Passwort speichern
        const user = await User.create({
            email: 'anbieter@example.com',
            password: 'SicheresPasswort!' // <-- Klartext-Passwort, das Model kümmert sich um das Hashing
        });
        testProviderId = user._id;
    });

    afterAll(async () => {
        // User aufräumen
        await User.deleteMany({});
        await Event.deleteMany({});
        // Optional: Verbindung trennen
        // await mongoose.disconnect();
    });

    afterEach(async () => {
        // Event aufräumen
        await Event.deleteMany({});
    });

    /**
     * @test {GET /event/:id} - Zeigt Termin-Details an, wenn Frist *nicht* abgelaufen ist
     *
     * Gegeben: Ein Event existiert in der DB, mit zukünftiger Anmeldefrist
     * Wenn: GET /event/:id aufgerufen wird
     * Dann: Antwort ist 200 OK
     * - Seite enthält Titel, Beschreibung, Ort, Datum/Uhrzeit, Frist
     * - Anmeldeformular ist *sichtbar*
     */
    test('should display event details and show registration form if deadline is not passed', async () => {
        // Erstelle ein Event mit zukünftiger Anmeldefrist (relativ ZUM TEST-ZEITPUNKT)
        const now = new Date(); // Zeitpunkt des Tests
        const futureDeadline = new Date(now.getTime() + 60 * 60 * 1000); // Deadline in 1 Stunde
        const startDate = new Date(now.getTime() + 2 * 60 * 60 * 1000); // Event-Start in 2 Stunden
        const endDate = new Date(now.getTime() + 3 * 60 * 60 * 1000); // Event-Ende in 3 Stunden

        const event = await Event.create({
            title: 'Zukünftiger Workshop',
            description: 'Ein toller Workshop in der Zukunft',
            location: 'Online',
            date: new Date(startDate.toISOString().split('T')[0]), // Nur das Datum
            startDate: startDate,
            endDate: endDate,
            registrationDeadline: futureDeadline, // Deadline vor Start und in der Zukunft (relativ zum Test-Zeitpunkt)
            providerId: testProviderId
        });
        testEventId = event._id;

        // seite aufrufen
        const response = await request(app)
            .get(`/event/${event._id}`);

        expect(response.status).toBe(200);

        // Sind die richtigen Daten im HTML-Body enthalten?
        expect(response.text).toContain('Zukünftiger Workshop');
        expect(response.text).toContain('Ein toller Workshop in der Zukunft');
        expect(response.text).toContain('Online');

        // Prüfe auf das Datum des Events (startDate Datum, wie in EJS mit toLocaleDateString() formatiert)
        // z.B. Wenn startDate '2025-12-17T18:35:36.000Z' ist, wird toLocaleDateString() in der deutschen Lokale wahrscheinlich '17.12.2025' ergeben
        // oder '12/17/2025' je nach System. Am sichersten ist es, auf Teile zu prüfen oder auf das Format, das du in EJS erzeugst.
        // Du könntest z.B. auf das Jahr prüfen, wenn es eindeutig ist:
        const expectedDatePart = startDate.getFullYear().toString();
        expect(response.text).toContain(expectedDatePart);

        // ODER: Prüfe auf das Datum im Format, wie es von toLocaleDateString() erzeugt wird (abhängig von der lokalen Systemzeitzone/locale)
        // const expectedFormattedDate = new Date(startDate.toISOString().split('T')[0]).toLocaleDateString('de-DE'); // z.B. '17.12.2025'
        // const expectedFormattedDateFallback = new Date(startDate.toISOString().split('T')[0]).toLocaleDateString(); // System-Standard
        // expect(response.text).toContain(expectedFormattedDate) || expect(response.text).toContain(expectedFormattedDateFallback);

        // Prüfe, ob das Anmeldeformular *sichtbar* ist (Frist ist noch nicht abgelaufen)
        expect(response.text).toContain(`<form method="POST" action="/event/${event._id}/register"`);
        // Prüfe, dass der "abgelaufen"-Text *nicht* sichtbar ist
        expect(response.text).not.toContain('Anmeldefrist abgelaufen.');
    });

    /**
     * @test {GET /event/:id} - Zeigt Termin-Details an, aber *kein* Anmeldeformular, wenn Frist abgelaufen ist
     *
     * Gegeben: Ein Event existiert in der DB, mit *vergangener* Anmeldefrist
     * Wenn: GET /event/:id aufgerufen wird
     * Dann: Antwort ist 200 OK
     * - Seite enthält Titel, Beschreibung, Ort, Datum/Uhrzeit, Frist
     * - Anmeldeformular ist *nicht sichtbar*, da Frist abgelaufen ist
     */
    test('should display event details but NOT show registration form if deadline is passed', async () => {
        // Erstelle ein Event mit vergangener Anmeldefrist
        // Stelle sicher, dass die Deadline *vor* dem startDate liegt und bereits abgelaufen ist
        const startDate = new Date(); // Jetzt (z.B. 2025-12-18)
        startDate.setDate(startDate.getDate() + 1); // Termin morgen (z.B. 2025-12-19)
        const pastDeadline = new Date(startDate); // Kopiere das startDate
        pastDeadline.setDate(pastDeadline.getDate() - 2); // Deadline vor *morgen*, also *gestern* (z.B. 2025-12-17)

        const event = await Event.create({
            title: 'Vergangener Workshop',
            description: 'Ein Workshop, für den man sich nicht mehr anmelden kann',
            location: 'Offline',
            date: new Date(startDate.toISOString().split('T')[0]), // Datum ohne Zeit (z.B. 2025-12-19)
            startDate: startDate,
            endDate: new Date(startDate.getTime() + 2 * 60 * 60 * 1000), // 2 Stunden später
            registrationDeadline: pastDeadline, // Jetzt: Deadline *vor* Start und bereits abgelaufen
            providerId: testProviderId
        });
        testEventIdExpired = event._id;

        // Seite aufrufen
        const response = await request(app)
            .get(`/event/${event._id}`);

        expect(response.status).toBe(200);

        // Prüfen, ob die richtigen Daten im HTML-Body enthalten sind
        expect(response.text).toContain('Vergangener Workshop');
        expect(response.text).toContain('Ein Workshop, für den man sich nicht mehr anmelden kann');
        expect(response.text).toContain('Offline');

        // Prüfe auf das Datum des Events (startDate Datum, wie in EJS mit toLocaleDateString() formatiert)
        // z.B. '12/18/2025' oder '18.12.2025' je nach System
        const expectedDatePart = startDate.getFullYear().toString();
        expect(response.text).toContain(expectedDatePart);

        // Prüfe, ob das Anmeldeformular *nicht* sichtbar ist (Frist ist abgelaufen)
        expect(response.text).not.toContain(`<form method="POST" action="/event/${event._id}/register"`);
        // Prüfe auf die Meldung, die "Anmeldefrist abgelaufen" enthält
        expect(response.text).toContain('Anmeldefrist abgelaufen');
    });


    /**
     * @test {GET /event/:id} - Fehler, wenn Event nicht existiert
     *
     * Gegeben: Eine nicht existierende Event-ID
     * Wenn: GET /event/:id aufgerufen wird
     * Dann: Antwort ist 404 Not Found
     */
    test('should return 404 if event does not exist', async () => {
        const fakeEventId = new mongoose.Types.ObjectId();

        const response = await request(app)
            .get(`/event/${fakeEventId}`);

        expect(response.status).toBe(404);
        expect(response.text).toContain('Event nicht gefunden');
    });
});