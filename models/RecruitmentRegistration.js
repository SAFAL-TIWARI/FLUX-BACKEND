const mongoose = require('mongoose');

const recruitmentRegistrationSchema = new mongoose.Schema(
  {
    // Step 1: Personal & Academic Details
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
    },
    enrollmentNo: {
      type: String,
      required: [true, 'Enrollment number is required'],
      uppercase: true,
      trim: true,
    },
    year: {
      type: String,
      default: '2nd Year',
      trim: true,
    },
    branch: {
      type: String,
      required: [true, 'Branch is required'],
      trim: true,
    },
    branchOther: {
      type: String,
      trim: true,
      default: '',
    },
    phone: {
      type: String,
      required: [true, 'WhatsApp contact number is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email address is required'],
      lowercase: true,
      trim: true,
    },

    // Step 2: Profiles & Skills
    linkedinUrl: {
      type: String,
      trim: true,
      default: '',
    },
    githubUrl: {
      type: String,
      trim: true,
      default: '',
    },
    resumeUrl: {
      type: String,
      trim: true,
      default: '',
    },
    techSkillCategories: [
      {
        type: String,
        trim: true,
      },
    ],
    softwareSkills: [
      {
        type: String,
        trim: true,
      },
    ],
    hardwareSkills: [
      {
        type: String,
        trim: true,
      },
    ],
    designingSkills: [
      {
        type: String,
        trim: true,
      },
    ],
    projectDriveUrl: {
      type: String,
      trim: true,
      default: '',
    },

    // Step 3: Soft Skills & Experience
    softSkills: [
      {
        type: String,
        trim: true,
      },
    ],
    markedFieldsExperience: {
      type: String,
      trim: true,
      default: '',
    },
    tellAboutYourself: {
      type: String,
      trim: true,
      default: '',
    },
    significantAchievement: {
      type: String,
      trim: true,
      default: '',
    },
    clubsJoined: [
      {
        type: String,
        trim: true,
      },
    ],

    // Step 4: Behavioral & Club Fit
    whyJoinClub: {
      type: String,
      trim: true,
      default: '',
    },
    strengthsWeaknesses: {
      type: String,
      trim: true,
      default: '',
    },
    handleTeamFailure: {
      type: String,
      trim: true,
      default: '',
    },
    handleTeamConflict: {
      type: String,
      trim: true,
      default: '',
    },
    whyHireYou: {
      type: String,
      trim: true,
      default: '',
    },
    whatKnowAboutClub: {
      type: String,
      trim: true,
      default: '',
    },
    fluxEventsAttended: {
      type: String,
      trim: true,
      default: '',
    },
        otherEventsAttended: {
      type: String,
      trim: true,
      default: '',
    },
    expectationsFromClub: {
      type: String,
      trim: true,
      default: '',
    },

    ticketId: {
      type: String,
      unique: true,
    },
    status: {
      type: String,
      enum: ['Pending', 'Reviewed', 'Shortlisted', 'Rejected'],
      default: 'Pending',
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for quick lookup
recruitmentRegistrationSchema.index({ email: 1, enrollmentNo: 1 });

module.exports = mongoose.model('RecruitmentRegistration', recruitmentRegistrationSchema);
