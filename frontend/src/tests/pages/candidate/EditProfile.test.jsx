import { describe, it, expect, vi } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { renderWithProviders } from '../../utils/renderWithProviders';
import EditProfile from '../../../pages/candidate/EditProfile';
import { server } from '../../mocks/server';
import { http, HttpResponse } from 'msw';
import toast from 'react-hot-toast';

vi.mock('../../../utils/socket', () => ({
  initSocket: vi.fn(),
  disconnectSocket: vi.fn(),
  getSocket: vi.fn(() => null),
}));

vi.mock('react-hot-toast', () => ({
  default: { success: vi.fn(), error: vi.fn() },
  Toaster: () => null,
}));

const candidateAuth = {
  auth: {
    user: { _id: 'u1', name: 'Test Candidate', email: 'c@test.com', role: 'candidate' },
    token: 'tok', isAuthenticated: true, initializing: false, loading: false, error: null,
  },
};

describe('EditProfile — basic rendering', () => {
  it('renders Edit Profile heading', async () => {
    renderWithProviders(<EditProfile />, { preloadedState: candidateAuth });
    await waitFor(() => {
      expect(screen.getByText('Edit Profile')).toBeInTheDocument();
    });
  });

  it('renders Save Profile button', async () => {
    renderWithProviders(<EditProfile />, { preloadedState: candidateAuth });
    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: /Save/i }).length).toBeGreaterThan(0);
    });
  });

  it('renders Basic Information section', async () => {
    renderWithProviders(<EditProfile />, { preloadedState: candidateAuth });
    await waitFor(() => {
      expect(screen.getByText('Basic Information')).toBeInTheDocument();
    });
  });

  it('renders Social Links section', async () => {
    renderWithProviders(<EditProfile />, { preloadedState: candidateAuth });
    await waitFor(() => {
      expect(screen.getByText('Social Links')).toBeInTheDocument();
    });
  });

  it('renders Skills section', async () => {
    renderWithProviders(<EditProfile />, { preloadedState: candidateAuth });
    await waitFor(() => {
      expect(screen.getByText('Skills')).toBeInTheDocument();
    });
  });

  it('renders Work Experience section', async () => {
    renderWithProviders(<EditProfile />, { preloadedState: candidateAuth });
    await waitFor(() => {
      expect(screen.getByText('Work Experience')).toBeInTheDocument();
    });
  });

  it('renders Education section', async () => {
    renderWithProviders(<EditProfile />, { preloadedState: candidateAuth });
    await waitFor(() => {
      expect(screen.getByText('Education')).toBeInTheDocument();
    });
  });

  it('renders Projects section', async () => {
    renderWithProviders(<EditProfile />, { preloadedState: candidateAuth });
    await waitFor(() => {
      expect(screen.getByText('Projects')).toBeInTheDocument();
    });
  });

  it('renders Certifications section', async () => {
    renderWithProviders(<EditProfile />, { preloadedState: candidateAuth });
    await waitFor(() => {
      expect(screen.getByText('Certifications')).toBeInTheDocument();
    });
  });
});

describe('EditProfile — pre-fills data from API', () => {
  it('pre-fills headline from profile data', async () => {
    renderWithProviders(<EditProfile />, { preloadedState: candidateAuth });
    await waitFor(() => {
      const headlineInput = screen.getByPlaceholderText('e.g. Senior React Developer');
      expect(headlineInput.value).toBe('Senior React Developer');
    });
  });

  it('pre-fills skills from profile data', async () => {
    renderWithProviders(<EditProfile />, { preloadedState: candidateAuth });
    await waitFor(() => {
      expect(screen.getByText('React')).toBeInTheDocument();
      expect(screen.getByText('JavaScript')).toBeInTheDocument();
      expect(screen.getByText('Node.js')).toBeInTheDocument();
    });
  });
});

