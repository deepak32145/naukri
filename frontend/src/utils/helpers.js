import { formatDistanceToNow, format } from 'date-fns';

export const timeAgo = (date) => {
  if (!date) return '';
  return formatDistanceToNow(new Date(date), { addSuffix: true });
};

export const formatDate = (date, fmt = 'MMM dd, yyyy') => {
  if (!date) return '';
  return format(new Date(date), fmt);
};

export const formatSalary = (min, max) => {
  if (!min && !max) return 'Not disclosed';
  if (min && max) return `₹${(min / 100000).toFixed(1)} - ${(max / 100000).toFixed(1)} LPA`;
  if (min) return `₹${(min / 100000).toFixed(1)}+ LPA`;
  return `Up to ₹${(max / 100000).toFixed(1)} LPA`;
};

export const getStatusColor = (status) => {
  const colors = {
    applied: 'bg-blue-100 text-blue-700',
    under_review: 'bg-yellow-100 text-yellow-700',
    shortlisted: 'bg-purple-100 text-purple-700',
    interview_scheduled: 'bg-indigo-100 text-indigo-700',
    rejected: 'bg-red-100 text-red-700',
    hired: 'bg-green-100 text-green-700',
    active: 'bg-green-100 text-green-700',
    paused: 'bg-yellow-100 text-yellow-700',
    closed: 'bg-gray-100 text-gray-700',
    draft: 'bg-gray-100 text-gray-500',
  };
  return colors[status] || 'bg-gray-100 text-gray-700';
};

export const getStatusLabel = (status) => {
  const labels = {
    applied: 'Applied',
    under_review: 'Under Review',
    shortlisted: 'Shortlisted',
    interview_scheduled: 'Interview Scheduled',
    rejected: 'Rejected',
    hired: 'Hired',
    active: 'Active',
    paused: 'Paused',
    closed: 'Closed',
    draft: 'Draft',
  };
  return labels[status] || status;
};

export const getInitials = (name = '') =>
  name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);

export const INDUSTRIES = [
  'Information Technology', 'Finance & Banking', 'Healthcare', 'Education',
  'E-commerce', 'Manufacturing', 'Consulting', 'Media & Entertainment',
  'Retail', 'Real Estate', 'Telecom', 'Logistics', 'Automotive', 'Other',
];

export const JOB_TYPES = ['full-time', 'part-time', 'contract', 'internship', 'freelance'];

export const EXPERIENCE_LEVELS = [
  { label: 'Fresher (0-1 yr)', min: 0, max: 1 },
  { label: '1-3 years', min: 1, max: 3 },
  { label: '3-5 years', min: 3, max: 5 },
  { label: '5-10 years', min: 5, max: 10 },
  { label: '10+ years', min: 10, max: 30 },
];

export const SKILLS = [
  'JavaScript', 'React', 'Node.js', 'Python', 'Java', 'SQL', 'MongoDB',
  'TypeScript', 'AWS', 'Docker', 'Git', 'REST APIs', 'GraphQL', 'Vue.js',
  'Angular', 'PHP', 'Laravel', 'Django', 'Spring Boot', 'Machine Learning',
];
