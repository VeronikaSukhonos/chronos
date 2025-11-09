import { Schema, model } from "mongoose";
const calendarSchema = new Schema({
  authorId: {
    type: ObjectId
  },
  participants: {
    type: Array
  },
  followers: {
    type: Array
  },
  name: {
    type: String,
    required: [true, "Name is required"]
  },
  description: {
    type: String
  },
  hidden: {
    type: Boolean,
    default: false
  },
  color: {
    type: String
  },
  isPublic: {
    type: Boolean,
    default: false
  }
});
export default model("Calendar", calendarSchema);