describe('EditProfile — Work Experience', () => {
  it('adds new experience entry when Add Experience clicked', async () => {
    renderWithProviders(<EditProfile />, { preloadedState: candidateAuth });
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Add Experience/i })).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole('button', { name: /Add Experience/i }));
    expect(screen.getByText('Experience 1')).toBeInTheDocument();
  });

  it('allows filling in company and title fields after adding experience', async () => {
    renderWithProviders(<EditProfile />, { preloadedState: candidateAuth });
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Add Experience/i })).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole('button', { name: /Add Experience/i }));
    // The newly added entry is the last one — use getAllByPlaceholderText and pick the last
    const companyInputs = screen.getAllByPlaceholderText('Company name');
    const titleInputs = screen.getAllByPlaceholderText('Software Engineer');
    const lastCompany = companyInputs[companyInputs.length - 1];
    const lastTitle = titleInputs[titleInputs.length - 1];
    fireEvent.change(lastCompany, { target: { value: 'TestCorp' } });
    fireEvent.change(lastTitle, { target: { value: 'Frontend Dev' } });
    expect(lastCompany.value).toBe('TestCorp');
    expect(lastTitle.value).toBe('Frontend Dev');
  });

  it('removes experience entry when remove button clicked', async () => {
    renderWithProviders(<EditProfile />, { preloadedState: candidateAuth });
    await waitFor(() => {
      expect(screen.getByText('Experience 1')).toBeInTheDocument();
    });
    // The MSW profile loads one experience. Find its remove (Trash2) button.
    const expLabel = screen.getByText('Experience 1');
    const expRow = expLabel.closest('div');
    const removeBtn = expRow.querySelector('button');
    fireEvent.click(removeBtn);
    expect(screen.queryByText('Experience 1')).not.toBeInTheDocument();
  });
});

describe('EditProfile — Education', () => {
  it('adds new education entry when Add Education clicked', async () => {
    renderWithProviders(<EditProfile />, { preloadedState: candidateAuth });
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Add Education/i })).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole('button', { name: /Add Education/i }));
    expect(screen.getByText('Education 1')).toBeInTheDocument();
  });

  it('allows filling in institution and degree fields', async () => {
    renderWithProviders(<EditProfile />, { preloadedState: candidateAuth });
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Add Education/i })).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole('button', { name: /Add Education/i }));
    // Use getAllBy since MSW profile already has one education entry
    const institutionInputs = screen.getAllByPlaceholderText('University/School name');
    const degreeInputs = screen.getAllByPlaceholderText('B.Tech, MBA...');
    const newInstitution = institutionInputs[institutionInputs.length - 1];
    const newDegree = degreeInputs[degreeInputs.length - 1];
    fireEvent.change(newInstitution, { target: { value: 'IIT Delhi' } });
    fireEvent.change(newDegree, { target: { value: 'B.Tech' } });
    expect(newInstitution.value).toBe('IIT Delhi');
    expect(newDegree.value).toBe('B.Tech');
  });

  it('removes education entry when remove button clicked', async () => {
    renderWithProviders(<EditProfile />, { preloadedState: candidateAuth });
    await waitFor(() => {
      expect(screen.getByText('Education 1')).toBeInTheDocument();
    });
    // The MSW profile loads one education entry already
    const eduLabel = screen.getByText('Education 1');
    const eduRow = eduLabel.closest('div');
    const removeBtn = eduRow.querySelector('button');
    fireEvent.click(removeBtn);
    expect(screen.queryByText('Education 1')).not.toBeInTheDocument();
  });
});

describe('EditProfile — Projects', () => {
  it('adds new project entry when Add Project clicked', async () => {
    renderWithProviders(<EditProfile />, { preloadedState: candidateAuth });
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Add Project/i })).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole('button', { name: /Add Project/i }));
    expect(screen.getByText('Project 1')).toBeInTheDocument();
  });
});

describe('EditProfile — Certifications', () => {
  it('adds new certification entry when Add Certification clicked', async () => {
    renderWithProviders(<EditProfile />, { preloadedState: candidateAuth });
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Add Certification/i })).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole('button', { name: /Add Certification/i }));
    expect(screen.getByText('Certification 1')).toBeInTheDocument();
  });
});

