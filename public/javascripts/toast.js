"use strict";

function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;

    // sicherstellen, dass toastContainer existiert
    const container = document.getElementById('toastContainer') || document.body;
    container.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 5000);
}

window.showToast = showToast;