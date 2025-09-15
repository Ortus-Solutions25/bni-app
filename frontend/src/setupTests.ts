// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';
import { server } from './test-utils/server';

// Start MSW server before tests
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));

// Reset handlers between tests
afterEach(() => server.resetHandlers());

// Clean up after tests
afterAll(() => server.close());
