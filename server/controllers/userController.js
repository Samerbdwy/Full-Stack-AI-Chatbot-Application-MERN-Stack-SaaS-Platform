import User from "../models/User.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import Chat from "../models/Chat.js"; // ✅ Already correct

// ------------------ Generate JWT ------------------
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: "30d" }
  );
};

// ------------------ REGISTER ------------------
export const registerUser = async (req, res) => {
  try {
    console.log("🔵 [REGISTER] Request received:", req.body);
    
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      console.log("❌ [REGISTER] Missing fields");
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    console.log("🔵 [REGISTER] Checking if user exists...");
    const userExists = await User.findOne({ email });
    if (userExists) {
      console.log("❌ [REGISTER] User already exists:", email);
      return res.status(400).json({ success: false, message: "User already exists" });
    }

    console.log("🔵 [REGISTER] Creating new user...");
    const user = await User.create({
      name,
      email,
      password,
      credits: 10,
    });

    console.log("✅ [REGISTER] User created successfully:", user.email);
    
    const token = generateToken(user);
    console.log("✅ [REGISTER] Token generated");

    return res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        credits: user.credits,
      },
    });
  } catch (error) {
    console.error("❌ [REGISTER] ERROR DETAILS:");
    console.error("Error Name:", error.name);
    console.error("Error Message:", error.message);
    console.error("Full Error:", error);
    
    // Specific error handling
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        success: false, 
        message: "Validation error: " + error.message 
      });
    }
    if (error.code === 11000) {
      return res.status(400).json({ 
        success: false, 
        message: "Email already exists" 
      });
    }

    return res.status(500).json({ 
      success: false, 
      message: "Server error during registration",
      error: error.message 
    });
  }
};

// ------------------ LOGIN ------------------
export const loginUser = async (req, res) => {
  try {
    console.log("🔵 [LOGIN] Request received:", req.body);
    
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required" });
    }

    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      console.log("❌ [LOGIN] User not found:", email);
      return res.status(400).json({ success: false, message: "Invalid email or password" });
    }

    console.log("🔵 [LOGIN] User found, comparing passwords...");
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log("❌ [LOGIN] Password mismatch for:", email);
      return res.status(400).json({ success: false, message: "Invalid email or password" });
    }

    const token = generateToken(user);
    console.log("✅ [LOGIN] Login successful for:", email);

    return res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        credits: user.credits,
      },
    });
  } catch (error) {
    console.error("❌ [LOGIN] ERROR:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Server error during login",
      error: error.message 
    });
  }
};

// ------------------ GET USER ------------------
export const getUser = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Not authorized" });
    }
    return res.json({ success: true, user: req.user });
  } catch (error) {
    console.error("Get User Error:", error.message);
    return res.status(500).json({ success: false, message: "Server error fetching user data" });
  }
};

// ------------------ GET PUBLISHED IMAGES ------------------
export const getPublishedImages = async (req, res) => {
  try {
    const publishedImageMessages = await Chat.aggregate([
      { $unwind: "$messages" },
      {
        $match: {
          "messages.isImage": true,
          "messages.isPublished": true,
        }
      },
      {
        $project: {
          _id: "$messages._id",
          imageUrl: "$messages.content",
          userName: "$userName",
          userId: "$userId",
          timestamp: "$messages.timestamp"
        }
      },
      { $sort: { timestamp: -1 } }
    ]);

    res.json({ 
      success: true, 
      images: publishedImageMessages 
    });
  } catch (error) {
    console.error("Get Published Images Error:", error.message);
    return res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};