import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Input,
} from '@mui/material';

interface BulkImportDialogProps {
  open: boolean;
  onClose: () => void;
  onImportSuccess: () => void;
  setNotification: (notification: {
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }) => void;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const BulkImportDialog: React.FC<BulkImportDialogProps> = ({
  open,
  onClose,
  onImportSuccess,
  setNotification,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setSelectedFile(event.target.files[0]);
    } else {
      setSelectedFile(null);
    }
  };

  const handleDownloadTemplate = () => {
    const csvContent = "title,author,isbn\n";
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", "mulampuzha_books_template.csv");
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setNotification({ open: true, message: 'Please select a CSV file to upload.', severity: 'warning' });
      return;
    }

    setIsUploading(true);
    setNotification({ open: true, message: 'Uploading books...', severity: 'info' });

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const response = await fetch(`${API_URL}/books/bulk-import`, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to bulk import books');
      }

      setNotification({
        open: true,
        message: result.message || 'Books imported successfully!',
        severity: result.errors && result.errors.length > 0 ? 'warning' : 'success',
      });
      onImportSuccess(); // Trigger parent to refetch books
      onClose(); // Close dialog
    } catch (error: any) {
      console.error('Bulk import error:', error);
      setNotification({ open: true, message: error.message, severity: 'error' });
    } finally {
      setIsUploading(false);
      setSelectedFile(null);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Bulk Import Books</DialogTitle>
      <DialogContent>
        <Typography variant="body2" sx={{ mb: 2 }}>
          Download the template, fill in your book details, and upload the CSV file.
          Only 'title', 'author', and 'isbn' columns will be processed.
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, mb: 3, alignItems: 'center' }}>
          <Button
            variant="outlined"
            onClick={handleDownloadTemplate}
          >
            Download CSV Template
          </Button>
        </Box>
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" gutterBottom>Upload CSV File</Typography>
          <Input
            type="file"
            inputProps={{ accept: '.csv' }}
            onChange={handleFileChange}
            fullWidth
          />
          {selectedFile && (
            <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
              Selected file: {selectedFile.name}
            </Typography>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isUploading}>Cancel</Button>
        <Button
          onClick={handleUpload}
          variant="contained"
          disabled={!selectedFile || isUploading}
        >
          {isUploading ? 'Uploading...' : 'Upload'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default BulkImportDialog;
