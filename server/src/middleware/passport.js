import passport from 'passport';

export function authenticateLocal(req, res, next) {
  passport.authenticate('local', { session: false }, (error, user, info) => {
    if (error) {
      return next(error);
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: info?.message || 'Authentication failed.',
      });
    }

    req.user = user;

    return next();
  })(req, res, next);
}
