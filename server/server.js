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

// ✅ Enable CORS for frontend
app.use(cors({
  origin: "http://localhost:5173", // Your Vite frontend
  credentials: true
}));

app.use(express.json());

// ✅ Fixed: Removed the stray 'z' character
connectDB();

app.get("/", (req, res) => res.send("Server is Live!"));
app.use("/api/auth", userRouter);
app.use("/api/chat", chatRouter);
app.use("/api/message", messageRouter);
app.use('/api/credit', creditRouter);
app.use('/api/community', communityRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));