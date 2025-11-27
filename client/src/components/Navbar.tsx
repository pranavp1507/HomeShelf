import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Menu,
  X,
  Home,
  BookOpen,
  Users,
  ArrowLeftRight,
  History,
  FolderOpen,
  UserCog,
  LogIn,
  LogOut,
  Sun,
  Moon,
  Sparkles,
  Download,
  Settings,
} from 'lucide-react';
import { useAuth } from './AuthContext';
import { useOnboarding } from './OnboardingContext';
import { config } from '../config';
import { Button } from './ui';

interface NavbarProps {
  toggleColorMode: () => void;
  currentMode: 'light' | 'dark';
}

const Navbar = ({ toggleColorMode, currentMode }: NavbarProps) => {
  const { user, logout } = useAuth();
  const { startTour } = useOnboarding();
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      // Show hamburger menu on screens smaller than 1024px (lg breakpoint)
      setIsMobile(window.innerWidth < 1024);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setDrawerOpen(false);
  };

  const navItems = [
    { text: 'Dashboard', icon: <Home className="h-5 w-5" />, path: '/dashboard', requiresAuth: true },
    { text: 'Books', icon: <BookOpen className="h-5 w-5" />, path: '/books', requiresAuth: true },
    { text: 'Members', icon: <Users className="h-5 w-5" />, path: '/members', requiresAuth: true },
    { text: 'Borrow/Return', icon: <ArrowLeftRight className="h-5 w-5" />, path: '/loans', requiresAuth: true },
    { text: 'Loan History', icon: <History className="h-5 w-5" />, path: '/loan-history', requiresAuth: true },
    { text: 'Category Management', icon: <FolderOpen className="h-5 w-5" />, path: '/categories', requiresAdmin: true, requiresAuth: true },
    { text: 'User Management', icon: <UserCog className="h-5 w-5" />, path: '/users', requiresAdmin: true, requiresAuth: true },
    { text: 'Data Export', icon: <Download className="h-5 w-5" />, path: '/export', requiresAdmin: true, requiresAuth: true },
    { text: 'Settings', icon: <Settings className="h-5 w-5" />, path: '/settings', requiresAdmin: true, requiresAuth: true },
  ];

  const filteredNavItems = navItems.filter((item) => {
    if (!item.requiresAuth || user) {
      if (item.requiresAdmin && user?.role !== 'admin') {
        return false;
      }
      return true;
    }
    return false;
  });

  return (
    <>
      <nav className="bg-primary text-white shadow-lg sticky top-0 z-50">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo and Title */}
            <div className="flex items-center gap-3">
              {isMobile && (
                <button
                  onClick={() => setDrawerOpen(true)}
                  className="p-2 rounded-md hover:bg-primary-dark transition-colors"
                  aria-label="Open menu"
                >
                  <Menu className="h-6 w-6" />
                </button>
              )}
              <Link to="/dashboard" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
                <img
                  src={config.libraryLogo}
                  alt={`${config.libraryName} Logo`}
                  className="h-10 w-10 object-contain"
                />
                <span className="text-xl font-semibold hidden sm:block">{config.libraryName}</span>
              </Link>
            </div>

            {/* Desktop Navigation */}
            {!isMobile && (
              <div className="flex items-center gap-2">
                {filteredNavItems.map((item) => (
                  <Link
                    key={item.text}
                    to={item.path}
                    className="px-3 py-2 rounded-md text-sm font-medium hover:bg-primary-dark transition-colors"
                  >
                    {item.text}
                  </Link>
                ))}

                {/* Theme Toggle */}
                <button
                  onClick={toggleColorMode}
                  className="p-2 rounded-md hover:bg-primary-dark transition-colors ml-2"
                  aria-label="Toggle theme"
                >
                  {currentMode === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                </button>

                {/* User Actions */}
                {user ? (
                  <div className="flex items-center gap-3 ml-4 pl-4 border-l border-primary-light">
                    <span className="text-sm">
                      Welcome, <span className="font-semibold">{user.username}</span> ({user.role})
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={startTour}
                      icon={<Sparkles className="h-4 w-4" />}
                      className="text-white hover:bg-primary-dark"
                    >
                      Tour
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleLogout}
                      icon={<LogOut className="h-4 w-4" />}
                      className="text-white hover:bg-primary-dark"
                    >
                      Logout
                    </Button>
                  </div>
                ) : (
                  <Link to="/login">
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={<LogIn className="h-4 w-4" />}
                      className="text-white hover:bg-primary-dark ml-4"
                    >
                      Login
                    </Button>
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDrawerOpen(false)}
              className="fixed inset-0 bg-black/50 z-40"
            />

            {/* Drawer */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 20, stiffness: 300 }}
              className="fixed top-0 left-0 bottom-0 w-64 bg-surface shadow-xl z-50 overflow-y-auto"
            >
              {/* Drawer Header */}
              <div className="flex items-center justify-between p-4 border-b border-border">
                <div className="flex items-center gap-2">
                  <img
                    src={config.libraryLogo}
                    alt={`${config.libraryName} Logo`}
                    className="h-8 w-8 object-contain"
                  />
                  <span className="font-semibold text-text-primary">{config.libraryName}</span>
                </div>
                <button
                  onClick={() => setDrawerOpen(false)}
                  className="p-2 rounded-md hover:bg-background-secondary transition-colors"
                  aria-label="Close menu"
                >
                  <X className="h-5 w-5 text-text-primary" />
                </button>
              </div>

              {/* Drawer Content */}
              <div className="p-2">
                {filteredNavItems.map((item) => (
                  <Link
                    key={item.text}
                    to={item.path}
                    onClick={() => setDrawerOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-background-secondary transition-colors text-text-primary"
                  >
                    {item.icon}
                    <span>{item.text}</span>
                  </Link>
                ))}

                {/* Theme Toggle in Drawer */}
                <button
                  onClick={() => {
                    toggleColorMode();
                    setDrawerOpen(false);
                  }}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-background-secondary transition-colors text-text-primary w-full mt-2"
                >
                  {currentMode === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                  <span>{currentMode === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
                </button>

                {/* User Actions in Drawer */}
                <div className="mt-4 pt-4 border-t border-border">
                  {user ? (
                    <>
                      <div className="px-4 py-2 text-sm text-text-secondary">
                        Logged in as <span className="font-semibold text-text-primary">{user.username}</span>
                        <br />
                        <span className="text-xs">Role: {user.role}</span>
                      </div>
                      <button
                        onClick={() => {
                          startTour();
                          setDrawerOpen(false);
                        }}
                        className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-background-secondary transition-colors text-primary w-full"
                      >
                        <Sparkles className="h-5 w-5" />
                        <span>Take Tour</span>
                      </button>
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-red-600 dark:text-red-400 w-full"
                      >
                        <LogOut className="h-5 w-5" />
                        <span>Logout</span>
                      </button>
                    </>
                  ) : (
                    <Link
                      to="/login"
                      onClick={() => setDrawerOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-background-secondary transition-colors text-text-primary"
                    >
                      <LogIn className="h-5 w-5" />
                      <span>Login</span>
                    </Link>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
