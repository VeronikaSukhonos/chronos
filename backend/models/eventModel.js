import { Schema, model } from "mongoose";

const eventSchema = new Schema({
  authorId: {
    type: Schema.Types.ObjectId,
    ref: "User"
  },
  calendarId: {
    type: Schema.Types.ObjectId,
    ref: "Calendar"
  },
  name: {
    type: String,
    trim: true,
    required: [true, "Name is required"],
    maxLength: [60, "Name must be at most 60 characters"]
  },
  description: {
    type: String,
    trim: true,
    maxLength: [250, "Description must be at most 250 characters"]
  },
  startDate: {
    type: Date,
    required: [true, "Start date is required"]
  },
  endDate: {
    type: Date
  },
  link: {
    type: String
  },
  isDone: {
    type: Boolean,
    default: false
  },
  color: {
    type: String,
    // TODO here possibly should be a function for default value - takes the value from the calendar color 
  },
  repeat: {
    type: Map // temporarily
  },
  participants: {
    type: [{ type: Schema.Types.ObjectId, ref: "User" }]
  },
  tags: {
    type: [{ type: Schema.Types.ObjectId, ref: "Tag" }]
  },
  createDate: {
    type: Date,
    default: () => Date.now(),
    immutable: true
  },
  type: {
    type: String,
    enum: ["arrangement", "reminder", "task", "holiday", "birthday"],
    required: [true, "Type is required"],
    immutable: true
  }
});

export default model("Event", eventSchema);
