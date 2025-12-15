// __tests__/user.bun.test.js
import {describe, test, expect, beforeAll, afterAll, beforeEach} from 'bun:test';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import User from '../../models/User.js';

/**
 * @test User Model
 *
 * Szenario: Anbieter registriert sich
 *
 * Akzeptanzkriterien:
 * - Ein User hat:
 *      - E-Mail (mandatory, unique)
 *      - Passwort (mandatory)
 * - Mail: Format ist gültig ([User]@[Domain].[TLD])
 * - Das Passwort wird vor dem Speichern gehasht
 */
describe('User Model', () => {
    beforeAll(async () => {
        // Stelle Verbindung her
        if (mongoose.connection.readyState !== 0) {
            await mongoose.disconnect();
        }

        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/test');
        await new Promise(resolve => setTimeout(resolve, 1000)); // Warte auf stabile Verbindung
    });

    afterAll(async () => {
        // Aufräumen
        await User.deleteMany({});
        await mongoose.disconnect();
    });

    beforeEach(async () => {
        // Bereinige vor jedem Test
        await User.deleteMany({});
    });

    test('should save email and hashed password', async () => {
        const userData = {
            email: 'user@domain.de',
            password: 'geheimesPasswort123!'
        };

        const user = new User(userData);
        const savedUser = await user.save();

        expect(savedUser.email).toBe(userData.email);
        expect(savedUser.password).not.toBe(userData.password);

        const isPasswordValid = await bcrypt.compare(userData.password, savedUser.password);
        expect(isPasswordValid).toBe(true);
    });

    test('should enforce unique email', async () => {
        const email = 'user@domain.de';
        const password = '1234sSS769786!';

        await User.create({email, password});

        // Für Promises, die fehlschlagen sollen, verwende rejects
        await expect(User.create({email, password})).rejects.toThrow();
    });

    test('email and pw should be mandatory', async () => {
        const userWithoutEmail = new User({password: 'stenrsS!nres5'});
        const userWithoutPassword = new User({email: 'user@domain.de'});

        await expect(userWithoutEmail.save()).rejects.toThrow();
        await expect(userWithoutPassword.save()).rejects.toThrow();
    });

    test('should enforce unique email and throw E11000 error', async () => {
        const email = 'user@domain.de';

        await User.create({email, password: 'rstenstinSSrcc56!'});

        try {
            await User.create({email, password: 'rsternuartCcS!'});
            // Wenn wir hier ankommen, sollte der Test fehlschlagen
            expect(true).toBe(false);
        } catch (error) {
            expect(error.message).toMatch(/E11000/);
        }
    });

    test('should validate pw strength (min 12 chars, 1 uppercase, 1 special char)', async () => {
        const weakPasswords = [
            '12345678901',      // 11 Zeichen
            '123456789012',     // 12 Zeichen, aber keine Großbuchstaben/Sonderzeichen
            '12345678901a',     // 12 Zeichen, Kleinbuchstabe, aber keine Groß-/Sonderzeichen
            '12345678901A',     // 12 Zeichen, Großbuchstabe, aber kein Sonderzeichen
        ];

        for (const pwnd of weakPasswords) {
            const user = new User({
                email: 'user@domain.de',
                password: pwnd
            });

            await expect(user.save()).rejects.toThrow();
        }

        // Starkes PW sollte funktionieren
        const strongPW = 'SicheresPasswortMit12Zeichen!A';
        const user = new User({
            email: 'user@domain.de',
            password: strongPW
        });

        const savedUser = await user.save();
        expect(savedUser).toBeDefined();
        expect(savedUser.password).not.toBe(strongPW);
    });
});