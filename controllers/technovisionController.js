const mongoose = require('mongoose');
const TechnovisionRegistration = require('../models/TechnovisionRegistration');

const COMPETITIONS = [
  { id: 'model-presentation', title: 'Model Presentation', category: 'Hardware Innovation', teamSize: '1 – 4 Members' },
  { id: 'robo-obstacle-challenge', title: 'Bot Racing', category: 'Autonomous & RC Robotics', teamSize: 'Solo or Dual' },
  { id: 'robo-rumble', title: 'Robo Rumble', category: 'Combat Robotics', teamSize: '2 – 4 Members' },
];

const COMPETITION_RULES = {
  'model-presentation': { types: ['individual', 'team'], min: 1, max: 4 },
  'robo-obstacle-challenge': { types: ['individual', 'team'], min: 1, max: 2 },
  'robo-rumble': { types: ['team'], min: 2, max: 4 },
};

const STATUS_VALUES = ['SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'WAITLISTED', 'REJECTED', 'WITHDRAWN'];
const COMPETITION_NAMES = Object.fromEntries(COMPETITIONS.map(({ id, title }) => [id, title]));

const generateApplicationId = (competitionId) => {
  const codes = { 'model-presentation': 'MP', 'robo-obstacle-challenge': 'ROC', 'robo-rumble': 'RR' };
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const suffix = Array.from({ length: 5 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `TV26-${codes[competitionId]}-${suffix}`;
};

const sendValidationError = (res, message) => res.status(400).json({ message, errors: [message] });

const getCompetitions = (req, res) => {
  res.json({
    event: {
      name: 'Technovision 2026',
      tagline: 'Innovate. Build. Compete.',
      dates: '2 – 3 November 2026',
      venue: 'SATI College, Vidisha',
    },
    competitions: COMPETITIONS,
  });
};

const registerParticipant = async (req, res) => {
  const {
    fullName, enrollmentNo, email, mobile, college, branch, academicYear,
    competitionId, participationType, teamName, teamMembers = [], projectName, projectDescription,
  } = req.body;

  const required = { fullName, enrollmentNo, email, mobile, college, branch, academicYear, competitionId, projectName };
  const missing = Object.entries(required).find(([, value]) => !String(value || '').trim());
  if (missing) return sendValidationError(res, `${missing[0]} is required`);
  if (!/^\S+@\S+\.\S+$/.test(email.trim())) return sendValidationError(res, 'Valid email is required');
  if (!/^[6-9]\d{9}$/.test(mobile.trim())) return sendValidationError(res, 'Enter a valid 10-digit mobile number');
  if (!Array.isArray(teamMembers)) return sendValidationError(res, 'Team members must be a list');

  const rules = COMPETITION_RULES[competitionId];
  if (!rules) return sendValidationError(res, 'Please select a valid competition');
  if (!rules.types.includes(participationType)) return sendValidationError(res, 'Invalid participation type for this competition');

  const members = participationType === 'team'
    ? teamMembers.filter((member) => member && String(member.name || '').trim())
    : [];
  const participantCount = 1 + members.length;
  if (participantCount < rules.min || participantCount > rules.max) {
    return sendValidationError(res, `Team size must be ${rules.min}–${rules.max} participants for this competition`);
  }
  if (participationType === 'team' && !String(teamName || '').trim()) {
    return sendValidationError(res, 'Team name is required');
  }

  try {
    let applicationId;
    do {
      applicationId = generateApplicationId(competitionId);
    } while (await TechnovisionRegistration.exists({ applicationId }));

    const registration = await TechnovisionRegistration.create({
      applicationId,
      fullName: fullName.trim(),
      enrollmentNo: enrollmentNo.trim().toUpperCase(),
      email: email.trim().toLowerCase(),
      mobile: mobile.trim(),
      college: college.trim(),
      branch: branch.trim(),
      academicYear,
      competitionId,
      competitionName: COMPETITION_NAMES[competitionId],
      participationType,
      teamName: participationType === 'team' ? teamName.trim() : '',
      teamMembers: members.map(({ name, phone }) => ({ name: name.trim(), phone: String(phone || '').trim() })),
      projectName: projectName.trim(),
      projectDescription: String(projectDescription || '').trim(),
      statusHistory: [{ status: 'SUBMITTED', note: 'Application received and submitted successfully' }],
    });

    return res.status(201).json({
      message: 'Registration successfully saved',
      applicationId: registration.applicationId,
      competitionName: registration.competitionName,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: 'This email is already registered for the selected competition.' });
    }
    if (error.name === 'ValidationError') return sendValidationError(res, error.message);
    throw error;
  }
};

const trackApplication = async (req, res) => {
  const registration = await TechnovisionRegistration.findOne({
    applicationId: req.params.appId.trim().toUpperCase(),
  }).lean();
  if (!registration) return res.status(404).json({ message: 'Application not found' });

  return res.json({
    applicationId: registration.applicationId,
    competitionName: registration.competitionName || registration.competitionId,
    applicantName: registration.fullName,
    enrollmentNo: registration.enrollmentNo,
    teamName: registration.teamName,
    projectName: registration.projectName,
    status: registration.status,
    submittedAt: registration.createdAt,
    updatedAt: registration.updatedAt,
    statusHistory: registration.statusHistory,
  });
};

const verifyAdminKey = (req, res) => {
  const configuredKey = process.env.TECHNOVISION_ADMIN_KEY;
  if (!configuredKey) return res.status(503).json({ message: 'Technovision admin key is not configured.', valid: false });
  const providedKey = req.body?.key || req.headers['x-technovision-key'];
  if (providedKey !== configuredKey) return res.status(401).json({ message: 'Invalid admin passkey', valid: false });
  return res.json({ message: 'Key verified', valid: true });
};

const getRegistrations = async (req, res) => {
  const registrations = await TechnovisionRegistration.find().sort({ createdAt: -1 }).lean();
  return res.json({ registrations });
};

const getStats = async (req, res) => {
  const registrations = await TechnovisionRegistration.find({}, 'status competitionId').lean();
  const byCompetition = {};
  registrations.forEach(({ competitionId }) => {
    byCompetition[competitionId] = (byCompetition[competitionId] || 0) + 1;
  });
  const count = (status) => registrations.filter((registration) => registration.status === status).length;
  return res.json({
    total: registrations.length,
    pending: count('SUBMITTED'),
    underReview: count('UNDER_REVIEW'),
    approved: count('APPROVED'),
    waitlisted: count('WAITLISTED'),
    rejected: count('REJECTED'),
    byCompetition,
  });
};

const getRegistrationQuery = (id) => id.startsWith('TV26-')
  ? { applicationId: id.toUpperCase() }
  : mongoose.isValidObjectId(id) ? { _id: id } : null;

const updateRegistrationStatus = async (req, res) => {
  const { status, note = '' } = req.body;
  if (!STATUS_VALUES.includes(status)) return sendValidationError(res, 'Valid status is required');
  const query = getRegistrationQuery(req.params.id);
  if (!query) return res.status(404).json({ message: 'Registration not found' });

  const registration = await TechnovisionRegistration.findOneAndUpdate(query, {
    $set: { status },
    $push: { statusHistory: { status, note: String(note).trim() } },
  }, { new: true, runValidators: true }).lean();
  if (!registration) return res.status(404).json({ message: 'Registration not found' });
  return res.json({ message: 'Status updated', registration });
};

const deleteRegistration = async (req, res) => {
  const query = getRegistrationQuery(req.params.id);
  if (!query) return res.status(404).json({ message: 'Registration not found' });
  const registration = await TechnovisionRegistration.findOneAndDelete(query);
  if (!registration) return res.status(404).json({ message: 'Registration not found' });
  return res.json({ message: 'Registration deleted' });
};

const exportRegistrations = async (req, res) => {
  const registrations = await TechnovisionRegistration.find().sort({ createdAt: -1 }).lean();
  const headers = ['Application ID', 'Enrollment No', 'Full Name', 'Email', 'Mobile', 'College', 'Branch', 'Academic Year', 'Competition', 'Type', 'Team Name', 'Project Name', 'Status', 'Submitted At'];
  const quote = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;
  const rows = registrations.map((registration) => [
    registration.applicationId, registration.enrollmentNo, registration.fullName, registration.email,
    registration.mobile, registration.college, registration.branch, registration.academicYear,
    registration.competitionName || registration.competitionId, registration.participationType,
    registration.teamName, registration.projectName, registration.status, registration.createdAt,
  ].map(quote));
  res.set({ 'Content-Type': 'text/csv', 'Content-Disposition': 'attachment; filename="technovision_registrations.csv"' });
  return res.send([headers.map(quote).join(','), ...rows.map((row) => row.join(','))].join('\n'));
};

module.exports = {
  getCompetitions,
  registerParticipant,
  trackApplication,
  verifyAdminKey,
  getRegistrations,
  getStats,
  updateRegistrationStatus,
  deleteRegistration,
  exportRegistrations,
};