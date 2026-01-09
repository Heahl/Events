import bcrypt from 'bcrypt';
import User from '../../models/User.js';

const PW_REGEX = /^(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{12,}$/;

/**
 * @openapi
 * components:
 *   schemas:
 *     UserRegistration:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           example: "user@example.com"
 *           description: User's email address
 *         password:
 *           type: string
 *           minLength: 12
 *           example: "SecurePassword123!"
 *           description: Password with minimum 12 characters, 1 uppercase, 1 special character
 *     LoginCredentials:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           example: "user@example.com"
 *           description: User's email address
 *         password:
 *           type: string
 *           example: "SecurePassword123!"
 *           description: User's password
 *     AuthResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           example: "Registrierung erfolgreich."
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         error:
 *           type: string
 *           example: "Ungültige E-Mail oder Passwort"
 */

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

        const user = await User.findOne({email});
        if (!user) {
            return res.status(401).json({error: 'Ungültige E-Mail oder Passwort'});
        }

        const match = await bcrypt.compare(password, user.password);

        if (!match) return res.status(401).json({error: 'Ungültige E-Mail oder Passwort'});

        /* SESSION-LOGIN */
        req.session.userId = user._id;

        res.status(200).json({message: 'Erfolgreich angemeldet.'});
    } catch (err) {
        console.error("Login: Serverfehler", err);
        res.status(500).json({error: 'Serverfehler'});
    }
};

/* === LOGOUT === */
export const logout = async (req, res) => {
    try {
        // sesion killen
        req.session.destroy((err) => {
            if (err) {
                console.error("Logout: Fehler beim zerstören der Session", err);
                return res.status(500).json({error: 'Fehler beim Logout'});
            }

            // sesson cookie löschen
            res.clearCookie('connect.sid');

            // Weiterleiten zu events Übersicht
            res.redirect('/event');
        });

    } catch (e) {
        console.error(e);
        res.status(500).json({error: 'Serverfehler'});
    }
}
