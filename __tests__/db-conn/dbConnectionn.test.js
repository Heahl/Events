import {describe, test, expect, beforeAll, afterAll} from 'bun:test';
import connectDB from '../../config/database.js';
import mongoose from 'mongoose';

// Testmodell definieren
const TestModel = mongoose.model('TestConnection', new mongoose.Schema({
    testId: String,
    timestamp: {type: Date, default: Date.now}
}));

describe('MongoDB Verbindung (Integrationstest gegen Atlas)', () => {
    beforeAll(async () => {
        // bestehende Verbindung trennen
        if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
        // DB verbinden
        await connectDB();
    });

    afterAll(async () => {
        // aufräumen
        await TestModel.deleteMany({testId: 'db-connection-test'});
        await mongoose.disconnect();
    });

    test('sollte erfolgreich mit MongoDB verbinden und Dokument speichern/können', async () => {
        const doc = await TestModel.create({
            testId: 'db-connection-test'
        });

        expect(doc._id).toBeDefined();
        expect(doc.testId).toBe('db-connection-test');

        const found = await TestModel.findOne({testId: 'db-connection-test'});
        expect(found).not.toBeNull();
        // Daten auch korrekt?
        expect(found._id.toString()).toBe(doc._id.toString());
    });
});