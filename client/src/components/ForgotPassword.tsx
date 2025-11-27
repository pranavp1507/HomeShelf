import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button, Input, Card, ErrorMessage } from './ui';
import { KeyRound, User, ArrowLeft } from 'lucide-react';
import { config } from '../config';
import { validateRequired, validateMinLength } from '../utils/validation';

const ForgotPassword = () => {
  const [username, setUsername] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [fieldError, setFieldError] = useState<string | undefined>(undefined);
  const [touched, setTouched] = useState(false);
  const [resetToken, setResetToken] = useState<string | null>(null); // For development mode
  const navigate = useNavigate();

  const validateUsername = (value: string): string | null => {
    const requiredError = validateRequired(value, 'Username');
    if (requiredError) return requiredError;
    return validateMinLength(value, 3, 'Username');
  };

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setUsername(value);
    if (touched) {
      setFieldError(validateUsername(value) || undefined);
    }
  };

  const handleUsernameBlur = () => {
    setTouched(true);
    setFieldError(validateUsername(username) || undefined);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setResetToken(null);

    // Validate username before submit
    const usernameError = validateUsername(username);
    setFieldError(usernameError || undefined);
    setTouched(true);

    if (usernameError) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${config.apiUrl}/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to request password reset');
      }

      setSuccess(data.message);

      // In development mode, show the reset token
      if (data.resetToken) {
        setResetToken(data.resetToken);
      } else {
        // In production, redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

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
          <h1 className="text-3xl font-bold text-text-primary mb-2">Forgot Password</h1>
          <p className="text-text-secondary">Enter your username to reset your password</p>
        </div>

        <Card variant="elevated" padding="lg">
          {success ? (
            <div className="space-y-6">
              <ErrorMessage
                message={success}
                variant="info"
              />

              {resetToken && (
                <div className="space-y-4">
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                    <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-300 mb-2">
                      Development Mode: Reset Token Generated
                    </p>
                    <p className="text-xs text-yellow-700 dark:text-yellow-400 mb-3">
                      In production, this would be sent via email. Click the button below to proceed with password reset.
                    </p>
                    <div className="bg-white dark:bg-gray-800 rounded p-2 mb-3 break-all font-mono text-xs">
                      {resetToken}
                    </div>
                    <Button
                      variant="primary"
                      fullWidth
                      onClick={() => navigate(`/reset-password?token=${resetToken}`)}
                    >
                      Proceed to Reset Password
                    </Button>
                  </div>
                </div>
              )}

              <Button
                variant="ghost"
                fullWidth
                onClick={() => navigate('/login')}
                icon={<ArrowLeft className="h-5 w-5" />}
              >
                Back to Login
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <Input
                label="Username"
                type="text"
                id="username"
                name="username"
                autoComplete="username"
                autoFocus
                required
                fullWidth
                value={username}
                onChange={handleUsernameChange}
                onBlur={handleUsernameBlur}
                error={fieldError}
                startIcon={<User className="h-5 w-5" />}
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
                {loading ? 'Sending...' : 'Send Reset Link'}
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

export default ForgotPassword;
