document.addEventListener('DOMContentLoaded', function () {
    createEvent();
});

function createEvent() {

    const form = document.getElementById('eventForm');
    if (!form) {
        console.error('Event form not found in DOM');
        return;
    }


    // Verhindere doppelte Event-Handler
    if (form.dataset.initialized) {
        console.warn('Event handler already initialized, skipping');
        return;
    }

    form.dataset.initialized = 'true';

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Validierung
        const validation = validateEventForm();

        if (!validation.isValid) {
            // Validierungsfehler zeigen
            showValidationErrors(validation.errors);
            return;
        }


        // Nutzereingaben müssen sanitisiert werden
        const formData = new FormData(form);
        const data = Object.fromEntries(formData);

        const sanitizedData = sanitizeEventData(data);

        try {
            const response = await fetch('/admin/event', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify(sanitizedData)
            });


            const result = await response.json();

            if (response.ok) {
                // Erfolg → weiterleiten zum dashboard
                window.location.href = '/admin/dashboard';
            } else {
                // else → serverseitige Fehler anzeigen
                showToast(result.error || 'Fehler beim Erstellen des Events');
            }
        } catch (e) {
            console.error('Error in fetch operation:', e);
            showToast('Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.');
        }
    });


    // Datum validierung - client side
    const startDateInput = document.getElementById('startDate');
    const endDateInput = document.getElementById('endDate');
    const registrationDeadlineInput = document.getElementById('registrationDeadline');

    if (startDateInput && endDateInput) {
        startDateInput.addEventListener('change', validateDateRelationships);
        endDateInput.addEventListener('change', validateDateRelationships);
    } else {
        console.warn('startDate or endDate input not found');
    }

    if (registrationDeadlineInput) {
        registrationDeadlineInput.addEventListener('change', validateDateRelationships);
    } else {
        console.warn('registrationDeadline input not found');
    }

}

function validateEventForm() {
    const errors = {};
    let isValid = true;

    // Titel
    const title = document.getElementById('title').value.trim();
    if (!title) {
        errors.title = 'Titel ist ein Pflichtfeld';
        isValid = false;
    } else if (title.length > 200) {
        errors.title = 'Titel darf maximal 200 Zeichen haben';
        isValid = false;
    }

    // Startdatum
    const startDate = document.getElementById('startDate').value;
    if (!startDate) {
        errors.startDate = 'Startzeit ist ein Pflichtfeld';
        isValid = false;
    } else {
        const startDateTime = new Date(startDate);
        if (isNaN(startDateTime.getTime())) {
            errors.startDate = 'Ungültiges Startdatum';
            isValid = false;
        }
    }

    // Enddatum
    const endDate = document.getElementById('endDate').value;
    if (!endDate) {
        errors.endDate = 'Endzeit ist ein Pflichtfeld';
        isValid = false;
    } else {
        const endDateTime = new Date(endDate);
        if (isNaN(endDateTime.getTime())) {
            errors.endDate = 'Ungültiges Enddatum';
            isValid = false;
        }
    }

    // Anmeldefrist
    const registrationDeadline = document.getElementById('registrationDeadline').value;
    if (!registrationDeadline) {
        errors.registrationDeadline = 'Anmeldefrist ist ein Pflichtfeld';
        isValid = false;
    } else {
        const deadlineDateTime = new Date(registrationDeadline);
        if (isNaN(deadlineDateTime.getTime())) {
            errors.registrationDeadline = 'Ungültiges Anmeldedatum';
            isValid = false;
        }
    }

    // Validierung von Datumsbeziehungen
    if (startDate && endDate) {
        const startDateTime = new Date(startDate);
        const endDateTime = new Date(endDate);
        if (startDateTime >= endDateTime) {
            errors.startDate = 'Startzeit muss vor der Endzeit liegen';
            errors.endDate = 'Endzeit muss nach der Startzeit liegen';
            isValid = false;
        }
    }

    if (startDate && registrationDeadline) {
        const startDateTime = new Date(startDate);
        const deadlineDateTime = new Date(registrationDeadline);
        if (deadlineDateTime > startDateTime) {
            errors.registrationDeadline = 'Die Anmeldefrist muss spätestens am Beginn des Termins liegen';
            isValid = false;
        }
    }

    return {isValid, errors};
}

function validateDateRelationships() {
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    const registrationDeadline = document.getElementById('registrationDeadline').value;

    if (startDate && endDate) {
        const startDateTime = new Date(startDate);
        const endDateTime = new Date(endDate);
        if (startDateTime >= endDateTime) {
            document.getElementById('startDate').setCustomValidity('Startzeit muss vor Endzeit liegen');
            document.getElementById('endDate').setCustomValidity('Endzeit muss nach Startzeit liegen');
        } else {
            document.getElementById('startDate').setCustomValidity('');
            document.getElementById('endDate').setCustomValidity('');
        }
    }

    if (startDate && registrationDeadline) {
        const startDateTime = new Date(startDate);
        const deadlineDateTime = new Date(registrationDeadline);
        if (deadlineDateTime > startDateTime) {
            document.getElementById('registrationDeadline').setCustomValidity('Die Anmeldefrist muss spätestens am Beginn des Termins liegen');
        } else {
            document.getElementById('registrationDeadline').setCustomValidity('');
        }
    }
}

function sanitizeEventData(data) {
    const sanitized = {
        title: sanitizeString(data.title),
        description: sanitizeString(data.description) || '',
        location: sanitizeString(data.location) || '',
        startDate: data.startDate,
        endDate: data.endDate,
        registrationDeadline: data.registrationDeadline
    };
    return sanitized;
}

function sanitizeString(str) {
    if (typeof str !== 'string') {
        return '';
    }

    try {
        let sanitized = str.trim();

        // Entferne script-Tags (sicherere Methode)
        sanitized = sanitized.replace(/<\s*script[^>]*>[\s\S]*?<\/\s*script\s*>/gi, '');

        // Entferne javascript: URLs
        sanitized = sanitized.replace(/javascript:/gi, '');

        // Entferne event handler (on\w+=)
        sanitized = sanitized.replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');

        return sanitized;
    } catch (error) {
        console.error('Sanitization error:', error, 'Input:', str);
        return str.trim(); // Rückfall auf einfache Bereinigung
    }
}

function showValidationErrors(errors) {
    // erst vorherige Fehlermeldungen leeren
    document.querySelectorAll('.error-message').forEach(err => err.textContent = '');

    // Fehler zeigen
    Object.keys(errors).forEach(fieldName => {
        const errorElement = document.getElementById(fieldName + 'Error');
        if (errorElement) {
            errorElement.textContent = errors[fieldName];
        } else {
            // fall kein div, als toast zeigen
            showToast(errors[fieldName]);
        }
    });
}
