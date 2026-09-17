const asyncHandler = require('express-async-handler');
const RecruitmentRegistration = require('../models/RecruitmentRegistration');

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@satiengg\.in$/i;
const ENROLLMENT_REGEX = /^0108/i;

// @desc    Register a new recruitment applicant
// @route   POST /api/recruitment/register
// @access  Public
const registerCandidate = asyncHandler(async (req, res) => {
  const {
    fullName,
    enrollmentNo,
    year,
    branch,
    branchOther,
    phone,
    email,
    linkedinUrl,
    githubUrl,
    resumeUrl,
    techSkillCategories,
    softwareSkills,
    hardwareSkills,
    designingSkills,
    projectDriveUrl,
    softSkills,
    markedFieldsExperience,
    tellAboutYourself,
    significantAchievement,
    clubsJoined,
    whyJoinClub,
    strengthsWeaknesses,
    handleTeamFailure,
    handleTeamConflict,
    whyHireYou,
    whatKnowAboutClub,
    fluxEventsAttended,
    otherEventsAttended,
    expectationsFromClub,
  } = req.body;

  // 1. Mandatory Validations
  if (!fullName || !fullName.trim()) {
    res.status(400);
    throw new Error('Full name is required.');
  }

  if (!enrollmentNo || !enrollmentNo.trim()) {
    res.status(400);
    throw new Error('Enrollment number is required.');
  }

  const trimmedEnrollment = enrollmentNo.trim().toUpperCase();
  if (!ENROLLMENT_REGEX.test(trimmedEnrollment)) {
    res.status(400);
    throw new Error('Enrollment number must start with 0108 (e.g. 0108CS231001).');
  }

  if (!phone || !phone.trim()) {
    res.status(400);
    throw new Error('WhatsApp contact number is required.');
  }

  if (!email || !email.trim()) {
    res.status(400);
    throw new Error('Email address is required.');
  }

  const trimmedEmail = email.trim().toLowerCase();
  if (!EMAIL_REGEX.test(trimmedEmail)) {
    res.status(400);
    throw new Error('Official college email (@satiengg.in) is compulsory.');
  }

  // 2. Check for Duplicate Registration
  const existingEmail = await RecruitmentRegistration.findOne({ email: trimmedEmail });
  if (existingEmail) {
    res.status(409);
    throw new Error(`An application with email '${trimmedEmail}' has already been submitted.`);
  }

  const existingEnrollment = await RecruitmentRegistration.findOne({ enrollmentNo: trimmedEnrollment });
  if (existingEnrollment) {
    res.status(409);
    throw new Error(`An application with enrollment number '${trimmedEnrollment}' has already been submitted.`);
  }

  // 3. Generate Ticket ID
  const randomDigits = Math.floor(100000 + Math.random() * 900000);
  const ticketId = `FLUX-2026-REG-${randomDigits}`;

  // 4. Create Registration Record
  const registration = await RecruitmentRegistration.create({
    fullName: fullName.trim(),
    enrollmentNo: trimmedEnrollment,
    year: year || '2nd Year',
    branch: branch || 'CS',
    branchOther: branchOther ? branchOther.trim() : '',
    phone: phone.trim(),
    email: trimmedEmail,
    linkedinUrl: linkedinUrl ? linkedinUrl.trim() : '',
    githubUrl: githubUrl ? githubUrl.trim() : '',
    resumeUrl: resumeUrl ? resumeUrl.trim() : '',
    techSkillCategories: Array.isArray(techSkillCategories) ? techSkillCategories : [],
    softwareSkills: Array.isArray(softwareSkills) ? softwareSkills : [],
    hardwareSkills: Array.isArray(hardwareSkills) ? hardwareSkills : [],
    designingSkills: Array.isArray(designingSkills) ? designingSkills : [],
    projectDriveUrl: projectDriveUrl ? projectDriveUrl.trim() : '',
    softSkills: Array.isArray(softSkills) ? softSkills : [],
    markedFieldsExperience: markedFieldsExperience ? markedFieldsExperience.trim() : '',
    tellAboutYourself: tellAboutYourself ? tellAboutYourself.trim() : '',
    significantAchievement: significantAchievement ? significantAchievement.trim() : '',
    clubsJoined: Array.isArray(clubsJoined) ? clubsJoined : [],
    whyJoinClub: whyJoinClub ? whyJoinClub.trim() : '',
    strengthsWeaknesses: strengthsWeaknesses ? strengthsWeaknesses.trim() : '',
    handleTeamFailure: handleTeamFailure ? handleTeamFailure.trim() : '',
    handleTeamConflict: handleTeamConflict ? handleTeamConflict.trim() : '',
    whyHireYou: whyHireYou ? whyHireYou.trim() : '',
    whatKnowAboutClub: whatKnowAboutClub ? whatKnowAboutClub.trim() : '',
    fluxEventsAttended: fluxEventsAttended ? fluxEventsAttended.trim() : '',
    otherEventsAttended: otherEventsAttended ? otherEventsAttended.trim() : '',
    expectationsFromClub: expectationsFromClub ? expectationsFromClub.trim() : '',
    ticketId,
  });

  res.status(201).json({
    success: true,
    message: 'Recruitment registration application submitted successfully!',
    ticketId,
    data: registration,
  });
});

