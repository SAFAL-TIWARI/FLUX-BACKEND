const FluxWaveRegistration = require("../models/FluxWaveRegistration");

/**
 * Format a Mongoose ValidationError into a clean array of messages.
 */
const formatValidationError = (error) =>
  Object.values(error.errors).map((e) => e.message);

/**
 * @route   POST /api/fluxwave/register
 * @desc    Register a team for FluxWave 2.0
 * @access  Public
 */
const registerParticipant = async (req, res) => {
  try {
    const {
      teamName,
      domain,
      leaderName,
      leaderEmail,
      contactNumber,
      enrollment,
      college,
      branch,
      year,
      teamMembers,
      ideaTitle,
      problemStatement,
    } = req.body;

    // Basic presence check before hitting the DB so we can return a single,
    // clear message instead of a raw Mongoose error for the common case.
    const requiredFields = {
      teamName,
      domain,
      leaderName,
      leaderEmail,
      contactNumber,
      enrollment,
    };
    const missing = Object.entries(requiredFields)
      .filter(([, value]) => !value || String(value).trim() === "")
      .map(([key]) => key);

    if (missing.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required field(s): ${missing.join(", ")}`,
      });
    }

    if (!Array.isArray(teamMembers) || teamMembers.length < 1) {
      return res.status(400).json({
        success: false,
        message: "Please add at least 1 additional team member (team size is 2-4 including the leader).",
      });
    }

    // Collect every email / enrollment in this submission (leader + members)
    const allEmails = [
      leaderEmail.trim().toLowerCase(),
      ...teamMembers.map((m) => (m.email || "").trim().toLowerCase()),
    ];
    const allEnrollments = [
      enrollment.trim().toUpperCase(),
      ...teamMembers.map((m) => (m.enrollment || "").trim().toUpperCase()),
    ];

    // Reject if the same person is listed twice within this one submission
    if (new Set(allEmails).size !== allEmails.length) {
      return res.status(400).json({
        success: false,
        message: "The same email address is listed more than once in this team.",
      });
    }
    if (new Set(allEnrollments).size !== allEnrollments.length) {
      return res.status(400).json({
        success: false,
        message: "The same enrollment number is listed more than once in this team.",
      });
    }

    // Prevent duplicates against everything already stored:
    // - team name clash
    // - email already used as ANY leader or ANY member, anywhere
    // - enrollment already used as ANY leader or ANY member, anywhere
    const existing = await FluxWaveRegistration.findOne({
      $or: [
        { teamName: teamName.trim() },
        { leaderEmail: { $in: allEmails } },
        { "teamMembers.email": { $in: allEmails } },
        { enrollment: { $in: allEnrollments } },
        { "teamMembers.enrollment": { $in: allEnrollments } },
      ],
    });

    if (existing) {
      let duplicateField = "Team name";
      if (existing.teamName.trim().toLowerCase() !== teamName.trim().toLowerCase()) {
        const emailClash =
          allEmails.includes(existing.leaderEmail) ||
          existing.teamMembers.some((m) => allEmails.includes(m.email));
        duplicateField = emailClash ? "One of these emails" : "One of these enrollment numbers";
      }
      return res.status(409).json({
        success: false,
        message: `${duplicateField} is already registered for FluxWave 2.0.`,
      });
    }

    const registration = await FluxWaveRegistration.create({
      teamName,
      domain,
      leaderName,
      leaderEmail,
      contactNumber,
      enrollment,
      college,
      branch,
      year,
      teamMembers,
      ideaTitle,
      problemStatement,
    });

    return res.status(201).json({
      success: true,
      message: "Registration successful! We'll be in touch on WhatsApp/email with next steps.",
      data: registration,
    });
  } catch (error) {
    console.error("FluxWave registration error:", error);

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: "Please fix the errors below and try again.",
        errors: formatValidationError(error),
      });
    }

    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern || {})[0] || "field";
      return res.status(409).json({
        success: false,
        message: `That ${field} is already registered.`,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Something went wrong while registering. Please try again in a moment.",
    });
  }
};

/**
 * @route   GET /api/fluxwave/domains
 * @desc    Get the list of valid domains (kept in sync with the schema)
 * @access  Public
 */
const getDomains = async (req, res) => {
  res.status(200).json({
    success: true,
    data: FluxWaveRegistration.DOMAINS,
  });
};

/**
 * @route   GET /api/fluxwave/count
 * @desc    Get the total number of registered teams (for a live counter on the page)
 * @access  Public
 */
const getRegistrationCount = async (req, res) => {
  try {
    const count = await FluxWaveRegistration.countDocuments();
    res.status(200).json({ success: true, data: { count } });
  } catch (error) {
    console.error("FluxWave count error:", error);
    res.status(500).json({ success: false, message: "Could not fetch registration count." });
  }
};

/**
 * @route   GET /api/fluxwave/registrations
 * @desc    Get all registrations (for admin dashboard use)
 * @access  Private/Admin (attach an auth+admin middleware on the route)
 */
const getAllRegistrations = async (req, res) => {
  try {
    const registrations = await FluxWaveRegistration.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: registrations });
  } catch (error) {
    console.error("FluxWave list error:", error);
    res.status(500).json({ success: false, message: "Could not fetch registrations." });
  }
};

/**
 * @route   PUT /api/fluxwave/submit-idea
 * @desc    Round 2: Submit idea title, problem statement, and PPT link (Jul 20-28)
 * @access  Public (identified by teamName + leaderEmail, since there's no login)
 */
const submitIdea = async (req, res) => {
  try {
    const { teamName, leaderEmail, ideaTitle, problemStatement, pptLink } = req.body;

    if (!teamName || !leaderEmail) {
      return res.status(400).json({
        success: false,
        message: "teamName and leaderEmail are required to identify your team.",
      });
    }
    if (!pptLink) {
      return res.status(400).json({
        success: false,
        message: "A PPT link (Drive/Canva/etc.) is required for this round.",
      });
    }

    const team = await FluxWaveRegistration.findOne({
      teamName: teamName.trim(),
      leaderEmail: leaderEmail.trim().toLowerCase(),
    });

    if (!team) {
      return res.status(404).json({
        success: false,
        message: "No matching team found. Check your team name and leader email.",
      });
    }

    if (team.status === "rejected") {
      return res.status(403).json({
        success: false,
        message: "This team was not shortlisted and cannot submit an idea.",
      });
    }

    team.ideaTitle = ideaTitle || team.ideaTitle;
    team.problemStatement = problemStatement || team.problemStatement;
    team.pptLink = pptLink;
    team.ideaSubmittedAt = new Date();
    if (team.status === "registered") team.status = "idea_submitted";

    await team.save();

    return res.status(200).json({
      success: true,
      message: "Idea and PPT submitted successfully.",
      data: team,
    });
  } catch (error) {
    console.error("FluxWave idea submission error:", error);
    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: "Please fix the errors below and try again.",
        errors: formatValidationError(error),
      });
    }
    return res.status(500).json({
      success: false,
      message: "Something went wrong while submitting your idea. Please try again.",
    });
  }
};

/**
 * @route   PATCH /api/fluxwave/:id/status
 * @desc    Round 3: Evaluation - move a team to shortlisted/rejected/finalist (Jul 29-31)
 * @access  Private/Admin (attach an auth+admin middleware on the route)
 */
const updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ["registered", "idea_submitted", "shortlisted", "rejected", "finalist"];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `status must be one of: ${validStatuses.join(", ")}`,
      });
    }

    const team = await FluxWaveRegistration.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );

    if (!team) {
      return res.status(404).json({ success: false, message: "Team not found." });
    }

    return res.status(200).json({
      success: true,
      message: `Team status updated to '${status}'.`,
      data: team,
    });
  } catch (error) {
    console.error("FluxWave status update error:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while updating status.",
    });
  }
};

/**
 * @route   PATCH /api/fluxwave/:id/checkin
 * @desc    Round 4: Grand Finale - mark a finalist team as checked in at KSH (Aug 1)
 * @access  Private/Admin (attach an auth+admin middleware on the route)
 */
const checkIn = async (req, res) => {
  try {
    const team = await FluxWaveRegistration.findById(req.params.id);

    if (!team) {
      return res.status(404).json({ success: false, message: "Team not found." });
    }

    if (team.status !== "finalist") {
      return res.status(403).json({
        success: false,
        message: "Only finalist teams can be checked in at the Grand Finale.",
      });
    }

    team.checkedIn = true;
    team.checkedInAt = new Date();
    await team.save();

    return res.status(200).json({
      success: true,
      message: `${team.teamName} checked in for the Grand Finale.`,
      data: team,
    });
  } catch (error) {
    console.error("FluxWave check-in error:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while checking in the team.",
    });
  }
};

/**
 * @route   PUT /api/fluxwave/submit-final
 * @desc    Round 2 (Grand Finale, Aug 1): Submit deploy link, GitHub repo, and screen recording
 * @access  Public (identified by teamName + leaderEmail, since there's no login)
 */
const submitFinal = async (req, res) => {
  try {
    const { teamName, leaderEmail, deployLink, githubLink, screenRecordingLink } = req.body;

    if (!teamName || !leaderEmail) {
      return res.status(400).json({
        success: false,
        message: "teamName and leaderEmail are required to identify your team.",
      });
    }
    if (!deployLink || !githubLink || !screenRecordingLink) {
      return res.status(400).json({
        success: false,
        message: "Deploy link, GitHub repo URL, and screen recording link are all required.",
      });
    }

    const team = await FluxWaveRegistration.findOne({
      teamName: teamName.trim(),
      leaderEmail: leaderEmail.trim().toLowerCase(),
    });

    if (!team) {
      return res.status(404).json({
        success: false,
        message: "No matching team found. Check your team name and leader email.",
      });
    }

    if (team.status !== "finalist") {
      return res.status(403).json({
        success: false,
        message: "Only finalist teams can submit their final project.",
      });
    }

    team.deployLink = deployLink;
    team.githubLink = githubLink;
    team.screenRecordingLink = screenRecordingLink;
    team.finalSubmittedAt = new Date();
    await team.save();

    return res.status(200).json({
      success: true,
      message: "Final submission received. Good luck at the Grand Finale!",
      data: team,
    });
  } catch (error) {
    console.error("FluxWave final submission error:", error);
    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: "Please fix the errors below and try again.",
        errors: formatValidationError(error),
      });
    }
    return res.status(500).json({
      success: false,
      message: "Something went wrong while submitting your final project. Please try again.",
    });
  }
};

module.exports = {
  registerParticipant,
  getDomains,
  getRegistrationCount,
  getAllRegistrations,
  submitIdea,
  submitFinal,
  updateStatus,
  checkIn,
};