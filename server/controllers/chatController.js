import Chat from "../models/Chat.js";

// CREATE CHAT - Match frontend
export const createChat = async (req, res) => {
  try {
    const userId = req.user._id;
    
    console.log("Creating new chat for user:", userId);

    const chatData = {
      userId,
      userName: req.user.name,
      name: "New Chat",
      messages: []
    };

    const chat = await Chat.create(chatData);
    
    console.log("Chat created successfully:", chat._id);

    res.status(201).json({ 
      success: true, 
      chat: {
        _id: chat._id,
        userId: chat.userId,
        userName: chat.userName,
        name: chat.name,
        messages: chat.messages,
        createdAt: chat.createdAt,
        updatedAt: chat.updatedAt
      }
    });
  } catch (error) {
    console.error("Create Chat Error:", error.message);
    res.status(500).json({ 
      success: false, 
      message: "Failed to create chat",
      error: error.message 
    });
  }
};

// GET USER CHATS
export const getChats = async (req, res) => {
  try {
    const userId = req.user._id;
    const chats = await Chat.find({ userId }).sort({ updatedAt: -1 });
    res.json({ success: true, chats });
  } catch (error) {
    console.error("Get Chats Error:", error.message);
    res.status(500).json({ success: false, message: "Failed to fetch chats" });
  }
};

export const updateChatName = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: "Chat name is required" });
    }

    const chat = await Chat.findOneAndUpdate(
      { _id: id, userId },
      { name },
      { new: true }
    );

    if (!chat) {
      return res.status(404).json({ success: false, message: "Chat not found" });
    }

    res.json({ success: true, message: "Chat name updated", chat });
  } catch (error) {
    console.error("Update Chat Name Error:", error.message);
    res.status(500).json({ success: false, message: "Failed to update chat name" });
  }
};

// GET CHAT BY ID - Match frontend
export const getChatById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const chat = await Chat.findOne({ _id: id, userId });
    if (!chat) {
      return res.status(404).json({ success: false, message: "Chat not found" });
    }

    res.json({ success: true, messages: chat.messages });
  } catch (error) {
    console.error("Get Chat Error:", error.message);
    res.status(500).json({ success: false, message: "Failed to fetch chat" });
  }
};

// DELETE CHAT - Match frontend
export const deleteChat = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const result = await Chat.deleteOne({ _id: id, userId });
    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, message: "Chat not found" });
    }

    res.json({ success: true, message: "Chat deleted" });
  } catch (error) {
    console.error("Delete Chat Error:", error.message);
    res.status(500).json({ success: false, message: "Failed to delete chat" });
  }
};

// ADD MESSAGE - Match frontend
export const addMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const userId = req.user._id;

    if (!content) {
      return res.status(400).json({ success: false, message: "Content is required" });
    }

    const chat = await Chat.findOne({ _id: id, userId });
    if (!chat) {
      return res.status(404).json({ success: false, message: "Chat not found" });
    }

    // Add user message
    const userMessage = {
      role: "user",
      content,
      isImage: false,
      timestamp: new Date()
    };

    chat.messages.push(userMessage);
    await chat.save();

    // For now, return the user message (AI integration will be handled separately)
    res.json({ success: true, message: userMessage });
  } catch (error) {
    console.error("Add Message Error:", error.message);
    res.status(500).json({ success: false, message: "Failed to add message" });
  }
};

// PUBLISH MESSAGE - USING INDEX INSTEAD OF ID (FIXED VERSION)
export const publishMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { messageIndex } = req.body; // Now using index instead of messageId
    const userId = req.user._id;

    console.log("🔵 [PUBLISH] Looking for message at index:", messageIndex);
    console.log("🔵 [PUBLISH] In chat:", id);
    console.log("🔵 [PUBLISH] For user:", userId);

    const chat = await Chat.findOne({ _id: id, userId });
    if (!chat) {
      console.log("❌ [PUBLISH] Chat not found");
      return res.status(404).json({ success: false, message: "Chat not found" });
    }

    console.log("🔵 [PUBLISH] Chat found, total messages:", chat.messages.length);

    // Validate index is within bounds
    if (messageIndex < 0 || messageIndex >= chat.messages.length) {
      console.log("❌ [PUBLISH] Invalid message index:", messageIndex);
      return res.status(404).json({ success: false, message: "Message not found" });
    }

    // Get message by index (this will always work if index is valid)
    const message = chat.messages[messageIndex];
    console.log("🔵 [PUBLISH] Found message:", {
      role: message.role,
      isImage: message.isImage,
      isPublished: message.isPublished,
      content: message.isImage ? 'IMAGE_URL' : message.content?.substring(0, 50) + '...'
    });

    // Only allow publishing of AI-generated images
    if (message.role !== 'assistant') {
      console.log("❌ [PUBLISH] Cannot publish - not an AI message");
      return res.status(400).json({ 
        success: false, 
        message: "Only AI-generated content can be published" 
      });
    }

    if (!message.isImage) {
      console.log("❌ [PUBLISH] Cannot publish - not an image");
      return res.status(400).json({ 
        success: false, 
        message: "Only images can be published to community" 
      });
    }

    // Check if already published
    if (message.isPublished) {
      console.log("ℹ️ [PUBLISH] Message already published");
      return res.status(400).json({ 
        success: false, 
        message: "Image is already published to community" 
      });
    }

    // Publish the image
    message.isPublished = true;
    await chat.save();

    console.log("✅ [PUBLISH] Message published successfully at index:", messageIndex);

    res.json({ 
      success: true, 
      message: "Image published to community!" 
    });
  } catch (error) {
    console.error("❌ [PUBLISH] Publish Message Error:", error.message);
    res.status(500).json({ 
      success: false, 
      message: "Failed to publish message: " + error.message 
    });
  }
};