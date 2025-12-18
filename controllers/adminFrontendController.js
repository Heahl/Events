// ./controllers/adminFrontendController.js
import Event from '../models/Event.js'; // Importiere dein Event-Model
import User from '../models/User.js'; // Importiere dein User-Model, falls nötig (z.B. für Berechtigungsprüfungen)

/**
 * @function dashboard
 * @description Controller-Funktion für GET /admin/dashboard
 * Zeigt eine Übersicht der eigenen Events an.
 */
export const dashboard = async (req, res) => {
    try {
        const userId = req.session.userId;

        // DEBUG: Logge die gefundenen Events
        console.log("DEBUG: Dashboard - gesuchte userId:", userId);
        const events = await Event.find({providerId: userId});
        console.log("DEBUG: Dashboard - gefundene Events:", JSON.stringify(events, null, 2)); // Stringify, um Objekte zu sehen

        res.render('admin-dashboard', {events});

    } catch (err) {
        console.error(err);
        res.status(500).render('error', {message: 'Fehler beim Laden des Dashboards'});
    }
};

/**
 * @function createEventForm
 * @description Controller-Funktion für GET /admin/event/create
 * Zeigt das Formular zum Erstellen eines neuen Events an.
 */
export const createEventForm = (req, res) => {
    // Stelle sicher, dass der Nutzer eingeloggt ist (wird durch authMiddleware sichergestellt)

    // Rendere das Event-Erstellungsformular
    res.render('create-event-form');
};

/**
 * @function getParticipants
 * @description Controller-Funktion für GET /admin/event/:id/participants
 * Zeigt die Liste der Teilnehmer für ein bestimmtes Event an.
 * Prüft, ob der eingeloggte Nutzer der Anbieter des Events ist.
 */
export const getParticipants = async (req, res) => {
    try {
        const {id} = req.params;
        const userId = req.session.userId;

        // console.log("DEBUG: getParticipants - gesuchte Event ID:", id); // Optional: Debugging wieder entfernen
        // console.log("DEBUG: getParticipants - eingeloggte userId:", userId); // Optional: Debugging wieder entfernen

        const event = await Event.findById(id);

        // console.log("DEBUG: getParticipants - gefunden Event:", JSON.stringify(event, null, 2)); // Optional: Debugging wieder entfernen

        if (!event) {
            // console.log("DEBUG: getParticipants - Event nicht gefunden"); // Optional: Debugging wieder entfernen
            // Verwende eine einfache JSON-Antwort oder eine spezielle View, anstatt error.ejs
            // return res.status(404).render('error', { message: 'Event nicht gefunden' });
            return res.status(404).json({error: 'Event nicht gefunden'});
            // ODER: res.status(404).send('Event nicht gefunden');
        }

        // console.log("DEBUG: getParticipants - Event providerId:", event.providerId.toString()); // Optional: Debugging wieder entfernen
        // console.log("DEBUG: getParticipants - Vergleiche mit userId:", userId.toString()); // Optional: Debugging wieder entfernen

        if (event.providerId.toString() !== userId.toString()) {
            // console.log("DEBUG: getParticipants - Anbieter stimmt nicht überein"); // Optional: Debugging wieder entfernen
            // Hier den Fehlerfall anpassen, um render('error') zu vermeiden
            // return res.status(404).render('error', { message: 'Kein Zugriff auf Teilnehmerliste dieses Events' });
            return res.status(404).json({error: 'Kein Zugriff auf Teilnehmerliste dieses Events'});
            // ODER: res.status(404).send('Kein Zugriff auf Teilnehmerliste dieses Events');
        }

        // console.log("DEBUG: getParticipants - Rendere event-participants.ejs"); // Optional: Debugging wieder entfernen
        res.render('event-participants', {event});

    } catch (err) {
        console.error("ERROR in getParticipants:", err);
        console.error(err.stack);
        // Auch hier, um Probleme mit render('error') zu vermeiden
        // res.status(500).render('error', { message: 'Fehler beim Laden der Teilnehmerliste' });
        res.status(500).json({error: 'Interner Serverfehler'});
    }
};