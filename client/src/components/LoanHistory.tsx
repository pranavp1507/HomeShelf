import { useState, useEffect } from 'react';
import { config } from '../config';
import { motion } from 'framer-motion';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Search, FileText, Calendar, AlertCircle, BookOpen } from 'lucide-react';
import { Input, Select, Badge, EmptyState } from './ui';
import Pagination from './Pagination';

interface Loan {
  id: number;
  book_title: string;
  member_name: string;
  borrow_date: string;
  due_date: string;
  return_date: string | null;
}


const LoanHistory = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination state
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'all');

  useEffect(() => {
    const fetchLoans = async () => {
      setLoading(true);
      setError(null);
      try {
        let url = `${config.apiUrl}/loans?page=${page}&limit=${limit}`;
        if (statusFilter !== 'all') url += `&status=${statusFilter}`;
        if (searchQuery) url += `&search=${searchQuery}`;

        const response = await fetch(url);
        if (!response.ok) {
          throw new Error('Failed to fetch loan history');
        }
        const result = await response.json();

        setLoans(result.data || []);
        if (result.pagination) {
          setTotalCount(result.pagination.totalCount);
          setTotalPages(result.pagination.totalPages);
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchLoans();
  }, [page, limit, statusFilter, searchQuery]);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusBadge = (loan: Loan) => {
    if (loan.return_date) {
      return <Badge variant="success" size="sm">Returned</Badge>;
    }
    if (new Date(loan.due_date) < new Date()) {
      return <Badge variant="error" size="sm">Overdue</Badge>;
    }
    return <Badge variant="info" size="sm">On Loan</Badge>;
  };

  if (loading && loans.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-lg text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search by book or member"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            startIcon={<Search className="h-5 w-5" />}
            fullWidth
          />
        </div>
        <div className="sm:w-48">
          <Select
            value={statusFilter}
            onChange={(e) => {
              const newStatus = e.target.value;
              setStatusFilter(newStatus);
              setPage(1);
              if (newStatus === 'all') {
                searchParams.delete('status');
              } else {
                searchParams.set('status', newStatus);
              }
              setSearchParams(searchParams);
            }}
            options={[
              { value: 'all', label: 'All Status' },
              { value: 'active', label: 'On Loan' },
              { value: 'overdue', label: 'Overdue' },
              { value: 'returned', label: 'Returned' },
            ]}
            fullWidth
          />
        </div>
      </div>

      {/* Table */}
      {loans.length === 0 ? (
        <div className="bg-surface rounded-lg shadow-md">
          <EmptyState
            icon={FileText}
            title="No Loan History"
            description="No loans have been recorded yet. Start borrowing books by visiting the Loan Manager!"
            action={{
              label: 'Go to Loan Manager',
              onClick: () => navigate('/loans'),
              icon: <BookOpen className="h-5 w-5" />,
            }}
          />
        </div>
      ) : (
        <div className="bg-surface rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[650px]">
              <thead className="bg-background-secondary border-b border-border">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-text-primary">Book</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-text-primary">Member</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-text-primary">Borrow Date</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-text-primary">Due Date</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-text-primary">Return Date</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-text-primary">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loans.map((loan, index) => (
                  <motion.tr
                    key={loan.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05, duration: 0.2 }}
                    className="hover:bg-background-secondary transition-colors"
                  >
                    <td className="px-4 py-3 text-text-primary font-medium">{loan.book_title}</td>
                    <td className="px-4 py-3 text-text-secondary">{loan.member_name}</td>
                    <td className="px-4 py-3 text-text-secondary">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-text-tertiary" />
                        {formatDate(loan.borrow_date)}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-text-secondary">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-text-tertiary" />
                        {formatDate(loan.due_date)}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-text-secondary">
                      {loan.return_date ? (
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-text-tertiary" />
                          {formatDate(loan.return_date)}
                        </div>
                      ) : (
                        <span className="text-text-tertiary">Not returned</span>
                      )}
                    </td>
                    <td className="px-4 py-3">{getStatusBadge(loan)}</td>
                  </motion.tr>
                ))
                }
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Pagination
        page={page}
        totalPages={totalPages}
        totalCount={totalCount}
        limit={limit}
        onPageChange={setPage}
        onLimitChange={setLimit}
      />
    </div>
  );
};

export default LoanHistory;