describe('EditProfile — Skills management', () => {
  it('adds skill via input and Add button', async () => {
    renderWithProviders(<EditProfile />, { preloadedState: candidateAuth });
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Type skill and press Enter')).toBeInTheDocument();
    });
    const skillInput = screen.getByPlaceholderText('Type skill and press Enter');
    fireEvent.change(skillInput, { target: { value: 'TypeScript' } });
    fireEvent.click(screen.getByRole('button', { name: /^Add$/i }));
    expect(screen.getByText('TypeScript')).toBeInTheDocument();
  });

  it('adds skill via quick suggestion button', async () => {
    // Override MSW to return empty skills so quick buttons are visible
    server.use(
      http.get('http://localhost:5000/api/candidate/profile', () =>
        HttpResponse.json({
          success: true,
          profile: {
            _id: 'p1', headline: 'Developer', summary: '',
            skills: [], currentLocation: '', experienceYears: 0,
            completenessScore: 50, experience: [], education: [],
            projects: [], certifications: [], preferredLocations: [], languages: [],
          },
        })
      )
    );
    renderWithProviders(<EditProfile />, { preloadedState: candidateAuth });
    await waitFor(() => {
      // SKILLS quick buttons appear as "+ SkillName"
      const quickBtns = screen.getAllByRole('button').filter(b => b.textContent.startsWith('+'));
      expect(quickBtns.length).toBeGreaterThan(0);
    });
    const quickBtns = screen.getAllByRole('button').filter(b => b.textContent.startsWith('+'));
    const firstSkillText = quickBtns[0].textContent.replace('+ ', '').trim();
    fireEvent.click(quickBtns[0]);
    expect(screen.getByText(firstSkillText)).toBeInTheDocument();
  });

  it('removes skill badge when trash icon clicked', async () => {
    renderWithProviders(<EditProfile />, { preloadedState: candidateAuth });
    await waitFor(() => {
      expect(screen.getByText('React')).toBeInTheDocument();
    });
    // The skill badge contains the skill text and a Trash2 button
    const reactBadge = screen.getByText('React').closest('span');
    const removeBtn = reactBadge.querySelector('button');
    fireEvent.click(removeBtn);
    expect(screen.queryByText('React')).not.toBeInTheDocument();
  });
});

describe('EditProfile — form submission', () => {
  it('calls PUT /candidate/profile on Save Profile click', async () => {
    let putCalled = false;
    server.use(
      http.put('http://localhost:5000/api/candidate/profile', () => {
        putCalled = true;
        return HttpResponse.json({ success: true });
      })
    );
    renderWithProviders(<EditProfile />, { preloadedState: candidateAuth });
    await waitFor(() => {
      expect(screen.getByText('Edit Profile')).toBeInTheDocument();
    });
    fireEvent.click(screen.getAllByRole('button', { name: /Save/i })[0]);
    await waitFor(() => {
      expect(putCalled).toBe(true);
    });
  });
});

describe('EditProfile — open to work', () => {
  it('toggles open to work checkbox', async () => {
    renderWithProviders(<EditProfile />, { preloadedState: candidateAuth });
    await waitFor(() => {
      expect(screen.getByLabelText('Open to work')).toBeInTheDocument();
    });
    const checkbox = screen.getByLabelText('Open to work');
    const initialChecked = checkbox.checked;
    fireEvent.click(checkbox);
    expect(checkbox.checked).toBe(!initialChecked);
  });
});

describe('EditProfile — Basic Info fields', () => {
  it('can change summary textarea', async () => {
    renderWithProviders(<EditProfile />, { preloadedState: candidateAuth });
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Brief professional summary...')).toBeInTheDocument();
    });
    const summaryInput = screen.getByPlaceholderText('Brief professional summary...');
    fireEvent.change(summaryInput, { target: { value: 'I am an expert React developer' } });
    expect(summaryInput.value).toBe('I am an expert React developer');
  });

  it('can change currentLocation input', async () => {
    renderWithProviders(<EditProfile />, { preloadedState: candidateAuth });
    await waitFor(() => {
      expect(screen.getByPlaceholderText('e.g. Bengaluru')).toBeInTheDocument();
    });
    const input = screen.getByPlaceholderText('e.g. Bengaluru');
    fireEvent.change(input, { target: { value: 'Hyderabad' } });
    expect(input.value).toBe('Hyderabad');
  });

  it('can change noticePeriod input', async () => {
    renderWithProviders(<EditProfile />, { preloadedState: candidateAuth });
    await waitFor(() => {
      expect(screen.getByPlaceholderText('e.g. 30 days')).toBeInTheDocument();
    });
    const input = screen.getByPlaceholderText('e.g. 30 days');
    fireEvent.change(input, { target: { value: '60 days' } });
    expect(input.value).toBe('60 days');
  });

  it('can change currentSalary input', async () => {
    renderWithProviders(<EditProfile />, { preloadedState: candidateAuth });
    await waitFor(() => {
      expect(screen.getByPlaceholderText('e.g. 500000')).toBeInTheDocument();
    });
    const input = screen.getByPlaceholderText('e.g. 500000');
    fireEvent.change(input, { target: { value: '700000' } });
    expect(input.value).toBe('700000');
  });

  it('can change expectedSalary input', async () => {
    renderWithProviders(<EditProfile />, { preloadedState: candidateAuth });
    await waitFor(() => {
      expect(screen.getByPlaceholderText('e.g. 800000')).toBeInTheDocument();
    });
    const input = screen.getByPlaceholderText('e.g. 800000');
    fireEvent.change(input, { target: { value: '1000000' } });
    expect(input.value).toBe('1000000');
  });
});

