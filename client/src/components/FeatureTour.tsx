import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOnboarding } from './OnboardingContext';
import { Button } from './ui';
import { ArrowRight, ArrowLeft, X, BookOpen, Users, RefreshCcw, LayoutDashboard } from 'lucide-react';

interface TourStep {
  title: string;
  description: string;
  icon: React.ReactNode;
  target?: string; // Optional: CSS selector for highlighting
  position: 'center' | 'top' | 'bottom' | 'left' | 'right';
}

const tourSteps: TourStep[] = [
  {
    title: 'Dashboard Overview',
    description: 'The dashboard gives you a quick overview of your library statistics, including total books, members, active loans, and overdue items.',
    icon: <LayoutDashboard className="h-6 w-6" />,
    position: 'center',
  },
  {
    title: 'Book Management',
    description: 'Navigate to Books to view your collection, add new books, upload covers, organize by categories, and import books in bulk via CSV.',
    icon: <BookOpen className="h-6 w-6" />,
    position: 'center',
  },
  {
    title: 'Member Management',
    description: 'The Members section lets you add and manage library members, search for members, and import them in bulk via CSV.',
    icon: <Users className="h-6 w-6" />,
    position: 'center',
  },
  {
    title: 'Loan System',
    description: 'Use the Loan Manager to borrow and return books. View loan history to track all past and current loans, including overdue items.',
    icon: <RefreshCcw className="h-6 w-6" />,
    position: 'center',
  },
];

const FeatureTour = () => {
  const { showTour, currentTourStep, nextTourStep, prevTourStep, completeTour, skipTour } = useOnboarding();

  const currentStep = tourSteps[currentTourStep];
  const isLastStep = currentTourStep === tourSteps.length - 1;
  const isFirstStep = currentTourStep === 0;

  // Prevent scrolling when tour is active
  useEffect(() => {
    if (showTour) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showTour]);

  const handleNext = () => {
    if (isLastStep) {
      completeTour();
    } else {
      nextTourStep();
    }
  };

  const handlePrev = () => {
    if (!isFirstStep) {
      prevTourStep();
    }
  };

  if (!currentStep) return null;

  return (
    <AnimatePresence>
      {showTour && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-[100] backdrop-blur-sm"
          />

          {/* Tour Card */}
          <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              key={currentTourStep}
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ duration: 0.3 }}
              className="w-full max-w-lg pointer-events-auto"
            >
              <div className="bg-surface rounded-xl shadow-2xl overflow-hidden border border-border">
                {/* Header */}
                <div className="bg-background-secondary px-6 py-4 border-b border-border">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10 text-primary">
                        {currentStep.icon}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-text-primary">
                          {currentStep.title}
                        </h3>
                        <p className="text-sm text-text-tertiary">
                          Step {currentTourStep + 1} of {tourSteps.length}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={skipTour}
                      className="p-2 rounded-lg hover:bg-background transition-colors text-text-secondary hover:text-text-primary"
                      aria-label="Skip tour"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="px-6 py-6 bg-surface">
                  <p className="text-text-secondary leading-relaxed mb-6">
                    {currentStep.description}
                  </p>

                  {/* Progress Indicators */}
                  <div className="flex justify-center gap-2 mb-6">
                    {tourSteps.map((_, index) => (
                      <div
                        key={index}
                        className={`h-2 rounded-full transition-all ${
                          index === currentTourStep
                            ? 'w-8 bg-primary'
                            : index < currentTourStep
                            ? 'w-2 bg-primary/50'
                            : 'w-2 bg-border'
                        }`}
                      />
                    ))}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-between items-center gap-4">
                    <div>
                      {!isFirstStep && (
                        <Button
                          variant="ghost"
                          onClick={handlePrev}
                          icon={<ArrowLeft className="h-5 w-5" />}
                        >
                          Previous
                        </Button>
                      )}
                    </div>

                    <div className="flex gap-3">
                      <Button
                        variant="ghost"
                        onClick={skipTour}
                      >
                        Skip Tour
                      </Button>

                      <Button
                        variant="primary"
                        onClick={handleNext}
                      >
                        {isLastStep ? (
                          'Finish'
                        ) : (
                          <>
                            Next <ArrowRight className="h-5 w-5 ml-2" />
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

export default FeatureTour;
