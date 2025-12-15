import {describe, test, expect, afterEach, afterAll, beforeAll} from "bun:test";
import request from "supertest";
import mongoose from "mongoose";
import app from '../../app.js';
import User from '../../models/User.js';

let dbConnected = false;

const ensureConnection = async () => {
    if (mongoose.connection.readyState !== 1) {
        console.log("Keine aktive Datenbankverbindung, versuche zu verbinden...");
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/test');
        dbConnected = true;
        console.log("Datenbankverbindung hergestellt.");
    } else {
        console.log("Datenbankverbindung besteht bereits.");
    }
    await new Promise(resolve => setTimeout(resolve, 1000));
};

describe('Auth Routen - Registrierung', () => {
    beforeAll(async () => {
        await ensureConnection();
    });

    // aufräumen
    afterEach(async () => {
        try {
            await ensureConnection();
            await User.deleteMany({});
            console.log("Benutzer erfolgreich gelöscht.");
        } catch (error) {
            console.error("Fehler beim Löschen der Benutzer:", error);
            try {
                await new Promise(resolve => setTimeout(resolve, 500));
                await ensureConnection();
                await User.deleteMany({});
                console.log("Benutzer erfolgreich gelöscht (nach 2. Versuch).");
            } catch (retryError) {
                console.error("Fehler beim Löschen der Benutzer (auch nach 2. Versuch):", retryError);
            }
        }
    });


    /**
     * @test {POST /register} - Erfolgreiche Registrierung
     *
     * Gegeben: Gültige Registrierungsdaten
     * Wenn: POST /register aufgerufen wird
     * Dann: Antwort ist 201 Created
     * - Nutzer ist in der DB mit gehashtem PW
     * - Antwort enthält nur 'message' (kein Passwort/E-Mail)
     */
    test('should register a new provider and return 201', async () => {
        await ensureConnection();

        const newUser = {
            email: 'anbieter@domain.de',
            password: 'SicheresPasswort!'
        };

        const response = await request(app)
            .post('/register')
            .send(newUser);

        console.log("Register Response Status:", response.status);
        console.log("Register Response Body:", response.body);

        expect(response.status).toBe(201);
        expect(response.body.message).toBe('Registrierung erfolgreich.');

        // Prüfe, ob der User in der db ist
        const userInDb = await User.findOne({email: newUser.email});
        expect(userInDb).toBeDefined();
        expect(userInDb.password).not.toBe(newUser.password);
    });

    /**
     * @test {POST /register} - Fehler bei doppelter E-Mail
     *
     * Gegeben: Ein Nutzer mit Email "user@domain.de" existiert
     * Wenn: Ein zweiter Nutzer mit gleicher Email registriert werden soll
     * Dann: Antwort ist 400 Bad Request
     */
    test('should return 400 if duplicate email', async () => {
        await ensureConnection();

        const existingUser = {
            email: 'user@domain.de',
            password: 'SicheresPasswort!'
        };

        // ersten Nutzer anlegen
        const firstRegisterResponse = await request(app)
            .post('/register')
            .send(existingUser);

        console.log("First Register Response Status:", firstRegisterResponse.status);
        console.log("First Register Response Body:", firstRegisterResponse.body);

        expect(firstRegisterResponse.status).toBe(201);

        // zweiter Nutzer mit duplicate mail
        const secondRegisterResponse = await request(app)
            .post('/register')
            .send(existingUser);

        console.log("Second Register Response Status:", secondRegisterResponse.status);
        console.log("Second Register Response Body:", secondRegisterResponse.body);

        expect(secondRegisterResponse.status).toBe(400);
        expect(secondRegisterResponse.body.error).toContain('Registrierung fehlgeschlagen. Bitte überprüfen Sie Ihre Eingaben.');
        // Warum nicht Hinweis, dass mail bereits vergeben? -> Angreifer kann Nutzer enumerieren
    });

    /**
     * @test {POST /register} - Fehler bei ungültigem Passwort
     *
     * Gegeben: Passwort entspricht nicht den Sicherheitsrichtlinien
     * Wenn: POST /register aufgerufen wird
     * Dann: Antwort ist 400 Bad Request mit Fehlermeldung
     */
    test('should return 400 if password bad', async () => {
        await ensureConnection();

        const newUser = {
            email: 'pwbad@domain.de',
            password: 'mist'
        };

        const response = await request(app)
            .post('/register')
            .send(newUser);

        console.log("Bad Password Register Response Status:", response.status);
        console.log("Bad Password Register Response Body:", response.body);

        expect(response.status).toBe(400);
        expect(response.body.error).toContain('Passwort muss mindestens 12 Zeichen lang sein und wenigstens einen Großbuchstaben und Sonderzeichen enthalten.')
    });

    /**
     * @test {POST /register} - Fehler bei fehlenden Pflichtfeldern
     *
     * Gegeben: Keine mail oder pw im body
     * Wenn: POST /register aufgerufen wird
     * Dann: Antwort ist 400 Bad Request
     */
    test('should return 400 if mail / pw missing', async () => {
        await ensureConnection();

        // ohne mail
        const response1 = await request(app)
            .post('/register')
            .send({password: 'SicheresPasswort!'});

        console.log("Missing Email Register Response Status:", response1.status);
        console.log("Missing Email Register Response Body:", response1.body);

        expect(response1.status).toBe(400);

        // ohne pw
        const response2 = await request(app)
            .post('/register')
            .send({email: 'pwmissing@domain.de'});

        console.log("Missing Password Register Response Status:", response2.status);
        console.log("Missing Password Register Response Body:", response2.body);

        expect(response2.status).toBe(400);
    });
});

