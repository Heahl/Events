export default function authMiddleware(req, res, next) {
    if (!req.session?.userId) {
        // API-Client (JSON) -> 401
        if (req.headers.accept?.includes('application/json') || req.xhr) {
            return res.status(401).json({error: 'Nicht authentifiziert'});
        }
        // klassischer Browser -> Redirect
        return res.redirect('/login');
    }
    next();
}