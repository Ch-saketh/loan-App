// src/middleware/roleAuth.js

export const allowRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ msg: "Unauthorized: No user found ❌" });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        msg: `Access denied: Only ${roles.join(", ")} allowed ❌`,
      });
    }

    next();
  };
};