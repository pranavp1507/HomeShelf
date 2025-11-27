import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button, Input, Card, ErrorMessage } from './ui';
import { KeyRound, Lock, CheckCircle, ArrowLeft } from 'lucide-react';
import { config } from '../config';
import { validatePassword } from '../utils/validation';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ password?: string; confirmPassword?: string }>({});
  const [touched, setTouched] = useState<{ password?: boolean; confirmPassword?: boolean }>({});
  const [resetUsername, setResetUsername] = useState<string>('');
  const navigate = useNavigate();

  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setError('Invalid reset link. Please request a new password reset.');
    }
  }, [token]);

  const validatePasswordField = (value: string): string | null => {
    return validatePassword(value);
  };

  const validateConfirmPasswordField = (value: string): string | null => {
    if (!value) {
      return 'Please confirm your password';
    }
    if (value !== password) {
      return 'Passwords do not match';
    }
    return null;
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPassword(value);
    if (touched.password) {
      setFieldErrors((prev) => ({ ...prev, password: validatePasswordField(value) || undefined }));
    }
    // Also revalidate confirm password if it's been touched
    if (touched.confirmPassword) {
      setFieldErrors((prev) => ({
        ...prev,
        confirmPassword: value !== confirmPassword ? 'Passwords do not match' : undefined
      }));
    }
  };

  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setConfirmPassword(value);
    if (touched.confirmPassword) {
      setFieldErrors((prev) => ({ ...prev, confirmPassword: validateConfirmPasswordField(value) || undefined }));
    }
  };

  const handlePasswordBlur = () => {
    setTouched((prev) => ({ ...prev, password: true }));
    setFieldErrors((prev) => ({ ...prev, password: validatePasswordField(password) || undefined }));
  };

  const handleConfirmPasswordBlur = () => {
    setTouched((prev) => ({ ...prev, confirmPassword: true }));
    setFieldErrors((prev) => ({ ...prev, confirmPassword: validateConfirmPasswordField(confirmPassword) || undefined }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!token) {
      setError('Invalid reset link. Please request a new password reset.');
      return;
    }

    // Validate all fields before submit
    const passwordError = validatePasswordField(password);
    const confirmPasswordError = validateConfirmPasswordField(confirmPassword);

    setFieldErrors({
      password: passwordError || undefined,
      confirmPassword: confirmPasswordError || undefined
    });
    setTouched({ password: true, confirmPassword: true });

    if (passwordError || confirmPasswordError) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${config.apiUrl}/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, newPassword: password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to reset password');
      }

      setResetUsername(data.username || '');
      setSuccess(true);

      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <Card variant="elevated" padding="lg">
            <ErrorMessage
              message="Invalid reset link. Please request a new password reset."
            />
            <div className="mt-6">
              <Button
                variant="primary"
                fullWidth
                onClick={() => navigate('/forgot-password')}
              >
                Request New Reset Link
              </Button>
            </div>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1, duration: 0.3 }}
            className="flex justify-center mb-4"
          >
            <img
              src={config.libraryLogo}
              alt={`${config.libraryName} Logo`}
              className="h-20 w-20 object-contain"
            />
          </motion.div>
          <h1 className="text-3xl font-bold text-text-primary mb-2">Reset Password</h1>
          <p className="text-text-secondary">Enter your new password</p>
        </div>

        <Card variant="elevated" padding="lg">
          {success ? (
            <div className="space-y-6 text-center">
              <div className="flex justify-center">
                <div className="rounded-full bg-green-100 dark:bg-green-900/20 p-4">
                  <CheckCircle className="h-12 w-12 text-green-600 dark:text-green-400" />
                </div>
              </div>

              <div>
                <h2 className="text-xl font-semibold text-text-primary mb-2">
                  Password Reset Successfully!
                </h2>
                <p className="text-text-secondary">
                  Your password has been reset. You can now log in with your new password.
                </p>
                {resetUsername && (
                  <p className="text-sm text-text-tertiary mt-2">
                    Username: <span className="font-medium text-text-primary">{resetUsername}</span>
                  </p>
                )}
              </div>

              <div className="space-y-3">
                <p className="text-sm text-text-tertiary">
                  Redirecting to login page in 3 seconds...
                </p>
                <Button
                  variant="primary"
                  fullWidth
                  onClick={() => navigate('/login')}
                >
                  Go to Login Now
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <Input
                label="New Password"
                type="password"
                id="password"
                name="password"
                autoComplete="new-password"
                autoFocus
                required
                fullWidth
                value={password}
                onChange={handlePasswordChange}
                onBlur={handlePasswordBlur}
                error={fieldErrors.password}
                startIcon={<Lock className="h-5 w-5" />}
                disabled={loading}
                helperText="Password must be at least 6 characters"
              />

              <Input
                label="Confirm New Password"
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                autoComplete="new-password"
                required
                fullWidth
                value={confirmPassword}
                onChange={handleConfirmPasswordChange}
                onBlur={handleConfirmPasswordBlur}
                error={fieldErrors.confirmPassword}
                startIcon={<Lock className="h-5 w-5" />}
                disabled={loading}
              />

              {error && (
                <ErrorMessage
                  message={error}
                  onClose={() => setError(null)}
                />
              )}

              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                loading={loading}
                icon={<KeyRound className="h-5 w-5" />}
              >
                {loading ? 'Resetting Password...' : 'Reset Password'}
              </Button>

              <div className="text-center">
                <Link
                  to="/login"
                  className="text-sm text-primary hover:text-primary-dark transition-colors inline-flex items-center gap-1"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Login
                </Link>
              </div>
            </form>
          )}
        </Card>

        <p className="mt-6 text-center text-sm text-text-secondary">
          Secure library management system
        </p>
      </motion.div>
    </div>
  );
};

export default ResetPassword;
