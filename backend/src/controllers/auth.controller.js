import { z } from "zod";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Employee from "../models/Employee.js";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

const registerEmployeeUserSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(["HR", "Employee"]),
  employeeId: z.string().optional()
});

// issue JWT
function sign(user) {
  const payload = {
    sub: user._id.toString(),
    role: user.role,
    name: user.name,
    email: user.email,
    employeeId: user.employeeId ? user.employeeId.toString() : undefined
  };
  const ttl = process.env.TOKEN_TTL || "7d";
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: ttl });
}

// POST /api/auth/login
export const login = async (req, res, next) => {
  try {
    const { email, password } = loginSchema.parse(req.body);
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) { res.status(401); throw new Error("Invalid credentials"); }
    const ok = await user.comparePassword(password);  3
    if (!ok) { res.status(401); throw new Error("Invalid credentials"); }
    const token = sign(user);
    res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role, employeeId: user.employeeId } });
  } catch (err) { next(err); }
};

// POST /api/auth/register (HR-only)
// Create HR or Employee user (if Employee, must link to Employee document)
export const register = async (req, res, next) => {
  try {
    const payload = registerEmployeeUserSchema.parse(req.body);

    // If role is Employee, ensure employeeId is valid and exists
    let employeeDoc = null;
    if (payload.role === "Employee") {
      if (!payload.employeeId) { res.status(400); throw new Error("employeeId required for Employee user"); }
      employeeDoc = await Employee.findById(payload.employeeId);
      if (!employeeDoc) { res.status(404); throw new Error("Employee not found"); }
    }

    const exists = await User.findOne({ email: payload.email.toLowerCase().trim() });
    if (exists) { res.status(409); throw new Error("User with this email already exists"); }

    const passwordHash = await bcrypt.hash(payload.password, 10);
    const user = await User.create({
      name: payload.name.trim(),
      email: payload.email.toLowerCase().trim(),
      passwordHash,
      role: payload.role,
      employeeId: employeeDoc ? employeeDoc._id : undefined
    });

    res.status(201).json({ id: user._id, role: user.role, email: user.email });
  } catch (err) { next(err); }
};

// GET /api/auth/me
export const me = async (req, res) => {
  res.json(req.user);
};

// Bootstrap an HR admin on startup (called from server)
export const ensureAdmin = async () => {
  const email = (process.env.ADMIN_EMAIL || "").toLowerCase().trim();
  const pass = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME || "HR Admin";
  if (!email || !pass) return;

  const exists = await User.findOne({ email });
  if (exists) return;

  const passwordHash = await bcrypt.hash(pass, 10);
  await User.create({
    name,
    email,
    passwordHash,
    role: "HR"
  });
  // eslint-disable-next-line no-console
  console.log(`👤 Seeded HR admin: ${email}`);
};
