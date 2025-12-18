import express from 'express';
import {register, login} from "../controllers/authController.js";

const router = express.Router();

/* ----------  POST /register  ---------- */
router.post('/register', register);

/* ----------  POST /login  ---------- */
router.post('/login', login);

/* ----------  GET /login ---------- */
router.get('/login', (req, res) => {
    res.render('login');
});

export default router;