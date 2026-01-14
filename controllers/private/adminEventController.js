import Event from '../../models/Event.js';

/**
 * @openapi
 * components:
 *   schemas:
 *     Event:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Event ID
 *           example: "60d5ec49f4a2b10015b8a3d7"
 *         title:
 *           type: string
 *           description: Event title
 *           example: "Konferenz 2024"
 *         description:
 *           type: string
 *           description: Event description
 *           example: "Jährliche Konferenz"
 *         location:
 *           type: string
 *           description: Event location
 *           example: "Berlin"
 *         startDate:
 *           type: string
 *           format: date-time
 *           description: Event start date
 *           example: "2024-01-15T10:00:00Z"
 *         endDate:
 *           type: string
 *           format: date-time
 *           description: Event end date
 *           example: "2024-01-15T18:00:00Z"
 *         registrationDeadline:
 *           type: string
 *           format: date-time
 *           description: Registration deadline
 *           example: "2024-01-10T23:59:59Z"
 *         participants:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Participant'
 *     Participant:
 *       type: object
 *       properties:
 *         firstName:
 *           type: string
 *           description: First name
 *           example: "Max"
 *         lastName:
 *           type: string
 *           description: Last name
 *           example: "Mustermann"
 *         email:
 *           type: string
 *           format: email
 *           description: Email address
 *           example: "max@example.com"
 *     EventCreation:
 *       type: object
 *       required:
 *         - title
 *         - startDate
 *         - endDate
 *         - registrationDeadline
 *       properties:
 *         title:
 *           type: string
 *           example: "Konferenz 2024"
 *         description:
 *           type: string
 *           example: "Jährliche Konferenz"
 *         location:
 *           type: string
 *           example: "Berlin"
 *         startDate:
 *           type: string
 *           format: date-time
 *           example: "2024-01-15T10:00:00Z"
 *         endDate:
 *           type: string
 *           format: date-time
 *           example: "2024-01-15T18:00:00Z"
 *         registrationDeadline:
 *           type: string
 *           format: date-time
 *           example: "2024-01-10T23:59:59Z"
 *     EventUpdate:
 *       type: object
 *       required:
 *         - title
 *         - startDate
 *         - endDate
 *         - registrationDeadline
 *       properties:
 *         title:
 *           type: string
 *           example: "Konferenz 2024"
 *         description:
 *           type: string
 *           example: "Jährliche Konferenz"
 *         location:
 *           type: string
 *           example: "Berlin"
 *         startDate:
 *           type: string
 *           format: date-time
 *           example: "2024-01-15T10:00:00Z"
 *         endDate:
 *           type: string
 *           format: date-time
 *           example: "2024-01-15T18:00:00Z"
 *         registrationDeadline:
 *           type: string
 *           format: date-time
 *           example: "2024-01-10T23:59:59Z"
 */

/* ---------- POST /admin/event && POST /api/events  ---------- */
export const createEvent = async (req, res) => {
    try {

        const {
            title,
            description,
            location,
            startDate,
            endDate,
            registrationDeadline
        } = req.body;

        if (!title || !startDate || !endDate || !registrationDeadline)
            return res.status(400).json({error: 'Titel, Start-, Endzeit und Anmeldefrist sind Pflicht.'});

        const event = await Event.create({
            title,
            description,
            location,
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            registrationDeadline: new Date(registrationDeadline),
            providerId: req.session.userId,
            participants: []
        });

        const isApiCall = req.headers.accept?.includes('application/json') || req.xhr;

        if (isApiCall) {
            res.status(201).json({id: event._id, title: event.title});
        } else {
            res.redirect('/admin/dashboard');
        }
    } catch (err) {
        const isApiCall = req.headers.accept?.includes('application/json') || req.xhr;

        if (err.name === 'ValidationError') {
            const msg = Object.values(err.errors).map(e => e.message).join(', ');
            if (isApiCall) {
                return res.status(400).json({error: msg});
            } else {
                return res.status(400).render('private/event-form', {isEditing: false, error: msg});
            }
        }
        console.error(err);
        if (isApiCall) {
            res.status(500).json({error: 'Serverfehler'});
        } else {
            res.status(500).render('private/event-form', {
                isEditing: false,
                error: 'Serverfehler'
            });
        }
    }
};

/* ----------  GET /api/events  ---------- */
export const getMyEvents = async (req, res) => {
    try {
        const userId = req.session.userId;

        if (!userId) {
            return res.status(401).json({error: 'Nicht authentifiziert'});
        }

        const events = await Event.find({providerId: userId});

        res.status(200).json(events);
    } catch (err) {
        console.error(err);
        res.status(500).json({error: 'Serverfehler'});
    }
};

