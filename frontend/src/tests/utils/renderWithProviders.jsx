import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../../redux/slices/authSlice';
import jobsReducer from '../../redux/slices/jobsSlice';
import notificationReducer from '../../redux/slices/notificationSlice';
import chatReducer from '../../redux/slices/chatSlice';
import uiReducer from '../../redux/slices/uiSlice';

/** Create a fresh test store with optional preloaded state */
export const createTestStore = (preloadedState = {}) =>
  configureStore({
    reducer: {
      auth: authReducer,
      jobs: jobsReducer,
      notifications: notificationReducer,
      chat: chatReducer,
      ui: uiReducer,
    },
    preloadedState,
  });

/**
 * Render a component wrapped in Redux Provider + BrowserRouter.
 * Pass `initialEntries` to control the route (e.g. ['/login']).
 */
export const renderWithProviders = (
  ui,
  { preloadedState = {}, store = createTestStore(preloadedState), initialEntries, ...renderOptions } = {}
) => {
  const Wrapper = ({ children }) => (
    <Provider store={store}>
      {initialEntries ? (
        <MemoryRouter initialEntries={initialEntries}>{children}</MemoryRouter>
      ) : (
        <BrowserRouter>{children}</BrowserRouter>
      )}
    </Provider>
  );
  return { store, ...render(ui, { wrapper: Wrapper, ...renderOptions }) };
};
