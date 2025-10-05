import express from "express";
import "dotenv/config";
import cors from "cors";
import connectDB from "./configs/db.js";
import userRouter from "./routes/userRoutes.js";
import chatRouter from "./routes/chatRoutes.js";
import messageRouter from "./routes/messageRoutes.js";
import creditRouter from "./routes/creditRoutes.js";
import communityRouter from "./routes/communityRoutes.js";

const app = express();

// ✅ FIXED CORS for Vercel deployment
app.use(cors({
  origin: [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://full-stack-ai-chatbot-application-m-lyart.vercel.app",
    process.env.FRONTEND_URL
  ].filter(Boolean),
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"]
}));

app.use(express.json());

// ✅ Connect to database
connectDB();

// Test route to verify server is working
app.get("/health", (req, res) => {
  res.status(200).json({ 
    success: true, 
    message: "Server is healthy",
    timestamp: new Date().toISOString()
  });
});

app.get("/", (req, res) => res.send("Server is Live!"));
app.use("/api/auth", userRouter);
app.use("/api/chat", chatRouter);
app.use("/api/message", messageRouter);
app.use('/api/credit', creditRouter);
app.use('/api/community', communityRouter);

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  res.status(500).json({ 
    success: false, 
    message: "Internal server error" 
  });
});

// ✅ Vercel serverless function export
export default app;