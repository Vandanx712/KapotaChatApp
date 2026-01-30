import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    fullname: {
      type: String,
    },
    email: {
      type: String,
    },
    password: {
      type: String,
    },
    gender:{
      type:String,
      enum:['male','female']
    },
    bio:{
      type:String
    },
    profilePic: {
      type: mongoose.Schema.Types.Mixed,
    },
    loginlimits: {
      type: Number,
    },
  },
  { timestamps: true }
);

userSchema.index({ email: 1 });

export const User = mongoose.model("User", userSchema);
