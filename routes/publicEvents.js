import express from 'express';
import {getEventDetails, registerForEvent} from '../controllers/publicEventController.js';

const router = express.Router();

router.get(
    '/:id',
    getEventDetails
);

router.post(
    '/:id/register',
    registerForEvent
);

export default router;