import {MongoMemoryServer} from 'mongodb-memory-server';
import mongoose from "mongoose";

let mongoServer;

export default async function globalSetup() {
    // Nur Memory – Atlas nur für dbconnection.test
    if (mongoose.connection.readyState !== 0) await mongoose.disconnect();

    mongoServer = await MongoMemoryServer.create();
    process.env.MONGO_URI = mongoServer.getUri();

    const conn = await mongoose.connect(process.env.MONGO_URI);

    await new Promise(resolve => setTimeout(resolve, 1_000));

    console.log('Globale memory-MongoDB für Tests gestartet.');
}

export async function globalTeardown() {
    await mongoose.disconnect();
    if (mongoServer) await mongoServer.stop();
    console.log('Globale memory-MongoDB gestoppt.');
}