// Für den Login-Bereich ebenfalls ensureConnection hinzufügen
describe('Auth Routes - Login', () => {
    beforeAll(async () => {
        await ensureConnection();
    });

    // aufräumen
    afterEach(async () => {
        try {
            await ensureConnection();
            await User.deleteMany({});
            console.log("Benutzer erfolgreich gelöscht (Login-Tests).");
        } catch (error) {
            console.error("Fehler beim Löschen der Benutzer (Login-Tests):", error);
            try {
                await new Promise(resolve => setTimeout(resolve, 500));
                await ensureConnection();
                await User.deleteMany({});
                console.log("Benutzer erfolgreich gelöscht (Login-Tests, nach 2. Versuch).");
            } catch (retryError) {
                console.error("Fehler beim Löschen der Benutzer (Login-Tests, auch nach 2. Versuch):", retryError);
            }
        }
    });

    /**
     * @test {POST /login} - Erfolgreiche Anmeldung
     *
     * Gegeben: Ein registrierter Nutzer mit Email und pw
     * Wenn: POST /login mit korrekten Daten aufgerufen wird
     * Dann: Antwort 200 OK
     * - Session ist gesetzt (User ist eingeloggt)
     * - Antwort enthält nur 'message'
     */
    test('should log in a user with correct credentials', async () => {
        await ensureConnection();

        // Gegeben: registrierter Nutzer
        const userData = {
            email: 'corrcred@domain.de',
            password: 'SicheresPasswort!'
        };

        const registerResponse = await request(app)
            .post('/register')
            .send(userData);

        console.log("Pre-test Register Response Status:", registerResponse.status);
        console.log("Pre-test Register Response Body:", registerResponse.body);

        expect(registerResponse.status).toBe(201);

        // Wenn login mit korrekten credentials
        const loginResponse = await request(app)
            .post('/login')
            .send({
                email: userData.email,
                password: userData.password
            });

        console.log("Login Response Status:", loginResponse.status);
        console.log("Login Response Body:", loginResponse.body);
        console.log("Login Response Headers:", loginResponse.headers);

        expect(loginResponse.status).toBe(200);
        expect(loginResponse.body.message).toContain('Erfolgreich angemeldet.');

        // Session cookie muss auch geprüft werden
        const sessionCookie = loginResponse.headers['set-cookie'];
        expect(sessionCookie).toBeDefined();
        expect(sessionCookie[0]).toContain('connect.sid');
    });

    /**
     * @test {POST /login} - Fehler bei falschen Anmeldedaten
     *
     * Gegeben: Ein registrierter Nutzer mit Email und Pw
     * Wenn: POST /login mit falschem PW oder nicht existierender mail
     * Dann: Antwort ist 401 Unauthorized
     */
    test('should return 401 on login with wrong password', async () => {
        await ensureConnection();

        // gegeben: registrierter Nutzer
        const userData = {
            email: 'wrongpw@domain.de',
            password: 'SicheresPasswort !'
        };
        const registerResponse = await request(app)
            .post('/register')
            .send(userData);

        expect(registerResponse.status).toBe(201);

        // Wenn login mit falschem pw
        const loginResponse = await request(app)
            .post('/login')
            .send({email: userData.email, password: 'falsch'});

        console.log("Wrong Password Login Response Status:", loginResponse.status);
        console.log("Wrong Password Login Response Body:", loginResponse.body);

        expect(loginResponse.status).toBe(401);
        // Dann Antwort
        expect(loginResponse.body.error).toBe("Ungültige E-Mail oder Passwort");
    });

    test('should return 401 on login with wrong email', async () => {
        await ensureConnection();

        const loginResponse = await request(app)
            .post('/login')
            .send({
                email: 'nichtVorhanden@bla.de',
                password: 'istAuchEgal'
            });

        console.log("Wrong Email Login Response Status:", loginResponse.status);
        console.log("Wrong Email Login Response Body:", loginResponse.body);

        expect(loginResponse.status).toBe(401);
        expect(loginResponse.body.error).toBe("Ungültige E-Mail oder Passwort");
    });

    /**
     * @test {POST /login} - Fehler bei fehlenden Pflichtfeldern
     *
     * Gegeben: Keine E-Mail oder kein PW im body
     * Wenn: POST /login aufgerufen wird
     * Dann: Antwort ist 400 Bad Request
     */
    test('should return 400 if email or password missing', async () => {
        await ensureConnection();

        // ohne mail
        const response1 = await request(app)
            .post('/login')
            .send({password: 'funktioniertNicht!'});

        console.log("Missing Email Login Response Status:", response1.status);
        console.log("Missing Email Login Response Body:", response1.body);

        expect(response1.status).toBe(400);

        // ohne pw
        const response2 = await request(app)
            .post('/login')
            .send({email: 'pwmissig@domain.de'});

        console.log("Missing Password Login Response Status:", response2.status);
        console.log("Missing Password Login Response Body:", response2.body);

        expect(response2.status).toBe(400);
    });
});