const express = require("express");
const router = express.Router();

const {
    registerParticipant
} = require("../controllers/fluxWaveController");

// POST /api/fluxwave/register
router.post("/register", registerParticipant);

module.exports = router;
