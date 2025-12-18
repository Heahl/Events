import Event from '../models/Event.js';

/* ----------  POST /api/events  ---------- */
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

        res.status(201).json({id: event._id, title: event.title});
    } catch (err) {
        if (err.name === 'ValidationError') {
            const msg = Object.values(err.errors).map(e => e.message).join(', ');
            return res.status(400).json({error: msg});
        }
        console.error(err);
        res.status(500).json({error: 'Serverfehler'});
    }
};

/* ----------  GET /api/events  ---------- */
export const getMyEvents = async (req, res) => {
    try {
        console.log("GET /api/events - Session userId:", req.session.userId); // DEBUG
        const userId = req.session.userId;

        if (!userId) {
            return res.status(401).json({error: 'Nicht authentifiziert'});
        }

        console.log("GET /api/events - Suchanfrage für providerId:", userId); // DEBUG
        const events = await Event.find({providerId: userId});

        console.log("GET /api/events - Gefundene Events:", events); // DEBUG
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