import { useState } from 'react';
import { config } from '../config';
import { Download, Upload, FileText } from 'lucide-react';
import { Modal, Button } from './ui';
import { useAuth } from './AuthContext';

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


const BulkImportDialog = ({
  open,
  onClose,
  onImportSuccess,
  setNotification,
}: BulkImportDialogProps) => {
  const { token } = useAuth();
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
      const response = await fetch(`${config.apiUrl}/books/bulk-import`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
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
    <Modal
      open={open}
      onClose={onClose}
      title="Bulk Import Books"
      size="sm"
    >
      <div className="space-y-6">
        {/* Instructions */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <p className="text-sm text-blue-800 dark:text-blue-300">
            Download the template, fill in your book details, and upload the CSV file.
            Only 'title', 'author', and 'isbn' columns will be processed.
          </p>
        </div>

        {/* Download Template Section */}
        <div>
          <h3 className="text-sm font-semibold text-text-primary mb-3">Step 1: Download Template</h3>
          <Button
            variant="outline"
            icon={<Download className="h-5 w-5" />}
            onClick={handleDownloadTemplate}
          >
            Download CSV Template
          </Button>
        </div>

        {/* Upload Section */}
        <div>
          <h3 className="text-sm font-semibold text-text-primary mb-3">Step 2: Upload CSV File</h3>
          <label className="block">
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
              id="csv-upload"
            />
            <div className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-primary hover:bg-background-secondary transition-colors">
              <FileText className="h-12 w-12 text-text-tertiary mx-auto mb-3" />
              <p className="text-sm font-medium text-text-primary mb-1">
                {selectedFile ? selectedFile.name : 'Click to select CSV file'}
              </p>
              <p className="text-xs text-text-secondary">
                {selectedFile ? 'Click to choose a different file' : 'or drag and drop your CSV file here'}
              </p>
            </div>
          </label>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t border-border">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={isUploading}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            icon={<Upload className="h-5 w-5" />}
            onClick={handleUpload}
            disabled={!selectedFile || isUploading}
            loading={isUploading}
          >
            {isUploading ? 'Uploading...' : 'Upload'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default BulkImportDialog;
