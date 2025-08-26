import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  Alert,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Snackbar,
} from '@mui/material';
import { People, Business, Email, Phone, PersonAdd } from '@mui/icons-material';
import { ChapterMemberData } from '../services/ChapterDataLoader';

interface Member {
  id: number;
  first_name: string;
  last_name: string;
  full_name: string;
  business_name: string;
  classification: string;
  email: string;
  phone: string;
  joined_date?: string;
  is_active: boolean;
}

interface MembersTabProps {
  chapterData: ChapterMemberData;
  onMemberSelect: (memberName: string) => void;
  onMemberAdded?: () => void;
}

const MembersTab: React.FC<MembersTabProps> = ({ chapterData, onMemberSelect, onMemberAdded }) => {
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    business_name: '',
    classification: '',
    email: '',
    phone: '',
    joined_date: '',
    is_active: true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  const fetchMembers = async () => {
    if (!chapterData.chapterId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/chapters/${chapterData.chapterId}/`);
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      setMembers(data.members || []);
      
    } catch (error) {
      console.error('Failed to load members:', error);
      setError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, [chapterData.chapterId]);

  const handleAddMember = () => {
    setFormData({
      first_name: '',
      last_name: '',
      business_name: '',
      classification: '',
      email: '',
      phone: '',
      joined_date: '',
      is_active: true,
    });
    setOpenAddDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenAddDialog(false);
  };

  const handleFormChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = field === 'is_active' ? event.target.checked : event.target.value;
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch(`http://localhost:8000/api/chapters/${chapterData.chapterId}/members/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setSnackbarMessage('Member added successfully!');
        setSnackbarOpen(true);
        handleCloseDialog();
        fetchMembers();
        // Trigger parent data refresh to update member counts
        if (onMemberAdded) {
          onMemberAdded();
        }
      } else {
        const errorData = await response.json();
        setSnackbarMessage(`Error: ${errorData.error || 'Failed to add member'}`);
        setSnackbarOpen(true);
      }
    } catch (error) {
      setSnackbarMessage('Failed to add member. Please try again.');
      setSnackbarOpen(true);
    }
    setIsSubmitting(false);
  };

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4 }}>
        <CircularProgress />
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          Loading members...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error">
        Failed to load members: {error}
      </Alert>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <People />
          Chapter Members
        </Typography>
        <Button
          variant="contained"
          startIcon={<PersonAdd />}
          onClick={handleAddMember}
          size="small"
        >
          Add Member
        </Button>
      </Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        All {members.length} active members in {chapterData.chapterName}
      </Typography>
      
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }, gap: 3 }}>
        {members.map((member) => (
          <Paper 
            key={member.id} 
            elevation={1} 
            sx={{ 
              p: 3, 
              cursor: 'pointer', 
              transition: 'all 0.2s',
              '&:hover': { 
                elevation: 4,
                transform: 'translateY(-2px)'
              } 
            }}
            onClick={() => onMemberSelect(member.full_name)}
          >
            <Box sx={{ mb: 2 }}>
              <Typography variant="h6" fontWeight="medium" sx={{ mb: 1 }}>
                {member.full_name}
              </Typography>
              {member.business_name && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Business fontSize="small" color="action" />
                  <Typography variant="body2" color="text.secondary">
                    {member.business_name}
                  </Typography>
                </Box>
              )}
              {member.classification && (
                <Chip 
                  label={member.classification}
                  size="small"
                  variant="outlined"
                  sx={{ mb: 2 }}
                />
              )}
            </Box>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {member.email && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Email fontSize="small" color="action" />
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                    {member.email}
                  </Typography>
                </Box>
              )}
              {member.phone && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Phone fontSize="small" color="action" />
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                    {member.phone}
                  </Typography>
                </Box>
              )}
            </Box>
          </Paper>
        ))}
      </Box>
      
      {members.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="body2" color="text.secondary">
            No active members found for this chapter.
          </Typography>
        </Box>
      )}

      {/* Add Member Dialog */}
      <Dialog open={openAddDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          Add New Member
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, gap: 2, pt: 1 }}>
            <TextField
              autoFocus
              label="First Name"
              variant="outlined"
              value={formData.first_name}
              onChange={handleFormChange('first_name')}
              required
            />
            <TextField
              label="Last Name"
              variant="outlined"
              value={formData.last_name}
              onChange={handleFormChange('last_name')}
              required
            />
            <TextField
              label="Business Name"
              variant="outlined"
              value={formData.business_name}
              onChange={handleFormChange('business_name')}
              sx={{ gridColumn: { xs: '1', sm: '1 / -1' } }}
            />
            <TextField
              label="Classification"
              variant="outlined"
              value={formData.classification}
              onChange={handleFormChange('classification')}
              placeholder="e.g., Accountant, Lawyer, Real Estate"
            />
            <TextField
              label="Email"
              type="email"
              variant="outlined"
              value={formData.email}
              onChange={handleFormChange('email')}
            />
            <TextField
              label="Phone"
              variant="outlined"
              value={formData.phone}
              onChange={handleFormChange('phone')}
            />
            <TextField
              label="Joined Date"
              type="date"
              variant="outlined"
              value={formData.joined_date}
              onChange={handleFormChange('joined_date')}
              InputLabelProps={{ shrink: true }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained"
            disabled={isSubmitting || !formData.first_name || !formData.last_name}
          >
            {isSubmitting ? 'Adding...' : 'Add Member'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success/Error Snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        message={snackbarMessage}
      />
    </Box>
  );
};

export default MembersTab;