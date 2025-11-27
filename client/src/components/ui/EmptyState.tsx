import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import Button from './Button';

export interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
  };
  className?: string;
}

const EmptyState = ({ icon: Icon, title, description, action, className = '' }: EmptyStateProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={`flex flex-col items-center justify-center py-16 px-4 text-center ${className}`}
    >
      <motion.div
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
        className="mb-6 p-6 rounded-full bg-primary/10 dark:bg-primary/20"
      >
        <Icon className="h-16 w-16 text-primary" />
      </motion.div>

      <h3 className="text-2xl font-semibold text-text-primary mb-3">
        {title}
      </h3>

      <p className="text-text-secondary max-w-md mb-8">
        {description}
      </p>

      {action && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <Button
            variant="primary"
            size="lg"
            onClick={action.onClick}
            icon={action.icon}
          >
            {action.label}
          </Button>
        </motion.div>
      )}
    </motion.div>
  );
};

export default EmptyState;
