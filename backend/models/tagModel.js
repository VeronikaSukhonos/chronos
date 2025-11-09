import { Schema, model } from "mongoose";
const tagSchema = new Schema({
  title: {
    type: String
  },
  authorId: {
    type: ObjectId
  }
});
export default model("Tag", tagSchema);