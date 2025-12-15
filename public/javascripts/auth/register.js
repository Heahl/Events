"use strict";
// Behandelt das Registrierungsformular

document.addEventListener('DOMContentLoaded', registerForm);

async function registerForm() {
    console.log("register.js geladen");

    document.getElementById('registerForm').addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData);

        try {
            const response = await fetch('/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (!response.ok) {
                // hier fangen wir die Error-Meldungen aus dem Backend ab
                if (result.error.includes('Pflicht')) {
                    document.getElementById('emailError').textContent = "E-Mail ist Pflicht";
                    document.getElementById('passwordError').textContent = "Passwort ist Pflicht";
                } else if (result.error.includes('12 Zeichen')) {
                    document.getElementById('emailError').textContent = '';
                    document.getElementById('passwordError').textContent = result.error;
                } else {
                    // catch-all toast für weitere Fehler
                    showToast(result.error);
                }
            } else if (response.ok) {
                // success toast
                showToast(result.message);

                // redirect nach 3 sek
                setTimeout(() => {
                    window.location.href = '/login';
                }, 3000);
            }
        } catch (e) {
            console.error('Registration Error:', e);
            showToast('Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.');
        }
    });
}

