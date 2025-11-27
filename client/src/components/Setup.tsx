import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from './AuthContext';
import { Button, Input, Card } from './ui';
import { UserPlus, User, Lock, AlertCircle, CheckCircle, Shield } from 'lucide-react';
import { config } from '../config';

interface SetupProps {
  onSetupComplete: () => void;
}

const Setup = ({ onSetupComplete }: SetupProps) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSetup = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const response = await fetch(`${config.apiUrl}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password, role: 'admin' }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Admin setup failed');
      }

      setSuccess('Admin user created successfully! Redirecting...');

      // Automatically log in the newly created admin user
      const loginResponse = await fetch(`${config.apiUrl}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const loginData = await loginResponse.json();

      if (!loginResponse.ok) {
        throw new Error(loginData.error || 'Automatic login failed after setup');
      }

      login(loginData.token, loginData.user);
      onSetupComplete();

      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.9, rotate: -5 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="flex justify-center mb-4"
          >
            <div className="relative">
              <img
                src={config.libraryLogo}
                alt={`${config.libraryName} Logo`}
                className="h-20 w-20 object-contain"
              />
              <div className="absolute -bottom-1 -right-1 bg-primary text-white rounded-full p-1.5">
                <Shield className="h-4 w-4" />
              </div>
            </div>
          </motion.div>
          <h1 className="text-3xl font-bold text-text-primary mb-2">Initial Admin Setup</h1>
          <p className="text-text-secondary">Create the first administrator account</p>
        </div>

        <Card variant="elevated" padding="lg">
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-1">
                  Welcome to {config.libraryName}
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-400">
                  No admin user found. Please create the first admin account to get started.
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSetup} className="space-y-6">
            <Input
              label="Admin Username"
              type="text"
              id="username"
              name="username"
              autoComplete="username"
              autoFocus
              required
              fullWidth
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              startIcon={<User className="h-5 w-5" />}
              disabled={loading}
              helperText="This will be your primary admin account"
            />

            <Input
              label="Admin Password"
              type="password"
              id="password"
              name="password"
              autoComplete="new-password"
              required
              fullWidth
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              startIcon={<Lock className="h-5 w-5" />}
              disabled={loading}
              helperText="Choose a strong password"
            />

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3"
              >
                <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
              </motion.div>
            )}

            {success && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-start gap-3"
              >
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-green-800 dark:text-green-300">{success}</p>
              </motion.div>
            )}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              loading={loading}
              icon={<UserPlus className="h-5 w-5" />}
              disabled={success !== null}
            >
              {loading ? 'Creating Admin...' : success ? 'Redirecting...' : 'Create Admin Account'}
            </Button>
          </form>
        </Card>

        <p className="mt-6 text-center text-sm text-text-secondary">
          This account will have full administrative privileges
        </p>
      </motion.div>
    </div>
  );
};

export default Setup;
