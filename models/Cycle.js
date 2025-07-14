const mongoose = require("mongoose");

const cycleSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    duration: {
      type: Number,
      required: true,
    },
    symptoms: String,
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Cycle", cycleSchema);
