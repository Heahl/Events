import Event from '../../models/Event.js';

/**
 * @openapi
 * components:
 *   schemas:
 *     PublicEventsPage:
 *       type: object
 *       properties:
 *         openEvents:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Event'
 *         closedEvents:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Event'
 *         pastEvents:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Event'
 *     EventDetailPage:
 *       type: object
 *       properties:
 *         event:
 *           $ref: '#/components/schemas/Event'
 *         isRegistrationDeadlinePassed:
 *           type: boolean
 *           example: false
 *           description: Whether the registration deadline has passed
 *     RegistrationData:
 *       type: object
 *       required:
 *         - firstName
 *         - lastName
 *         - email
 *       properties:
 *         firstName:
 *           type: string
 *           example: "Max"
 *         lastName:
 *           type: string
 *           example: "Mustermann"
 *         email:
 *           type: string
 *           format: email
 *           example: "max@example.com"
 *     RegistrationResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           example: "Erfolgreich angemeldet!"
 *     EventWithParticipants:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: "60d5ec49f4a2b10015b8a3d7"
 *         title:
 *           type: string
 *           example: "Konferenz 2024"
 *         participants:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Participant'
 */

export const getPublicEvents = async (req, res) => {
    try {
        const now = new Date();

        const allEvents = await Event.find({}).sort({startDate: 1});

        // Events in Kategorien filtern
        // vor Anmeldeschluss && vor start
        const openEvents = allEvents.filter(event => {
            const registrationDeadline = new Date(event.registrationDeadline);
            const startDate = new Date(event.startDate);
            return registrationDeadline >= now && startDate >= now;
        });

        // nach Anmeldeschluss && vor start
        const closedEvents = allEvents.filter(event => {
            const registrationDeadline = new Date(event.registrationDeadline);
            const startDate = new Date(event.startDate);
            return registrationDeadline < now && startDate >= now;
        });

        // nach Start
        const pastEvents = allEvents.filter(event => {
            const startDate = new Date(event.startDate);
            return startDate < now;
        });

        res.render('public/events', {
            openEvents,
            closedEvents,
            pastEvents
        });
    } catch (e) {
        console.error(e);
        res.status(500).render('error', {error: 'Serverfehler'});
    }
}

/**
 * @function getEventDetails
 * @description Controller-Funktion für GET /event/:id
 * Ruft die Details eines Events anhand der ID ab und rendert eine Detailseite.
 * Zeigt das Anmeldeformular an, wenn die Frist noch nicht abgelaufen ist.
 */
export const getEventDetails = async (req, res) => {
    try {
        const {id} = req.params;

        const event = await Event.findById(id);

        if (!event) {
            // prüfen, ob api-anfrage
            if (req.headers.accept?.includes('application/json') || req.xhr) {
                return res.status(404).json({error: 'Event nicht gefunden'});
            } else {
                // web-anfragen -> error template rendern
                return res.status(404).render('auth/error', {
                    message: 'Event nicht gefunden',
                    error: {}
                })
            }
        }

        const isRegistrationDeadlinePassed = new Date() > event.registrationDeadline;

        res.render('public/event-detail', {
            event,
            isRegistrationDeadlinePassed
        });

    } catch (e) {
        console.error(e);
        // bei Validierungsfehlern -> 404
        if (e.name === 'CastError') {
            if (req.headers.accept?.includes('application/json') || req.xhr) {
                return res.status(404).json({error: 'Event nicht gefunden'});
            } else {
                return res.status(404).render('auth/error', {
                    message: 'Event nicht gefunden',
                    error: {}
                });
            }
        }

        // rest -> 500
        if (req.headers.accept?.includes('application/json') || req.xhr) {
            res.status(500).json({error: 'Serverfehler'});
        } else {
            res.status(500).render('auth/error', {message: 'Serverfehler', error: e});
        }
    }
};

/**
 * @function registerForEvent
 * @description Controller-Funktion für POST /event/:id/register
 * Fügt einen Teilnehmer zu einem Event hinzu, wenn die Anmeldefrist noch nicht abgelaufen ist.
 */
export const registerForEvent = async (req, res) => {
    try {
        const {id} = req.params;
        const {firstName, lastName, email} = req.body;

        if (!firstName || !lastName || !email) {
            return res.status(400).json({error: 'Vorname, Nachname und E-Mail sind erforderlich.'});
        }

        // Finde das Event anhand der ID
        const event = await Event.findById(id);

        // Wenn das Event nicht existiert, sende 404
        if (!event) {
            return res.status(404).json({error: 'Event nicht gefunden.'});
        }

        // Prüfe, ob die Anmeldefrist abgelaufen ist
        if (new Date() > event.registrationDeadline) {
            return res.status(400).json({error: 'Anmeldefrist abgelaufen.'});
        }

        // Prüfe, ob Teilnehmer bereits angemeldet
        const alreadyRegistered = event.participants.some(participant =>
            participant.email.toLowerCase() === email.toLowerCase()
        );

        if (alreadyRegistered) {
            return res.status(400).json({error: 'Sie sind bereits für das Event angemeldet'});
        }

        // Füge den Teilnehmer zur participants-Liste hinzu
        event.participants.push({
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            email: email.trim().toLowerCase()
        });

        // Speichere das aktualisierte Event
        await event.save();

        // Sende eine Erfolgsmeldung
        res.status(201).json({message: 'Erfolgreich angemeldet!'});

    } catch (e) {
        console.error(e);
        res.status(500).json('auth/error', {error: 'Serverfehler'});
    }
};