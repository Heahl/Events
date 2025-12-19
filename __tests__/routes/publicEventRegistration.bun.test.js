import {describe, test, expect, beforeAll, afterAll, afterEach} from 'bun:test';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../../app.js';
import User from '../../models/User.js';
import Event from '../../models/Event.js';

/**
 * @test {POST /event/:id/register} - Interessent:in meldet sich für einen Termin an
 *
 * Szenario: Eine Interessent:in möchte sich für einen Termin anmelden
 *
 * Akzeptanzkriterien:
 * - Die Route ist öffentlich zugänglich (keine Authentifizierung)
 * - Bei gültigen Daten und offener Frist: Antwort ist 201 Created, Teilnehmer ist in der DB
 * - Bei abgelaufener Anmeldefrist: Antwort ist 400 Bad Request
 * - Bei fehlendem Event: Antwort ist 404 Not Found
 * - Bei ungültigen Daten (zB. fehlende E-Mail): Antwort ist 400 Bad Request
 */
describe('Public Event Registration - POST /event/:id/register', () => {
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
        // User und Events aufräumen
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
     * @test {POST /event/:id/register} - Erfolgreiche Anmeldung, wenn Frist offen
     *
     * Gegeben: Ein Event mit zukünftiger Anmeldefrist existiert
     * Und: Gültige Anmeldedaten (Vorname, Nachname, E-Mail)
     * Wenn: POST /event/:id/register aufgerufen wird
     * Dann: Antwort ist 201 Created
     * - Teilnehmer ist in der participants-Liste des Events
     */
    test('should add participant to event if registration deadline is not passed', async () => {
        // Erstelle ein Event mit zukünftiger Anmeldefrist
        // Stelle sicher, dass die Deadline *vor* dem startDate liegt, aber definitiv in der Zukunft
        const now = new Date();
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
            registrationDeadline: futureDeadline, // Deadline vor Start und in der Zukunft
            providerId: testProviderId,
            // mit leerer Liste starten
            participants: []
        });
        testEventId = event._id;

        // anmeldedaten senden
        const registrationData = {
            firstName: 'Max',
            lastName: 'Mustermann',
            email: 'max@mustermann.test'
        };

        const response = await request(app)
            .post(`/event/${event._id}/register`)
            .send(registrationData);

        expect(response.status).toBe(201);

        // Prüfen Antwort
        expect(response.body.message).toBe('Erfolgreich angemeldet!');

        // Prüfen, ob Teilnehmer in DB hinzugefügt wurde
        const updatedEvent = await Event.findById(event._id);
        expect(updatedEvent.participants).toHaveLength(1);
        expect(updatedEvent.participants[0].firstName).toBe('Max');
        expect(updatedEvent.participants[0].lastName).toBe('Mustermann');
        expect(updatedEvent.participants[0].email).toBe('max@mustermann.test');
    });

    /**
     * @test {POST /event/:id/register} - Fehler, wenn Anmeldefrist abgelaufen ist
     *
     * Gegeben: Ein Event mit vergangener Anmeldefrist existiert
     * Und: Gültige Anmeldedaten (Vorname, Nachname, E-Mail)
     * Wenn: POST /event/:id/register aufgerufen wird
     * Dann: Antwort ist 400 Bad Request mit Fehlermeldung
     * - Teilnehmer ist nicht in der participants-Liste
     */
    test('should return 400 if registration deadline has passed', async () => {
        // Event mit vergangener Anmeldefrist erstellen
        // Stelle sicher, dass die Deadline *vor* dem startDate liegt und bereits abgelaufen ist
        const startDate = new Date(); // Jetzt (z.B. 2025-12-18)
        startDate.setDate(startDate.getDate() + 1); // Termin morgen (z.B. 2025-12-19)
        const pastDeadline = new Date(startDate); // Kopiere das startDate
        pastDeadline.setDate(pastDeadline.getDate() - 2); // Deadline vor *morgen*, also *gestern* (z.B. 2025-12-17)

        const event = await Event.create({
            title: 'Vergangener Workshop',
            description: 'Ein Workshop, für den man sich nicht mehr anmelden kann',
            location: 'Offline',
            date: new Date(startDate.toISOString().split('T')[0]), // Datum ohne Zeit
            startDate: startDate,
            endDate: new Date(startDate.getTime() + 2 * 60 * 60 * 1000), // 2 Stunden später
            registrationDeadline: pastDeadline, // Jetzt: Deadline *vor* Start und bereits abgelaufen
            providerId: testProviderId,
            participants: []
        });
        testEventIdExpired = event._id;

        // Sende Anmeldedaten
        const registrationData = {
            firstName: 'Max',
            lastName: 'Mustermann',
            email: 'max@testseite.de'
        };

        const response = await request(app)
            .post(`/event/${event._id}/register`)
            .send(registrationData);

        expect(response.status).toBe(400);

        // Prüfe Antwort
        expect(response.body.error).toBe('Anmeldefrist abgelaufen.');

        // Prüfe, dass Teilnehmer nicht hinzugefügt wurde
        const updatedEvent = await Event.findById(event._id);
        expect(updatedEvent.participants).toHaveLength(0);
    });

    /**
     * @test {POST /event/:id/register} - Fehler, wenn Event nicht existiert
     *
     * Gegeben: Eine nicht existierende Event-ID
     * Und: Gültige Anmeldedaten
     * Wenn: POST /event/:id/register aufgerufen wird
     * Dann: Antwort ist 404 Not Found
     */
    test('should return 404 if event does not exist', async () => {
        const fakeEventId = new mongoose.Types.ObjectId();
        const registrationData = {
            firstName: 'Max',
            lastName: 'Mustermann',
            email: 'max@testseite.de'
        };

        const response = await request(app)
            .post(`/event/${fakeEventId}/register`)
            .send(registrationData);

        expect(response.status).toBe(404);
    });

    /**
     * @test {POST /event/:id/register} - Fehler, wenn Anmeldedaten ungültig sind (zB. fehlende E-Mail)
     *
     * Gegeben: Ein existierendes Event mit offener Frist
     * Und: Ungültige Anmeldedaten (zB. keine E-Mail)
     * Wenn: POST /event/:id/register aufgerufen wird
     * Dann: Antwort ist 400 Bad Request
     * - Teilnehmer ist nicht in der participants-Liste
     */
    test('should return 400 if registration data is invalid (e.g. missing email)', async () => {
        // Erstelle ein Event mit zukünftiger Anmeldefrist
        const startDate = new Date('2025-03-21T10:00:00Z'); // Termin am 21. März 2025
        const futureDeadline = new Date(startDate); // Kopiere das startDate
        futureDeadline.setDate(futureDeadline.getDate() - 1); // Deadline am 20. März 2025

        const event = await Event.create({
            title: 'Zukünftiger Workshop 2',
            description: 'Ein toller Workshop in der Zukunft',
            location: 'Online',
            date: new Date('2025-03-21'),
            startDate: startDate,
            endDate: new Date('2025-03-21T12:00:00Z'),
            registrationDeadline: futureDeadline, // Deadline vor Start
            providerId: testProviderId,
            participants: []
        });

        // Sende ungültige Anmeldedaten (keine E-Mail)
        const registrationData = {
            firstName: 'Max',
            lastName: 'Mustermann'
            // Keine E-Mail
        };

        const response = await request(app)
            .post(`/event/${event._id}/register`)
            .send(registrationData);

        expect(response.status).toBe(400);

        // Prüfe Antwort
        expect(response.body.error).toBeDefined();

        // Prüfe, dass Teilnehmer nicht hinzugefügt wurde
        const updatedEvent = await Event.findById(event._id);
        expect(updatedEvent.participants).toHaveLength(0);
    });
});

