import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  TableSortLabel, // Import TableSortLabel
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

// Define the member type
interface Member {
  id: number;
  name: string;
  email: string;
  phone?: string;
}

interface MemberListProps {
  members: Member[];
  onEdit: (member: Member) => void;
  onDelete: (id: number) => void;
  sortBy: string; // Current sort column
  sortOrder: 'asc' | 'desc'; // Current sort order
  onSortChange: (sortBy: string, sortOrder: 'asc' | 'desc') => void; // Callback for sort change
}

const MemberList: React.FC<MemberListProps> = ({ members, onEdit, onDelete, sortBy, sortOrder, onSortChange }) => {
  const handleSortRequest = (columnId: string) => {
    const isAsc = sortBy === columnId && sortOrder === 'asc';
    onSortChange(columnId, isAsc ? 'desc' : 'asc');
  };

  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell sortDirection={sortBy === 'name' ? sortOrder : false}>
              <TableSortLabel
                active={sortBy === 'name'}
                direction={sortBy === 'name' ? sortOrder : 'asc'}
                onClick={() => handleSortRequest('name')}
              >
                Name
              </TableSortLabel>
            </TableCell>
            <TableCell sortDirection={sortBy === 'email' ? sortOrder : false}>
              <TableSortLabel
                active={sortBy === 'email'}
                direction={sortBy === 'email' ? sortOrder : 'asc'}
                onClick={() => handleSortRequest('email')}
              >
                Email
              </TableSortLabel>
            </TableCell>
            <TableCell>Phone</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {members.map((member) => (
            <TableRow key={member.id}>
              <TableCell>{member.name}</TableCell>
              <TableCell>{member.email}</TableCell>
              <TableCell>{member.phone}</TableCell>
              <TableCell align="right">
                <IconButton aria-label="edit" onClick={() => onEdit(member)}>
                  <EditIcon />
                </IconButton>
                <IconButton aria-label="delete" onClick={() => onDelete(member.id)}>
                  <DeleteIcon />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default MemberList;

