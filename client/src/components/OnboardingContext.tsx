import { createContext, useContext, useState, useEffect, useCallback, useMemo, type ReactNode } from 'react';

interface OnboardingContextType {
  showWelcome: boolean;
  showTour: boolean;
  currentTourStep: number;
  startWelcome: () => void;
  completeWelcome: () => void;
  startTour: () => void;
  completeTour: () => void;
  nextTourStep: () => void;
  prevTourStep: () => void;
  skipTour: () => void;
  resetOnboarding: () => void;
}

const OnboardingContext = createContext<OnboardingContextType | null>(null);

export const useOnboarding = () => {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboarding must be used within OnboardingProvider');
  }
  return context;
};

interface OnboardingProviderProps {
  children: ReactNode;
}

export const OnboardingProvider = ({ children }: OnboardingProviderProps) => {
  const [showWelcome, setShowWelcome] = useState(false);
  const [showTour, setShowTour] = useState(false);
  const [currentTourStep, setCurrentTourStep] = useState(0);

  // Component initialization
  useEffect(() => {
    // Onboarding state is managed by localStorage
    // Welcome and tour will be triggered by App.tsx when appropriate
  }, []);

  const startWelcome = useCallback(() => {
    setShowWelcome(true);
  }, []);

  const completeWelcome = useCallback(() => {
    setShowWelcome(false);
    localStorage.setItem('onboarding_welcome_completed', 'true');
    // Optionally start tour after welcome
    // For now, we'll let user trigger it manually or skip
  }, []);

  const startTour = useCallback(() => {
    setShowTour(true);
    setCurrentTourStep(0);
  }, []);

  const completeTour = useCallback(() => {
    setShowTour(false);
    setCurrentTourStep(0);
    localStorage.setItem('onboarding_tour_completed', 'true');
  }, []);

  const nextTourStep = useCallback(() => {
    setCurrentTourStep((prev) => prev + 1);
  }, []);

  const prevTourStep = useCallback(() => {
    setCurrentTourStep((prev) => Math.max(0, prev - 1));
  }, []);

  const skipTour = useCallback(() => {
    setShowTour(false);
    setCurrentTourStep(0);
    localStorage.setItem('onboarding_tour_completed', 'true');
  }, []);

  const resetOnboarding = useCallback(() => {
    localStorage.removeItem('onboarding_welcome_completed');
    localStorage.removeItem('onboarding_tour_completed');
    setShowWelcome(false);
    setShowTour(false);
    setCurrentTourStep(0);
  }, []);

  const value: OnboardingContextType = useMemo(
    () => ({
      showWelcome,
      showTour,
      currentTourStep,
      startWelcome,
      completeWelcome,
      startTour,
      completeTour,
      nextTourStep,
      prevTourStep,
      skipTour,
      resetOnboarding,
    }),
    [
      showWelcome,
      showTour,
      currentTourStep,
      startWelcome,
      completeWelcome,
      startTour,
      completeTour,
      nextTourStep,
      prevTourStep,
      skipTour,
      resetOnboarding,
    ]
  );

  return <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>;
};
