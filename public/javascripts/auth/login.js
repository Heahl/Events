document.addEventListener('DOMContentLoaded', loginForm);

async function loginForm() {

    document.getElementById('loginForm').addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData);

        try {
            const response = await fetch('/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (!response.ok) {
                // Fehlerbehandlung
                if (result.error.includes('Pflicht')) {
                    document.getElementById('emailError').textContent = "E-Mail ist Pflicht";
                    document.getElementById('passwordError').textContent = "Passwort ist Pflicht";
                } else {
                    // catch-all toast für weitere Fehler
                    showToast(result.error);
                }
            } else if (response.ok) {
                // Erfolg - Weiterleitung zu Dashboard
                window.location.href = '/admin/dashboard';
            }
        } catch (e) {
            console.error('Login Error:', e);
            showToast('Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.');
        }
    });
}

function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;

    document.getElementById('toastContainer').appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 5000);
}
