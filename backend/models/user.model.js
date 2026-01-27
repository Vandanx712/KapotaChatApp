import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: mongoose.Schema.Types.String,
    },
    email: {
      type: mongoose.Schema.Types.String,
    },
    phoneNo:{
      type:mongoose.Schema.Types.Number
    },
    password: {
      type: mongoose.Schema.Types.String,
    },
    avatar: {
      key: { type: mongoose.Schema.Types.String },
      url: { type: mongoose.Schema.Types.String },
    },
    isOnline: {
      type: mongoose.Schema.Types.Boolean,
      default: false,
    },
    lastseen: {
      type: mongoose.Schema.Types.Date,
    },
    loginlimit:{
      type:mongoose.Schema.Types.Number,
      default:2
    }
  },
  { timestamps: true },
);

export const User = mongoose.model("User", userSchema);
