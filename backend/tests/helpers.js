const User = require('../src/models/User.model');
const CandidateProfile = require('../src/models/CandidateProfile.model');
const Company = require('../src/models/Company.model');
const Job = require('../src/models/Job.model');
const Application = require('../src/models/Application.model');
const Notification = require('../src/models/Notification.model');
const Conversation = require('../src/models/Conversation.model');
const { generateToken } = require('../src/utils/generateToken');

/** Create a user and return { user, token } */
const createUser = async (role = 'candidate', overrides = {}) => {
  const defaults = {
    name: `Test ${role}`,
    email: `${role}_${Date.now()}@test.com`,
    password: 'password123',
    role,
    isEmailVerified: true,
  };
  const user = await User.create({ ...defaults, ...overrides });
  if (role === 'candidate') {
    await CandidateProfile.create({ userId: user._id });
  }
  const token = generateToken(user._id);
  return { user, token };
};

/** Create a company for a recruiter */
const createCompany = async (recruiterId, overrides = {}) => {
  return Company.create({
    name: 'Test Company',
    industry: 'Information Technology',
    location: 'Bengaluru',
    createdBy: recruiterId,
    ...overrides,
  });
};

/** Create a job posted by a recruiter */
const createJob = async (recruiterId, companyId, overrides = {}) => {
  return Job.create({
    title: 'Software Engineer',
    description: 'A great job opportunity',
    location: 'Bengaluru',
    jobType: 'full-time',
    experienceMin: 1,
    experienceMax: 3,
    skills: ['JavaScript', 'React'],
    openings: 2,
    companyId,
    postedBy: recruiterId,
    status: 'active',
    ...overrides,
  });
};

/** Apply a candidate to a job */
const createApplication = async (jobId, candidateId, overrides = {}) => {
  return Application.create({
    jobId,
    candidateId,
    status: 'applied',
    timeline: [{ status: 'applied', note: 'Applied', updatedBy: candidateId }],
    ...overrides,
  });
};

/** Create a notification */
const createNotification = async (userId, overrides = {}) => {
  return Notification.create({
    userId,
    type: 'application_update',
    title: 'Test notification',
    body: 'This is a test',
    isRead: false,
    ...overrides,
  });
};

/** Create a conversation between two users */
const createConversation = async (userA, userB) => {
  return Conversation.create({ participants: [userA, userB] });
};

module.exports = {
  createUser,
  createCompany,
  createJob,
  createApplication,
  createNotification,
  createConversation,
};
