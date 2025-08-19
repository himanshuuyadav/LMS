import jwt from "jsonwebtoken";

export const requireAuth = (req, res, next) => {
  try {
    const auth = req.headers.authorization || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
    if (!token) { res.status(401); throw new Error("Missing token"); }

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    // payload: { sub, role, employeeId, name, email }
    req.user = payload;
    next();
  } catch (err) {
    if (!res.statusCode || res.statusCode < 400) res.status(401);
    next(new Error("Unauthorized"));
  }
};

export const requireHR = (req, _res, next) => {
  if (req.user?.role !== "HR") {
    const err = new Error("Forbidden: HR only");
    err.status = 403;
    return next(err);
  }
  next();
};
