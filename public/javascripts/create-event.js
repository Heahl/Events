"use strict";
// todo: use strict entfernen

console.log('create-event.js starting to load');

document.addEventListener('DOMContentLoaded', function () {
    console.log('DOMContentLoaded event fired');
    createEvent();
});

function createEvent() {
    console.log('createEvent function called');

    const form = document.getElementById('eventForm');
    if (!form) {
        console.error('Event form not found in DOM');
        return;
    }

    console.log('Event form found, adding event listener');

    // Verhindere doppelte Event-Handler
    if (form.dataset.initialized) {
        console.warn('Event handler already initialized, skipping');
        return;
    }

    form.dataset.initialized = 'true';

    form.addEventListener('submit', async (e) => {
        console.log('Form submit event triggered');
        e.preventDefault();
        console.log('Form submit prevented');

        // Validierung
        const validation = validateEventForm();
        console.log('Validation result:', validation);

        if (!validation.isValid) {
            console.log('Validation failed, showing errors');
            // Validierungsfehler zeigen
            showValidationErrors(validation.errors);
            return;
        }

        console.log('Validation passed, proceeding with form submission');

        // Nutzereingaben müssen sanitisiert werden
        const formData = new FormData(form);
        const data = Object.fromEntries(formData);
        console.log('Raw form data:', data);

        const sanitizedData = sanitizeEventData(data);
        console.log('Sanitized data:', sanitizedData);

        try {
            console.log('Sending fetch request to /admin/event');
            const response = await fetch('/admin/event', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body: JSON.stringify(sanitizedData)
            });

            console.log('Fetch response received:', response.status);

            const result = await response.json();
            console.log('Parsed JSON response:', result);

            if (response.ok) {
                console.log('Response OK, redirecting to dashboard');
                // Erfolg → weiterleiten zum dashboard
                window.location.href = '/admin/dashboard';
            } else {
                console.log('Response not OK, showing error toast');
                // else → serverseitige Fehler anzeigen
                showToast(result.error || 'Fehler beim Erstellen des Events');
            }
        } catch (e) {
            console.error('Error in fetch operation:', e);
            showToast('Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.');
        }
    });

    console.log('Adding date validation event listeners');

    // Datum validierung - client side
    const startDateInput = document.getElementById('startDate');
    const endDateInput = document.getElementById('endDate');
    const registrationDeadlineInput = document.getElementById('registrationDeadline');

    if (startDateInput && endDateInput) {
        startDateInput.addEventListener('change', validateDateRelationships);
        endDateInput.addEventListener('change', validateDateRelationships);
        console.log('Added change listeners to startDate and endDate');
    } else {
        console.warn('startDate or endDate input not found');
    }

    if (registrationDeadlineInput) {
        registrationDeadlineInput.addEventListener('change', validateDateRelationships);
        console.log('Added change listener to registrationDeadline');
    } else {
        console.warn('registrationDeadline input not found');
    }

    console.log('createEvent function completed');
}

function validateEventForm() {
    console.log('Running form validation');
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

    console.log('Validation result:', {isValid, errors});
    return {isValid, errors};
}

function validateDateRelationships() {
    console.log('Running date relationship validation');
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
    console.log('Sanitizing event data');
    const sanitized = {
        title: sanitizeString(data.title),
        description: sanitizeString(data.description) || '',
        location: sanitizeString(data.location) || '',
        startDate: data.startDate,
        endDate: data.endDate,
        registrationDeadline: data.registrationDeadline
    };
    console.log('Sanitized data result:', sanitized);
    return sanitized;
}

function sanitizeString(str) {
    console.log('Sanitizing string:', str);
    if (typeof str !== 'string') {
        console.log('Input is not a string, returning empty string');
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

        console.log('String sanitization successful:', sanitized);
        return sanitized;
    } catch (error) {
        console.error('Sanitization error:', error, 'Input:', str);
        return str.trim(); // Rückfall auf einfache Bereinigung
    }
}

function showValidationErrors(errors) {
    console.log('Showing validation errors:', errors);
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