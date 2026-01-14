document.addEventListener('DOMContentLoaded', eventForm);

function eventForm() {
    const form = document.getElementById('eventForm');

    if (!form) return;

    const isEditing = form.getAttribute('data-event-id');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = new FormData(form);
        const data = Object.fromEntries(formData);

        try {
            let url, method;
            if (isEditing) {
                const eventId = form.getAttribute('data-event-id');
                url = `/admin/event/${eventId}`;
                method = 'PUT';
            } else {
                url = '/admin/event';
                method = 'POST';
            }

            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (response.ok) {
                const message = isEditing ? 'Event erfolgreich aktualisiert!' : 'Event erfolgreich erstellt!';
                showToast(message, 'success');
                setTimeout(() => {
                    window.location.href = '/admin/dashboard';
                }, 1000);
            } else {
                showToast(result.error || 'Fehler beim Speichern');
            }
        } catch (error) {
            showToast('Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.');
        }
    });
}

function showToast(message, type = 'error') {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.style.backgroundColor = type === 'success' ? '#4caf50' : '#f44336';
    toast.textContent = message;

    const container = document.getElementById('toastContainer');
    if (container) {
        container.appendChild(toast);

        setTimeout(() => {
            toast.remove();
        }, 5000);
    }
}