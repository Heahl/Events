import express from 'express';
import {createEvent, getMyEvents, getParticipants} from '../controllers/adminEventController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

// createEvent
router.post('/', authMiddleware, createEvent);
router.get('/', authMiddleware, getMyEvents);
router.get('/:id/participants', authMiddleware, getParticipants);

export default router;