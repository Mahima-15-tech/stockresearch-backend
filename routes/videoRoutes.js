const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const Video = require("../models/Video");

const router = express.Router();

// ---------- Multer Setup ----------
const uploadDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

// ---------- Helpers ----------
function extractYouTubeId(url) {
  if (!url || typeof url !== "string") return null;
  // try regex first
  const idMatch = url.match(
    /(?:youtube\.com\/(?:watch\?.*v=|embed\/|v\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/
  );
  if (idMatch && idMatch[1]) return idMatch[1];

  // fallback to query param parsing
  try {
    const u = new URL(url);
    const v = u.searchParams.get("v");
    if (v && v.length >= 6) return v.split("&")[0];
  } catch (e) {
    // ignore
  }

  // last-resort: find 11-char token anywhere
  const fallback = (url.match(/[A-Za-z0-9_-]{11}/) || [])[0];
  return fallback || null;
}

function makeWatchLink(id) {
  return `https://www.youtube.com/watch?v=${id}`;
}
function makeEmbedLink(id) {
  return `https://www.youtube.com/embed/${id}`;
}
function makeThumbnailUrl(id) {
  return `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
}

// ---------- ROUTES ----------

// POST /api/videos (add video)
router.post("/", upload.single("thumbnail"), async (req, res) => {
  try {
    const { title, mode, youtubeLink } = req.body;
    if (!title || !mode || !youtubeLink)
      return res.status(400).json({ message: "Missing required fields" });

    const videoId = extractYouTubeId(youtubeLink);
    if (!videoId)
      return res.status(400).json({ message: "Could not parse YouTube ID" });

    let thumbnail = "";
    if (req.file) {
      thumbnail = `/uploads/${req.file.filename}`;
    } else {
      // use YouTube thumbnail fallback
      thumbnail = makeThumbnailUrl(videoId);
    }

    const video = new Video({
      title,
      mode,
      youtubeLink: makeWatchLink(videoId), // normalized watch link
      embedLink: makeEmbedLink(videoId),
      videoId,
      thumbnail,
    });

    await video.save();
    res.status(201).json(video);
  } catch (err) {
    console.error("Video upload error:", err);
    res.status(500).json({ message: err.message });
  }
});

// GET /api/videos
router.get("/", async (req, res) => {
  try {
    const videos = await Video.find().sort({ createdAt: -1 });
    res.json(videos);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const video = await Video.findById(id);
    if (!video) return res.status(404).json({ message: "Video not found" });

    // remove uploaded thumbnail file if it is in /uploads (only if custom uploaded)
    if (video.thumbnail && video.thumbnail.startsWith("/uploads")) {
      const filePath = path.join(__dirname, "..", video.thumbnail); // e.g. ../uploads/xxx.jpg
      fs.unlink(filePath, (err) => {
        if (err && err.code !== "ENOENT") console.warn("Failed to delete thumbnail:", err);
      });
    }

    await Video.deleteOne({ _id: id });
    res.json({ message: "Deleted" });
  } catch (err) {
    console.error("Delete video error:", err);
    res.status(500).json({ message: err.message });
  }
});


module.exports = router;
