document.addEventListener('DOMContentLoaded', registerForEvent);

function registerForEvent() {
    console.log("registerForEvent.js geladen");
    const form = document.getElementById('registrationForm');

    if (!form) {
        console.error("registrationForm not found");
        return;
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        console.log("Form submit prevented");

        // Hol die Event-ID aus dem data-Attribut
        const eventId = form.getAttribute('data-event-id');
        console.log("Event ID:", eventId);

        if (!eventId) {
            console.error("Event ID not found in form");
            showToast('Fehler: Event-ID nicht gefunden');
            return;
        }

        // Validierung
        const validation = validateRegistrationForm();
        if (!validation.isValid) {
            showValidationErrors(validation.errors);
            return;
        }

        const formData = new FormData(form);
        const data = Object.fromEntries(formData);
        console.log("Form data:", data);

        try {
            const response = await fetch(`/event/${eventId}/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(data)
            });

            console.log('Response status:', response.status);
            console.log('Response headers:', response.headers.get('content-type'));

            // Überprüfe, ob die Antwort JSON ist
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                const result = await response.json();

                if (response.ok) {
                    // Erfolg - zeige Meldung und leite weiter
                    showToast('Anmeldung erfolgreich! Sie werden weitergeleitet...', 'success');
                    setTimeout(() => {
                        window.location.reload();
                    }, 1000);
                } else {
                    // Fehler anzeigen
                    showToast(result.error || 'Fehler bei der Anmeldung');
                }
            } else {
                // Wenn es kein JSON ist, lies den Text
                const textResult = await response.text();
                console.log('Non-JSON response:', textResult);
                showToast('Serverfehler - Antwort ist kein JSON');
            }
        } catch (error) {
            console.error('Registration error:', error);
            showToast('Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.');
        }
    });
}

function validateRegistrationForm() {
    const errors = {};
    let isValid = true;

    const firstName = document.getElementById('firstName').value.trim();
    if (!firstName) {
        errors.firstName = 'Vorname ist ein Pflichtfeld';
        isValid = false;
    }

    const lastName = document.getElementById('lastName').value.trim();
    if (!lastName) {
        errors.lastName = 'Nachname ist ein Pflichtfeld';
        isValid = false;
    }

    const email = document.getElementById('email').value.trim();
    if (!email) {
        errors.email = 'E-Mail ist ein Pflichtfeld';
        isValid = false;
    } else {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            errors.email = 'Ungültiges E-Mail-Format';
            isValid = false;
        }
    }
    return {isValid, errors};
}

function showValidationErrors(errors) {
    // alle vorherigen Fehlermeldungen leeren
    document.querySelectorAll('.error-message').forEach(el => el.textContent = '');

    // Zeige Fehler für jedes Feld
    Object.keys(errors).forEach(fieldName => {
        const errorElement = document.getElementById(fieldName + 'Error');
        if (errorElement) {
            errorElement.textContent = errors[fieldName];
        }
    });
}

function showToast(message, type = 'error') {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.style.backgroundColor = type === 'success' ? '#4caf50' : '#f44336';
    toast.textContent = message;

    const container = document.getElementById('toastContainer');
    container.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 5000);
}