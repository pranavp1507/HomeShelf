import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box, // Import Box
} from '@mui/material';

// Define the member type
interface Member {
  id?: number;
  name: string;
  email: string;
  phone?: string;
}

interface MemberFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (member: Member) => void;
  memberToEdit?: Member | null;
}

const MemberForm: React.FC<MemberFormProps> = ({ open, onClose, onSubmit, memberToEdit }) => {
  const [member, setMember] = useState<Member>({ name: '', email: '', phone: '' });

  useEffect(() => {
    if (memberToEdit) {
      setMember(memberToEdit);
    } else {
      setMember({ name: '', email: '', phone: '' });
    }
  }, [memberToEdit, open]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setMember((prevMember) => ({ ...prevMember, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(member);
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>{memberToEdit ? 'Edit Member' : 'Add New Member'}</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Box sx={{ p: 2 }}> {/* Added Box with padding */}
            <TextField
              autoFocus
              margin="dense"
              name="name"
              label="Name"
              type="text"
              fullWidth
              variant="outlined"
              value={member.name}
              onChange={handleChange}
              required
            />
            <TextField
              margin="dense"
              name="email"
              label="Email"
              type="email"
              fullWidth
              variant="outlined"
              value={member.email}
              onChange={handleChange}
              required
            />
            <TextField
              margin="dense"
              name="phone"
              label="Phone"
              type="text"
              fullWidth
              variant="outlined"
              value={member.phone}
              onChange={handleChange}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit">{memberToEdit ? 'Save Changes' : 'Add Member'}</Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default MemberForm;
