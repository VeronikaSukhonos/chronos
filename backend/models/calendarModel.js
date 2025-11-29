import { Schema, model } from "mongoose";

const calendarSchema = new Schema({
  authorId: {
    type: Schema.Types.ObjectId,
    ref: "User"
  },
  participants: {
    type: [{
      participantId: {
        type: Schema.Types.ObjectId,
        ref: "User"
      },
      isConfirmed: {
        type: String,
        default: null
      }
    }],
    default: []
  },
  followers: {
    type: [{ type: Schema.Types.ObjectId, ref: "User" }],
    default: []
  },
  name: {
    type: String,
    trim: true,
    required: [true, "Name is required"],
    maxLength: [30, "Name must be at most 30 characters"]
  },
  description: {
    type: String,
    trim: true,
    maxLength: [250, "Description must be at most 250 characters"]
  },
  color: {
    type: String,
    default: "#ade4ff"
  },
  isHidden: {
    type: Boolean,
    default: false
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  type: {
    type: String,
    enum: ["main", "holidays", "other"],
    immutable: true,
    default: "other"
  }
});

export default model("Calendar", calendarSchema);
