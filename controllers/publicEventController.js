import Event from '../models/Event.js';

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
            res.status(404);
            return res.render('error', {message: 'Event nicht gefunden', error: {}});
        }

        const isRegistrationDeadlinePassed = new Date() > event.registrationDeadline;

        res.render('event-detail', {
            event,
            isRegistrationDeadlinePassed
        });

    } catch (err) {
        console.error(err);
        res.status(500);
        res.render('error', {message: 'Serverfehler', error: err});
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

    } catch (err) {
        console.error(err);
        // Behandle mögliche Datenbankfehler
        res.status(500).json({error: 'Serverfehler'});
    }
};