describe('EditProfile — Social Links', () => {
  it('can change LinkedIn URL', async () => {
    renderWithProviders(<EditProfile />, { preloadedState: candidateAuth });
    await waitFor(() => {
      expect(screen.getByPlaceholderText('https://linkedin.com/in/...')).toBeInTheDocument();
    });
    const input = screen.getByPlaceholderText('https://linkedin.com/in/...');
    fireEvent.change(input, { target: { value: 'https://linkedin.com/in/test' } });
    expect(input.value).toBe('https://linkedin.com/in/test');
  });

  it('can change GitHub URL', async () => {
    renderWithProviders(<EditProfile />, { preloadedState: candidateAuth });
    await waitFor(() => {
      expect(screen.getByPlaceholderText('https://github.com/...')).toBeInTheDocument();
    });
    const input = screen.getByPlaceholderText('https://github.com/...');
    fireEvent.change(input, { target: { value: 'https://github.com/testuser' } });
    expect(input.value).toBe('https://github.com/testuser');
  });

  it('can change Portfolio URL', async () => {
    renderWithProviders(<EditProfile />, { preloadedState: candidateAuth });
    await waitFor(() => {
      expect(screen.getByPlaceholderText('https://yourportfolio.com')).toBeInTheDocument();
    });
    const input = screen.getByPlaceholderText('https://yourportfolio.com');
    fireEvent.change(input, { target: { value: 'https://myportfolio.dev' } });
    expect(input.value).toBe('https://myportfolio.dev');
  });
});

describe('EditProfile — Experience fields', () => {
  it('can update pre-filled experience title', async () => {
    renderWithProviders(<EditProfile />, { preloadedState: candidateAuth });
    await waitFor(() => {
      expect(screen.getByText('Experience 1')).toBeInTheDocument();
    });
    const titleInputs = screen.getAllByPlaceholderText('Software Engineer');
    fireEvent.change(titleInputs[0], { target: { value: 'Senior Dev' } });
    expect(titleInputs[0].value).toBe('Senior Dev');
  });

  it('can update pre-filled experience company', async () => {
    renderWithProviders(<EditProfile />, { preloadedState: candidateAuth });
    await waitFor(() => {
      expect(screen.getByText('Experience 1')).toBeInTheDocument();
    });
    const companyInputs = screen.getAllByPlaceholderText('Company name');
    fireEvent.change(companyInputs[0], { target: { value: 'NewCorp' } });
    expect(companyInputs[0].value).toBe('NewCorp');
  });

  it('can update experience location input', async () => {
    renderWithProviders(<EditProfile />, { preloadedState: candidateAuth });
    await waitFor(() => {
      expect(screen.getByText('Experience 1')).toBeInTheDocument();
    });
    const cityInputs = screen.getAllByPlaceholderText('City');
    fireEvent.change(cityInputs[0], { target: { value: 'Mumbai' } });
    expect(cityInputs[0].value).toBe('Mumbai');
  });

  it('can update experience description textarea', async () => {
    renderWithProviders(<EditProfile />, { preloadedState: candidateAuth });
    await waitFor(() => {
      expect(screen.getByText('Experience 1')).toBeInTheDocument();
    });
    const descTextareas = screen.getAllByPlaceholderText('Responsibilities, achievements...');
    fireEvent.change(descTextareas[0], { target: { value: 'Led the frontend team' } });
    expect(descTextareas[0].value).toBe('Led the frontend team');
  });
});

describe('EditProfile — Education fields', () => {
  it('can update pre-filled education institution', async () => {
    renderWithProviders(<EditProfile />, { preloadedState: candidateAuth });
    await waitFor(() => {
      expect(screen.getByText('Education 1')).toBeInTheDocument();
    });
    const institutionInputs = screen.getAllByPlaceholderText('University/School name');
    fireEvent.change(institutionInputs[0], { target: { value: 'MIT' } });
    expect(institutionInputs[0].value).toBe('MIT');
  });

  it('can update pre-filled education degree', async () => {
    renderWithProviders(<EditProfile />, { preloadedState: candidateAuth });
    await waitFor(() => {
      expect(screen.getByText('Education 1')).toBeInTheDocument();
    });
    const degreeInputs = screen.getAllByPlaceholderText('B.Tech, MBA...');
    fireEvent.change(degreeInputs[0], { target: { value: 'M.Tech' } });
    expect(degreeInputs[0].value).toBe('M.Tech');
  });

  it('can update education grade field', async () => {
    renderWithProviders(<EditProfile />, { preloadedState: candidateAuth });
    await waitFor(() => {
      expect(screen.getByText('Education 1')).toBeInTheDocument();
    });
    const gradeInputs = screen.getAllByPlaceholderText('8.5 CGPA / 85%');
    fireEvent.change(gradeInputs[0], { target: { value: '9.0 CGPA' } });
    expect(gradeInputs[0].value).toBe('9.0 CGPA');
  });
});

