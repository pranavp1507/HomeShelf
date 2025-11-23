import { createTheme } from '@mui/material/styles';
import { amber, deepOrange, grey } from '@mui/material/colors';

// Function to get the site-wide theme
const getTheme = (mode: 'light' | 'dark') => createTheme({
  palette: {
    mode,
    ...(mode === 'light'
      ? {
          // Palette for light mode
          primary: amber,
          divider: amber[200],
          text: {
            primary: grey[900],
            secondary: grey[800],
          },
        }
      : {
          // Palette for dark mode
          primary: deepOrange,
          divider: deepOrange[700],
          background: {
            default: grey[900],
            paper: grey[900],
          },
          text: {
            primary: '#fff',
            secondary: grey[500],
          },
        }),
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: ({ ownerState, theme }) => ({
          ...(ownerState.variant === 'contained' && {
            '&:hover': {
              backgroundColor: theme.palette.mode === 'dark' ? deepOrange[800] : amber[500],
            },
          }),
          ...(ownerState.variant === 'text' && ownerState.color === 'inherit' && {
            '&:hover': {
              backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
            },
          }),
        }),
      },
    },
    MuiListItemButton: {
        styleOverrides: {
          root: {
            '&:hover': {
              backgroundColor: 'rgba(0, 0, 0, 0.08)', // A subtle hover for list items
            },
          },
        },
      },
    MuiAppBar: {
        styleOverrides: {
            root: ({theme}) => ({
                ...(theme.palette.mode === 'dark' && {
                    backgroundColor: grey[800],
                })
            })
        }
    }
  },
});

export default getTheme;
