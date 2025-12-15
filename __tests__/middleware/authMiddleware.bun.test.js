import {describe, test, expect, beforeAll, afterEach} from "bun:test";
import request from "supertest";
import mongoose from "mongoose";
import User from '../../models/User.js';
import app from '../../app.js';

// Hilfsfunktion, um sicherzustellen, dass die Verbindung aktiv ist
const ensureConnection = async () => {
    if (mongoose.connection.readyState !== 1) {
        console.log("Keine aktive Datenbankverbindung, versuche zu verbinden...");
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/test');
        // kurze Pause
        await new Promise(resolve => setTimeout(resolve, 1500));
    }
};

describe('Auth Middleware', () => {
    beforeAll(async () => {
        await ensureConnection();
    });

    afterEach(async () => {
        try {
            // kurz warten
            await new Promise(resolve => setTimeout(resolve, 100));
            await ensureConnection();
            await User.deleteMany({});
            console.log("Datenbank erfolgreich bereinigt.");
        } catch (error) {
            console.error("Fehler beim Bereinigen der Datenbank nach Test:", error.message);
            // Erneuter Versuch nach kurzer Pause
            try {
                await new Promise(resolve => setTimeout(resolve, 500));
                await ensureConnection();
                await User.deleteMany({});
                console.log("Datenbank erfolgreich bereinigt (nach 2. Versuch).");
            } catch (retryError) {
                console.error("Fehler beim Bereinigen der Datenbank (auch nach 2. Versuch):", retryError.message);
            }
        }
    });

    test('should redirect unauthenticated user to /login', async () => {
        // Stelle sicher, dass die Verbindung vor dem Test aktiv ist
        await ensureConnection();
        const response = await request(app)
            .get('/admin/dashboard')
            .expect(302);

        expect(response.headers.location).toBe('/login');
    });

    test('should allow authenticated user to access private routes', async () => {
        await ensureConnection();

        const userData = {
            email: 'user@domain.de',
            password: 'SicheresPasswort!'
        };

        // Nutzer registrieren
        const registerResponse = await request(app)
            .post('/register')
            .send(userData);

        expect(registerResponse.status).toBe(201);

        // Nutzer anmelden und Session-cookie erhalten
        const loginResponse = await request(app)
            .post('/login')
            .send(userData);

        expect(loginResponse.status).toBe(200);

        const cookie = loginResponse.headers['set-cookie'];
        expect(cookie).toBeDefined();

        // Cookie nutzen, um geschützte Route aufzurufen
        const response = await request(app)
            .get('/admin/dashboard')
            .set('Cookie', cookie);

        // Prüfe Status 200 OK
        expect(response.status).toBe(200);

        expect(response.text).toContain('Dashboard');
    });
});