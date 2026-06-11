const express = require("express");
const router = express.Router();
const { requireAuth } = require("../../core/middleware/auth.middleware");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const UPLOAD_DIR = path.join(__dirname, "../../../uploads");

// Ensure upload dir exists
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

router.post("/receipt", requireAuth, (req, res) => {
  try {
    const { image } = req.body;
    if (!image || !image.startsWith("data:image/")) {
      return res.status(400).json({ success: false, message: "Format gambar tidak valid" });
    }

    const matches = image.match(/^data:image\/(png|jpeg|jpg|webp);base64,(.+)$/);
    if (!matches) {
      return res.status(400).json({ success: false, message: "Format base64 tidak valid" });
    }

    const ext = matches[1] === "jpeg" ? "jpg" : matches[1];
    const filename = `receipt-${crypto.randomBytes(8).toString("hex")}.${ext}`;
    const filepath = path.join(UPLOAD_DIR, filename);
    fs.writeFileSync(filepath, matches[2], "base64");

    res.json({ success: true, data: { url: `/uploads/${filename}` } });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ success: false, message: "Gagal upload" });
  }
});

module.exports = router;
