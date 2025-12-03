import type { ReactElement } from 'react';
import { render, type RenderOptions } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../components/AuthContext';
import { OnboardingProvider } from '../components/OnboardingContext';

interface ProvidersProps {
  children: React.ReactNode;
}

// Create a wrapper with all necessary providers
const AllProviders = ({ children }: ProvidersProps) => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <OnboardingProvider>
          {children}
        </OnboardingProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

// Custom render function that includes providers
const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) => render(ui, { wrapper: AllProviders, ...options });

// Re-export everything
export * from '@testing-library/react';
export { customRender as render };
