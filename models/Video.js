const mongoose = require("mongoose");

const videoSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    mode: {
      type: String,
      enum: ["embed", "redirect"],
      required: true,
    },
    youtubeLink: { type: String, required: true }, // saved as normalized watch link: https://www.youtube.com/watch?v=...
    embedLink: { type: String }, // https://www.youtube.com/embed/VIDEOID
    videoId: { type: String }, // the raw ID (11 chars normally)
    thumbnail: { type: String }, // uploaded path OR youtube thumbnail
  },
  { timestamps: true }
);

module.exports = mongoose.model("Video", videoSchema);
