import { useState, useEffect, useCallback } from 'react';
import { config } from '../config';
import { apiFetch } from '../utils/api';
import { Edit2, Trash2, Plus, Key, Users, UserPlus } from 'lucide-react';
import { useAuth } from './AuthContext';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Input, Modal, Select, Badge, EmptyState, ErrorMessage } from './ui';

interface User {
  id: number;
  username: string;
  role: 'admin' | 'member';
  created_at: string;
}


const UserManagement = () => {
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
      const response = await apiFetch(`${config.apiUrl}/users`, {
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
      const response = await apiFetch(`${config.apiUrl}/users/${passwordChangeUserId}/password`, {
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

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setCurrentUserData((prev: Partial<User>) => ({ ...prev, [name as string]: value }));
  };

  const handleDialogSubmit = async () => {
    setError(null);
    const url = isEditing
      ? `${config.apiUrl}/users/${currentUserData.id}`
      : `${config.apiUrl}/auth/register`;
    const method = isEditing ? 'PUT' : 'POST';

    try {
      const response = await apiFetch(url, {
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
        const response = await apiFetch(`${config.apiUrl}/users/${userId}`, {
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
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-800 dark:text-red-300 font-medium">
            Access Denied: You must be an administrator to view this page.
          </p>
        </div>
      </div>
    );
  }

  const roleOptions = [
    { value: 'member', label: 'Member' },
    { value: 'admin', label: 'Admin' }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <Users className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold text-text-primary">User Management</h1>
        </div>
        <Button
          variant="primary"
          icon={<Plus className="h-5 w-5" />}
          onClick={() => handleOpenDialog()}
        >
          Add New User
        </Button>
      </div>

      {error && (
        <ErrorMessage
          message={error}
          onClose={() => setError(null)}
          className="mb-6"
        />
      )}

      {users.length === 0 ? (
        <Card>
          <EmptyState
            icon={Users}
            title="No Users Yet"
            description="Get started by adding users to your library management system!"
            action={{
              label: 'Add First User',
              onClick: () => handleOpenDialog(),
              icon: <UserPlus className="h-5 w-5" />,
            }}
          />
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-text-primary">ID</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-text-primary">Username</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-text-primary">Role</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-text-primary">Created At</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-text-primary">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b border-border hover:bg-background-secondary transition-colors">
                    <td className="py-3 px-4 text-sm text-text-primary">{user.id}</td>
                    <td className="py-3 px-4 text-sm text-text-primary font-medium">{user.username}</td>
                    <td className="py-3 px-4 text-sm">
                      <Badge variant={user.role === 'admin' ? 'success' : 'info'}>
                        {user.role}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-sm text-text-secondary">
                      {new Date(user.created_at).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleOpenDialog(user)}
                          className="p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 dark:text-blue-400 transition-colors"
                          aria-label="Edit user"
                        >
                          <Edit2 className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleOpenPasswordDialog(user.id)}
                          disabled={currentUser?.id === user.id}
                          className="p-2 rounded-lg hover:bg-yellow-50 dark:hover:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          aria-label="Change password"
                        >
                          <Key className="h-5 w-5" />
                        </button>
                        {currentUser?.id !== user.id && (
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 transition-colors"
                            aria-label="Delete user"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
                }
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Dialog for Add/Edit User */}
      <Modal
        open={dialogOpen}
        onClose={handleCloseDialog}
        title={isEditing ? 'Edit User' : 'Add New User'}
        size="sm"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleDialogSubmit();
          }}
          className="space-y-4"
        >
          <Input
            label="Username"
            name="username"
            type="text"
            value={currentUserData.username || ''}
            onChange={handleDialogChange}
            required
            fullWidth
            autoFocus
          />

          {!isEditing && (
            <Input
              label="Password"
              name="password"
              type="password"
              onChange={handleDialogChange}
              required
              fullWidth
            />
          )}

          <Select
            label="Role"
            name="role"
            value={currentUserData.role || 'member'}
            onChange={handleRoleChange}
            options={roleOptions}
            fullWidth
          />

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button
              type="button"
              variant="ghost"
              onClick={handleCloseDialog}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
            >
              {isEditing ? 'Save Changes' : 'Create User'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Dialog for Changing Password */}
      <Modal
        open={passwordDialogOpen}
        onClose={handleClosePasswordDialog}
        title="Change Password"
        size="sm"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handlePasswordChangeSubmit();
          }}
          className="space-y-4"
        >
          <Input
            label="New Password"
            name="password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            fullWidth
            autoFocus
          />

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button
              type="button"
              variant="ghost"
              onClick={handleClosePasswordDialog}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={!newPassword}
            >
              Update Password
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default UserManagement;
