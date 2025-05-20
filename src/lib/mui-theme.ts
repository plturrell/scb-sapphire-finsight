import { createTheme } from '@mui/material/styles';

// Create a Material UI theme that aligns with our SCB design system
const muiTheme = createTheme({
  palette: {
    primary: {
      main: '#0072AA', // SCB Honolulu Blue
      light: '#78ADD2', // SCB Iceberg
      dark: '#005888',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#21AA47', // SCB American Green
      light: '#A4D0A0', // SCB Eton Blue
      dark: '#198238',
      contrastText: '#ffffff',
    },
    error: {
      main: '#D33732', // SCB Muted Red
    },
    warning: {
      main: '#F59E0B',
    },
    info: {
      main: '#0072AA', // SCB Honolulu Blue
    },
    success: {
      main: '#21AA47', // SCB American Green
    },
    background: {
      default: '#F5F7FA', // SCB Light Gray
      paper: '#ffffff',
    },
    text: {
      primary: '#525355', // SCB Dark Gray
      secondary: 'rgba(82, 83, 85, 0.7)',
    },
    divider: 'rgba(229, 231, 235, 1)', // SCB Border
  },
  typography: {
    fontFamily: '"SC Prosper Sans", "Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2rem',
      fontWeight: 700,
    },
    h2: {
      fontSize: '1.75rem',
      fontWeight: 700,
    },
    h3: {
      fontSize: '1.5rem',
      fontWeight: 600,
    },
    h4: {
      fontSize: '1.25rem',
      fontWeight: 600,
    },
    h5: {
      fontSize: '1.125rem',
      fontWeight: 500,
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 500,
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.5,
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.5,
    },
    button: {
      textTransform: 'none',
      fontWeight: 500,
    },
  },
  shape: {
    borderRadius: 8,
  },
  spacing: (factor: number) => `${0.25 * factor}rem`, // 1 = 0.25rem, 4 = 1rem, etc.
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '0.5rem 1rem',
          textTransform: 'none',
          fontWeight: 500,
        },
        containedPrimary: {
          backgroundColor: '#0072AA',
          '&:hover': {
            backgroundColor: '#005888',
          },
        },
        containedSecondary: {
          backgroundColor: '#21AA47',
          '&:hover': {
            backgroundColor: '#198238',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
          borderRadius: 8,
        },
        outlined: {
          border: '1px solid rgba(229, 231, 235, 1)',
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: 'rgba(229, 231, 235, 1)',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        },
      },
    },
    MuiContainer: {
      styleOverrides: {
        root: {
          paddingLeft: '1rem',
          paddingRight: '1rem',
          '@media (min-width: 600px)': {
            paddingLeft: '1.5rem',
            paddingRight: '1.5rem',
          },
        },
      },
    },
  },
});

export default muiTheme;