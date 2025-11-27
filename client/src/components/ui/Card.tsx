import { forwardRef, type HTMLAttributes } from 'react';
import { motion } from 'framer-motion';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'bordered' | 'elevated';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
  clickable?: boolean;
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      children,
      variant = 'default',
      padding = 'md',
      hover = false,
      clickable = false,
      className = '',
      ...props
    },
    ref
  ) => {
    const baseClasses = 'bg-surface rounded-lg transition-all';

    const variantClasses = {
      default: 'border border-border',
      bordered: 'border-2 border-border',
      elevated: 'shadow-lg',
    };

    const paddingClasses = {
      none: '',
      sm: 'p-3',
      md: 'p-4',
      lg: 'p-6',
    };

    const interactiveClasses = clickable ? 'cursor-pointer' : '';

    const classes = `${baseClasses} ${variantClasses[variant]} ${paddingClasses[padding]} ${interactiveClasses} ${className}`;

    if (hover || clickable) {
      const MotionDiv = motion.div;
      return (
        <MotionDiv
          ref={ref}
          className={classes}
          whileHover={{ scale: 1.02, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }}
          transition={{ duration: 0.2 }}
          {...(props as any)}
        >
          {children}
        </MotionDiv>
      );
    }

    return (
      <div
        ref={ref}
        className={classes}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

export default Card;
