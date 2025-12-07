import { useState, useEffect, type ReactNode, useCallback, useMemo } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import BookList from './components/BookList';
import BookForm from './components/BookForm';
import MemberList from './components/MemberList';
import MemberForm from './components/MemberForm';
import LoanManager from './components/LoanManager';
import LoanHistory from './components/LoanHistory';
import Dashboard from './components/Dashboard';
import BulkImportDialog from './components/BulkImportDialog';
import MemberBulkImportDialog from './components/MemberBulkImportDialog';
import Notification from './components/Notification';
import Pagination from './components/Pagination';
import Login from './components/Login';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';
import Navbar from './components/Navbar';
import { useAuth } from './components/AuthContext';
import CategoryManagement from './components/CategoryManagement';
import UserManagement from './components/UserManagement';
import Setup from './components/Setup';
import BookListSkeleton from './components/BookListSkeleton';
import MemberListSkeleton from './components/MemberListSkeleton';
import WelcomeWizard from './components/WelcomeWizard';
import FeatureTour from './components/FeatureTour';
import DataExport from './components/DataExport';
import Settings from './components/Settings';
import { useOnboarding } from './components/OnboardingContext';
import { config } from './config';
import { Input, Button, Select, MultiSelect } from './components/ui';
import { Plus, Upload, Loader2 } from 'lucide-react';
import './App.css';

// Define the book type
interface Category {
  id: number;
  name: string;
}

interface Book {
  id: number;
  title: string;
  author: string;
  isbn: string;
  available: boolean;
  cover_image_path?: string;
  categories?: Category[];
}

// Define the member type
interface Member {
  id: number;
  name: string;
  email: string;
  phone?: string;
}

// ProtectedRoute component
const ProtectedRoute: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { token } = useAuth();
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

