// controllers/authController.js

import bcrypt from 'bcrypt';
import User from '../models/User.js';

const PW_REGEX = /^(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{12,}$/;

/* === REGISTER === */
export const register = async (req, res) => {
    try {
        const {email, password} = req.body;

        if (!email || !password)
            return res.status(400).json({error: 'E-Mail und Passwort sind Pflicht.'});

        if (!PW_REGEX.test(password))
            return res.status(400).json({error: 'Passwort muss mindestens 12 Zeichen lang sein und wenigstens einen Großbuchstaben und Sonderzeichen enthalten.'});

        const existing = await User.findOne({email});
        if (existing)
            return res.status(400).json({error: 'Registrierung fehlgeschlagen. Bitte überprüfen Sie Ihre Eingaben.'});

        await User.create({email, password});

        res.status(201).json({message: 'Registrierung erfolgreich.'});
    } catch (err) {
        console.error(err);
        res.status(500).json({error: 'Serverfehler'});
    }
};

/* === LOGIN === */
export const login = async (req, res) => {
    try {
        const {email, password} = req.body;

        if (!email || !password)
            return res.status(400).json({error: 'E-Mail und Passwort sind Pflicht.'});

        console.log("Login: Eingegebenes Passwort:", password);
        const user = await User.findOne({email});
        if (!user) {
            console.log("Login: Kein Nutzer mit dieser E-Mail gefunden:", email);
            return res.status(401).json({error: 'Ungültige E-Mail oder Passwort'});
        }

        console.log("Login: Gespeichertes Hash aus DB:", user.password);
        const match = await bcrypt.compare(password, user.password);
        console.log("Login: Passwort-Vergleich (bcrypt.compare) Ergebnis:", match);

        if (!match) return res.status(401).json({error: 'Ungültige E-Mail oder Passwort'});

        /* SESSION-LOGIN */
        req.session.userId = user._id;

        res.status(200).json({message: 'Erfolgreich angemeldet.'});
    } catch (err) {
        console.error("Login: Serverfehler", err);
        res.status(500).json({error: 'Serverfehler'});
    }
};