import mongoose from "mongoose";

const chatSchema = new mongoose.Schema(
  {
    users: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],
    latestMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
    },
    unreadMessages: {
      type: Map,
      of: Number, // key = userId, value = unread count
      default: {},
    },
  },
  { timestamps: true }
);

export default mongoose.model("Chat", chatSchema);
