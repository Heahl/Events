/**
 * @openapi
 * tags:
 *   name: Auth
 *   description: Authentication endpoints
 */

/**
 * @openapi
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "user@example.com"
 *                 description: User's email address
 *               password:
 *                 type: string
 *                 minLength: 12
 *                 example: "SecurePassword123!"
 *                 description: Password with minimum 12 characters, 1 uppercase, 1 special character
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Registrierung erfolgreich."
 *       400:
 *         description: Invalid input or duplicate email
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "E-Mail und Passwort sind Pflicht."
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Serverfehler"
 */

/**
 * @openapi
 * /auth/register:
 *   get:
 *     summary: Show registration form
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Registration form rendered successfully
 *         content:
 *           text/html:
 *             schema:
 *               type: string
 *               description: HTML registration form
 */

/**
 * @openapi
 * /auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "user@example.com"
 *                 description: User's email address
 *               password:
 *                 type: string
 *                 example: "SecurePassword123!"
 *                 description: User's password
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Erfolgreich angemeldet."
 *       400:
 *         description: Missing email or password
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "E-Mail und Passwort sind Pflicht."
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Ungültige E-Mail oder Passwort"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Serverfehler"
 */

/**
 * @openapi
 * /auth/login:
 *   get:
 *     summary: Show login form
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Login form rendered successfully
 *         content:
 *           text/html:
 *             schema:
 *               type: string
 *               description: HTML login form
 */

/**
 * @openapi
 * /auth/logout:
 *   post:
 *     summary: Logout user
 *     tags: [Auth]
 *     responses:
 *       302:
 *         description: Redirect to event overview after successful logout
 *       500:
 *         description: Server error during logout
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Fehler beim Logout"
 */

import express from 'express';
import {register, login, logout} from "../../controllers/auth/authController.js";

const router = express.Router();

/* ===  POST /register  === */
router.post('/register', register);

/* === GET /register === */
router.get('/register', (req, res) => {
    res.render('auth/register');
})

/* ===  POST /login  === */
router.post('/login', login);

/* ===  GET /login === */
router.get('/login', (req, res) => {
    res.render('auth/login');
});

/* === POST /logout === */
router.post('/logout', logout);

export default router;