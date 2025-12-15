/**
 * @openapi
 * tags:
 *   name: PublicEvents
 *   description: Public event endpoints (no authentication required)
 */

/**
 * @openapi
 * /event:
 *   get:
 *     summary: Get all public events
 *     tags: [PublicEvents]
 *     responses:
 *       200:
 *         description: List of public events rendered successfully
 *         content:
 *           text/html:
 *             schema:
 *               type: string
 *               description: HTML page with categorized events (open, closed, past)
 *       500:
 *         description: Server error
 *         content:
 *           text/html:
 *             schema:
 *               type: string
 *               description: Error page
 */

/**
 * @openapi
 * /event/{id}:
 *   get:
 *     summary: Get event details by ID
 *     tags: [PublicEvents]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Event ID
 *     responses:
 *       200:
 *         description: Event details page rendered successfully
 *         content:
 *           text/html:
 *             schema:
 *               type: string
 *               description: HTML event detail page with registration form if deadline not passed
 *       404:
 *         description: Event not found
 *         content:
 *           text/html:
 *             schema:
 *               type: string
 *               description: Error page
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Event nicht gefunden"
 *       500:
 *         description: Server error
 *         content:
 *           text/html:
 *             schema:
 *               type: string
 *               description: Error page
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
 * /event/{id}/register:
 *   post:
 *     summary: Register for an event
 *     tags: [PublicEvents]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Event ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - firstName
 *               - lastName
 *               - email
 *             properties:
 *               firstName:
 *                 type: string
 *                 example: "Max"
 *                 description: Participant's first name
 *               lastName:
 *                 type: string
 *                 example: "Mustermann"
 *                 description: Participant's last name
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "max@example.com"
 *                 description: Participant's email address
 *     responses:
 *       201:
 *         description: Registration successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Erfolgreich angemeldet!"
 *       400:
 *         description: Invalid input or registration deadline passed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Vorname, Nachname und E-Mail sind erforderlich."
 *       404:
 *         description: Event not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Event nicht gefunden."
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

import express from 'express';
import {
    getEventDetails, registerForEvent, getPublicEvents
} from '../../controllers/public/publicEventController.js';

const router = express.Router();

// Alle Events öffentlich anzeigen (Landing Page)
router.get('/', getPublicEvents);

// Einzelnes Event anzeigen
router.get(
    '/:id',
    getEventDetails
);

// Anmeldung verarbeiten
router.post(
    '/:id/register',
    registerForEvent
);

export default router;