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
  doneDate: {
    type: Date,
    default: null
  },
  color: {
    type: String
  },
  repeat: {
    type: {
      frequency: {
        type: String,
        enum: ["day", "week", "month", "year"]
      },
      parameter: {
        type: Number
      }
    }
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
  },
  visibleForAll: {
    type: Boolean,
    default: false
  }
});

export default model("Event", eventSchema);
