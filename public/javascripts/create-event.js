document.addEventListener('DOMContentLoaded', function () {
    initEventForm();
});

function initEventForm() {
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

        // Mode & ID auslesen
        const isEditing = form.dataset.isEditing === 'true';
        const eventId = form.dataset.eventId; // "" für Create
        const url = isEditing ? `/admin/event/${eventId}` : '/admin/event';
        const method = isEditing ? 'PUT' : 'POST';

        // Validierung
        const validation = validateEventForm();
        if (!validation.isValid) {
            showValidationErrors(validation.errors);
            return;
        }

        // Nutzereingaben sanitieren
        const formData = new FormData(form);
        const data = Object.fromEntries(formData);
        const sanitizedData = sanitizeEventData(data);

        try {
            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify(sanitizedData)
            });

            const result = await response.json();

            if (response.ok) {
                // Erfolg → weiterleiten zum Dashboard
                window.location.href = '/admin/dashboard';
            } else {
                // serverseitige Fehler anzeigen
                showToast(result.error || 'Fehler beim Speichern des Events');
            }
        } catch (e) {
            console.error('Error in fetch operation:', e);
            showToast('Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.');
        }
    });

    // Datumvalidierung - client-side
    const startDateInput = document.getElementById('startDate');
    const endDateInput = document.getElementById('endDate');
    const registrationDeadlineInput = document.getElementById('registrationDeadline');

    if (startDateInput && endDateInput) {
        startDateInput.addEventListener('change', validateDateRelationships);
        endDateInput.addEventListener('change', validateDateRelationships);
    }
    if (registrationDeadlineInput) {
        registrationDeadlineInput.addEventListener('change', validateDateRelationships);
    }
}

// ---- Form Validation ----
function validateEventForm() {
    const errors = {};
    let isValid = true;

    const title = document.getElementById('title').value.trim();
    if (!title) {
        errors.title = 'Titel ist ein Pflichtfeld';
        isValid = false;
    } else if (title.length > 200) {
        errors.title = 'Titel darf maximal 200 Zeichen haben';
        isValid = false;
    }

    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    const registrationDeadline = document.getElementById('registrationDeadline').value;

    // Startdatum
    if (!startDate) {
        errors.startDate = 'Startzeit ist ein Pflichtfeld';
        isValid = false;
    } else if (isNaN(new Date(startDate).getTime())) {
        errors.startDate = 'Ungültiges Startdatum';
        isValid = false;
    }

    // Enddatum
    if (!endDate) {
        errors.endDate = 'Endzeit ist ein Pflichtfeld';
        isValid = false;
    } else if (isNaN(new Date(endDate).getTime())) {
        errors.endDate = 'Ungültiges Enddatum';
        isValid = false;
    }

    // Anmeldefrist
    if (!registrationDeadline) {
        errors.registrationDeadline = 'Anmeldefrist ist ein Pflichtfeld';
        isValid = false;
    } else if (isNaN(new Date(registrationDeadline).getTime())) {
        errors.registrationDeadline = 'Ungültiges Anmeldedatum';
        isValid = false;
    }

    // Datumsbeziehungen
    if (startDate && endDate) {
        if (new Date(startDate) >= new Date(endDate)) {
            errors.startDate = 'Startzeit muss vor der Endzeit liegen';
            errors.endDate = 'Endzeit muss nach der Startzeit liegen';
            isValid = false;
        }
    }
    if (startDate && registrationDeadline) {
        if (new Date(registrationDeadline) > new Date(startDate)) {
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
        if (new Date(startDate) >= new Date(endDate)) {
            document.getElementById('startDate').setCustomValidity('Startzeit muss vor Endzeit liegen');
            document.getElementById('endDate').setCustomValidity('Endzeit muss nach Startzeit liegen');
        } else {
            document.getElementById('startDate').setCustomValidity('');
            document.getElementById('endDate').setCustomValidity('');
        }
    }

    if (startDate && registrationDeadline) {
        if (new Date(registrationDeadline) > new Date(startDate)) {
            document.getElementById('registrationDeadline').setCustomValidity('Die Anmeldefrist muss spätestens am Beginn des Termins liegen');
        } else {
            document.getElementById('registrationDeadline').setCustomValidity('');
        }
    }
}

// ---- Sanitization ----
function sanitizeEventData(data) {
    return {
        title: sanitizeString(data.title),
        description: sanitizeString(data.description) || '',
        location: sanitizeString(data.location) || '',
        startDate: data.startDate,
        endDate: data.endDate,
        registrationDeadline: data.registrationDeadline
    };
}

function sanitizeString(str) {
    if (typeof str !== 'string') return '';
    try {
        let sanitized = str.trim();
        sanitized = sanitized.replace(/<\s*script[^>]*>[\s\S]*?<\/\s*script\s*>/gi, '');
        sanitized = sanitized.replace(/javascript:/gi, '');
        sanitized = sanitized.replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');
        return sanitized;
    } catch (err) {
        console.error('Sanitization error:', err, 'Input:', str);
        return str.trim();
    }
}

// ---- Show Errors ----
function showValidationErrors(errors) {
    document.querySelectorAll('.error-message').forEach(el => el.textContent = '');
    Object.keys(errors).forEach(fieldName => {
        const errorElement = document.getElementById(fieldName + 'Error');
        if (errorElement) {
            errorElement.textContent = errors[fieldName];
        } else {
            showToast(errors[fieldName]);
        }
    });
}
