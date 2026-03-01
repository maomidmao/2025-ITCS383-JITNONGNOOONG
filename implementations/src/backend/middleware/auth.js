/**
 * middleware/auth.js
 * Pure middleware — no router code, no side effects.
 * Single responsibility: session authentication and role-based access control.
 */

/**
 * requireAuth — rejects requests with no active session.
 * Use on any route that requires a logged-in user.
 */
function requireAuth(req, res, next) {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ message: 'กรุณาเข้าสู่ระบบก่อน' });
  }
  next();
}

/**
 * requireRole(...roles) — rejects requests where the user's role
 * is not in the allowed list. Automatically checks authentication first.
 *
 * @param {...string} roles  One or more uppercase role strings e.g. 'ADMIN', 'STAFF'
 * @returns Express middleware function
 */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.session || !req.session.user) {
      return res.status(401).json({ message: 'กรุณาเข้าสู่ระบบก่อน' });
    }
    const userRole = (req.session.user.UserRole || '').toUpperCase();
    if (!roles.map(r => r.toUpperCase()).includes(userRole)) {
      return res.status(403).json({ message: 'ไม่มีสิทธิ์เข้าถึง' });
    }
    next();
  };
}

module.exports = { requireAuth, requireRole };