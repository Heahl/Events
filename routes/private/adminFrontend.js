/**
 * @openapi
 * tags:
 *   name: AdminFrontend
 *   description: Admin frontend pages (server-side rendered)
 */

/**
 * @openapi
 * /admin/dashboard:
 *   get:
 *     summary: Get admin dashboard
 *     tags: [AdminFrontend]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Admin dashboard rendered successfully
 *         content:
 *           text/html:
 *             schema:
 *               type: string
 *               description: HTML dashboard page with list of user's events
 *       401:
 *         description: User not authenticated, redirects to login
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
 * /admin/event/create:
 *   get:
 *     summary: Get event creation form
 *     tags: [AdminFrontend]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Event creation form rendered successfully
 *         content:
 *           text/html:
 *             schema:
 *               type: string
 *               description: HTML event creation form
 *       401:
 *         description: User not authenticated, redirects to login
 */

/**
 * @openapi
 * /admin/event/{id}/participants:
 *   get:
 *     summary: Get participants list for an event
 *     tags: [AdminFrontend]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Event ID
 *     responses:
 *       200:
 *         description: Participants list page rendered successfully
 *         content:
 *           text/html:
 *             schema:
 *               type: string
 *               description: HTML page with list of participants
 *       401:
 *         description: User not authenticated, redirects to login
 *       404:
 *         description: Event not found or user has no access
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Event nicht gefunden"
 */

/**
 * @openapi
 * /admin/event/{id}/edit:
 *   get:
 *     summary: Get event edit form
 *     tags: [AdminFrontend]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Event ID
 *     responses:
 *       200:
 *         description: Event edit form rendered successfully
 *         content:
 *           text/html:
 *             schema:
 *               type: string
 *               description: HTML event edit form
 *       401:
 *         description: User not authenticated, redirects to login
 *       404:
 *         description: Event not found or user has no access
 *         content:
 *           text/html:
 *             schema:
 *               type: string
 *               description: Error page
 */

/**
 * @openapi
 * /admin/event/{id}:
 *   put:
 *     summary: Update an event
 *     tags: [AdminFrontend]
 *     security:
 *       - bearerAuth: []
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
 *             $ref: '#/components/schemas/EventUpdate'
 *     responses:
 *       200:
 *         description: Event updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Event erfolgreich aktualisiert"
 *       302:
 *         description: Redirect to dashboard after successful update (for non-API calls)
 *       400:
 *         description: Invalid input data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Titel, Startdatum, Enddatum und Anmeldefrist sind erforderlich."
 *       401:
 *         description: User not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Nicht authentifiziert"
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
 */

/**
 * @openapi
 * /admin/event:
 *   post:
 *     summary: Create an event via form
 *     tags: [AdminFrontend]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/EventCreation'
 *     responses:
 *       201:
 *         description: Event created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   example: "60d5ec49f4a2b10015b8a3d7"
 *                 title:
 *                   type: string
 *                   example: "Konferenz 2024"
 *       302:
 *         description: Redirect to dashboard after successful creation (for non-API calls)
 *       400:
 *         description: Invalid input data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Titel, Start-, Endzeit und Anmeldefrist sind Pflicht."
 *       401:
 *         description: User not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Nicht authentifiziert"
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
import {dashboard, createEventForm, getParticipants} from '../../controllers/private/adminFrontendController.js';
import {createEvent, getEditEventForm, updateEvent} from '../../controllers/private/adminEventController.js';
import authMiddleware from '../../middleware/authMiddleware.js';

const router = express.Router();

// Dashboard-Seite
router.get('/dashboard', authMiddleware, dashboard);

// Event-Erstellungsformular-Seite
router.get('/event/create', authMiddleware, createEventForm);

// Anmeldeliste-Seite
router.get('/event/:id/participants', authMiddleware, getParticipants);

// Edit-Formular-Seite
router.get('/event/:id/edit', authMiddleware, getEditEventForm);

// Event aktualisieren
router.put('/event/:id', authMiddleware, updateEvent);

// POST-Route zum Erstellen eines Events über das Formular
router.post('/event', authMiddleware, createEvent);

export default router;