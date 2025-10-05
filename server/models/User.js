import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { 
      type: String, 
      required: true, 
      unique: true, 
      lowercase: true, 
      trim: true, 
      index: true 
    },
    password: { type: String, required: true, select: false },
    credits: { type: Number, default: 20 },
  },
  { timestamps: true }
);

// Password hashing middleware with error handling
userSchema.pre("save", async function(next) {
  try {
    // Only hash the password if it has been modified (or is new)
    if (!this.isModified("password")) return next();
    
    console.log("🔵 [USER MODEL] Hashing password...");
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    console.log("✅ [USER MODEL] Password hashed successfully");
    next();
  } catch (error) {
    console.error("❌ [USER MODEL] Password hashing error:", error);
    next(error);
  }
});

userSchema.methods.matchPassword = async function(password) {
  return bcrypt.compare(password, this.password);
};

export default mongoose.models.User || mongoose.model("User", userSchema);