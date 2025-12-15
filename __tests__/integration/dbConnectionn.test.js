import {jest} from '@jest/globals';
import connectDB from '../../config/database.js';
import mongoose from 'mongoose';

jest.setTimeout(10000);

describe('MongoDB Verbindung (Integrationstest gegen Atlas)', () => {
    const TestModel = mongoose.model('TestConnection', new mongoose.Schema({
        testId: String,
        timestamp: {type: Date, default: Date.now}
    }));

    beforeAll(async () => {
        await connectDB();
    });

    afterAll(async () => {
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
    });
});