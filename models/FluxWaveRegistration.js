
const mongoose = require("mongoose");

const fluxWaveRegistrationSchema = new mongoose.Schema(
{
    teamName: {
        type: String,
        required: true,
    },
    leaderName: {
        type: String,
        required: true,
    },
    contactNumber: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
    },
    enrollment: {
        type: String,
        required: true,
    },
    round: {
        type: Number,
        required: true,
    },
},
{
    timestamps: true,
});

module.exports = mongoose.model(
    "FluxWaveRegistration",
    fluxWaveRegistrationSchema
);
