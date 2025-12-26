import React, { useState } from 'react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalFooter,
  Button,
  Input,
  FormField,
  FormLabel,
  FormError,
} from '@/components/ui';

interface MasterPasswordModalProps {
  open: boolean;
  mode: 'create' | 'unlock';
  onSubmit: (password: string) => void;
  onCancel?: () => void;
}

const MasterPasswordModal: React.FC<MasterPasswordModalProps> = ({
  open,
  mode,
  onSubmit,
  onCancel,
}) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateCreate = () => {
    const newErrors: Record<string, string> = {};

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateUnlock = () => {
    const newErrors: Record<string, string> = {};

    if (!password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    const isValid = mode === 'create' ? validateCreate() : validateUnlock();
    if (!isValid) return;

    onSubmit(password);
    setPassword('');
    setConfirmPassword('');
    setErrors({});
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  const getPasswordStrength = (pwd: string): { strength: number; label: string; color: string } => {
    let strength = 0;
    if (pwd.length >= 8) strength++;
    if (pwd.length >= 12) strength++;
    if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) strength++;
    if (/\d/.test(pwd)) strength++;
    if (/[^a-zA-Z0-9]/.test(pwd)) strength++;

    if (strength <= 2) return { strength, label: 'Weak', color: 'bg-error' };
    if (strength <= 3) return { strength, label: 'Fair', color: 'bg-warning' };
    if (strength <= 4) return { strength, label: 'Good', color: 'bg-success' };
    return { strength, label: 'Strong', color: 'bg-success' };
  };

  const strength = mode === 'create' && password ? getPasswordStrength(password) : null;

  return (
    <Modal open={open} onOpenChange={onCancel}>
      <ModalContent className="max-w-md">
        <ModalHeader>
          <ModalTitle>
            {mode === 'create' ? 'Create Master Password' : 'Unlock NomadSSH'}
          </ModalTitle>
          <ModalDescription>
            {mode === 'create'
              ? 'Your master password encrypts all sensitive data. Choose a strong password you can remember.'
              : 'Enter your master password to unlock your encrypted data.'}
          </ModalDescription>
        </ModalHeader>

        <div className="p-6 space-y-4">
          <FormField>
            <FormLabel htmlFor="password" required>
              {mode === 'create' ? 'Master Password' : 'Password'}
            </FormLabel>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Enter password"
              error={!!errors.password}
              autoFocus
            />
            {errors.password && <FormError>{errors.password}</FormError>}

            {/* Password Strength Indicator */}
            {mode === 'create' && password && strength && (
              <div className="mt-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-text-secondary">Strength:</span>
                  <span className="text-xs font-medium text-text-primary">{strength.label}</span>
                </div>
                <div className="h-1.5 bg-border rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all ${strength.color}`}
                    style={{ width: `${(strength.strength / 5) * 100}%` }}
                  />
                </div>
              </div>
            )}
          </FormField>

          {mode === 'create' && (
            <FormField>
              <FormLabel htmlFor="confirmPassword" required>
                Confirm Password
              </FormLabel>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Re-enter password"
                error={!!errors.confirmPassword}
              />
              {errors.confirmPassword && <FormError>{errors.confirmPassword}</FormError>}
            </FormField>
          )}

          {mode === 'create' && (
            <div className="p-3 bg-surface border border-border rounded text-sm">
              <p className="text-text-secondary mb-2">Password requirements:</p>
              <ul className="text-xs text-text-secondary space-y-1">
                <li className={password.length >= 8 ? 'text-success' : ''}>
                  • At least 8 characters
                </li>
                <li className={/[A-Z]/.test(password) && /[a-z]/.test(password) ? 'text-success' : ''}>
                  • Mix of uppercase and lowercase
                </li>
                <li className={/\d/.test(password) ? 'text-success' : ''}>
                  • At least one number
                </li>
                <li className={/[^a-zA-Z0-9]/.test(password) ? 'text-success' : ''}>
                  • Special characters (recommended)
                </li>
              </ul>
            </div>
          )}
        </div>

        <ModalFooter>
          {onCancel && (
            <Button variant="ghost" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button variant="primary" onClick={handleSubmit}>
            {mode === 'create' ? 'Create Password' : 'Unlock'}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default MasterPasswordModal;
