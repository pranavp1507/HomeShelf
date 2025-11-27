import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useAuth } from './AuthContext';
import { useNavigate } from 'react-router-dom';
import { Card } from './ui';
import { BookOpen, Users, FileText, AlertCircle } from 'lucide-react';
import { config } from '../config';

interface DashboardStats {
  total_books: number;
  total_members: number;
  active_loans: number;
  overdue_loans: number;
}

interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
  onClick?: () => void;
}

const StatCard = ({ title, value, icon, color, onClick }: StatCardProps) => (
  <motion.div
    whileHover={{ scale: 1.02, y: -4 }}
    whileTap={{ scale: 0.98 }}
    transition={{ duration: 0.2 }}
  >
    <Card
      clickable={!!onClick}
      onClick={onClick}
      className="h-full"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-text-secondary mb-1">{title}</p>
          <p className="text-3xl font-bold text-text-primary">{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          {icon}
        </div>
      </div>
    </Card>
  </motion.div>
);

const Dashboard = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth();
  const navigate = useNavigate();

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
        const response = await fetch(`${config.apiUrl}/dashboard`, {
          headers: {
            'Authorization': `Bearer ${token}`,
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
  }, [token]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-lg text-red-600">{error || 'No data available'}</p>
        </div>
      </div>
    );
  }

  const booksStatusData = [
    { name: 'Available', value: stats.total_books - stats.active_loans },
    { name: 'On Loan', value: stats.active_loans },
  ];

  const COLORS = ['#0088FE', '#FF8042'];

  return (
    <div className="mt-8 px-4 max-w-7xl mx-auto">
      {stats.overdue_loans > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg flex items-start gap-3"
        >
          <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-yellow-800 dark:text-yellow-300">
              You have {stats.overdue_loans} overdue loan(s)!
            </p>
            <p className="text-sm text-yellow-700 dark:text-yellow-400 mt-1">
              Please return or renew these items as soon as possible.
            </p>
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Books"
          value={stats.total_books}
          icon={<BookOpen className="h-6 w-6 text-blue-600" />}
          color="bg-blue-50 dark:bg-blue-900/20"
          onClick={() => navigate('/books')}
        />
        <StatCard
          title="Total Members"
          value={stats.total_members}
          icon={<Users className="h-6 w-6 text-green-600" />}
          color="bg-green-50 dark:bg-green-900/20"
          onClick={() => navigate('/members')}
        />
        <StatCard
          title="Active Loans"
          value={stats.active_loans}
          icon={<FileText className="h-6 w-6 text-purple-600" />}
          color="bg-purple-50 dark:bg-purple-900/20"
          onClick={() => navigate('/loan-history?status=active')}
        />
        <StatCard
          title="Overdue Loans"
          value={stats.overdue_loans}
          icon={<AlertCircle className="h-6 w-6 text-red-600" />}
          color="bg-red-50 dark:bg-red-900/20"
          onClick={() => navigate('/loan-history?status=overdue')}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="h-full">
            <h3 className="text-lg font-semibold text-text-primary mb-4">Book Status</h3>
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
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="h-full">
            <h3 className="text-lg font-semibold text-text-primary mb-4">Quick Stats</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-background-secondary rounded-lg">
                <span className="text-text-secondary">Books Per Member</span>
                <span className="text-lg font-semibold text-text-primary">
                  {stats.total_members > 0 ? (stats.total_books / stats.total_members).toFixed(1) : '0'}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-background-secondary rounded-lg">
                <span className="text-text-secondary">Loan Rate</span>
                <span className="text-lg font-semibold text-text-primary">
                  {stats.total_books > 0 ? ((stats.active_loans / stats.total_books) * 100).toFixed(1) : '0'}%
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-background-secondary rounded-lg">
                <span className="text-text-secondary">Overdue Rate</span>
                <span className="text-lg font-semibold text-text-primary">
                  {stats.active_loans > 0 ? ((stats.overdue_loans / stats.active_loans) * 100).toFixed(1) : '0'}%
                </span>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;
