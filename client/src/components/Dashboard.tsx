import React, { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Alert from '@mui/material/Alert'; // Import Alert
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useAuth } from './AuthContext'; // Import useAuth
import { useNavigate } from 'react-router-dom'; // Import useNavigate

interface DashboardStats {
  total_books: number;
  total_members: number;
  active_loans: number;
  overdue_loans: number;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const StatCard: React.FC<{ title: string; value: number | string; onClick?: () => void }> = ({ title, value, onClick }) => (
  <Card onClick={onClick} sx={{ cursor: onClick ? 'pointer' : 'default', '&:hover': { bgcolor: onClick ? 'action.hover' : 'inherit' } }}>
    <CardContent>
      <Typography color="textSecondary" gutterBottom>
        {title}
      </Typography>
      <Typography variant="h4" component="h2">
        {value}
      </Typography>
    </CardContent>
  </Card>
);

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth(); // Use auth token
  const navigate = useNavigate(); // Initialize useNavigate

  useEffect(() => {
    const fetchStats = async () => {
      if (!token) {
        setLoading(false);
        setError('Authentication token not found.');
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`${API_URL}/dashboard`, {
          headers: {
            'Authorization': `Bearer ${token}`, // Include token
          },
        });
        if (!response.ok) {
          throw new Error('Failed to fetch dashboard data');
        }
        const data = await response.json();
        setStats(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [token]); // Re-run when token changes

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>;
  }

  if (error || !stats) {
    return <Typography color="error" align="center" sx={{ mt: 4 }}>{error || 'No data available'}</Typography>;
  }
  
  const booksStatusData = [
    { name: 'Available', value: stats.total_books - stats.active_loans },
    { name: 'On Loan', value: stats.active_loans },
  ];

  const COLORS = ['#0088FE', '#FF8042'];

  return (
    <Box sx={{ mt: 4 }}>
      {stats.overdue_loans > 0 && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          You have {stats.overdue_loans} overdue loan(s)!
        </Alert>
      )}
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="Total Books" value={stats.total_books} onClick={() => navigate('/books')} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="Total Members" value={stats.total_members} onClick={() => navigate('/members')} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="Active Loans" value={stats.active_loans} onClick={() => navigate('/loan-history?status=active')} />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <StatCard title="Overdue Loans" value={stats.overdue_loans} onClick={() => navigate('/loan-history?status=overdue')} />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Book Status</Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={booksStatusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                  >
                    {booksStatusData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