/* ----------  GET /api/events/:id/participants  ---------- */
export const getParticipants = async (req, res) => {
    try {
        const event = await Event.findOne({
            _id: req.params.id,
            providerId: req.session.userId
        });

        if (!event) return res.status(404).json({error: 'Event nicht gefunden'});

        res.json(event.participants);
    } catch (err) {
        console.error(err);
        res.status(500).json({error: 'Serverfehler'});
    }
};

/* ----------  GET /admin/event/:id/edit  ---------- */
export const getEditEventForm = async (req, res) => {
    try {
        const {id} = req.params;

        const event = await Event.findById(id);

        if (!event) {
            return res.status(404).render('auth/error', {
                message: 'Event nicht gefunden',
                error: {}
            });
        }

        // Prüfen, ob Benutzer === Besitzer
        if (event.providerId.toString() !== req.session.userId) {
            return res.status(404).render('auth/error', {
                message: 'Event nicht gefunden',
                error: {}
            });
        }

        res.render('private/event-form', {isEditing: true, event: event});
    } catch (e) {
        console.error(e);
        res.status(500).render('auth/error', {
            message: 'Serverfehler',
            error: e
        });
    }
};

/* ----------  PUT /admin/event/:id  ---------- */
export const updateEvent = async (req, res) => {
    try {
        const {id} = req.params;
        const {title, description, location, startDate, endDate, registrationDeadline} = req.body;

        // Validierung
        if (!title || !startDate || !endDate || !registrationDeadline) {
            return res.status(400).json({error: 'Titel, Startdatum, Enddatum und Anmeldefrist sind erforderlich.'});
        }

        const startDateTime = new Date(startDate);
        const endDateTime = new Date(endDate);
        const regDeadline = new Date(registrationDeadline);

        if (startDateTime >= endDateTime) {
            return res.status(400).json({error: 'Startdatum muss vor dem Enddatum liegen.'});
        }

        if (regDeadline >= startDateTime) {
            return res.status(400).json({error: 'Anmeldefrist muss vor Startdatum liegen.'});
        }

        const event = await Event.findById(id);

        if (!event) {
            return res.status(404).json({error: 'Event nicht gefunden.'});
        }

        // Benutzer === Besitzer ?
        if (event.providerId.toString() !== req.session.userId) {
            return res.status(404).json({error: 'Event nicht gefunden.'});
        }

        // updaten
        event.title = title;
        event.description = description;
        event.location = location;
        event.startDate = startDateTime;
        event.endDate = endDateTime;
        event.registrationDeadline = regDeadline;

        await event.save();

        // if api-anfrage?
        const isApiCall = req.headers.accept?.includes('application/json') || req.xhr;

        if (isApiCall) {
            res.status(200).json({message: 'Event erfolgreich aktualisiert', event});
        } else {
            res.redirect('/admin/dashboard');
        }
    } catch (e) {
        console.error(e);
        const isApiCall = req.headers.accept?.includes('application/json') || req.xhr;

        if (isApiCall) {
            res.status(500).json({error: 'Serverfehler'});
        } else {
            res.status(500).render('auth/error', {
                message: 'Serverfehler',
                error: e
            });
        }
    }
};

/* ----------  GET /api/events/:id/participants/csv  ---------- */
export const getParticipantsCsv = async (req, res) => {
    try {
        const {id} = req.params;

        const event = await Event.findOne({
            _id: id,
            providerId: req.session.userId
        });

        if (!event) {
            return res.status(404).json({error: 'Event nicht gefunden'});
        }

        // Generiere CSV-Inhalt
        const participants = event.participants || [];
        let csvContent = 'Vorname,Nachname,E-Mail\n';

        participants.forEach(participant => {
            const firstName = (participant.firstName || '').toString().replace(/"/g, '""');
            const lastName = (participant.lastName || '').toString().replace(/"/g, '""');
            const email = (participant.email || '').toString().replace(/"/g, '""');

            // Füge Anführungszeichen hinzu, wenn Kommas oder Anführungszeichen enthalten sind
            const fields = [
                firstName.includes(',') || firstName.includes('"') ? `"${firstName}"` : firstName,
                lastName.includes(',') || lastName.includes('"') ? `"${lastName}"` : lastName,
                email.includes(',') || email.includes('"') ? `"${email}"` : email
            ];

            csvContent += fields.join(',') + '\n';
        });

        // Setze Header für Datei-Download
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `teilnehmer-${timestamp}.csv`;

        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

        res.send(csvContent);

    } catch (err) {
        console.error(err);
        res.status(500).json({error: 'Serverfehler'});
    }
};
