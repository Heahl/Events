import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const connectDB = async () => {
    const uri = process.env.MONGODB_URI;
    if (!uri) throw new Error('MONGODB_URI ist nicht in .env gesetzt!');

    /* schon verbunden mit demselben Host → nichts tun */
    if (mongoose.connection.readyState === 1 &&
        mongoose.connection.host === new URL(uri).host) {
        return mongoose.connection;
    }

    /* alte Verbindung trennen, falls vorhanden */
    if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
    }

    await mongoose.connect(uri);
};

export default connectDB;
