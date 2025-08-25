import React, { useState } from 'react';
import {
  Box,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';

interface MemberFormData {
  first_name: string;
  last_name: string;
  business_name: string;
  classification: string;
  email: string;
  phone: string;
}

interface MemberManagementProps {
  chapterId: number;
  onMemberAdded: () => void;
}

export const MemberManagement: React.FC<MemberManagementProps> = ({ 
  chapterId, 
  onMemberAdded 
}) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const [formData, setFormData] = useState<MemberFormData>({
    first_name: '',
    last_name: '',
    business_name: '',
    classification: '',
    email: '',
    phone: '',
  });

  const handleOpen = () => {
    setOpen(true);
    setError(null);
    setSuccess(false);
  };

  const handleClose = () => {
    setOpen(false);
    setFormData({
      first_name: '',
      last_name: '',
      business_name: '',
      classification: '',
      email: '',
      phone: '',
    });
  };

  const handleInputChange = (field: keyof MemberFormData) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value,
    }));
  };

  const handleSubmit = async () => {
    if (!formData.first_name.trim() || !formData.last_name.trim()) {
      setError('First name and last name are required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // For now, we'll create members via Django admin or direct API call
      // This would typically be a POST to /api/members/
      const response = await fetch('http://localhost:8000/api/members/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          chapter: chapterId,
        }),
      });

      if (response.ok) {
        setSuccess(true);
        onMemberAdded();
        setTimeout(() => {
          handleClose();
        }, 1500);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to create member');
      }
    } catch (err) {
      setError('Network error: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Button
        variant="contained"
        startIcon={<AddIcon />}
        onClick={handleOpen}
        sx={{ mb: 2 }}
      >
        Add Member
      </Button>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Member</DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              Member added successfully!
            </Alert>
          )}

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                fullWidth
                label="First Name"
                value={formData.first_name}
                onChange={handleInputChange('first_name')}
                required
                disabled={loading}
              />
              <TextField
                fullWidth
                label="Last Name"
                value={formData.last_name}
                onChange={handleInputChange('last_name')}
                required
                disabled={loading}
              />
            </Box>
            <TextField
              fullWidth
              label="Business Name"
              value={formData.business_name}
              onChange={handleInputChange('business_name')}
              disabled={loading}
            />
            <TextField
              fullWidth
              label="Classification"
              value={formData.classification}
              onChange={handleInputChange('classification')}
              placeholder="e.g., Insurance, Real Estate, Marketing"
              disabled={loading}
            />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={formData.email}
                onChange={handleInputChange('email')}
                disabled={loading}
              />
              <TextField
                fullWidth
                label="Phone"
                value={formData.phone}
                onChange={handleInputChange('phone')}
                disabled={loading}
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained"
            disabled={loading || !formData.first_name.trim() || !formData.last_name.trim()}
          >
            {loading ? 'Adding...' : 'Add Member'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};