const mongoose = require('mongoose');

const teamMemberSchema = new mongoose.Schema({
  name: { type: String, trim: true, required: true, maxlength: 80 },
  phone: { type: String, trim: true, default: '' },
}, { _id: false });

const statusHistorySchema = new mongoose.Schema({
  status: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  note: { type: String, default: '' },
}, { _id: false });

const technovisionRegistrationSchema = new mongoose.Schema({
  applicationId: { type: String, required: true, unique: true, trim: true, uppercase: true },
  fullName: { type: String, required: true, trim: true },
  enrollmentNo: { type: String, required: true, trim: true, uppercase: true },
  email: { type: String, required: true, trim: true, lowercase: true },
  mobile: { type: String, required: true, trim: true },
  college: { type: String, required: true, trim: true },
  branch: { type: String, required: true, trim: true },
  academicYear: { type: String, required: true },
  competitionId: {
    type: String,
    required: true,
    enum: ['model-presentation', 'robo-obstacle-challenge', 'robo-rumble'],
  },
  competitionName: { type: String, default: '' },
  participationType: { type: String, required: true, enum: ['individual', 'team'] },
  teamName: { type: String, trim: true, default: '' },
  teamMembers: { type: [teamMemberSchema], default: [] },
  projectName: { type: String, required: true, trim: true },
  projectDescription: { type: String, trim: true, default: '' },
  status: {
    type: String,
    enum: ['SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'WAITLISTED', 'REJECTED', 'WITHDRAWN'],
    default: 'SUBMITTED',
  },
  statusHistory: { type: [statusHistorySchema], default: [] },
}, {
  timestamps: true,
  collection: 'technovision_registrations',
});

technovisionRegistrationSchema.index({ email: 1, competitionId: 1 }, { unique: true });

module.exports = mongoose.models.TechnovisionRegistration
  || mongoose.model('TechnovisionRegistration', technovisionRegistrationSchema);