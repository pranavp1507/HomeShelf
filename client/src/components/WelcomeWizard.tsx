import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOnboarding } from './OnboardingContext';
import { Button, Modal } from './ui';
import {
  BookOpen,
  Users,
  RefreshCcw,
  BarChart3,
  Shield,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Check
} from 'lucide-react';
import { config } from '../config';

interface WizardStep {
  title: string;
  description: string;
  icon: React.ReactNode;
  features: string[];
}

const steps: WizardStep[] = [
  {
    title: `Welcome to ${config.libraryName}!`,
    description: 'Your complete library management solution',
    icon: <Sparkles className="h-16 w-16 text-primary" />,
    features: [
      'Manage your entire book collection',
      'Track member information',
      'Handle book loans and returns',
      'Generate insights and reports',
    ],
  },
  {
    title: 'Book Management',
    description: 'Organize and manage your collection',
    icon: <BookOpen className="h-16 w-16 text-primary" />,
    features: [
      'Add books individually or in bulk via CSV',
      'Upload book covers and organize by categories',
      'Search and filter by title, author, or ISBN',
      'Track availability status in real-time',
    ],
  },
  {
    title: 'Member Management',
    description: 'Keep track of your library members',
    icon: <Users className="h-16 w-16 text-primary" />,
    features: [
      'Add and manage member profiles',
      'Import members via CSV for bulk operations',
      'Search members by name, email, or phone',
      'View member loan history',
    ],
  },
  {
    title: 'Loan System',
    description: 'Streamline borrowing and returns',
    icon: <RefreshCcw className="h-16 w-16 text-primary" />,
    features: [
      'Quick and easy book borrowing',
      'Automatic due date calculation (14 days)',
      'Track active, overdue, and returned loans',
      'Get notified about overdue books',
    ],
  },
  {
    title: 'Dashboard & Insights',
    description: 'Monitor your library at a glance',
    icon: <BarChart3 className="h-16 w-16 text-primary" />,
    features: [
      'View key statistics and metrics',
      'Track most borrowed books',
      'Monitor overdue loans',
      'Visualize lending trends over time',
    ],
  },
  {
    title: 'Security & Access',
    description: 'Secure and role-based access control',
    icon: <Shield className="h-16 w-16 text-primary" />,
    features: [
      'Admin and member role management',
      'Secure authentication with JWT',
      'Password reset functionality',
      'Protected routes and data',
    ],
  },
];

const WelcomeWizard = () => {
  const { showWelcome, completeWelcome } = useOnboarding();
  const [currentStep, setCurrentStep] = useState(0);

  const isLastStep = currentStep === steps.length - 1;
  const isFirstStep = currentStep === 0;

  const handleNext = () => {
    if (isLastStep) {
      handleComplete();
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    setCurrentStep((prev) => Math.max(0, prev - 1));
  };

  const handleComplete = () => {
    completeWelcome();
    // Optionally offer to start the feature tour
    // startTour();
  };

  const handleSkip = () => {
    completeWelcome();
  };

  const currentStepData = steps[currentStep];

  return (
    <Modal
      open={showWelcome}
      onClose={handleSkip}
      title="Welcome"
      size="lg"
    >
      <div className="py-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {/* Icon */}
            <div className="flex justify-center mb-6">
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
                className="p-4 rounded-full bg-primary/10"
              >
                {currentStepData.icon}
              </motion.div>
            </div>

            {/* Title and Description */}
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-text-primary mb-3">
                {currentStepData.title}
              </h2>
              <p className="text-lg text-text-secondary">
                {currentStepData.description}
              </p>
            </div>

            {/* Features List */}
            <div className="space-y-3 mb-8">
              {currentStepData.features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + index * 0.1 }}
                  className="flex items-start gap-3 p-3 rounded-lg bg-background-secondary"
                >
                  <div className="flex-shrink-0 mt-0.5">
                    <Check className="h-5 w-5 text-secondary" />
                  </div>
                  <p className="text-text-primary">{feature}</p>
                </motion.div>
              ))}
            </div>

            {/* Progress Indicators */}
            <div className="flex justify-center gap-2 mb-8">
              {steps.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentStep(index)}
                  className={`h-2 rounded-full transition-all ${
                    index === currentStep
                      ? 'w-8 bg-primary'
                      : index < currentStep
                      ? 'w-2 bg-primary/50'
                      : 'w-2 bg-border'
                  }`}
                  aria-label={`Go to step ${index + 1}`}
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
                {!isLastStep && (
                  <Button
                    variant="ghost"
                    onClick={handleSkip}
                  >
                    Skip Tour
                  </Button>
                )}

                <Button
                  variant="primary"
                  onClick={handleNext}
                  icon={isLastStep ? <Check className="h-5 w-5" /> : undefined}
                >
                  {isLastStep ? (
                    'Get Started'
                  ) : (
                    <>
                      Next <ArrowRight className="h-5 w-5 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </Modal>
  );
};

export default WelcomeWizard;
