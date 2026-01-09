import Event from '../../models/Event.js';

/**
 * @openapi
 * components:
 *   schemas:
 *     DashboardData:
 *       type: object
 *       properties:
 *         events:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Event'
 *     EventFormPage:
 *       type: object
 *       properties:
 *         isEditing:
 *           type: boolean
 *           example: false
 *           description: Whether the form is in edit mode
 *         event:
 *           $ref: '#/components/schemas/Event'
 *     ParticipantsPage:
 *       type: object
 *       properties:
 *         event:
 *           $ref: '#/components/schemas/Event'
 */

/**
 * @function dashboard
 * @description Controller-Funktion für GET /admin/dashboard
 * Zeigt eine Übersicht der eigenen Events an.
 */
export const dashboard = async (req, res) => {
    try {
        const userId = req.session.userId;

        const events = await Event.find({providerId: userId});

        res.render('private/admin-dashboard', {events});

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
    res.render('private/event-form', {
        isEditing: false
    });
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

        const event = await Event.findById(id);

        if (!event) {
            return res.status(404).json({error: 'Event nicht gefunden'});
        }

        if (event.providerId.toString() !== userId.toString()) {
            return res.status(404).json({error: 'Kein Zugriff auf Teilnehmerliste dieses Events'});
        }

        res.render('private/event-participants', {event});

    } catch (err) {
        console.error("ERROR in getParticipants:", err);
        console.error(err.stack);
        res.status(500).json({error: 'Interner Serverfehler'});
    }
};
