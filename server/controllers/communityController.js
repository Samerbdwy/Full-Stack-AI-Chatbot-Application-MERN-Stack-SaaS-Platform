import Chat from "../models/Chat.js";
import mongoose from "mongoose";

// ------------------ DELETE COMMUNITY IMAGE ------------------
export const deleteCommunityImage = async (req, res) => {
  try {
    const userId = req.user._id;
    const { imageId } = req.params;

    console.log("🔵 [COMMUNITY] Deleting image:", imageId);

    // Find the chat that contains this message
    const chat = await Chat.findOne({
      userId,
      "messages.isPublished": true,
      "messages.isImage": true
    });

    if (!chat) {
      return res.status(404).json({ 
        success: false, 
        message: "No published images found for this user" 
      });
    }

    // Find the specific message by _id
    // Since messages are subdocuments, we need to search through the array
    const messageIndex = chat.messages.findIndex(msg => 
      msg._id.toString() === imageId && 
      msg.isPublished === true && 
      msg.isImage === true
    );

    if (messageIndex === -1) {
      return res.status(404).json({ 
        success: false, 
        message: "Image not found or you don't have permission to delete it" 
      });
    }

    // Update the specific message
    chat.messages[messageIndex].isPublished = false;
    await chat.save();

    console.log("✅ [COMMUNITY] Image unpublished successfully");

    res.json({ 
      success: true, 
      message: "Image removed from community" 
    });

  } catch (error) {
    console.error("❌ [COMMUNITY] Delete image error:", error.message);
    res.status(500).json({ 
      success: false, 
      message: "Failed to delete image from community" 
    });
  }
};