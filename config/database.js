import mongoose from "mongoose";
import dotenv from 'dotenv';

dotenv.config();

const connectDB = async () => {
    try {
        // uri aus .env
        const uri = process.env.MONGODB_URI;

        if (!uri) {
            throw new Error('MONGODB_URI ist nicht in .env gesetzt!');
        }

        await mongoose.connect(uri);
        console.log("Mongodb verbunden.");
    } catch (e) {
        console.error("Mongodb Verbindungsfehler: " + e.message);
        process.exit(1);
    }
}

export default connectDB;