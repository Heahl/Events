// __tests__/event.bun.test.js
import {describe, test, expect, beforeAll, afterAll, afterEach} from 'bun:test';
import Event from '../../models/Event.js';
import User from '../../models/User.js';
import mongoose from "mongoose";

/**
 * @test Event Model - Validierung und Business logic
 *
 * Szenario: Anbieter erstellt neuen Termin
 *
 * Akzeptanzkriterien:
 * - Ein Event hat Titel, Beschreibung, Ort (optional)
 * - Ein Event hat ein Datum (Datum des Termins) - zB. 2026-03-20
 * - Ein Event hat Start- und Endzeit als vollständige Zeitstempel (startDate, endDate)
 * - Ein Event hat eine Anmeldefrist (registrationDeadline), die *spätestens* am *Termin-Datum* liegt
 * - Ein Event gehört einer Anbieter:in (providerId ist ObjectId und verweist auf User)
 * - Ein Event hat eine Liste von Teilnehmer:innen (participants)
 * - Die Anmeldefrist ist ein Pflichtfeld
 * - Die Teilnehmer:innen haben Vorname, Nachname, E-Mail (alles Pflichtfelder)
 */
describe('Event Model', () => {
    // Nutzer erstellen, um providerId zu füllen
    let testProviderId;

    beforeAll(async () => {
        // Stelle sicher, dass die Verbindung besteht
        if (mongoose.connection.readyState !== 1) {
            await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/test');
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        const user = await User.create({
            email: 'user@domain.de',
            password: 'SicheresPasswort!'
        });
        testProviderId = user._id;
    });

    afterEach(async () => {
        // Events aufräumen
        await Event.deleteMany({});
    });

    afterAll(async () => {
        // User aufräumen
        await User.deleteMany({});
        // Optional: Verbindung trennen
        // await mongoose.disconnect();
    });

    /**
     * @test {Event Schema} - speichert alle benötigten Felder korrekt
     *
     * Gegeben: Gültige Event-Daten
     * Wenn: Event wird gespeichert
     * Dann: Alle Felder sind korrekt gespeichert
     * - date, startDate, endDate, registrationDeadline enthalten Datum und Uhrzeit
     * - providerId ist korrekt verlinkt
     * - Validierung: startDate < endDate
     * - Validierung: registrationDeadline <= date (gemäß Anforderung)
     */
    test('should save all fields', async () => {
        const eventData = {
            title: 'Workshop über TDD mit Jest',
            description: 'Ein Workshop zur Einführung in Test-Driven-Development',
            location: 'Online - wir sind ja keine Dinosaurier',
            startDate: new Date('2026-03-20T10:00:00Z'),
            endDate: new Date('2026-03-20T20:00:00Z'),
            registrationDeadline: new Date('2026-03-19T09:00:00Z'),
            providerId: testProviderId,
            participants: []
        };

        const event = new Event(eventData);
        const savedEvent = await event.save();

        expect(savedEvent.title).toBe(eventData.title);
        expect(savedEvent.description).toBe(eventData.description);
        expect(savedEvent.location).toBe(eventData.location);
        expect(savedEvent.startDate).toStrictEqual(eventData.startDate);
        expect(savedEvent.endDate).toStrictEqual(eventData.endDate);
        expect(savedEvent.registrationDeadline).toStrictEqual(eventData.registrationDeadline);
        expect(savedEvent.providerId.toString()).toBe(eventData.providerId.toString());
        expect(savedEvent.participants).toHaveLength(0);

        // Prüfe Validierung Start < End
        expect(savedEvent.startDate.getTime()).toBeLessThan(savedEvent.endDate.getTime());
        // Prüfe Validierung Deadline <= date
        expect(savedEvent.registrationDeadline.getTime()).toBeLessThanOrEqual(savedEvent.startDate.getTime());
    });

    /**
     * @test {Event Schema} - Validierung: startDate muss vor EndDate liegen
     *
     * Gegeben: Event-Daten mit startDate nach endDate
     * Wenn: Event wird gespeichert
     * Dann: Wird ein Validierungsfehler geworfen
     */
    test('should reject if startDate > endDate', async () => {
        const eventWithInvalidStartTime = new Event({
            title: 'Workshop über TDD mit Jest',
            description: 'Ein Workshop zur Einführung in Test-Driven-Development',
            location: 'Online - wir sind ja keine Dinosaurier',
            startDate: new Date('2026-03-20T21:00:00Z'), // Später
            endDate: new Date('2026-03-20T20:00:00Z'), // Früher
            registrationDeadline: new Date('2026-03-20T09:00:00Z'),
            providerId: testProviderId,
            participants: []
        });
        await expect(eventWithInvalidStartTime.save()).rejects.toThrow();
    });

    /**
     * @test {Event Schema} - Validierung: registrationDeadline darf *nicht* nach dem Termin-*Datum* liegen
     *
     * Gegeben: Event-Daten mit registrationDeadline *nach* dem Termin-Datum (`date`)
     * Wenn: Event wird gespeichert
     * Dann: Wird ein Validierungsfehler geworfen
     */
    test('should reject if registrationDeadline > startDate', async () => {
        const eventWithInvalidDeadline = new Event({
            title: 'Workshop über TDD mit Jest',
            description: 'Ein Workshop zur Einführung in Test-Driven-Development',
            location: 'Online - wir sind ja keine Dinosaurier',
            startDate: new Date('2026-03-20T10:00:00Z'),
            endDate: new Date('2026-03-20T20:00:00Z'),
            registrationDeadline: new Date('2026-03-20T11:00:00Z'),
            providerId: testProviderId,
            participants: []
        });

        await expect(eventWithInvalidDeadline.save()).rejects.toThrow();
    });

    /**
     * @test {Event Schema} - Validierung: registrationDeadline darf am Termin-Datum liegen
     * Gemäß Anforderung: "spätestens am Termin-Datum".
     */
    test('should allow registrationDeadline exactly at startDate', async () => {
        const startDate = new Date('2026-03-20T10:00:00Z');
        const eventWithSameTimeDeadline = new Event({
            title: 'Workshop über TDD mit Jest',
            description: 'Ein Workshop zur Einführung in Test-Driven Development',
            location: 'Online - wir sind ja keine Dinosaurier',
            startDate: startDate,
            endDate: new Date('2026-03-20T20:00:00Z'), // Nach Start
            registrationDeadline: startDate,
            providerId: testProviderId,
            participants: []
        });

        const savedEvent = await eventWithSameTimeDeadline.save();

        expect(savedEvent).toBeDefined();
        expect(savedEvent.registrationDeadline).toStrictEqual(startDate);
    });

    /**
     * @test {Event Schema} - Teilnehmer haben korrekte Pflichtfelder (Vorname, Nachname, E-Mail)
     *
     * Gegeben: Event mit einem Teilnehmer
     * Wenn: Event wird gespeichert
     * Dann: Der Teilnehmer hat Vorname, Nachname, E-Mail
     */
    test('should validate participant field (firstName, lastName, email)', async () => {
        const eventWithParticipant = new Event({
            title: 'Workshop über TDD mit Jest',
            description: 'Ein Workshop zur Einführung in Test-Driven-Development',
            location: 'Online - wir sind ja keine Dinosaurier',
            startDate: new Date('2026-03-20T10:00:00Z'),
            endDate: new Date('2026-03-20T20:00:00Z'),
            registrationDeadline: new Date('2026-03-20T09:00:00Z'),
            providerId: testProviderId,
            participants: [{
                firstName: 'Max',
                lastName: 'Mustermann',
                email: 'max@mustermann.de'
            }]
        });

        const savedEvent = await eventWithParticipant.save();

        expect(savedEvent.participants).toHaveLength(1);
        expect(savedEvent.participants[0].firstName).toBe(eventWithParticipant.participants[0].firstName);
        expect(savedEvent.participants[0].lastName).toBe(eventWithParticipant.participants[0].lastName);
        expect(savedEvent.participants[0].email).toBe(eventWithParticipant.participants[0].email);
    });

    /**
     * @test {Event Schema} - Teilnehmer E-Mail ist Pflicht
     *
     * Gegeben: Event mit einem Teilnehmer ohne E-Mail
     * Wenn: Event wird gespeichert
     * Dann: Wird ein Validierungsfehler geworfen
     */
    test('should require email for participants', async () => {
        const eventWithInvalidParticipant = new Event({
            title: 'Workshop',
            date: new Date('2026-03-20'),
            startDate: new Date('2026-03-20T10:00:00Z'),
            endDate: new Date('2026-03-20T20:00:00Z'),
            registrationDeadline: new Date('2026-03-15T23:59:59Z'),
            providerId: testProviderId,
            participants: [
                {
                    firstName: 'Max',
                    lastName: 'Mustermann'
                    // Keine E-Mail (sollte fehlschlagen)
                }
            ]
        });

        await expect(eventWithInvalidParticipant.save()).rejects.toThrow();
    });
});