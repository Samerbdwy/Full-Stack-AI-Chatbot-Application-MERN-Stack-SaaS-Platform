import express from "express"
import { getPlans, purchasePlan, verifyPayment } from "../controllers/creditController.js"
import { protect } from "../middlewares/auth.js"

const creditRouter = express.Router()
creditRouter.get('/plan', getPlans)
creditRouter.post('/create-checkout-session', protect, purchasePlan) // Match frontend
creditRouter.get('/verify-payment', verifyPayment) // Match frontend

export default creditRouter;



