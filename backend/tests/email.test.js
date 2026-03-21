/**
 * Unit tests for src/utils/email.js
 * We mock nodemailer so no real SMTP connection is made.
 */

// Must mock nodemailer BEFORE requiring email.js
const mockSendMail = jest.fn().mockResolvedValue({ messageId: 'test-id' });
jest.mock('nodemailer', () => ({
  createTransport: jest.fn(() => ({ sendMail: mockSendMail })),
}));

const { sendEmail, emailTemplates } = require('../src/utils/email');

beforeEach(() => {
  jest.clearAllMocks();
});

// ─── sendEmail ────────────────────────────────────────────────────────────────

describe('sendEmail', () => {
  it('calls transporter.sendMail with correct args', async () => {
    await sendEmail({ to: 'user@test.com', subject: 'Hello', html: '<p>Hi</p>' });
    expect(mockSendMail).toHaveBeenCalledTimes(1);
    expect(mockSendMail).toHaveBeenCalledWith(
      expect.objectContaining({ to: 'user@test.com', subject: 'Hello', html: '<p>Hi</p>' })
    );
  });

  it('does not throw when sendMail fails (error is caught internally)', async () => {
    mockSendMail.mockRejectedValueOnce(new Error('SMTP error'));
    await expect(sendEmail({ to: 'x@x.com', subject: 'S', html: 'H' })).resolves.not.toThrow();
  });
});

// ─── emailTemplates.verifyEmail ───────────────────────────────────────────────

describe('emailTemplates.verifyEmail', () => {
  it('returns correct subject and html', () => {
    const tpl = emailTemplates.verifyEmail('Alice', '123456');
    expect(tpl.subject).toContain('Verify');
    expect(tpl.html).toContain('Alice');
    expect(tpl.html).toContain('123456');
  });

  it('includes OTP expiry message', () => {
    const tpl = emailTemplates.verifyEmail('Bob', '999');
    expect(tpl.html).toContain('10 minutes');
  });
});

// ─── emailTemplates.passwordReset ─────────────────────────────────────────────

describe('emailTemplates.passwordReset', () => {
  it('returns correct subject and html', () => {
    const tpl = emailTemplates.passwordReset('Charlie', '654321');
    expect(tpl.subject).toMatch(/reset/i);
    expect(tpl.html).toContain('Charlie');
    expect(tpl.html).toContain('654321');
  });

  it('includes 10 minute expiry', () => {
    const tpl = emailTemplates.passwordReset('Dave', '111');
    expect(tpl.html).toContain('10 minutes');
  });
});

// ─── emailTemplates.applicationStatus ────────────────────────────────────────

describe('emailTemplates.applicationStatus', () => {
  it('includes candidate name, job title, company and status', () => {
    const tpl = emailTemplates.applicationStatus('Eve', 'React Dev', 'TechCorp', 'shortlisted');
    expect(tpl.subject).toContain('React Dev');
    expect(tpl.subject).toContain('TechCorp');
    expect(tpl.html).toContain('Eve');
    expect(tpl.html).toContain('SHORTLISTED');
  });

  it('formats underscore statuses with spaces', () => {
    const tpl = emailTemplates.applicationStatus('F', 'J', 'C', 'interview_scheduled');
    expect(tpl.html).toContain('INTERVIEW SCHEDULED');
  });
});

// ─── emailTemplates.interviewScheduled ───────────────────────────────────────

describe('emailTemplates.interviewScheduled', () => {
  it('includes date, time, mode in the html', () => {
    const tpl = emailTemplates.interviewScheduled(
      'Grace', 'Backend Dev', 'MyCorp',
      '2026-04-01', '10:00 AM', 'Video Call', 'https://meet.example.com'
    );
    expect(tpl.subject).toContain('Interview Scheduled');
    expect(tpl.html).toContain('2026-04-01');
    expect(tpl.html).toContain('10:00 AM');
    expect(tpl.html).toContain('Video Call');
    expect(tpl.html).toContain('https://meet.example.com');
  });

  it('omits link section when link is not provided', () => {
    const tpl = emailTemplates.interviewScheduled(
      'Henry', 'Job', 'Corp', '2026-04-01', '2pm', 'Phone', null
    );
    expect(tpl.html).not.toContain('<a href=');
  });
});

// ─── emailTemplates.jobAlert ──────────────────────────────────────────────────

describe('emailTemplates.jobAlert', () => {
  it('includes candidate name and job details', () => {
    const jobs = [
      { title: 'React Dev', company: 'TechCorp', location: 'Bengaluru', salary: '10-15 LPA' },
      { title: 'Node Dev', company: 'StartupX', location: 'Remote', salary: null },
    ];
    const tpl = emailTemplates.jobAlert('Ivy', jobs);
    expect(tpl.subject).toMatch(/new job/i);
    expect(tpl.html).toContain('Ivy');
    expect(tpl.html).toContain('React Dev');
    expect(tpl.html).toContain('TechCorp');
    expect(tpl.html).toContain('10-15 LPA');
  });

  it('does not include salary when salary is null', () => {
    const jobs = [{ title: 'Dev', company: 'Corp', location: 'Delhi', salary: null }];
    const tpl = emailTemplates.jobAlert('Jack', jobs);
    // salary paragraph should not be rendered
    expect(tpl.html).not.toContain('₹null');
  });
});
