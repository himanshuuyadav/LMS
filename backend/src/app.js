import express from "express";
import cors from "cors";

import authRouter from "./routes/auth.routes.js";
import employeesRouter from "./routes/employees.routes.js";
import leavesRouter from "./routes/leaves.routes.js";
import ledgerRouter from "./routes/ledger.routes.js";

import { notFound, errorHandler } from "./middleware/errorHandler.js";

const app = express();
app.use(cors());
app.use(express.json());

// ✅ Health check
app.get("/ping", (_req, res) => res.json({ message: "pong 🏓" }));

// ✅ Root welcome
app.get("/", (_req, res) => res.send("Leave Management System API 🚀"));

// ✅ Public auth routes (login/register)
app.use("/api/auth", authRouter);

// ✅ Protected resources (add auth middleware inside routes if needed)
app.use("/api/employees", employeesRouter);
app.use("/api/leaves", leavesRouter);
app.use("/api/ledger", ledgerRouter);

// ❌ Catch-all + error handlers should always be LAST
app.use(notFound);
app.use(errorHandler);

export default app;
