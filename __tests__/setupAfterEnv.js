import mongoose from 'mongoose';

// Wird nach dem Setup aber vor den Tests ausgeführt
beforeEach(async () => {
    // Stelle sicher, dass die Verbindung bereit ist
    if (mongoose.connection.readyState !== 1) {
        throw new Error('Mongoose nicht verbunden!');
    }
});