describe('EditProfile — Project fields', () => {
  it('can fill in project title after adding', async () => {
    renderWithProviders(<EditProfile />, { preloadedState: candidateAuth });
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Add Project/i })).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole('button', { name: /Add Project/i }));
    const projectTitle = screen.getByPlaceholderText('Project title *');
    fireEvent.change(projectTitle, { target: { value: 'My E-commerce App' } });
    expect(projectTitle.value).toBe('My E-commerce App');
  });

  it('can fill in project description after adding', async () => {
    renderWithProviders(<EditProfile />, { preloadedState: candidateAuth });
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Add Project/i })).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole('button', { name: /Add Project/i }));
    const projectDesc = screen.getByPlaceholderText('Project description');
    fireEvent.change(projectDesc, { target: { value: 'An e-commerce platform' } });
    expect(projectDesc.value).toBe('An e-commerce platform');
  });

  it('can fill in project URL after adding', async () => {
    renderWithProviders(<EditProfile />, { preloadedState: candidateAuth });
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Add Project/i })).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole('button', { name: /Add Project/i }));
    const projectUrl = screen.getByPlaceholderText('Project URL (optional)');
    fireEvent.change(projectUrl, { target: { value: 'https://myproject.com' } });
    expect(projectUrl.value).toBe('https://myproject.com');
  });

  it('can fill in project skills after adding', async () => {
    renderWithProviders(<EditProfile />, { preloadedState: candidateAuth });
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Add Project/i })).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole('button', { name: /Add Project/i }));
    const projectSkills = screen.getByPlaceholderText('Skills used (comma separated)');
    fireEvent.change(projectSkills, { target: { value: 'React, TypeScript' } });
    expect(projectSkills.value).toBe('React, TypeScript');
  });

  it('can remove project entry', async () => {
    renderWithProviders(<EditProfile />, { preloadedState: candidateAuth });
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Add Project/i })).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole('button', { name: /Add Project/i }));
    expect(screen.getByText('Project 1')).toBeInTheDocument();
    const projectLabel = screen.getByText('Project 1');
    const projectRow = projectLabel.closest('div');
    const removeBtn = projectRow.querySelector('button');
    fireEvent.click(removeBtn);
    expect(screen.queryByText('Project 1')).not.toBeInTheDocument();
  });
});

describe('EditProfile — Certification fields', () => {
  it('can fill in certification name after adding', async () => {
    renderWithProviders(<EditProfile />, { preloadedState: candidateAuth });
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Add Certification/i })).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole('button', { name: /Add Certification/i }));
    const certName = screen.getByPlaceholderText('AWS Certified...');
    fireEvent.change(certName, { target: { value: 'AWS Solutions Architect' } });
    expect(certName.value).toBe('AWS Solutions Architect');
  });

  it('can fill in certification issuer after adding', async () => {
    renderWithProviders(<EditProfile />, { preloadedState: candidateAuth });
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Add Certification/i })).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole('button', { name: /Add Certification/i }));
    const certIssuer = screen.getByPlaceholderText('Amazon, Google...');
    fireEvent.change(certIssuer, { target: { value: 'Amazon' } });
    expect(certIssuer.value).toBe('Amazon');
  });

  it('can fill in certification credential URL after adding', async () => {
    renderWithProviders(<EditProfile />, { preloadedState: candidateAuth });
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Add Certification/i })).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole('button', { name: /Add Certification/i }));
    const certUrl = screen.getByPlaceholderText('https://...');
    fireEvent.change(certUrl, { target: { value: 'https://aws.amazon.com/cert' } });
    expect(certUrl.value).toBe('https://aws.amazon.com/cert');
  });

  it('can remove certification entry', async () => {
    renderWithProviders(<EditProfile />, { preloadedState: candidateAuth });
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Add Certification/i })).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole('button', { name: /Add Certification/i }));
    expect(screen.getByText('Certification 1')).toBeInTheDocument();
    const certLabel = screen.getByText('Certification 1');
    const certRow = certLabel.closest('div');
    const removeBtn = certRow.querySelector('button');
    fireEvent.click(removeBtn);
    expect(screen.queryByText('Certification 1')).not.toBeInTheDocument();
  });
});
