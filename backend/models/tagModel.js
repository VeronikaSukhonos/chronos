import { Schema, model } from "mongoose";

const tagSchema = new Schema({
  authorId: {
    type: Schema.Types.ObjectId,
    ref: "User"
  },
  title: {
    type: String,
    trim: true,
    required: [true, "Title is required"],
    maxLength: [30, "Title must be at most 30 characters"]
  }
});

export default model("Tag", tagSchema);
