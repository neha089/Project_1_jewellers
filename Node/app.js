import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url"; // Needed because __dirname doesn’t exist in ESM


// ESM fix for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import routes
import customerRoutes from "./routes/customerRoutes.js";
import goldLoanRoutes from "./routes/goldLoanRoutes.js";
import loanRoutes from "./routes/loanRoutes.js";
import udharRoutes from "./routes/udharRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import transactionRoutes from "./routes/transactionRoutes.js";
import silverLoanRoutes from "./routes/silverLoanRoutes.js";
import goldRoutes from "./routes/goldRoutes.js";
import silverRoutes from "./routes/silverRoutes.js";
import bussinessExpenseRoutes from './routes/businessExpenseRoutes.js';
// Import middleware and utilities
import { generateDailyReminders } from "./utils/reminderService.js";
import { errorHandler } from "./middleware/errorHandler.js";

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Create exports directory if it doesn't exist
const exportsDir = path.join(__dirname, "exports");
if (!fs.existsSync(exportsDir)) {
  fs.mkdirSync(exportsDir, { recursive: true });
}

// Serve static files
app.use("/exports", express.static(exportsDir));

// Routes
app.use("/api/customers", customerRoutes);
app.use("/api/gold-loans", goldLoanRoutes);
app.use("/api/silver-loans", silverLoanRoutes);
app.use("/api/loans", loanRoutes);
app.use("/api/udhari", udharRoutes);
app.use('/api/gold', goldRoutes);
app.use('/api/silver', silverRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/business-expenses", bussinessExpenseRoutes);

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use(errorHandler);

// ✅ 404 handler (Express v5 safe)
app.use((req, res) => {
  res.status(404).json({ success: false, error: "Route not found" });
});

// Database connection
mongoose
  .connect(process.env.MONGODB_URI || "mongodb://localhost:27017/jewellery_business", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Connected to MongoDB");

    // Start reminder service
    setInterval(() => {
      generateDailyReminders();
    }, 24 * 60 * 60 * 1000); // Run daily

    // Generate reminders on startup
    generateDailyReminders();
  })
  .catch((error) => {
    console.error("MongoDB connection error:", error);
  });

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// ✅ ESM export
export default app;
