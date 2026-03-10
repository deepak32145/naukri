import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../utils/axios';

export const fetchJobs = createAsyncThunk('jobs/fetchAll', async (params, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/jobs', { params });
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to fetch jobs');
  }
});

export const fetchJobById = createAsyncThunk('jobs/fetchOne', async (id, { rejectWithValue }) => {
  try {
    const { data } = await api.get(`/jobs/${id}`);
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to fetch job');
  }
});

export const fetchSavedJobs = createAsyncThunk('jobs/fetchSaved', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/jobs/candidate/saved');
    return data.jobs;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});

export const fetchRecommended = createAsyncThunk('jobs/fetchRecommended', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/jobs/candidate/recommended');
    return data.jobs;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});

export const fetchMyJobs = createAsyncThunk('jobs/fetchMyJobs', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/jobs/recruiter/my-jobs');
    return data.jobs;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});

const jobsSlice = createSlice({
  name: 'jobs',
  initialState: {
    jobs: [],
    currentJob: null,
    similarJobs: [],
    savedJobs: [],
    recommendedJobs: [],
    myJobs: [],
    total: 0,
    page: 1,
    totalPages: 1,
    loading: false,
    error: null,
    filters: { keyword: '', location: '', jobType: '', skills: '', salaryMin: '', salaryMax: '', experienceMin: '', experienceMax: '', industry: '' },
  },
  reducers: {
    setFilters: (state, action) => { state.filters = { ...state.filters, ...action.payload }; },
    clearFilters: (state) => {
      state.filters = { keyword: '', location: '', jobType: '', skills: '', salaryMin: '', salaryMax: '', experienceMin: '', experienceMax: '', industry: '' };
    },
    toggleSaveJob: (state, action) => {
      const jobId = action.payload;
      const idx = state.savedJobs.findIndex(j => j._id === jobId);
      if (idx > -1) state.savedJobs.splice(idx, 1);
      else if (state.currentJob?._id === jobId) state.savedJobs.push(state.currentJob);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchJobs.pending, (state) => { state.loading = true; })
      .addCase(fetchJobs.fulfilled, (state, action) => {
        state.loading = false;
        state.jobs = action.payload.jobs;
        state.total = action.payload.total;
        state.page = action.payload.page;
        state.totalPages = action.payload.totalPages;
      })
      .addCase(fetchJobs.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(fetchJobById.pending, (state) => { state.loading = true; })
      .addCase(fetchJobById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentJob = action.payload.job;
        state.similarJobs = action.payload.similar;
      })
      .addCase(fetchJobById.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(fetchSavedJobs.fulfilled, (state, action) => { state.savedJobs = action.payload; })
      .addCase(fetchRecommended.fulfilled, (state, action) => { state.recommendedJobs = action.payload; })
      .addCase(fetchMyJobs.fulfilled, (state, action) => { state.myJobs = action.payload; });
  },
});

export const { setFilters, clearFilters, toggleSaveJob } = jobsSlice.actions;
export default jobsSlice.reducer;
