document.addEventListener('DOMContentLoaded', eventParticipants);

function eventParticipants() {
    const downloadBtn = document.getElementById('downloadCsvBtn');

    if (downloadBtn) {
        downloadBtn.addEventListener('click', function () {
            try {
                const eventId = this.getAttribute('data-event-id');
                const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                const filename = `teilnehmer-${timestamp}.csv`;

                // Lade die CSV-Datei direkt vom Server
                window.location.href = `/api/events/${eventId}/participants/csv`;

                showToast('CSV-Datei wird heruntergeladen', 'success');
            } catch (error) {
                console.error('Fehler beim CSV-Download:', error);
                showToast('Fehler beim Herunterladen der CSV-Datei');
            }
        });
    }
}
