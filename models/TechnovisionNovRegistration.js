const mongoose = require("mongoose");

const memberSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Member name is required"],
      trim: true,
      maxlength: [80, "Name cannot exceed 80 characters"],
    },
    email: {
      type: String,
      required: [true, "Member email is required"],
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email address"],
    },
    contact: {
      type: String,
      required: [true, "Member contact number is required"],
      trim: true,
    },
    college: {
      type: String,
      required: [true, "Member college is required"],
      trim: true,
    },
    branch: {
      type: String,
      required: [true, "Member branch is required"],
      trim: true,
    },
    enrollmentNo: {
      type: String,
      required: [true, "Member enrollment number is required"],
      trim: true,
    },
    year: {
      type: String,
      required: [true, "Member year is required"],
      enum: ["1st Year", "2nd Year", "3rd Year", "4th Year"],
    },
  },
  { _id: false }
);

const technovisionNovRegistrationSchema = new mongoose.Schema(
  {
    eventId: {
      type: String,
      required: [true, "Event ID is required"],
      enum: {
        values: ["model", "robo", "botRacing"],
        message: "'{VALUE}' is not a valid event",
      },
    },
    eventName: {
      type: String,
      required: true,
    },
    teamName: {
      type: String,
      required: [true, "Team name is required"],
      trim: true,
      minlength: [2, "Team name must be at least 2 characters"],
      maxlength: [60, "Team name cannot exceed 60 characters"],
    },
    teamSize: {
      type: Number,
      required: [true, "Team size is required"],
      min: [1, "Team size must be at least 1"],
      max: [2, "Team size cannot exceed 2"],
    },
    leaderName: {
      type: String,
      required: [true, "Team leader name is required"],
      trim: true,
      maxlength: [80, "Leader name cannot exceed 80 characters"],
    },
    leaderEmail: {
      type: String,
      required: [true, "Team leader email is required"],
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email address"],
    },
    leaderContact: {
      type: String,
      required: [true, "Team leader contact number is required"],
      trim: true,
    },
    leaderCollege: {
      type: String,
      required: [true, "Team leader college is required"],
      trim: true,
    },
    leaderBranch: {
      type: String,
      required: [true, "Team leader branch is required"],
      trim: true,
    },
    leaderEnrollmentNo: {
      type: String,
      required: [true, "Team leader enrollment number is required"],
      trim: true,
    },
    leaderYear: {
      type: String,
      required: [true, "Team leader year is required"],
      enum: ["1st Year", "2nd Year", "3rd Year", "4th Year"],
    },
    teamMembers: {
      type: [memberSchema],
      default: [],
    },
    ticketId: {
      type: String,
      required: true,
      unique: true,
    },
    status: {
      type: String,
      enum: ["registered", "confirmed", "attended"],
      default: "confirmed",
    },
    // Used only for the per-IP registration limit; never sent to clients.
    submitterIp: {
      type: String,
      select: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// A student leader email can only register ONCE per event
technovisionNovRegistrationSchema.index({ eventId: 1, leaderEmail: 1 }, { unique: true });

// Prevent duplicate team names inside the same event
technovisionNovRegistrationSchema.index({ eventId: 1, teamName: 1 });

module.exports = mongoose.model(
  "TechnovisionNovRegistration",
  technovisionNovRegistrationSchema
);
