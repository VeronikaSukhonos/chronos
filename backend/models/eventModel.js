import { Schema, model } from "mongoose";
const eventSchema = new Schema({
  authorId: {
    type: ObjectId
  },
  calendarId: {
    type: ObjectId
  },
  name: {
    type: String,
    required: [true, "Name is required"]
  },
  description: {
    type: String
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
    type: String
  },
  repeat: {
    type: Map // temporarily
  },
  participants: {
    type: Array
  },
  tags: {
    type: Array
  },
  createDate: {
    type: Date,
    default: () => Date.now()
  },
  type: {
    type: String,
    required: [true, "Type is required"]
  }
});
export default model("Event", eventSchema);