// @desc    Check recruitment application status by email or enrollment
// @route   GET /api/recruitment/status?email=someone@satiengg.in
// @access  Public
const getRecruitmentStatus = asyncHandler(async (req, res) => {
  const { email, enrollmentNo } = req.query;

  let query = {};
  if (email) query.email = email.trim().toLowerCase();
  if (enrollmentNo) query.enrollmentNo = enrollmentNo.trim().toUpperCase();

  if (!email && !enrollmentNo) {
    res.status(400);
    throw new Error('Please provide an email or enrollment number to query status.');
  }

  const registration = await RecruitmentRegistration.findOne(query).select(
    'ticketId fullName enrollmentNo branch year status createdAt'
  );

  if (!registration) {
    return res.status(200).json({
      success: true,
      registered: false,
      message: 'No active application found.',
    });
  }

  res.status(200).json({
    success: true,
    registered: true,
    data: registration,
  });
});

// @desc    Get all recruitment registrations (Admin / Public Organizer view)
// @route   GET /api/recruitment/registrations
// @access  Public / Private
const getAllRecruitmentRegistrations = asyncHandler(async (req, res) => {
  const registrations = await RecruitmentRegistration.find({}).sort({ createdAt: -1 });
  res.status(200).json({
    success: true,
    count: registrations.length,
    data: registrations,
  });
});

// @desc    Delete a recruitment registration
// @route   DELETE /api/recruitment/registrations/:id
// @access  Private/Admin
const deleteRecruitmentRegistration = asyncHandler(async (req, res) => {
  const registration = await RecruitmentRegistration.findById(req.params.id);
  if (!registration) {
    res.status(404);
    throw new Error('Recruitment application record not found.');
  }
  await registration.deleteOne();
  res.status(200).json({
    success: true,
    message: 'Recruitment application purged successfully.',
  });
});

// @desc    Update recruitment registration status
// @route   PATCH /api/recruitment/public-status/:id
// @access  Public / Event Admin
const updateRecruitmentStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const registration = await RecruitmentRegistration.findById(req.params.id);

  if (!registration) {
    res.status(404);
    throw new Error('Candidate application not found.');
  }

  registration.status = status || registration.status;
  await registration.save();

  res.status(200).json({
    success: true,
    message: `Candidate status updated to ${registration.status}`,
    data: registration,
  });
});

module.exports = {
  registerCandidate,
  getRecruitmentStatus,
  getAllRecruitmentRegistrations,
  deleteRecruitmentRegistration,
  updateRecruitmentStatus,
};


