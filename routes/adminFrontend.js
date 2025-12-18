import express from 'express';
import {dashboard, createEventForm, getParticipants} from '../controllers/adminFrontendController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

// Dashboard-Seite
router.get('/dashboard', authMiddleware, dashboard);

// Event-Erstellungsformular-Seite
router.get('/event/create', authMiddleware, createEventForm);

// Anmeldeliste-Seite
router.get('/event/:id/participants', authMiddleware, getParticipants);

export default router;