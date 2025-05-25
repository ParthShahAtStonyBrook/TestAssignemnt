import { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Alert,
  Typography,
  Chip,
  useTheme,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import { format, parseISO } from 'date-fns';

interface User {
  id: string;
  name: string;
  createDate: string;
  lastLogin: string;
  lastPwdChange: string;
  daysSinceLogin: number;
  daysSincePwd: number;
  mfaEnabled: boolean;
}

const formatDate = (dateString: string) => {
  const date = parseISO(dateString);
  return format(date, 'MMM d, yyyy');
};

const UserTable = () => {
  const theme = useTheme();
  const [users, setUsers] = useState<User[]>([]);
  const [mfaFilter, setMfaFilter] = useState<string>('all');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch('http://localhost:8081/api/users');
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        setUsers(data);
      } catch (error) {
        console.error('Error fetching users:', error);
        setError(error instanceof Error ? error.message : 'Failed to fetch users');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const handleMfaFilterChange = (event: SelectChangeEvent) => {
    setMfaFilter(event.target.value);
  };

  const filteredUsers = users.filter((user) => {
    if (mfaFilter === 'all') return true;
    return mfaFilter === 'enabled' ? user.mfaEnabled : !user.mfaEnabled;
  });

  const isOldPassword = (daysSincePwd: number) => {
    return daysSincePwd > 365;
  };

  const isInactive = (daysSinceLogin: number) => {
    return daysSinceLogin > 90;
  };

  const getRowStyle = (user: User) => {
    const isPasswordExpired = user.daysSincePwd > 365;
    const isInactive = user.daysSinceLogin > 90;

    if ((isPasswordExpired && isInactive) || (user.daysSinceLogin === -1 || user.daysSincePwd === -1)) {
      return {
        backgroundColor: '#ffebee', //red
        '&:hover': {
          backgroundColor: '#ffcdd2',
        },
      };
    } else if (isPasswordExpired) {
      return {
        backgroundColor: '#e3f2fd', //blue
        '&:hover': {
          backgroundColor: '#bbdefb',
        },
      };
    } else if (isInactive) {
      return {
        backgroundColor: '#fff3e0', //yellow
        '&:hover': {
          backgroundColor: '#ffe0b2',
        },
      };
    } else {
      return {
        backgroundColor: '#e8f5e9', //green
        '&:hover': {
          backgroundColor: '#c8e6c9',
        },
      };
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <Typography variant="h6">Loading users...</Typography>
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ mb: 2, width: '100%' }}>
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center',
          backgroundColor: 'white',
          padding: 2,
          borderRadius: 1,
          boxShadow: 1,
          width: '100%'
        }}>
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel id="mfa-filter-label">MFA Status</InputLabel>
            <Select
              labelId="mfa-filter-label"
              value={mfaFilter}
              label="MFA Status"
              onChange={handleMfaFilterChange}
            >
              <MenuItem value="all">All Users</MenuItem>
              <MenuItem value="enabled">MFA Enabled</MenuItem>
              <MenuItem value="disabled">MFA Disabled</MenuItem>
            </Select>
          </FormControl>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, ml: 4, flex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ width: 16, height: 16, bgcolor: '#e8f5e9', border: '1px solid #c8e6c9' }} />
              <Typography variant="body2">Active & Password Up to Date</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ width: 16, height: 16, bgcolor: '#fff3e0', border: '1px solid #ffe0b2' }} />
              <Typography variant="body2">Inactive ({'>'}90 days)</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ width: 16, height: 16, bgcolor: '#e3f2fd', border: '1px solid #bbdefb' }} />
              <Typography variant="body2">Password Change Required ({'>'}365 days)</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ width: 16, height: 16, bgcolor: '#ffebee', border: '1px solid #ffcdd2' }} />
              <Typography variant="body2">Inactive & Password Change Required</Typography>
            </Box>
          </Box>
        </Box>
      </Box>

      {users.length === 0 ? (
        <Alert severity="info">No users found</Alert>
      ) : (
        <Box sx={{ width: '100%' }}>
          <TableContainer 
            component={Paper} 
            sx={{ 
              boxShadow: theme.shadows[3],
              borderRadius: 1,
              overflow: 'hidden',
              backgroundColor: 'white',
              width: '100%'
            }}
          >
            <Table size="small" sx={{ width: '100%', minWidth: 800 }}>
              <TableHead>
                <TableRow sx={{ backgroundColor: theme.palette.primary.main }}>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold', whiteSpace: 'nowrap', textAlign: 'center' }}>User Name</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold', whiteSpace: 'nowrap', textAlign: 'center' }}>Account Created</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold', whiteSpace: 'nowrap', textAlign: 'center' }}>Last Access</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold', whiteSpace: 'nowrap', textAlign: 'center' }}>Days Since Access</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold', whiteSpace: 'nowrap', textAlign: 'center' }}>Last Password Change</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold', whiteSpace: 'nowrap', textAlign: 'center' }}>Days Since Password Change</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold', whiteSpace: 'nowrap', textAlign: 'center' }}>MFA Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow
                    key={user.id}
                    sx={getRowStyle(user)}
                  >
                    <TableCell sx={{ textAlign: 'center' }}>
                      <Typography variant="body2" sx={{ fontWeight: 500, whiteSpace: 'nowrap' }}>
                        {user.name}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ textAlign: 'center' }}>
                      <Typography variant="body2" sx={{ whiteSpace: 'nowrap' }}>
                        {formatDate(user.createDate)}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ textAlign: 'center' }}>
                      <Typography variant="body2" sx={{ whiteSpace: 'nowrap' }}>
                        {formatDate(user.lastLogin)}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ textAlign: 'center' }}>
                      <Typography variant="body2" sx={{ whiteSpace: 'nowrap' }}>
                        {user.daysSinceLogin === -1 ? 'Invalid Date' : `${user.daysSinceLogin} days ago`}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ textAlign: 'center' }}>
                      <Typography variant="body2" sx={{ whiteSpace: 'nowrap' }}>
                        {formatDate(user.lastPwdChange)}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ textAlign: 'center' }}>
                      <Typography variant="body2" sx={{ whiteSpace: 'nowrap' }}>
                        {user.daysSincePwd === -1 ? 'Invalid Date' : `${user.daysSincePwd} days ago`}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ textAlign: 'center' }}>
                      <Chip
                        label={user.mfaEnabled ? 'Enabled' : 'Disabled'}
                        color={user.mfaEnabled ? 'success' : 'error'}
                        variant="outlined"
                        size="small"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}
    </Box>
  );
};

export default UserTable;