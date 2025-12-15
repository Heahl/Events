import {describe, test, expect, beforeAll, afterAll, afterEach} from 'bun:test';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../../app.js';
import User from '../../models/User.js';
import Event from '../../models/Event.js';

/**
 * @test Admin Frontend Routes - Server-seitig gerenderte Seiten für Anbieter:innen
 *
 * Szenario: Authentifizierte Anbieter:innen greifen auf verschiedene Admin-Seiten zu
 * Nicht authentifizierte Nutzer:innen sollen zur Login-Seite weitergeleitet werden.
 *
 * Akzeptanzkriterien:
 * - Nur authentifizierte Nutzer:innen können die Admin-Seiten aufrufen
 * - Bei fehlender Authentifizierung: Redirect zu /login
 * - Bei gültiger Authentifizierung: Die jeweilige Seite wird mit korrekten Daten gerendert
 */
describe('Admin Frontend Routes - /admin/*', () => {
    let testProviderId;
    let testEventId;
    let testUserEmail = 'testuser@testseite.de';
    let testUserPassword = 'SicheresPasswort!';

    // Geht davon aus, dass der User bereits existiert
    const loginAndGetSessionCookie = async (email = testUserEmail, password = testUserPassword) => {
        // Nur Anmeldung, da User im beforeAll erstellt wird
        const loginResponse = await request(app)
            .post('/login')
            .send({
                email,
                password
            });

        // Prüfe explizit den Login-Status
        expect(loginResponse.status).toBe(200);

        const cookie = loginResponse.headers['set-cookie'];
        expect(cookie).toBeDefined();
        return cookie;
    };

    beforeAll(async () => {
        // Stelle sicher, dass die Datenbankverbindung steht
        if (mongoose.connection.readyState !== 1) {
            await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/test');
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        // Erstelle einen Test-User
        // Hashen erfolgt im User-Model, daher Klartext-Passwort speichern
        const user = await User.create({
            email: testUserEmail,
            password: testUserPassword
        });
        testProviderId = user._id;
    });

    afterAll(async () => {
        // User aufräumen
        await User.deleteMany({});
        await Event.deleteMany({});
    });

    afterEach(async () => {
        // Event aufräumen
        await Event.deleteMany({});
    });

    /**
     * @test {GET /admin/dashboard} - Nur authentifizierte Nutzer dürfen Dashboard sehen
     */
    describe('GET /admin/dashboard', () => {
        test('should redirect to /login if user is not authenticated', async () => {
            const response = await request(app)
                .get('/admin/dashboard');

            expect(response.status).toBe(302);
            expect(response.headers.location).toBe('/login');
        });

        test('should render dashboard with list of own events if user is authenticated', async () => {
            // Erstelle ein Event für den eingeloggten Nutzer
            const event = await Event.create({
                title: 'Mein Workshop',
                description: 'Beschreibung',
                location: 'Online',
                date: new Date('2025-03-20'),
                startDate: new Date('2025-03-20T10:00:00Z'),
                endDate: new Date('2025-03-20T12:00:00Z'),
                registrationDeadline: new Date('2025-03-15T23:59:59Z'),
                providerId: testProviderId,
                participants: [
                    {firstName: 'Max', lastName: 'Mustermann', email: 'max@example.com'},
                    {firstName: 'Erika', lastName: 'Musterfrau', email: 'erika@example.com'}
                ]
            });
            testEventId = event._id;

            // Hole das Dashboard mit gültiger Session
            const sessionCookie = await loginAndGetSessionCookie();

            const response = await request(app)
                .get('/admin/dashboard')
                .set('Cookie', sessionCookie);

            expect(response.status).toBe(200);

            // Prüfe, ob die Seite korrekt gerendert wurde
            expect(response.text).toContain('Mein Workshop');
            expect(response.text).toContain('Donnerstag, 20. März 2025');
            // Annahme: Template zeigt die Anzahl der Anmeldungen an
            expect(response.text).toContain('2 Angemeldete Teilnehmer');
            // Prüfe auf Button/Link zur Anmeldeliste
            expect(response.text).toContain(`/admin/event/${event._id}/participants`);
        });
    });

    /**
     * @test {GET /admin/event/create} - Nur authentifizierte Nutzer dürfen Formular sehen
     */
    describe('GET /admin/event/create', () => {
        test('should redirect to /login if user is not authenticated', async () => {
            const response = await request(app)
                .get('/admin/event/create');

            expect(response.status).toBe(302);
            expect(response.headers.location).toBe('/login');
        });

        test('should render the event creation form if user is authenticated', async () => {
            const sessionCookie = await loginAndGetSessionCookie();

            const response = await request(app)
                .get('/admin/event/create')
                .set('Cookie', sessionCookie);

            expect(response.status).toBe(200);

            // Prüfe, ob das Formular gerendert wurde
            expect(response.text).toContain('<form');
            expect(response.text).toContain('id="eventForm');
            expect(response.text).toContain('javascripts/eventForm.js');
        });
    });

    /**
     * @test {GET /admin/event/:id/participants} - Nur authentifizierte Nutzer dürfen Anmeldeliste sehen
     */
    describe('GET /admin/event/:id/participants', () => {
        test('should redirect to /login if user is not authenticated', async () => {
            const fakeEventId = new mongoose.Types.ObjectId();

            const response = await request(app)
                .get(`/admin/event/${fakeEventId}/participants`);

            expect(response.status).toBe(302);
            expect(response.headers.location).toBe('/login');
        });

        test('should render list of participants for an event created by the authenticated user', async () => {
            // --- Event innerhalb des Tests erstellen ---
            const event = await Event.create({
                title: 'Testevent für Teilnehmerliste',
                description: 'Beschreibung',
                location: 'Online',
                date: new Date('2025-03-20'),
                startDate: new Date('2025-03-20T10:00:00Z'),
                endDate: new Date('2025-03-20T12:00:00Z'),
                registrationDeadline: new Date('2025-03-15T23:59:59Z'),
                providerId: testProviderId, // Nutze den ProviderId des eingeloggten Users
                participants: [
                    {firstName: 'Max', lastName: 'Mustermann', email: 'max@example.com'},
                    {firstName: 'Erika', lastName: 'Musterfrau', email: 'erika@example.com'}
                ]
            });
            // testEventId wird hier nicht mehr benötigt, sondern die ID des lokal erstellten Events
            const eventIdForThisTest = event._id;

            const sessionCookie = await loginAndGetSessionCookie();

            const response = await request(app)
                .get(`/admin/event/${eventIdForThisTest}/participants`)
                .set('Cookie', sessionCookie);

            expect(response.status).toBe(200);

            // Prüfe, ob die Anmeldelisten-Seite korrekt gerendert wurde
            expect(response.text).toContain('Max');
            expect(response.text).toContain('Mustermann');
            expect(response.text).toContain('erika@example.com');
            // Prüfe auf eine Tabelle oder Liste
            expect(response.text).toContain('<table');
        });

        test('should return 404 if user tries to access participants of an event from a different provider', async () => {
            // Erstelle ein Event für einen anderen Anbieter
            const otherUser = await User.create({
                email: 'other@example.com',
                password: 'SicheresPasswort!'
            });
            const otherEvent = await Event.create({
                title: 'Fremdes Event',
                description: 'Beschreibung',
                location: 'Offline',
                date: new Date('2024-03-20'),
                startDate: new Date('2024-03-20T10:00:00Z'),
                endDate: new Date('2024-03-20T12:00:00Z'),
                registrationDeadline: new Date('2024-03-15T23:59:59Z'),
                providerId: otherUser._id,
                participants: []
            });

            const sessionCookie = await loginAndGetSessionCookie();

            // Versuche, die Anmeldeliste des fremden Events aufzurufen
            const response = await request(app)
                .get(`/admin/event/${otherEvent._id}/participants`)
                .set('Cookie', sessionCookie);

            // Passe die Erwartung an: Status 404 && JSON-Body mit Fehlermeldung
            expect(response.status).toBe(404);
            expect(response.body.error).toBe('Kein Zugriff auf Teilnehmerliste dieses Events');

            // Lösche den temporären anderen User
            await User.deleteOne({_id: otherUser._id});

        });
    });

    /**
     * @test {GET /login} - Login-Seite ist öffentlich zugänglich
     */
    describe('GET /login', () => {
        test('should render the login page without authentication', async () => {
            const response = await request(app)
                .get('/login');

            expect(response.status).toBe(200);

            // Prüfe, ob das Login-Formular gerendert wurde
            expect(response.text).toContain('<form');
            expect(response.text).toContain('id="loginForm"');
        });
    });
});