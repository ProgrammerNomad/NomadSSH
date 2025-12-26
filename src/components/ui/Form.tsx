import React from 'react';
import { cn } from '@/utils/cn';

interface FormFieldProps {
  children: React.ReactNode;
  className?: string;
}

const FormField: React.FC<FormFieldProps> = ({ children, className }) => {
  return <div className={cn('space-y-2', className)}>{children}</div>;
};

interface FormLabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
}

const FormLabel: React.FC<FormLabelProps> = ({ children, required, className, ...props }) => {
  return (
    <label className={cn('block text-sm font-medium text-text-primary', className)} {...props}>
      {children}
      {required && <span className="text-error ml-1">*</span>}
    </label>
  );
};

interface FormErrorProps {
  children: React.ReactNode;
  className?: string;
}

const FormError: React.FC<FormErrorProps> = ({ children, className }) => {
  return <p className={cn('text-sm text-error', className)}>{children}</p>;
};

export { FormField, FormLabel, FormError };
