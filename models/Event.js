import mongoose from 'mongoose';

const participantSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: [true, 'Vorname der Teilnehmer:in ist erforderlich']
    },
    lastName: {
        type: String,
        required: [true, 'Nachname der Teilnehmer:in ist erforderlich']
    },
    email: {
        type: String,
        required: [true, 'E-Mail der Teilnehmer:in ist erforderlich'],
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,})+$/, 'Ungültiges E-Mail-Format']
    }
}, {_id: false});

const eventSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Titel ist ein Pflichtfeld']
    },
    description: String,
    location: String,
    startDate: {
        type: Date,
        required: [true, 'Startzeit ist ein Pflichtfeld']
    },
    endDate: {
        type: Date,
        required: [true, 'Endzeit ist ein Pflichtfeld']
    },
    registrationDeadline: {
        type: Date,
        required: [true, 'Anmeldefrist ist ein Pflichtfeld'],
        validate: {
            // validierung: registrationDeadline <= startDate
            validator: function (value) {
                return value <= this.startDate;
            },
            message: 'Die Anmeldefrist muss spätestens zum Beginn des Termins liegen.'
        }
    },
    providerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Provider-ID ist erforderlich']
    },
    participants: [participantSchema]
});

// Validierung: startDate < endDate
eventSchema.path('startDate').validate(function (startDate) {
    if (this.endDate && startDate) {
        return startDate < this.endDate;
    }
    return true;
}, 'Startzeit muss vor der Endzeit liegen.');

const Event = mongoose.model('Event', eventSchema);

export default Event;