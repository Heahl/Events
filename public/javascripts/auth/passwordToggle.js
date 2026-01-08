document.addEventListener('DOMContentLoaded', setupPasswordToggle);

function setupPasswordToggle() {
    const input = document.getElementById('password');
    const toggleBtn = document.getElementById('toggle-btn');
    const toggleImg = document.getElementById('toggle-img');

    console.log('Input gefunden:', !!input);
    console.log('Button gefunden:', !!toggleBtn);
    console.log('Image gefunden:', !!toggleImg);

    if (input && toggleBtn && toggleImg) {
        toggleBtn.addEventListener('click', () => {
            const isPasswordVisible = input.type === 'text';

            if (isPasswordVisible) {
                input.type = 'password';
                toggleImg.src = '/icons/eye-closed.svg';
                toggleImg.alt = 'Passwort verbergen';
            } else {
                input.type = 'text';
                toggleImg.src = '/icons/eye-open.svg';
                toggleImg.alt = 'Passwort anzeigen';
            }
            input.focus();
        })
    }
}