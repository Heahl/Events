import {describe, test, expect, beforeAll, afterAll, afterEach} from 'bun:test';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../../app.js';
import User from '../../models/User.js';
import Event from '../../models/Event.js';

/**
 * @test Admin Event Routes - Alle geschützten Routen unter /api/events/*
 *
 * Szenario: Authentifizierte Anbieter greifen auf verschiedene Admin-Funktionen zu
 * Nicht authentifizierte Nutzer sollen abgewiesen werden.
 *
 * Akzeptanzkriterien:
 * - Nur authentifizierte Nutzer können die Routen unter /api/events/* aufrufen
 * - Bei fehlender Authentifizierung: Antwort ist 401 Unauthorized
 * - Bei gültiger Authentifizierung: Die jeweilige Funktion (Erstellen, Übersicht, Anmeldeliste) wird ausgeführt
 * - Terminübersicht: Gibt nur Termine des eingeloggten Anbieters zurück
 * - Anmeldeliste: Gibt nur Anmeldungen für ein Event des eingeloggten Anbieters zurück
 */
describe('Admin Event Routes - /api/events/*', () => {
    let testProviderId;
    let testProviderId2;
    let testEventId;
    let testEventIdFromOtherProvider;
    let testUserEmail = 'testuser@example.com';
    let testUserPassword = 'SicheresPasswort!'; // <- An das neue PW_REGEX angepasst (keine Zahl)
    let testUser2Email = 'testuser2@example.com';
    let testUser2Password = 'SicheresPasswort!'; // <- An das neue PW_REGEX angepasst (keine Zahl)

    // Login durchführen und Session-Cookie zurückgeben
    const loginAndGetSessionCookie = async (email, password) => {
        // Nur Anmeldung, da Benutzer bereits im beforeAll erstellt wurden
        const loginResponse = await request(app)
            .post('/login')
            .send({
                email,
                password
            });

        // Prüfe explizit den Login-Status - sollte 200 sein, nicht 201
        expect(loginResponse.status).toBe(200);

        const cookie = loginResponse.headers['set-cookie'];
        expect(cookie).toBeDefined();
        return cookie;
    };

    beforeAll(async () => {
        console.log("beforeAll: Start");
        if (mongoose.connection.readyState !== 1) {
            console.log("beforeAll: Verbinde mit Datenbank...");
            await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/test');
            console.log("beforeAll: Datenbankverbindung hergestellt.");
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        console.log("beforeAll: Erster Benutzer wird erstellt...");
        const user1 = await User.create({
            email: testUserEmail,
            password: testUserPassword
        });
        testProviderId = user1._id;
        console.log("beforeAll: Erster Benutzer erstellt:", user1._id);

        console.log("beforeAll: Zweiter Benutzer wird erstellt...");
        const user2 = await User.create({
            email: testUser2Email,
            password: testUser2Password
        });
        testProviderId2 = user2._id;
        console.log("beforeAll: Zweiter Benutzer erstellt:", user2._id);
        console.log("beforeAll: Fertig.");
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
     * @test {POST /api/events} - Nur authentifizierte Nutzer dürfen Termine erstellen
     */
    describe('POST /api/events', () => {
        test('should return 401 if user is not authenticated', async () => {
            const newEvent = {
                title: 'Workshop über TDD',
                description: 'Ein Workshop zur Einführung in Test-Driven Development',
                location: 'Online',
                date: new Date('2025-03-20'),
                startDate: new Date('2025-03-20T10:00:00Z'),
                endDate: new Date('2025-03-20T12:00:00Z'),
                registrationDeadline: new Date('2025-03-15T23:59:59Z')
            };

            // WESENTLICHE ÄNDERUNG: Weise das Ergebnis der Variable 'response' zu
            const response = await request(app)
                .post('/api/events')
                .set('Accept', 'application/json')
                .send(newEvent);

            expect(response.status).toBe(401); // <- Jetzt wird der korrekte Response geprüft
        });

        test('should create a new event with valid data and authenticated user', async () => {
            const sessionCookie = await loginAndGetSessionCookie(testUserEmail, testUserPassword);

            const newEvent = {
                title: 'Workshop über TDD',
                description: 'Ein Workshop zur Einführung in Test-Driven Development',
                location: 'Online',
                date: new Date('2025-03-20'),
                startDate: new Date('2025-03-20T10:00:00Z'),
                endDate: new Date('2025-03-20T12:00:00Z'),
                registrationDeadline: new Date('2025-03-15T23:59:59Z')
            };

            const response = await request(app)
                .post('/api/events')
                .set('Cookie', sessionCookie)
                .send(newEvent);

            expect(response.status).toBe(201); // <- Statusprüfung separat
            expect(response.body.id).toBeDefined();
            expect(response.body.title).toBe(newEvent.title);

            // prüfen, ob Event in DB ist und die providerId korrekt gesetzt ist
            const eventInDb = await Event.findOne({title: newEvent.title});
            expect(eventInDb).toBeDefined();
            expect(eventInDb.providerId.toString()).toBe(testProviderId.toString());
            testEventId = eventInDb._id;
        });
    });

    /**
     * @test {GET /api/events} - Terminübersicht: Nur Termine des angemeldeten Anbieters
     */
    describe('GET /api/events', () => {
        test('should return 401 if user is not authenticated', async () => {
            const response = await request(app)
                .get('/api/events')
                .set('Accept', 'application/json');

            expect(response.status).toBe(401);
        });

        test('should return only events created by the authenticated user', async () => {
            // Dieser Test erstellt seine eigenen Events
            // Anmelden als Provider 1
            const sessionCookie1 = await loginAndGetSessionCookie(testUserEmail, testUserPassword);
            // Event für Provider 1 erstellen
            const newEventForProvider1 = {
                title: 'Testtermin 1',
                description: 'Test',
                location: 'Testort',
                date: new Date('2025-04-01'),
                startDate: new Date('2025-04-01T10:00:00Z'),
                endDate: new Date('2025-04-01T12:00:00Z'),
                registrationDeadline: new Date('2025-03-20T23:59:59Z')
            };

            const createResponse = await request(app)
                .post('/api/events')
                .set('Cookie', sessionCookie1)
                .send(newEventForProvider1);

            expect(createResponse.status).toBe(201);
            const createdEventId = createResponse.body.id; // oder createResponse.body._id, je nachdem was dein Controller zurückgibt

            // Anmelden als Provider 2
            const sessionCookie2 = await loginAndGetSessionCookie(testUser2Email, testUser2Password);
            // Event für Provider 2 erstellen
            const newEventForProvider2 = {
                title: 'Testtermin 2 (anderer Anbieter)',
                description: 'Test',
                location: 'Testort2',
                date: new Date('2025-04-02'),
                startDate: new Date('2025-04-02T10:00:00Z'),
                endDate: new Date('2025-04-02T12:00:00Z'),
                registrationDeadline: new Date('2025-03-21T23:59:59Z')
            };

            const createResponse2 = await request(app)
                .post('/api/events')
                .set('Cookie', sessionCookie2)
                .send(newEventForProvider2);

            expect(createResponse2.status).toBe(201);

            const response = await request(app)
                .get('/api/events')
                .set('Cookie', sessionCookie1);

            expect(response.status).toBe(200);

            // Wird eine Liste zurückgegeben?
            expect(Array.isArray(response.body)).toBe(true);

            // Ist nur eigenes Event enthalten?
            expect(response.body).toHaveLength(1);
            expect(response.body[0]._id).toBe(createdEventId); // oder response.body[0].id
            expect(response.body[0].title).toBe('Testtermin 1');

            // Sind keine Events anderer Anbieter enthalten? (Ist implizit durch .toHaveLength(1), aber zur Sicherheit)
            const foundOtherEvent = response.body.find(e => e._id === createResponse2.body.id); // oder e.id
            expect(foundOtherEvent).toBeUndefined();
        });
    });

    /**
     * @test {GET /api/events/:id/participants} - Anmeldeliste: Nur für zugehörigen Anbieter
     */
    describe('GET /api/events/:id/participants', () => {
        test('should return 401 if user is not authenticated', async () => {
            const fakeEventId = new mongoose.Types.ObjectId();

            const response = await request(app)
                .get(`/api/events/${fakeEventId}/participants`)
                .set('Accept', 'application/json');

            expect(response.status).toBe(401);
        });

        test('should return list of participants for an event created by the authenticated user', async () => {
            // Anmelden als Provider 1
            const sessionCookie = await loginAndGetSessionCookie(testUserEmail, testUserPassword);

            // Event für Provider 1 erstellen
            const newEvent = {
                title: 'Testtermin mit Teilnehmern',
                description: 'Test',
                location: 'Testort',
                date: new Date('2025-04-03'),
                startDate: new Date('2025-04-03T10:00:00Z'),
                endDate: new Date('2025-04-03T12:00:00Z'),
                registrationDeadline: new Date('2025-03-22T23:59:59Z')
            };

            const createResponse = await request(app)
                .post('/api/events')
                .set('Cookie', sessionCookie)
                .send(newEvent);

            expect(createResponse.status).toBe(201);
            const eventId = createResponse.body.id; // oder createResponse.body._id

            // Teilnehmer hinzufügen - NICHT über direkten DB-Zugriff, sondern idealerweise über eine Registrierungsroute
            // Da der Test aber nur prüfen will, ob *nach* dem Hinzufügen die Liste korrekt ist,
            // können wir es direkt in der DB tun, ABER VORSICHT: Stelle sicher, dass das Event existiert und die ID stimmt.
            // In diesem Fall, da wir es gerade erstellt haben, sollte es funktionieren.
            // BESSER: Nutze eine spezielle API-Route, um Teilnehmer hinzuzufügen, falls vorhanden.
            // Da es keine gibt, machen wir es direkt in der DB, aber innerhalb des Tests:
            await Event.findByIdAndUpdate(
                eventId, // <-- Verwende die ID des gerade erstellten Events
                {
                    $push: {
                        participants: {
                            firstName: 'Max',
                            lastName: 'Mustermann',
                            email: 'max@example.com'
                        }
                    }
                }
            );

            // Jetzt die Teilnehmerliste abrufen
            const response = await request(app)
                .get(`/api/events/${eventId}/participants`) // <-- Verwende die ID des gerade erstellten Events
                .set('Cookie', sessionCookie);

            expect(response.status).toBe(200);

            // Wird eine Liste zurückgegeben?
            expect(Array.isArray(response.body)).toBe(true);
            // ist der hinzugefügte Teilnehmer in der Liste?
            expect(response.body).toHaveLength(1);
            expect(response.body[0].firstName).toBe('Max');
            expect(response.body[0].lastName).toBe('Mustermann');
            expect(response.body[0].email).toBe('max@example.com');
        });

        test('should return 404 if user tries to access participants of an event from a different provider', async () => {
            // Anmelden als Provider 1
            const sessionCookieOfFirstUser = await loginAndGetSessionCookie(testUserEmail, testUserPassword);

            // Event für Provider 2 erstellen (durch Anmeldung als Provider 2)
            const sessionCookieOfSecondUser = await loginAndGetSessionCookie(testUser2Email, testUser2Password);
            const newEventForSecondProvider = {
                title: 'Testtermin 2 (anderer Anbieter für Teilnehmer)',
                description: 'Test',
                location: 'Testort2',
                date: new Date('2025-04-04'),
                startDate: new Date('2025-04-04T10:00:00Z'),
                endDate: new Date('2025-04-04T12:00:00Z'),
                registrationDeadline: new Date('2025-03-23T23:59:59Z')
            };

            const createResponse2 = await request(app)
                .post('/api/events')
                .set('Cookie', sessionCookieOfSecondUser) // <-- Anbieter2 erstellt
                .send(newEventForSecondProvider);

            expect(createResponse2.status).toBe(201);
            const eventIdFromOtherProvider = createResponse2.body.id; // oder createResponse2.body._id

            // Versuche, die Anmeldeliste des Events des Anbieters2 als Anbieter1 abzurufen
            const response = await request(app)
                .get(`/api/events/${eventIdFromOtherProvider}/participants`) // <-- ID des Events von Anbieter2
                .set('Cookie', sessionCookieOfFirstUser); // <-- Anbieter1 versucht Zugriff

            expect(response.status).toBe(404); // <-- Sollte 404 sein, da Anbieter1 nicht der Besitzer ist
        });
    });
});