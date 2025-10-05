import express from "express";
import { createChat, deleteChat, getChats, getChatById, addMessage, publishMessage, updateChatName } from "../controllers/chatController.js";
import { protect } from "../middlewares/auth.js";

const chatRouter = express.Router();

chatRouter.post('/new', protect, createChat);
chatRouter.get('/', protect, getChats);
chatRouter.get('/:id', protect, getChatById);
chatRouter.put('/:id', protect, updateChatName); // Add this line
chatRouter.delete('/:id', protect, deleteChat);
chatRouter.post('/:id/message', protect, addMessage);
chatRouter.post('/:id/publish', protect, publishMessage);

export default chatRouter;