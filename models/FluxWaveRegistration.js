const mongoose = require("mongoose");

const DOMAINS = [
  "IoT & Hardware",
  "Artificial Intelligence",
  "Cyber Security",
  "Web3 & Blockchain",
  "Open Innovation",
  "Game Development",
];

// Branch codes as used in the college's enrollment numbering scheme
const BRANCHES = ["EC", "AI", "CS", "IT", "BC", "EE", "ME"];

// Only the college domain is allowed to register
const collegeEmailRegex = /^[a-zA-Z0-9._%+-]+@satiengg\.in$/;

const phoneRegex = /^[6-9]\d{9}$/; // 10-digit Indian mobile number

const teamMemberSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Member name is required"],
      trim: true,
      maxlength: [80, "Member name is too long"],
    },
    email: {
      type: String,
      required: [true, "Member email is required"],
      trim: true,
      lowercase: true,
      match: [collegeEmailRegex, "Use your college email ending with @satiengg.in"],
    },
    enrollment: {
      type: String,
      required: [true, "Member enrollment number is required"],
      trim: true,
      uppercase: true,
    },
  },
  { _id: false }
);

const fluxWaveRegistrationSchema = new mongoose.Schema(
  {
    teamName: {
      type: String,
      required: [true, "Team name is required"],
      trim: true,
      minlength: [3, "Team name must be at least 3 characters"],
      maxlength: [50, "Team name cannot exceed 50 characters"],
      unique: true,
    },
    domain: {
      type: String,
      required: [true, "Please select a domain"],
      enum: {
        values: DOMAINS,
        message: "'{VALUE}' is not a valid domain",
      },
    },
    leaderName: {
      type: String,
      required: [true, "Team leader name is required"],
      trim: true,
      maxlength: [80, "Leader name is too long"],
    },
    leaderEmail: {
      type: String,
      required: [true, "Team leader email is required"],
      trim: true,
      lowercase: true,
      unique: true,
      match: [collegeEmailRegex, "Use your college email ending with @satiengg.in"],
    },
    contactNumber: {
      type: String,
      required: [true, "Contact number is required"],
      trim: true,
      match: [phoneRegex, "Enter a valid 10-digit mobile number"],
    },
    enrollment: {
      type: String,
      required: [true, "Leader enrollment number is required"],
      trim: true,
      uppercase: true,
      unique: true,
    },
    college: {
      type: String,
      required: [true, "College name is required"],
      trim: true,
      default: "Samrat Ashok Technological Institute (SATI), Vidisha",
    },
    branch: {
      type: String,
      trim: true,
    },
    year: {
      type: String,
      enum: {
        values: ["1st Year", "2nd Year", "3rd Year", "4th Year"],
        message: "'{VALUE}' is not a valid year",
      },
    },
    teamMembers: {
      type: [teamMemberSchema],
      default: [],
      validate: {
        validator: function (members) {
          // Team size is 2-4 including the leader, so 1-3 additional members
          return members.length >= 1 && members.length <= 3;
        },
        message: "A team must have 1 to 3 additional members (2-4 including the leader)",
      },
    },
    ideaTitle: {
      type: String,
      trim: true,
      maxlength: [120, "Idea title cannot exceed 120 characters"],
    },
    problemStatement: {
      type: String,
      trim: true,
      maxlength: [1000, "Problem statement cannot exceed 1000 characters"],
    },
    // Round 2: Idea & PPT submission (Jul 20-28)
    pptLink: {
      type: String,
      trim: true,
      match: [/^https?:\/\/.+/, "PPT link must be a valid URL (Drive/Canva/etc.)"],
    },
    ideaSubmittedAt: {
      type: Date,
    },
    // Round 2: Final project submission at the Grand Finale (Aug 1)
    deployLink: {
      type: String,
      trim: true,
      match: [/^https?:\/\/.+/, "Deploy link must be a valid URL"],
    },
    githubLink: {
      type: String,
      trim: true,
      match: [/^https?:\/\/(www\.)?github\.com\/.+/, "Enter a valid GitHub repository URL"],
    },
    screenRecordingLink: {
      type: String,
      trim: true,
      match: [/^https?:\/\/.+/, "Screen recording link must be a valid URL"],
    },
    finalSubmittedAt: {
      type: Date,
    },
    // Round 3: Evaluation (Jul 29-31) -> Round 4: Grand Finale (Aug 1)
    status: {
      type: String,
      enum: {
        values: ["registered", "idea_submitted", "shortlisted", "rejected", "finalist"],
        message: "'{VALUE}' is not a valid status",
      },
      default: "registered",
    },
    checkedIn: {
      type: Boolean,
      default: false,
    },
    checkedInAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Note: teamName and leaderEmail already get a unique index from
// `unique: true` on their field definitions above — no need to declare
// schema.index() separately for them (that caused a duplicate-index warning).

fluxWaveRegistrationSchema.statics.DOMAINS = DOMAINS;
fluxWaveRegistrationSchema.statics.BRANCHES = BRANCHES;

// ---------------------------------------------------------------------
// TEMPORARY DIAGNOSTIC — remove once you've confirmed the right file
// is loading. Prints the exact schema paths this process is using,
// once, at boot. If you see "round" or a top-level "email" in this
// list, a DIFFERENT file than this one is being required somewhere —
// search your project for another models/FluxWaveRegistration*.js
// (check for case differences, a build/dist folder, or a symlink).
// ---------------------------------------------------------------------
console.log(
  "[FluxWaveRegistration model] loaded from:",
  __filename,
  "\n[FluxWaveRegistration model] schema paths:",
  Object.keys(fluxWaveRegistrationSchema.paths)
);

module.exports = mongoose.model("FluxWaveRegistration", fluxWaveRegistrationSchema);