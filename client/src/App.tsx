import { useState, useEffect, type ReactNode, useCallback, useMemo } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import getTheme from './theme';
import {
  Container,
  CssBaseline,
  Box,
  TextField,
  Button,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Typography, // Add Typography here
  type SelectChangeEvent,
} from '@mui/material';
import BookList from './components/BookList';
import BookForm from './components/BookForm';
import MemberList from './components/MemberList';
import MemberForm from './components/MemberForm';
import LoanManager from './components/LoanManager';
import LoanHistory from './components/LoanHistory';
import Dashboard from './components/Dashboard';
import BulkImportDialog from './components/BulkImportDialog';
import Notification from './components/Notification';
import Login from './components/Login'; // Import Login component
import Navbar from './components/Navbar'; // Import Navbar component
import { useAuth } from './components/AuthContext'; // Import useAuth hook
import CategoryManagement from './components/CategoryManagement';
import UserManagement from './components/UserManagement'; // Import UserManagement component
import Autocomplete from '@mui/material/Autocomplete'; // Added for category filter
import Chip from '@mui/material/Chip'; // Added for category filter
import Setup from './components/Setup'; // Import Setup component
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

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

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

  const theme = useMemo(() => getTheme(mode), [mode]);

  const [books, setBooks] = useState<Book[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [allCategories, setAllCategories] = useState<Category[]>([]); // For category filter options

  // Filter and Sort states for Books
  const [bookSearchQuery, setBookSearchQuery] = useState('');
  const [availableStatusFilter, setAvailableStatusFilter] = useState<string>('all'); // 'all', 'true', 'false'
  const [categoryFilter, setCategoryFilter] = useState<Category[]>([]);
  const [bookSortBy, setBookSortBy] = useState<string>('id');
  const [bookSortOrder, setBookSortOrder] = useState<"asc" | "desc">('asc');

  // Sort states for Members
  const [memberSortBy, setMemberSortBy] = useState<string>('id');
  const [memberSortOrder, setMemberSortOrder] = useState<"asc" | "desc">('asc');

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

  const { token, logout } = useAuth();
  const [isSetupNeeded, setIsSetupNeeded] = useState<boolean | null>(null); // New state for setup status
  const [setupChecked, setSetupChecked] = useState(false); // New state to check if setup status has been verified

  useEffect(() => {
    const checkSetupStatus = async () => {
      try {
        const response = await fetch(`${API_URL}/auth/setup-status`);
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
      const response = await fetch(`${API_URL}/categories`);
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
    try {
      let url = `${API_URL}/books?sortBy=${bookSortBy}&sortOrder=${bookSortOrder}`;
      if (bookSearchQuery) url += `&search=${bookSearchQuery}`;
      if (availableStatusFilter !== 'all') url += `&availableStatus=${availableStatusFilter}`;
      if (categoryFilter.length > 0) url += `&categoryIds=${categoryFilter.map(cat => cat.id).join(',')}`;

      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to fetch books');
      const data = await response.json();
      setBooks(data);
    } catch (error: any) {
      console.error(error);
      setNotification({ open: true, message: error.message, severity: 'error' });
    }
  }, [token, bookSearchQuery, availableStatusFilter, categoryFilter, bookSortBy, bookSortOrder]);

  const fetchMembers = useCallback(async () => {
    if (!token) return;
    try {
      const response = await fetch(`${API_URL}/members?sortBy=${memberSortBy}&sortOrder=${memberSortOrder}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to fetch members');
      const data = await response.json();
      setMembers(data);
    } catch (error: any) {
      console.error(error);
      setNotification({ open: true, message: error.message, severity: 'error' });
    }
  }, [token, memberSortBy, memberSortOrder]);

  useEffect(() => {
    if (setupChecked && !isSetupNeeded && token) {
      fetchBooks();
      fetchMembers();
      fetchAllCategories();
    }
  }, [token, fetchBooks, fetchMembers, fetchAllCategories, isSetupNeeded, setupChecked]);

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
    const url = bookData.id ? `${API_URL}/books/${bookData.id}` : `${API_URL}/books`;

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
        const response = await fetch(`${API_URL}/books/${id}`, {
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
    const url = memberData.id ? `${API_URL}/members/${memberData.id}` : `${API_URL}/members`;

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
        const response = await fetch(`${API_URL}/members/${id}`, {
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
    return <Container sx={{ mt: 4 }}><Typography>Loading application...</Typography></Container>;
  }

  return (
    <ThemeProvider theme={theme}>
      <BrowserRouter>
        <CssBaseline />
        <Navbar toggleColorMode={colorMode.toggleColorMode} currentMode={mode} />
        <Container sx={{ mt: 4 }}>
          <Routes>
            {isSetupNeeded ? (
              <Route path="*" element={<Setup onSetupComplete={handleSetupComplete} />} />
            ) : (
              <>
                <Route path="/login" element={<Login />} />
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
                      <Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 2 }}>
                          <TextField
                            label="Search Books"
                            variant="outlined"
                            size="small"
                            value={bookSearchQuery}
                            onChange={(e) => setBookSearchQuery(e.target.value)}
                            sx={{ width: '200px' }}
                          />
                          <FormControl size="small" sx={{ width: '150px' }}>
                            <InputLabel>Availability</InputLabel>
                            <Select
                              value={availableStatusFilter}
                              label="Availability"
                              onChange={(e: SelectChangeEvent) => setAvailableStatusFilter(e.target.value)}
                            >
                              <MenuItem value="all">All</MenuItem>
                              <MenuItem value="true">Available</MenuItem>
                              <MenuItem value="false">Borrowed</MenuItem>
                            </Select>
                          </FormControl>
                          <Autocomplete
                            multiple
                            id="book-categories-filter"
                            options={allCategories}
                            getOptionLabel={(option) => option.name}
                            value={categoryFilter}
                            onChange={(_event, newValue) => {
                              setCategoryFilter(newValue);
                            }}
                            renderTags={(value, getTagProps) =>
                              value.map((option, index) => (
                                <Chip variant="outlined" label={option.name} {...getTagProps({ index })} />
                              ))
                            }
                            renderInput={(params) => (
                              <TextField
                                {...params}
                                variant="outlined"
                                label="Filter by Categories"
                                placeholder="Select categories"
                                size="small"
                              />
                            )}
                            sx={{ width: '250px' }}
                          />
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Button variant="contained" onClick={() => handleBookOpenForm()}>
                              Add New Book
                            </Button>
                            <Button variant="contained" onClick={() => setIsBulkImportOpen(true)}>
                              Bulk Import
                            </Button>
                          </Box>
                        </Box>
                        <BookList
                          books={books}
                          onEdit={handleBookOpenForm}
                          onDelete={handleBookDelete}
                          sortBy={bookSortBy}
                          sortOrder={bookSortOrder}
                          onSortChange={(newSortBy, newSortOrder) => {
                            setBookSortBy(newSortBy);
                            setBookSortOrder(newSortOrder);
                          }}
                        />
                      </Box>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/members"
                  element={
                    <ProtectedRoute>
                      <Box>
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                          <Button variant="contained" onClick={() => handleMemberOpenForm()}>
                            Add New Member
                          </Button>
                        </Box>
                        <MemberList
                          members={members}
                          onEdit={handleMemberOpenForm}
                          onDelete={handleMemberDelete}
                          sortBy={memberSortBy}
                          sortOrder={memberSortOrder}
                          onSortChange={(newSortBy, newSortOrder) => {
                            setMemberSortBy(newSortBy);
                            setMemberSortOrder(newSortOrder);
                          }}
                        />
                      </Box>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/loans"
                  element={
                    <ProtectedRoute>
                      <Box>
                        <LoanManager
                          books={books}
                          members={members}
                          onLoanChange={fetchBooks}
                          setNotification={setNotification}
                        />
                      </Box>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/loan-history"
                  element={
                    <ProtectedRoute>
                      <Box>
                        <LoanHistory />
                      </Box>
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
                              />              </>
            )}
          </Routes>
        </Container>
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
        <Notification
          open={notification.open}
          message={notification.message}
          severity={notification.severity}
          onClose={handleCloseNotification}
        />
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;