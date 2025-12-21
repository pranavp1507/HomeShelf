import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from './AuthContext';
import { Button, Input, Card, ErrorMessage } from './ui';
import { LogIn, User, Lock } from 'lucide-react';
import { config } from '../config';
import { validateRequired, validateMinLength } from '../utils/validation';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ username?: string; password?: string }>({});
  const [touched, setTouched] = useState<{ username?: boolean; password?: boolean }>({});
  const navigate = useNavigate();
  const { login } = useAuth();

  const validateUsername = (value: string): string | null => {
    const requiredError = validateRequired(value, 'Username');
    if (requiredError) return requiredError;
    return validateMinLength(value, 3, 'Username');
  };

  const validatePasswordField = (value: string): string | null => {
    const requiredError = validateRequired(value, 'Password');
    if (requiredError) return requiredError;
    return validateMinLength(value, 6, 'Password');
  };

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setUsername(value);
    if (touched.username) {
      setFieldErrors((prev) => ({ ...prev, username: validateUsername(value) || undefined }));
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPassword(value);
    if (touched.password) {
      setFieldErrors((prev) => ({ ...prev, password: validatePasswordField(value) || undefined }));
    }
  };

  const handleUsernameBlur = () => {
    setTouched((prev) => ({ ...prev, username: true }));
    setFieldErrors((prev) => ({ ...prev, username: validateUsername(username) || undefined }));
  };

  const handlePasswordBlur = () => {
    setTouched((prev) => ({ ...prev, password: true }));
    setFieldErrors((prev) => ({ ...prev, password: validatePasswordField(password) || undefined }));
  };

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    // Validate all fields before submit
    const usernameError = validateUsername(username);
    const passwordError = validatePasswordField(password);

    setFieldErrors({ username: usernameError || undefined, password: passwordError || undefined });
    setTouched({ username: true, password: true });

    if (usernameError || passwordError) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${config.apiUrl}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      // Check if response is JSON before parsing
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Server returned an invalid response. Please try again later.');
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Invalid username or password');
      }

      const { token, user: userData } = data;
      login(token, userData);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'An error occurred during login');
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
          <h1 className="text-3xl font-bold text-text-primary mb-2">{config.libraryName}</h1>
          <p className="text-text-secondary">Sign in to your account</p>
        </div>

        <Card variant="elevated" padding="lg">
          <form onSubmit={handleLogin} className="space-y-6">
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
              error={fieldErrors.username}
              startIcon={<User className="h-5 w-5" />}
              disabled={loading}
            />

            <Input
              label="Password"
              type="password"
              id="password"
              name="password"
              autoComplete="current-password"
              required
              fullWidth
              value={password}
              onChange={handlePasswordChange}
              onBlur={handlePasswordBlur}
              error={fieldErrors.password}
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
              icon={<LogIn className="h-5 w-5" />}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>

            <div className="text-center">
              <Link
                to="/forgot-password"
                className="text-sm text-primary hover:text-primary-dark transition-colors"
              >
                Forgot your password?
              </Link>
            </div>
          </form>
        </Card>

        <p className="mt-6 text-center text-sm text-text-secondary">
          Secure library management system
        </p>
      </motion.div>
    </div>
  );
};

export default Login;
