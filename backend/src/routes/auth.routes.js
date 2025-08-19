import { Router } from "express";
import rateLimit from "express-rate-limit";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import { login, register, me } from "../controllers/auth.controller.js";
import { requireAuth, requireHR } from "../middleware/auth.js";

const router = Router();

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200 });

router.post("/login", limiter, login);

// HR-only registration
router.post("/register", requireAuth, requireHR, register);

// Get logged-in user info
router.get("/me", requireAuth, me);

// Change password (logged-in users only)
router.post("/change-password", requireAuth, async (req, res, next) => {
  try {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ message: "Both old and new passwords are required" });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) return res.status(400).json({ message: "Old password incorrect" });

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({ message: "Password updated successfully" });
  } catch (err) {
    next(err);
  }
});

export default router;
