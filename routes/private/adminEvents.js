/**
 * @openapi
 * tags:
 *   name: Events
 *   description: Event management endpoints
 */

/**
 * @openapi
 * /api/events:
 *   post:
 *     summary: Create a new event
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - startDate
 *               - endDate
 *               - registrationDeadline
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Konferenz 2024"
 *                 description: Event title
 *               description:
 *                 type: string
 *                 example: "Jährliche Konferenz"
 *                 description: Event description
 *               location:
 *                 type: string
 *                 example: "Berlin"
 *                 description: Event location
 *               startDate:
 *                 type: string
 *                 format: date-time
 *                 example: "2024-01-15T10:00:00Z"
 *                 description: Event start date
 *               endDate:
 *                 type: string
 *                 format: date-time
 *                 example: "2024-01-15T18:00:00Z"
 *                 description: Event end date
 *               registrationDeadline:
 *                 type: string
 *                 format: date-time
 *                 example: "2024-01-10T23:59:59Z"
 *                 description: Registration deadline
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
 *       400:
 *         description: Invalid input
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Titel, Start-, Endzeit und Anmeldefrist sind Pflicht."
 *       401:
 *         description: Not authenticated
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

/**
 * @openapi
 * /api/events:
 *   get:
 *     summary: Get all events for current user
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of events
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Event'
 *       401:
 *         description: Not authenticated
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

/**
 * @openapi
 * /api/events/{id}/participants:
 *   get:
 *     summary: Get participants for an event
 *     tags: [Events]
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
 *         description: List of participants
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Participant'
 *       404:
 *         description: Event not found
 *         content:
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
 * /api/events/{id}/participants/csv:
 *   get:
 *     summary: Download participants as CSV
 *     tags: [Events]
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
 *         description: CSV file with participants
 *         content:
 *           text/csv:
 *             schema:
 *               type: string
 *       404:
 *         description: Event not found
 *         content:
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
    createEvent,
    getMyEvents,
    getParticipants, getParticipantsCsv
} from '../../controllers/private/adminEventController.js';
import authMiddleware from '../../middleware/authMiddleware.js';

const router = express.Router();

// POST /api/admin/events
router.post('/', authMiddleware, createEvent);

// GET /api/admin/events
router.get('/', authMiddleware, getMyEvents);

// GET /api/admin/events/:id/participants
router.get('/:id/participants', authMiddleware, getParticipants);

// GET /api/admin/events/:id/participants/csv
router.get('/:id/participants/csv', authMiddleware, getParticipantsCsv);

export default router;