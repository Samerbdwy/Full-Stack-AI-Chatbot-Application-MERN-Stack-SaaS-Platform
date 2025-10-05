import mongoose from "mongoose";
import Chat from "../models/Chat.js";
import User from "../models/User.js";
import imagekit from "../configs/imageKit.js";
import { GoogleGenAI } from "@google/genai";
import axios from "axios";
import FormData from "form-data";

// Initialize Google GenAI
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});

// ---------------------- TEXT MESSAGE CONTROLLER ----------------------
export const textMessageController = async (req, res) => {
  try {
    const userId = req.user._id;
    const { chatId, prompt } = req.body;

    console.log("🔵 [AI] Processing text message:", prompt);
    
    if (!prompt) return res.status(400).json({ success: false, message: "Prompt is required" });
    
    // Get fresh user data to check credits
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    
    if (user.credits < 1) {
      return res.status(400).json({ success: false, message: "You don't have enough credits" });
    }

    const chat = await Chat.findOne({ userId, _id: chatId });
    if (!chat) return res.status(404).json({ success: false, message: "Chat not found" });

    // Save user message
    const userMessage = { 
      _id: new mongoose.Types.ObjectId(),
      role: "user", 
      content: prompt, 
      isImage: false, 
      timestamp: new Date() 
    };
    chat.messages.push(userMessage);

    console.log("🔵 [AI] Calling Gemini API...");
    
    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: prompt,
      });

      console.log("✅ [AI] Gemini response received");
      
      const aiContent = response.text;
      
      if (!aiContent) {
        console.error("❌ [AI] No content in Gemini response:", response);
        throw new Error("No AI response content");
      }

      const aiMessage = { 
        _id: new mongoose.Types.ObjectId(),
        role: "assistant", 
        content: aiContent, 
        isImage: false, 
        timestamp: new Date() 
      };
      
      chat.messages.push(aiMessage);
      await chat.save();
      
      // Deduct credits and get updated user
      user.credits -= 1;
      await user.save();
      
      console.log("✅ [AI] Message saved and credits updated");

      res.json({ 
        success: true, 
        reply: aiMessage,
        updatedCredits: user.credits
      });
      
    } catch (apiError) {
      console.error("❌ [AI] Gemini API Error:", apiError);
      throw new Error(`Gemini API Error: ${apiError.message}`);
    }

  } catch (err) {
    console.error("❌ [AI] Text message error:", err);
    
    res.status(500).json({ 
      success: false, 
      message: "Gemini API Error: " + err.message
    });
  }
};

// ---------------------- IMAGE MESSAGE CONTROLLER ----------------------
export const imageMessageController = async (req, res) => {
  try {
    const userId = req.user._id;
    const { chatId, prompt, isPublished } = req.body;

    console.log("🔵 [IMAGE] Processing image generation:", prompt);
    
    if (!prompt) return res.status(400).json({ success: false, message: "Prompt is required" });
    
    // Get fresh user data to check credits
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    
    if (user.credits < 2) {
      return res.status(400).json({ success: false, message: "You don't have enough credits" });
    }

    const chat = await Chat.findOne({ userId, _id: chatId });
    if (!chat) return res.status(404).json({ success: false, message: "Chat not found" });

    // Save user message
    const userMessage = { 
      role: "user", 
      content: prompt, 
      isImage: false, 
      timestamp: new Date() 
    };
    chat.messages.push(userMessage);

    console.log("🔵 [IMAGE] Calling ClipDrop API...");
    
    const form = new FormData();
    form.append("prompt", prompt);

    const clipdropResponse = await axios.post(
      "https://clipdrop-api.co/text-to-image/v1",
      form,
      { 
        headers: { 
          "x-api-key": process.env.CLIPDROP_API_KEY, 
          ...form.getHeaders() 
        }, 
        responseType: "arraybuffer",
        timeout: 30000
      }
    );

    if (!clipdropResponse?.data) {
      throw new Error("No image data received from ClipDrop");
    }

    console.log("✅ [IMAGE] ClipDrop image generated");

    const base64Image = Buffer.from(clipdropResponse.data, "binary").toString("base64");
    const dataUrl = `data:image/png;base64,${base64Image}`;

    const uploadResponse = await imagekit.upload({ 
      file: dataUrl, 
      fileName: `quickgpt-${Date.now()}.png`, 
      folder: "quickgpt" 
    });
    
    if (!uploadResponse?.url) {
      throw new Error("ImageKit upload failed");
    }

    console.log("✅ [IMAGE] Image uploaded to ImageKit:", uploadResponse.url);

    const aiMessage = { 
      role: "assistant", 
      content: uploadResponse.url, 
      isImage: true, 
      timestamp: new Date(), 
      isPublished: isPublished || false 
    };
    
    chat.messages.push(aiMessage);
    await chat.save();
    
    // Deduct credits and get updated user
    user.credits -= 2;
    await user.save();
    
    console.log("✅ [IMAGE] Image message saved and credits updated");

    res.json({ 
      success: true, 
      reply: aiMessage,
      updatedCredits: user.credits
    });
    
  } catch (err) {
    console.error("❌ [IMAGE] Image message error:", err);
    
    res.status(500).json({ 
      success: false, 
      message: "Image generation failed: " + err.message
    });
  }
};