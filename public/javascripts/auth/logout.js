document.addEventListener('DOMContentLoaded', logout);

function logout() {
    const logoutButton = document.getElementById('logoutButton');
    if (logoutButton) {
        console.log('Logout Button gefunden');

        logoutButton.addEventListener('click', async function (e) {
            e.preventDefault();

            console.log('Logout Button geklickt');

            try {
                const response = await fetch('/logout', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });

                console.log('Antwort Status:', response.status);

                if (response.ok) {
                    // Weiterleitung zu den öffentlichen Events
                    window.location.href = '/event';
                } else {
                    const result = await response.json();
                    alert(result.error || 'Fehler beim Logout');
                }
            } catch (error) {
                console.error('Logout error:', error);
                alert('Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.');
            }
        });
    } else {
        console.error('Logout Button nicht gefunden');
    }
}