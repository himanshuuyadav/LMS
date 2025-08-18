import express from "express";
import cors from "cors";
import employeesRouter from "./routes/employees.routes.js";
import leavesRouter from "./routes/leaves.routes.js";
import { notFound, errorHandler } from "./middleware/errorHandler.js";

const app = express();
app.use(cors());
app.use(express.json());

// ✅ Test route
app.get("/ping", (req, res) => {
  res.json({ message: "pong 🏓" });
});

// ✅ Root welcome
app.get("/", (_req, res) => res.send("Leave Management System API 🚀"));

// ✅ API routes
app.use("/api/employees", employeesRouter);
app.use("/api/leaves", leavesRouter);

// ❌ Catch-all + error handlers
app.use(notFound);
app.use(errorHandler);

export default app;
