import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Box,
  Alert,
  type SelectChangeEvent, // Import SelectChangeEvent as a type
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import KeyIcon from '@mui/icons-material/Key'; // For password change
import { useAuth } from './AuthContext';
import { useNavigate } from 'react-router-dom';

interface User {
  id: number;
  username: string;
  role: 'admin' | 'member';
  created_at: string;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const UserManagement: React.FC = () => {
  const { token, user: currentUser } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentUserData, setCurrentUserData] = useState<Partial<User>>({});
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [passwordChangeUserId, setPasswordChangeUserId] = useState<number | null>(null);
  const [newPassword, setNewPassword] = useState('');

  const fetchUsers = useCallback(async () => {
    setError(null);
    try {
      const response = await fetch(`${API_URL}/users`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) {
        throw new Error((await response.json()).error || 'Failed to fetch users');
      }
      const data = await response.json();
      setUsers(data);
    } catch (err: any) {
      setError(err.message);
    }
  }, [token]);

  useEffect(() => {
    if (currentUser?.role !== 'admin') {
      navigate('/dashboard'); // Redirect if not admin
    } else {
      fetchUsers();
    }
  }, [currentUser, navigate, fetchUsers]);

  const handleOpenDialog = (user: User | null = null) => {
    setIsEditing(!!user);
    setCurrentUserData(user ? { ...user } : { role: 'member' });
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setCurrentUserData({});
  };

  const handleOpenPasswordDialog = (userId: number) => {
    setPasswordChangeUserId(userId);
    setPasswordDialogOpen(true);
  };

  const handleClosePasswordDialog = () => {
    setPasswordDialogOpen(false);
    setPasswordChangeUserId(null);
    setNewPassword('');
  };

  const handlePasswordChangeSubmit = async () => {
    setError(null);
    if (!passwordChangeUserId || !newPassword) return;

    try {
      const response = await fetch(`${API_URL}/users/${passwordChangeUserId}/password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ password: newPassword }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to update password');
      }
      handleClosePasswordDialog();
      // Optionally, show a success notification
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDialogChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCurrentUserData((prev: Partial<User>) => ({ ...prev, [name as string]: value }));
  };

  const handleRoleChange = (e: SelectChangeEvent<'admin' | 'member'>) => {
    const { name, value } = e.target;
    setCurrentUserData((prev: Partial<User>) => ({ ...prev, [name as string]: value }));
  };

  const handleDialogSubmit = async () => {
    setError(null);
    const url = isEditing
      ? `${API_URL}/users/${currentUserData.id}`
      : `${API_URL}/auth/register`;
    const method = isEditing ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(currentUserData),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || `Failed to ${isEditing ? 'update' : 'create'} user`);
      }
      handleCloseDialog();
      fetchUsers();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDeleteUser = async (userId: number) => {
    setError(null);
    if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      try {
        const response = await fetch(`${API_URL}/users/${userId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` },
        });

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.error || 'Failed to delete user');
        }
        fetchUsers();
      } catch (err: any) {
        setError(err.message);
      }
    }
  };
  
  if (currentUser?.role !== 'admin') {
    return <Container><Alert severity="error">Access Denied: You must be an administrator to view this page.</Alert></Container>;
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4" component="h2" gutterBottom>
          User Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add New User
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Username</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Created At</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{user.id}</TableCell>
                <TableCell>{user.username}</TableCell>
                <TableCell>{user.role}</TableCell>
                <TableCell>{new Date(user.created_at).toLocaleString()}</TableCell>
                <TableCell align="right">
                  <IconButton onClick={() => handleOpenDialog(user)}><EditIcon /></IconButton>
                  <IconButton onClick={() => handleOpenPasswordDialog(user.id)} disabled={currentUser?.id === user.id}><KeyIcon /></IconButton>
                  {currentUser?.id !== user.id && (
                    <IconButton onClick={() => handleDeleteUser(user.id)}><DeleteIcon /></IconButton>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Dialog for Add/Edit User */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog}>
        <DialogTitle>{isEditing ? 'Edit User' : 'Add New User'}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            name="username"
            label="Username"
            type="text"
            fullWidth
            variant="outlined"
            value={currentUserData.username || ''}
            onChange={handleDialogChange}
            required
          />
          {!isEditing && (
            <TextField
              margin="dense"
              name="password"
              label="Password"
              type="password"
              fullWidth
              variant="outlined"
              onChange={handleDialogChange}
              required
            />
          )}
          <FormControl fullWidth margin="dense">
            <InputLabel>Role</InputLabel>
            <Select
              name="role"
              value={currentUserData.role || 'member'}
              label="Role"
              onChange={handleRoleChange}
            >
              <MenuItem value="admin">Admin</MenuItem>
              <MenuItem value="member">Member</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleDialogSubmit}>{isEditing ? 'Save Changes' : 'Create User'}</Button>
        </DialogActions>
      </Dialog>

      {/* Dialog for Changing Password */}
      <Dialog open={passwordDialogOpen} onClose={handleClosePasswordDialog}>
        <DialogTitle>Change Password</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            name="password"
            label="New Password"
            type="password"
            fullWidth
            variant="outlined"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClosePasswordDialog}>Cancel</Button>
          <Button onClick={handlePasswordChangeSubmit} disabled={!newPassword}>Update Password</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default UserManagement;
