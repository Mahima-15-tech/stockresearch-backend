const express = require("express");
const auth = require("../middleware/auth");
const Contact = require("../models/Contact");
const Kyc = require("../models/Kyc");
const Submission = require("../models/ResearchSubmission");

const router = express.Router();

router.get("/admin/stats", auth, async (req, res) => {
  try {
    const [contacts, kycs, researchSubs] = await Promise.all([
      Contact.countDocuments(),
      Kyc.countDocuments(),
      Submission.countDocuments(),
    ]);

    res.json({
      contacts,
      kycs,
      researchSubs,
    });
  } catch (err) {
    console.error("Stats error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
