import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import UserTable from './components/UserTable';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#f5f5f5'
    }
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', width: '100vw', bgcolor: '#ffffff' }}>
        <AppBar 
          position="fixed" 
          elevation={2}
          sx={{
            background: 'linear-gradient(45deg, #1976d2 30%, #2196f3 90%)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
            width: '100%'
          }}
        >
          <Toolbar sx={{ justifyContent: 'center', minHeight: '64px' }}>
            <Typography 
              variant="h4" 
              component="h1"
              sx={{ 
                fontWeight: 600,
                letterSpacing: 1,
                textAlign: 'center',
                color: 'white',
                textShadow: '2px 2px 4px rgba(0,0,0,0.2)'
              }}
            >
              User Management Dashboard
            </Typography>
          </Toolbar>
        </AppBar>
        <Box 
          component="main" 
          sx={{ 
            flexGrow: 1, 
            pt: 9,
            pb: 2,
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}
        >
          <Container 
            maxWidth={false} 
            sx={{ 
              width: '100%',
              maxWidth: 'none',
              px: { xs: 1, sm: 2, md: 3 }
            }}
          >
            <UserTable />
          </Container>
        </Box>
      </Box>
    </ThemeProvider>
  );
}

export default App;
