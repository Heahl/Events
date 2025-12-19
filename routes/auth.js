import express from 'express';
import {register, login} from "../controllers/authController.js";

const router = express.Router();

/* === GET / (weiterleitung zu login) === */
router.get('/', (req, res) => {
    res.redirect('/login');
})

/* ===  POST /register  === */
router.post('/register', register);

/* === GET /register === */
router.get('/register', (req, res) => {
    res.render('register');
})

/* ===  POST /login  === */
router.post('/login', login);

/* ===  GET /login === */
router.get('/login', (req, res) => {
    res.render('login');
});

export default router;