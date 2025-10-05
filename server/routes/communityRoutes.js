import express from "express";
import { protect } from "../middlewares/auth.js";
import { deleteCommunityImage } from "../controllers/communityController.js";

const communityRouter = express.Router();

communityRouter.delete('/:imageId', protect, deleteCommunityImage);

export default communityRouter;