import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import DashboardIcon from '@mui/icons-material/Dashboard';
import BookIcon from '@mui/icons-material/Book';
import PeopleIcon from '@mui/icons-material/People';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import HistoryIcon from '@mui/icons-material/History';
import CategoryIcon from '@mui/icons-material/Category';
import SupervisorAccountIcon from '@mui/icons-material/SupervisorAccount';
import LoginIcon from '@mui/icons-material/Login';
import LogoutIcon from '@mui/icons-material/Logout';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

interface NavbarProps {
  toggleColorMode: () => void;
  currentMode: 'light' | 'dark';
}

const Navbar: React.FC<NavbarProps> = ({ toggleColorMode, currentMode }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setDrawerOpen(false); // Close drawer on logout
  };

  const toggleDrawer = (open: boolean) => () => {
    setDrawerOpen(open);
  };

  const navItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard', requiresAuth: true },
    { text: 'Books', icon: <BookIcon />, path: '/books', requiresAuth: true },
    { text: 'Members', icon: <PeopleIcon />, path: '/members', requiresAuth: true },
    { text: 'Borrow/Return', icon: <SwapHorizIcon />, path: '/loans', requiresAuth: true },
    { text: 'Loan History', icon: <HistoryIcon />, path: '/loan-history', requiresAuth: true },
    { text: 'Category Management', icon: <CategoryIcon />, path: '/categories', requiresAdmin: true, requiresAuth: true },
    { text: 'User Management', icon: <SupervisorAccountIcon />, path: '/users', requiresAdmin: true, requiresAuth: true },
  ];

  const drawer = (
    <Box
      sx={{ width: 250 }}
      role="presentation"
      onClick={toggleDrawer(false)}
      onKeyDown={toggleDrawer(false)}
    >
      <List>
        {navItems.map((item) => {
          if (!item.requiresAuth || user) { // Only show if user is authenticated or it doesn't require auth
            if (item.requiresAdmin && user?.role !== 'admin') {
              return null; // Skip if admin-only and not admin
            }
            return (
              <ListItem key={item.text} disablePadding>
                <ListItemButton component={Link} to={item.path}>
                  <ListItemIcon>{item.icon}</ListItemIcon>
                  <ListItemText primary={item.text} />
                </ListItemButton>
              </ListItem>
            );
          }
          return null;
        })}
        {user ? (
          <ListItem disablePadding>
            <ListItemButton onClick={handleLogout}>
              <ListItemIcon><LogoutIcon /></ListItemIcon>
              <ListItemText primary="Logout" />
            </ListItemButton>
          </ListItem>
        ) : (
          <ListItem disablePadding>
            <ListItemButton component={Link} to="/login">
              <ListItemIcon><LoginIcon /></ListItemIcon>
              <ListItemText primary="Login" />
            </ListItemButton>
          </ListItem>
        )}
      </List>
    </Box>
  );

  return (
    <AppBar position="static">
      <Toolbar>
        {isMobile && (
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={toggleDrawer(true)}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
        )}
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          <img src="/Logo.svg" alt="Logo" style={{ height: '40px', marginRight: '10px', verticalAlign: 'middle' }} />
          Mulampuzha Library
        </Typography>

        {!isMobile && (
          <Box sx={{ display: 'flex' }}>
            {navItems.map((item) => {
              if (!item.requiresAuth || user) {
                if (item.requiresAdmin && user?.role !== 'admin') {
                  return null;
                }
                return (
                  <Button key={item.text} color="inherit" component={Link} to={item.path}>
                    {item.text}
                  </Button>
                );
              }
              return null;
            })}
            <IconButton sx={{ ml: 1 }} onClick={toggleColorMode} color="inherit">
              {currentMode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
            </IconButton>
            {user ? (
              <>
                <Typography variant="body1" component="span" sx={{ mr: 1, display: 'flex', alignItems: 'center' }}>
                  Welcome, {user.username} ({user.role})
                </Typography>
                <Button color="inherit" onClick={handleLogout} startIcon={<LogoutIcon />}>
                  Logout
                </Button>
              </>
            ) : (
              <Button color="inherit" component={Link} to="/login" startIcon={<LoginIcon />}>
                Login
              </Button>
            )}
          </Box>
        )}
      </Toolbar>
      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={toggleDrawer(false)}
      >
        {drawer}
      </Drawer>
    </AppBar>
  );
};

export default Navbar;
