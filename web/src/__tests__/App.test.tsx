import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import App from '../App';

// Mock child components to avoid routing complexity in unit test
// or just test that it renders BrowserRouter
describe('App Component', () => {
    it('renders without crashing', () => {
        render(<App />);
        // Since default route redirects to /dashboard, and Dashboard is protected or needs context,
        // it might be complex.
        // But App uses BrowserRouter, so testing it might require mocking sub-components or handling navigation.
        // For a smoke test, we just want to ensure it mounts.
        expect(document.body).toBeInTheDocument();
    });
});