function App() {
  const [mode, setMode] = useState<'light' | 'dark'>(() => {
    const storedMode = localStorage.getItem('themeMode');
    return (storedMode === 'light' || storedMode === 'dark') ? storedMode : 'light';
  });

  // Apply dark mode class to document
  useEffect(() => {
    if (mode === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [mode]);

  const colorMode = useMemo(
    () => ({
      toggleColorMode: () => {
        setMode((prevMode) => {
          const newMode = prevMode === 'light' ? 'dark' : 'light';
          localStorage.setItem('themeMode', newMode);
          return newMode;
        });
      },
    }),
    [],
  );

  const [books, setBooks] = useState<Book[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [allCategories, setAllCategories] = useState<Category[]>([]); // For category filter options

  // Loading states
  const [booksLoading, setBooksLoading] = useState(false);
  const [membersLoading, setMembersLoading] = useState(false);

  // Filter and Sort states for Books
  const [bookSearchQuery, setBookSearchQuery] = useState('');
  const [availableStatusFilter, setAvailableStatusFilter] = useState<string>('all'); // 'all', 'true', 'false'
  const [categoryFilter, setCategoryFilter] = useState<Category[]>([]);
  const [bookSortBy, setBookSortBy] = useState<string>('id');
  const [bookSortOrder, setBookSortOrder] = useState<"asc" | "desc">('asc');

  // Pagination states for Books
  const [bookPage, setBookPage] = useState(1);
  const [bookLimit, setBookLimit] = useState(25);
  const [bookTotalCount, setBookTotalCount] = useState(0);
  const [bookTotalPages, setBookTotalPages] = useState(0);

  // Sort states for Members
  const [memberSortBy, setMemberSortBy] = useState<string>('id');
  const [memberSortOrder, setMemberSortOrder] = useState<"asc" | "desc">('asc');
  const [memberSearchQuery, setMemberSearchQuery] = useState('');

  // Pagination states for Members
  const [memberPage, setMemberPage] = useState(1);
  const [memberLimit, setMemberLimit] = useState(25);
  const [memberTotalCount, setMemberTotalCount] = useState(0);
  const [memberTotalPages, setMemberTotalPages] = useState(0);

  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'info' | 'warning',
  });

  const handleCloseNotification = () => {
    setNotification((prev: typeof notification) => ({ ...prev, open: false }));
  };

  // State for Book Form
  const [isBookFormOpen, setIsBookFormOpen] = useState(false);
  const [bookToEdit, setBookToEdit] = useState<Book | null>(null);

  // State for Bulk Import Dialog
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);

  // State for Member Form
  const [isMemberFormOpen, setIsMemberFormOpen] = useState(false);
  const [memberToEdit, setMemberToEdit] = useState<Member | null>(null);

  // State for Member Bulk Import Dialog
  const [isMemberBulkImportOpen, setIsMemberBulkImportOpen] = useState(false);

  const { token, logout } = useAuth();
  const { startWelcome } = useOnboarding();
  const [isSetupNeeded, setIsSetupNeeded] = useState<boolean | null>(null); // New state for setup status
  const [setupChecked, setSetupChecked] = useState(false); // New state to check if setup status has been verified

  useEffect(() => {
    const checkSetupStatus = async () => {
      try {
        const response = await fetch(`${config.apiUrl}/auth/setup-status`);
        if (!response.ok) throw new Error('Failed to fetch setup status');
        const data = await response.json();
        if (data.isSetupNeeded) {
          logout(); // Clear any stale auth tokens if setup is needed
        }
        setIsSetupNeeded(data.isSetupNeeded);
      } catch (error) {
        console.error('Error checking setup status:', error);
        setNotification({ open: true, message: 'Failed to check setup status.', severity: 'error' });
        setIsSetupNeeded(true); // Assume setup is needed on error
      } finally {
        setSetupChecked(true);
      }
    };
    checkSetupStatus();
  }, [logout, setNotification]);

  const fetchAllCategories = useCallback(async () => {
    // Only fetch if setup is complete and user is authenticated
    if (!token || isSetupNeeded === true) return;
    try {
      const response = await fetch(`${config.apiUrl}/categories`);
      if (!response.ok) throw new Error('Failed to fetch categories');
      const data = await response.json();
      setAllCategories(data);
    } catch (error: any) {
      console.error('Error fetching categories:', error);
      setNotification({ open: true, message: error.message, severity: 'error' });
    }
  }, [token]);

  const fetchBooks = useCallback(async () => {
    if (!token) return;
    setBooksLoading(true);
    try {
      let url = `${config.apiUrl}/books?sortBy=${bookSortBy}&sortOrder=${bookSortOrder}&page=${bookPage}&limit=${bookLimit}`;
      if (bookSearchQuery) url += `&search=${bookSearchQuery}`;
      if (availableStatusFilter !== 'all') url += `&availableStatus=${availableStatusFilter}`;
      if (categoryFilter.length > 0) url += `&categoryIds=${categoryFilter.map(cat => cat.id).join(',')}`;

      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to fetch books');
      const result = await response.json();

      // Handle paginated response
      setBooks(result.data || []);
      if (result.pagination) {
        setBookTotalCount(result.pagination.totalCount);
        setBookTotalPages(result.pagination.totalPages);
      }
    } catch (error: any) {
      console.error(error);
      setNotification({ open: true, message: error.message, severity: 'error' });
    } finally {
      setBooksLoading(false);
    }
  }, [token, bookSearchQuery, availableStatusFilter, categoryFilter, bookSortBy, bookSortOrder, bookPage, bookLimit]);

  const fetchMembers = useCallback(async () => {
    if (!token) return;
    setMembersLoading(true);
    try {
      let url = `${config.apiUrl}/members?sortBy=${memberSortBy}&sortOrder=${memberSortOrder}&page=${memberPage}&limit=${memberLimit}`;
      if (memberSearchQuery) url += `&search=${memberSearchQuery}`;

      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to fetch members');
      const result = await response.json();

      // Handle paginated response
      setMembers(result.data || []);
      if (result.pagination) {
        setMemberTotalCount(result.pagination.totalCount);
        setMemberTotalPages(result.pagination.totalPages);
      }
    } catch (error: any) {
      console.error(error);
      setNotification({ open: true, message: error.message, severity: 'error' });
    } finally {
      setMembersLoading(false);
    }
  }, [token, memberSortBy, memberSortOrder, memberPage, memberLimit, memberSearchQuery]);

  useEffect(() => {
    if (setupChecked && !isSetupNeeded && token) {
      fetchBooks();
      fetchMembers();
      fetchAllCategories();

      // Check if user has completed onboarding
      const hasCompletedWelcome = localStorage.getItem('onboarding_welcome_completed') === 'true';
      if (!hasCompletedWelcome) {
        // Show welcome wizard for first-time users
        setTimeout(() => startWelcome(), 500); // Small delay for smooth transition
      }
    }
  }, [token, fetchBooks, fetchMembers, fetchAllCategories, isSetupNeeded, setupChecked, startWelcome]);

  const handleBookOpenForm = (book: Book | null = null) => {
    setBookToEdit(book);
    setIsBookFormOpen(true);
  };

  const handleBookCloseForm = () => {
    setIsBookFormOpen(false);
    setBookToEdit(null);
  };

  const handleBookFormSubmit = async (bookData: Partial<Book>) => {
    const method = bookData.id ? 'PUT' : 'POST';
    const url = bookData.id ? `${config.apiUrl}/books/${bookData.id}` : `${config.apiUrl}/books`;

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(bookData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit book');
      }
      
      const submittedBook = await response.json();
      await fetchBooks();
      handleBookCloseForm();
      setNotification({
        open: true,
        message: `Book ${bookData.id ? 'updated' : 'added'} successfully!`,
        severity: 'success',
      });
      return submittedBook;
    } catch (error: any) {
      console.error(error);
      setNotification({ open: true, message: error.message, severity: 'error' });
      throw error;
    }
  };

  const handleBookDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this book?')) {
      try {
        const response = await fetch(`${config.apiUrl}/books/${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to delete book');
        }
        await fetchBooks();
        setNotification({ open: true, message: 'Book deleted successfully!', severity: 'success' });
      } catch (error: any) {
        console.error(error);
        setNotification({ open: true, message: error.message, severity: 'error' });
      }
    }
  };

  const handleMemberOpenForm = (member: Member | null = null) => {
    setMemberToEdit(member);
    setIsMemberFormOpen(true);
  };

  const handleMemberCloseForm = () => {
    setIsMemberFormOpen(false);
    setMemberToEdit(null);
  };

  const handleMemberFormSubmit = async (memberData: Partial<Member>) => {
    const method = memberData.id ? 'PUT' : 'POST';
    const url = memberData.id ? `${config.apiUrl}/members/${memberData.id}` : `${config.apiUrl}/members`;

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(memberData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit member');
      }
      
      await fetchMembers();
      handleMemberCloseForm();
      setNotification({
        open: true,
        message: `Member ${memberData.id ? 'updated' : 'added'} successfully!`,
        severity: 'success',
      });
    } catch (error: any) {
      console.error(error);
      setNotification({ open: true, message: error.message, severity: 'error' });
    }
  };

  const handleMemberDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this member?')) {
      try {
        const response = await fetch(`${config.apiUrl}/members/${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to delete member');
        }
        await fetchMembers();
        setNotification({ open: true, message: 'Member deleted successfully!', severity: 'success' });
      } catch (error: any) {
        console.error(error);
        setNotification({ open: true, message: error.message, severity: 'error' });
      }
    }
  };

  const handleSetupComplete = () => {
    setIsSetupNeeded(false);
  };


  if (!setupChecked) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
      <BrowserRouter>
        <Navbar toggleColorMode={colorMode.toggleColorMode} currentMode={mode} />
        <div className="container mx-auto px-4 mt-6">
          <Routes>
            {isSetupNeeded ? (
              <Route path="*" element={<Setup onSetupComplete={handleSetupComplete} />} />
            ) : (
              <>
                <Route path="/login" element={<Login />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/setup" element={<Setup onSetupComplete={handleSetupComplete} />} />
                <Route path="/" element={<Navigate to="/dashboard" />} />
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/books"
                  element={
                    <ProtectedRoute>
                      <div>
                        <div className="flex flex-col gap-4 mb-6">
                          {/* Filters Row */}
                          <div className="flex flex-col sm:flex-row gap-4">
                            <div className="flex-1">
                              <Input
                                label="Search Books"
                                value={bookSearchQuery}
                                onChange={(e) => setBookSearchQuery(e.target.value)}
                                placeholder="Search by title, author, or ISBN"
                              />
                            </div>
                            <div className="w-full sm:w-auto sm:min-w-[150px]">
                              <Select
                                label="Availability"
                                value={availableStatusFilter}
                                onChange={(e) => setAvailableStatusFilter(e.target.value)}
                                options={[
                                  { value: 'all', label: 'All' },
                                  { value: 'true', label: 'Available' },
                                  { value: 'false', label: 'Borrowed' }
                                ]}
                              />
                            </div>
                            <div className="w-full sm:w-auto sm:min-w-[200px]">
                              <MultiSelect
                                label="Filter by Categories"
                                options={allCategories}
                                value={categoryFilter}
                                onChange={(newValue) => setCategoryFilter(newValue)}
                                placeholder="Select categories"
                                fullWidth
                              />
                            </div>
                          </div>
                          {/* Actions Row */}
                          <div className="flex gap-2">
                            <Button
                              variant="primary"
                              icon={<Plus className="h-5 w-5" />}
                              onClick={() => handleBookOpenForm()}
                              className="flex-1 sm:flex-initial"
                            >
                              <span className="hidden xs:inline">Add New Book</span>
                              <span className="xs:hidden">Add Book</span>
                            </Button>
                            <Button
                              variant="secondary"
                              icon={<Upload className="h-5 w-5" />}
                              onClick={() => setIsBulkImportOpen(true)}
                              className="flex-1 sm:flex-initial"
                            >
                              <span className="hidden xs:inline">Bulk Import</span>
                              <span className="xs:hidden">Import</span>
                            </Button>
                          </div>
                        </div>
                        {booksLoading ? (
                          <BookListSkeleton />
                        ) : (
                          <BookList
                            books={books}
                            onEdit={handleBookOpenForm}
                            onDelete={handleBookDelete}
                            onAdd={() => handleBookOpenForm(null)}
                            sortBy={bookSortBy}
                            sortOrder={bookSortOrder}
                            onSortChange={(newSortBy, newSortOrder) => {
                              setBookSortBy(newSortBy);
                              setBookSortOrder(newSortOrder);
                            }}
                          />
                        )}
                        <Pagination
                          page={bookPage}
                          totalPages={bookTotalPages}
                          totalCount={bookTotalCount}
                          limit={bookLimit}
                          onPageChange={setBookPage}
                          onLimitChange={setBookLimit}
                        />
                      </div>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/members"
                  element={
                    <ProtectedRoute>
                      <div>
                        <div className="flex flex-col gap-4 mb-6">
                          {/* Search Row */}
                          <div>
                            <Input
                              label="Search members"
                              value={memberSearchQuery}
                              onChange={(e) => {
                                setMemberSearchQuery(e.target.value);
                                setMemberPage(1);
                              }}
                              placeholder="Search by name, email, or phone"
                            />
                          </div>
                          {/* Actions Row */}
                          <div className="flex gap-2">
                            <Button
                              variant="primary"
                              icon={<Plus className="h-5 w-5" />}
                              onClick={() => handleMemberOpenForm()}
                              className="flex-1 sm:flex-initial"
                            >
                              <span className="hidden xs:inline">Add New Member</span>
                              <span className="xs:hidden">Add Member</span>
                            </Button>
                            <Button
                              variant="secondary"
                              icon={<Upload className="h-5 w-5" />}
                              onClick={() => setIsMemberBulkImportOpen(true)}
                              className="flex-1 sm:flex-initial"
                            >
                              <span className="hidden xs:inline">Bulk Import</span>
                              <span className="xs:hidden">Import</span>
                            </Button>
                          </div>
                        </div>
                        {membersLoading ? (
                          <MemberListSkeleton />
                        ) : (
                          <MemberList
                            members={members}
                            onEdit={handleMemberOpenForm}
                            onDelete={handleMemberDelete}
                            onAdd={() => handleMemberOpenForm(null)}
                            sortBy={memberSortBy}
                            sortOrder={memberSortOrder}
                            onSortChange={(newSortBy, newSortOrder) => {
                              setMemberSortBy(newSortBy);
                              setMemberSortOrder(newSortOrder);
                            }}
                          />
                        )}
                        <Pagination
                          page={memberPage}
                          totalPages={memberTotalPages}
                          totalCount={memberTotalCount}
                          limit={memberLimit}
                          onPageChange={setMemberPage}
                          onLimitChange={setMemberLimit}
                        />
                      </div>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/loans"
                  element={
                    <ProtectedRoute>
                      <div>
                        <LoanManager
                          books={books}
                          members={members}
                          onLoanChange={fetchBooks}
                          setNotification={setNotification}
                        />
                      </div>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/loan-history"
                  element={
                    <ProtectedRoute>
                      <div>
                        <LoanHistory />
                      </div>
                    </ProtectedRoute>
                  }
                />
                              <Route
                                path="/categories"
                                element={
                                  <ProtectedRoute>
                                    <CategoryManagement />
                                  </ProtectedRoute>
                                }
                              />
                              <Route
                                path="/users"
                                element={
                                  <ProtectedRoute>
                                    <UserManagement />
                                  </ProtectedRoute>
                                }
                              />
                              <Route
                                path="/export"
                                element={
                                  <ProtectedRoute>
                                    <DataExport />
                                  </ProtectedRoute>
                                }
                              />
                              <Route
                                path="/settings"
                                element={
                                  <ProtectedRoute>
                                    <Settings />
                                  </ProtectedRoute>
                                }
                              />
              </>
            )}
          </Routes>
        </div>
        <BookForm
          open={isBookFormOpen}
          onClose={handleBookCloseForm}
          onSubmit={handleBookFormSubmit}
          bookToEdit={bookToEdit || undefined}
        />
        <MemberForm
          open={isMemberFormOpen}
          onClose={handleMemberCloseForm}
          onSubmit={handleMemberFormSubmit}
          memberToEdit={memberToEdit || undefined}
        />
        <BulkImportDialog
          open={isBulkImportOpen}
          onClose={() => setIsBulkImportOpen(false)}
          onImportSuccess={fetchBooks}
          setNotification={setNotification}
        />
        <MemberBulkImportDialog
          open={isMemberBulkImportOpen}
          onClose={() => setIsMemberBulkImportOpen(false)}
          onImportSuccess={fetchMembers}
          setNotification={setNotification}
        />
        <Notification
          open={notification.open}
          message={notification.message}
          severity={notification.severity}
          onClose={handleCloseNotification}
        />
        <WelcomeWizard />
        <FeatureTour />
      </BrowserRouter>
  );
}

export default App;