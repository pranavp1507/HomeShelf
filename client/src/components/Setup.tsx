import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import {
  Container,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
} from '@mui/material';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

interface SetupProps {
  onSetupComplete: () => void;
}

const Setup: React.FC<SetupProps> = ({ onSetupComplete }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSetup = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password, role: 'admin' }), // Create the first user as admin
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Admin setup failed');
      }

      setSuccess('Admin user created successfully! Redirecting to login...');
      // Automatically log in the newly created admin user
      const loginResponse = await fetch(`${API_URL}/auth/login`, {
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

      // Notify parent component that setup is complete
      onSetupComplete();

      // Redirect immediately
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <Container maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Typography component="h1" variant="h5">
          Initial Admin Setup
        </Typography>
        <Typography variant="body2" color="textSecondary" sx={{ mt: 1, mb: 3 }}>
          No admin user found. Please create the first admin account.
        </Typography>
        <Box component="form" onSubmit={handleSetup} noValidate sx={{ mt: 1 }}>
          <TextField
            margin="normal"
            required
            fullWidth
            id="username"
            label="Admin Username"
            name="username"
            autoComplete="username"
            autoFocus
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="Admin Password"
            type="password"
            id="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
          >
            Create Admin
          </Button>
          {error && <Alert severity="error">{error}</Alert>}
          {success && <Alert severity="success">{success}</Alert>}
        </Box>
      </Box>
    </Container>
  );
};

export default Setup;
