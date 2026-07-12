const FluxWaveRegistration = require("../models/FluxWaveRegistration");

// Register a participant
const registerParticipant = async (req, res) => {
    try {
        const registration = await FluxWaveRegistration.create(req.body);

        res.status(201).json({
            success: true,
            message: "Registration successful",
            data: registration
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Registration failed",
            error: error.message
        });
    }
};

module.exports = {
    registerParticipant
};
