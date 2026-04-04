import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";                     // ⭐ Added for file upload fix
import { fileURLToPath } from "url";
import pool from "./src/config/db.js";

import authRoutes from "./src/routes/authRoutes.js";
import auth from "./src/middleware/auth.js";
import loanRoutes from "./src/routes/loanRoutes.js";
import adminRoutes from "./src/routes/adminRoutes.js";
import adminAuth from "./src/middleware/adminAuth.js";
import transactionRoutes from "./src/routes/transactionRoutes.js";
import dashboardRoutes   from "./src/routes/dashboardRoutes.js";
import rateLimit from "express-rate-limit";
import swaggerUi from "swagger-ui-express";
import swaggerSpec from "./src/config/swagger.js";
const app = express();

/* ------------------------------
   ⭐ Absolute path setup (Render required)
--------------------------------*/
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: { msg: "Too many requests, please try again later ❌" }
});

/* ------------------------------
   ⭐ FIX: Auto-create uploads folder on Render
--------------------------------*/
const uploadPath = path.join(__dirname, "uploads");

if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
  console.log("📁 uploads folder created on Render");
} else {
  console.log("📁 uploads folder already exists");
}

/* ------------------------------
   ⭐ Serve uploaded files
--------------------------------*/
app.use("/uploads", express.static(path.join(__dirname, "uploads")));



/* ------------------------------
   ⭐ CORS for local + production
--------------------------------*/
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

/* ------------------------------
   ⭐ JSON + URL decoder limits
--------------------------------*/
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ limit: "20mb", extended: true }));

/* ------------------------------
   ⭐ API ROUTES
--------------------------------*/
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use(limiter); 
app.use("/api/auth", authRoutes);
app.use("/api/loans", loanRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/dashboard", dashboardRoutes);        

/* ------------------------------
   ⭐ Protected test route
--------------------------------*/
app.get("/protected", auth, (req, res) => {
  res.json({ msg: "Protected route access ✅", user: req.user });
});

/* ------------------------------
   ⭐ Admin test route
--------------------------------*/
app.get("/api/admin/test", (req, res) => {
  res.send("Admin test route working ✅");
});

/* ------------------------------
   ⭐ Root endpoint
--------------------------------*/
app.get("/", (req, res) => {
  res.send("Loan API working 🟢");
});

/* ------------------------------
   ⭐ DB test route
--------------------------------*/
app.get("/test-db", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json({
      msg: "DB Connected 🟢",
      time: result.rows[0],
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "DB Connection Failed ❌" });
  }
});

/* ------------------------------
   ⭐ Correct port handling for Render
--------------------------------*/
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on PORT: ${PORT}`);
});
