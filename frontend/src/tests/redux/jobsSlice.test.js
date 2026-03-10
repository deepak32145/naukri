import { describe, it, expect } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import jobsReducer, {
  setFilters, clearFilters, toggleSaveJob,
  fetchJobs, fetchJobById, fetchSavedJobs, fetchMyJobs,
} from '../../redux/slices/jobsSlice';

const makeStore = (preloadedState) =>
  configureStore({ reducer: { jobs: jobsReducer }, preloadedState });

// ─── SYNC REDUCERS ───────────────────────────────────────────────────────────

describe('jobsSlice — setFilters reducer', () => {
  it('merges new filter values into existing filters', () => {
    const store = makeStore();
    store.dispatch(setFilters({ keyword: 'react', location: 'Bengaluru' }));
    const { filters } = store.getState().jobs;
    expect(filters.keyword).toBe('react');
    expect(filters.location).toBe('Bengaluru');
    expect(filters.jobType).toBe(''); // other keys unchanged
  });

  it('overwrites a previously set filter', () => {
    const store = makeStore({ jobs: { filters: { keyword: 'old', location: '', jobType: '' } } });
    store.dispatch(setFilters({ keyword: 'new' }));
    expect(store.getState().jobs.filters.keyword).toBe('new');
  });
});

describe('jobsSlice — clearFilters reducer', () => {
  it('resets all filters to empty strings', () => {
    const store = makeStore({
      jobs: { filters: { keyword: 'react', location: 'Mumbai', jobType: 'full-time', skills: 'React', salaryMin: '500000', salaryMax: '', experienceMin: '2', experienceMax: '', industry: 'IT' } },
    });
    store.dispatch(clearFilters());
    const { filters } = store.getState().jobs;
    Object.values(filters).forEach((val) => expect(val).toBe(''));
  });
});

describe('jobsSlice — toggleSaveJob reducer', () => {
  it('removes job from savedJobs if already saved', () => {
    const savedJob = { _id: 'j1', title: 'React Dev' };
    const store = makeStore({ jobs: { savedJobs: [savedJob], currentJob: null } });
    store.dispatch(toggleSaveJob('j1'));
    expect(store.getState().jobs.savedJobs).toHaveLength(0);
  });

  it('adds currentJob to savedJobs if not already saved', () => {
    const currentJob = { _id: 'j2', title: 'Node Dev' };
    const store = makeStore({ jobs: { savedJobs: [], currentJob } });
    store.dispatch(toggleSaveJob('j2'));
    expect(store.getState().jobs.savedJobs).toHaveLength(1);
    expect(store.getState().jobs.savedJobs[0]._id).toBe('j2');
  });

  it('does nothing if job not in savedJobs and not currentJob', () => {
    const store = makeStore({ jobs: { savedJobs: [], currentJob: { _id: 'j3' } } });
    store.dispatch(toggleSaveJob('j-unknown'));
    expect(store.getState().jobs.savedJobs).toHaveLength(0);
  });
});

// ─── THUNK: fetchJobs ────────────────────────────────────────────────────────

describe('jobsSlice — fetchJobs thunk', () => {
  it('sets jobs, total, page, totalPages on success', async () => {
    const store = makeStore();
    await store.dispatch(fetchJobs({}));
    const state = store.getState().jobs;
    expect(state.jobs).toHaveLength(2);
    expect(state.total).toBe(2);
    expect(state.page).toBe(1);
    expect(state.loading).toBe(false);
  });

  it('filters jobs by keyword via API', async () => {
    const store = makeStore();
    await store.dispatch(fetchJobs({ keyword: 'react' }));
    const state = store.getState().jobs;
    expect(state.jobs).toHaveLength(1);
    expect(state.jobs[0].title).toMatch(/react/i);
  });

  it('sets loading true while pending', async () => {
    const store = makeStore();
    const promise = store.dispatch(fetchJobs({}));
    expect(store.getState().jobs.loading).toBe(true);
    await promise;
    expect(store.getState().jobs.loading).toBe(false);
  });
});

// ─── THUNK: fetchJobById ─────────────────────────────────────────────────────

describe('jobsSlice — fetchJobById thunk', () => {
  it('sets currentJob and similarJobs on success', async () => {
    const store = makeStore();
    await store.dispatch(fetchJobById('j1'));
    const state = store.getState().jobs;
    expect(state.currentJob._id).toBe('j1');
    expect(state.currentJob.title).toBe('React Developer');
    expect(state.similarJobs).toEqual([]);
  });

  it('sets error when job not found', async () => {
    const store = makeStore();
    await store.dispatch(fetchJobById('nonexistent'));
    const state = store.getState().jobs;
    expect(state.error).toBe('Job not found');
    expect(state.currentJob).toBeNull();
  });
});
