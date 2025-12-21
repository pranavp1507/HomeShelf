import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button, Input, Card, Select } from './ui';
import { Download, FileDown, Calendar } from 'lucide-react';
import { config } from '../config';
import { apiFetch } from '../utils/api';

const DataExport = () => {
  const [exportType, setExportType] = useState<'books' | 'members' | 'loans'>('books');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loanStatus, setLoanStatus] = useState('all');
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);

    try {
      const token = localStorage.getItem('token');
      let url = `${config.apiUrl}/export/${exportType}?`;

      const params = new URLSearchParams();

      if (startDate) {
        params.append('startDate', startDate);
      }

      if (endDate) {
        params.append('endDate', endDate);
      }

      if (exportType === 'loans' && loanStatus !== 'all') {
        params.append('status', loanStatus);
      }

      url += params.toString();

      const response = await apiFetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to export data');
      }

      // Get the CSV content
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;

      // Get filename from Content-Disposition header or use default
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = `${exportType}_export.csv`;

      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }

      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error: any) {
      console.error('Export error:', error);
      alert('Failed to export data. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleClearFilters = () => {
    setStartDate('');
    setEndDate('');
    setLoanStatus('all');
  };

  return (
    <div className="max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-text-primary mb-2">Data Export</h1>
          <p className="text-text-secondary">Export your library data to CSV format for backup or analysis</p>
        </div>

        <Card variant="elevated" padding="lg">
          <div className="space-y-6">
            {/* Export Type Selection */}
            <div>
              <label className="block text-sm font-semibold text-text-primary mb-3">
                Select Data to Export
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setExportType('books')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    exportType === 'books'
                      ? 'border-primary bg-primary/10 dark:bg-primary/20'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <FileDown className={`h-8 w-8 mx-auto mb-2 ${
                    exportType === 'books' ? 'text-primary' : 'text-text-tertiary'
                  }`} />
                  <div className="text-sm font-medium text-text-primary">Books</div>
                  <div className="text-xs text-text-tertiary mt-1">
                    All book records with categories
                  </div>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setExportType('members')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    exportType === 'members'
                      ? 'border-primary bg-primary/10 dark:bg-primary/20'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <FileDown className={`h-8 w-8 mx-auto mb-2 ${
                    exportType === 'members' ? 'text-primary' : 'text-text-tertiary'
                  }`} />
                  <div className="text-sm font-medium text-text-primary">Members</div>
                  <div className="text-xs text-text-tertiary mt-1">
                    All member information
                  </div>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setExportType('loans')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    exportType === 'loans'
                      ? 'border-primary bg-primary/10 dark:bg-primary/20'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <FileDown className={`h-8 w-8 mx-auto mb-2 ${
                    exportType === 'loans' ? 'text-primary' : 'text-text-tertiary'
                  }`} />
                  <div className="text-sm font-medium text-text-primary">Loans</div>
                  <div className="text-xs text-text-tertiary mt-1">
                    Complete loan history
                  </div>
                </motion.button>
              </div>
            </div>

            {/* Date Range Filters */}
            <div className="border-t border-border pt-6">
              <label className="block text-sm font-semibold text-text-primary mb-3">
                <Calendar className="h-4 w-4 inline mr-2" />
                Date Range (Optional)
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Start Date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  fullWidth
                />
                <Input
                  label="End Date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  fullWidth
                />
              </div>
              <p className="text-xs text-text-tertiary mt-2">
                Leave empty to export all records
              </p>
            </div>

            {/* Loan Status Filter (only for loans) */}
            {exportType === 'loans' && (
              <div className="border-t border-border pt-6">
                <Select
                  label="Loan Status"
                  value={loanStatus}
                  onChange={(e) => setLoanStatus(e.target.value)}
                  options={[
                    { value: 'all', label: 'All Loans' },
                    { value: 'active', label: 'Active' },
                    { value: 'overdue', label: 'Overdue' },
                    { value: 'returned', label: 'Returned' },
                  ]}
                  fullWidth
                />
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t border-border">
              <Button
                variant="ghost"
                onClick={handleClearFilters}
                disabled={isExporting}
              >
                Clear Filters
              </Button>
              <Button
                variant="primary"
                onClick={handleExport}
                loading={isExporting}
                icon={<Download className="h-5 w-5" />}
              >
                {isExporting ? 'Exporting...' : 'Export to CSV'}
              </Button>
            </div>
          </div>
        </Card>

        {/* Info Card */}
        <Card variant="bordered" padding="md" className="mt-6">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/20">
              <Download className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-text-primary mb-1">
                Export Information
              </h3>
              <ul className="text-sm text-text-secondary space-y-1">
                <li>• Data is exported in CSV format compatible with Excel and Google Sheets</li>
                <li>• Date filters apply to the creation date of records</li>
                <li>• All exports include complete record information</li>
                <li>• Large exports may take a few seconds to process</li>
              </ul>
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
};

export default DataExport;
