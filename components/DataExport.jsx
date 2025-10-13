/**
 * Data Export Component
 * User interface for data export functionality
 */

import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Checkbox,
  FormControlLabel,
  Box,
  Typography,
  Card,
  CardContent,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  LinearProgress,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Tooltip,
  useTheme,
  alpha,
} from '@mui/material';
import {
  GetApp as DownloadIcon,
  FilterList as FilterIcon,
  Visibility as PreviewIcon,
  History as HistoryIcon,
  Settings as SettingsIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Description as FileIcon,
  ExpandMore as ExpandMoreIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import dataExportService from '../services/dataExportService';

const ExportFormatSelector = ({ value, onChange, disabled = false }) => {
  const formats = [
    { value: 'csv', label: 'CSV', description: 'Comma-separated values' },
    { value: 'xlsx', label: 'Excel', description: 'Microsoft Excel format' },
    { value: 'pdf', label: 'PDF', description: 'Portable document format' },
    { value: 'json', label: 'JSON', description: 'JavaScript object notation' },
  ];

  return (
    <FormControl fullWidth disabled={disabled}>
      <InputLabel>Export Format</InputLabel>
      <Select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        label='Export Format'
      >
        {formats.map((format) => (
          <MenuItem key={format.value} value={format.value}>
            <Box>
              <Typography variant='body2'>{format.label}</Typography>
              <Typography variant='caption' color='textSecondary'>
                {format.description}
              </Typography>
            </Box>
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

const ColumnSelector = ({
  availableColumns,
  selectedColumns,
  onChange,
  disabled = false,
}) => {
  const handleToggle = (column) => {
    const newSelected = selectedColumns.includes(column)
      ? selectedColumns.filter((col) => col !== column)
      : [...selectedColumns, column];
    onChange(newSelected);
  };

  const handleSelectAll = () => {
    onChange(availableColumns);
  };

  const handleDeselectAll = () => {
    onChange([]);
  };

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 2,
        }}
      >
        <Typography variant='subtitle2'>Select Columns</Typography>
        <Box>
          <Button
            size='small'
            onClick={handleSelectAll}
            disabled={
              disabled || selectedColumns.length === availableColumns.length
            }
          >
            Select All
          </Button>
          <Button
            size='small'
            onClick={handleDeselectAll}
            disabled={disabled || selectedColumns.length === 0}
            sx={{ ml: 1 }}
          >
            Clear
          </Button>
        </Box>
      </Box>

      <Box
        sx={{
          maxHeight: 200,
          overflow: 'auto',
          border: 1,
          borderColor: 'divider',
          borderRadius: 1,
          p: 1,
        }}
      >
        {availableColumns.map((column) => (
          <FormControlLabel
            key={column}
            control={
              <Checkbox
                checked={selectedColumns.includes(column)}
                onChange={() => handleToggle(column)}
                disabled={disabled}
              />
            }
            label={column}
            sx={{ display: 'block', width: '100%' }}
          />
        ))}
      </Box>

      <Typography
        variant='caption'
        color='textSecondary'
        sx={{ mt: 1, display: 'block' }}
      >
        {selectedColumns.length} of {availableColumns.length} columns selected
      </Typography>
    </Box>
  );
};

const ExportPreview = ({ data, columns, maxRows = 5 }) => {
  const theme = useTheme();

  if (!data || data.length === 0) {
    return (
      <Alert severity='info'>
        No data to preview. Apply filters to see preview.
      </Alert>
    );
  }

  const displayColumns = columns || Object.keys(data[0]);
  const previewData = data.slice(0, maxRows);

  return (
    <Box>
      <Typography variant='subtitle2' gutterBottom>
        Export Preview ({previewData.length} of {data.length} records)
      </Typography>

      <Box sx={{ overflow: 'auto', maxHeight: 300 }}>
        <Table size='small'>
          <TableHead>
            <TableRow>
              {displayColumns.map((column) => (
                <TableCell
                  key={column}
                  sx={{
                    fontWeight: 'bold',
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                  }}
                >
                  {column}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {previewData.map((row, index) => (
              <TableRow key={index}>
                {displayColumns.map((column) => (
                  <TableCell key={column}>
                    {row[column]?.toString() || ''}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Box>

      {data.length > maxRows && (
        <Typography
          variant='caption'
          color='textSecondary'
          sx={{ mt: 1, display: 'block' }}
        >
          ... and {data.length - maxRows} more records
        </Typography>
      )}
    </Box>
  );
};

const ExportHistory = ({ onClearHistory }) => {
  const [history, setHistory] = useState([]);
  const theme = useTheme();

  useEffect(() => {
    setHistory(dataExportService.getExportHistory());
  }, []);

  const handleClearHistory = () => {
    dataExportService.clearExportHistory();
    setHistory([]);
    onClearHistory?.();
  };

  const getFormatIcon = (format) => {
    return <FileIcon fontSize='small' />;
  };

  const getFormatColor = (format) => {
    switch (format.toLowerCase()) {
      case 'csv':
        return 'success';
      case 'xlsx':
        return 'primary';
      case 'pdf':
        return 'error';
      case 'json':
        return 'warning';
      default:
        return 'default';
    }
  };

  if (history.length === 0) {
    return <Alert severity='info'>No export history available.</Alert>;
  }

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 2,
        }}
      >
        <Typography variant='subtitle2'>Export History</Typography>
        <Button
          size='small'
          onClick={handleClearHistory}
          startIcon={<DeleteIcon />}
          color='error'
        >
          Clear History
        </Button>
      </Box>

      <List sx={{ maxHeight: 300, overflow: 'auto' }}>
        {history.map((export_item, index) => (
          <ListItem key={index} divider>
            <ListItemIcon>{getFormatIcon(export_item.format)}</ListItemIcon>
            <ListItemText
              primary={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant='body2'>
                    {export_item.filename}
                  </Typography>
                  <Chip
                    label={export_item.format.toUpperCase()}
                    size='small'
                    color={getFormatColor(export_item.format)}
                    variant='outlined'
                  />
                </Box>
              }
              secondary={
                <Typography variant='caption' color='textSecondary'>
                  {export_item.recordCount} records •{' '}
                  {formatDistanceToNow(new Date(export_item.timestamp), {
                    addSuffix: true,
                  })}
                </Typography>
              }
            />
          </ListItem>
        ))}
      </List>
    </Box>
  );
};

export const DataExportDialog = ({
  open,
  onClose,
  data = [],
  title = 'Export Data',
  defaultFilename = 'export',
  availableColumns = [],
}) => {
  const [format, setFormat] = useState('csv');
  const [filename, setFilename] = useState(defaultFilename);
  const [selectedColumns, setSelectedColumns] = useState(availableColumns);
  const [filters, setFilters] = useState({});
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [previewData, setPreviewData] = useState(null);

  // Update selected columns when available columns change
  useEffect(() => {
    if (availableColumns.length > 0 && selectedColumns.length === 0) {
      setSelectedColumns(availableColumns);
    }
  }, [availableColumns, selectedColumns.length]);

  // Generate preview data
  useEffect(() => {
    if (showPreview && data.length > 0) {
      const preview = dataExportService.generatePreview(data, {
        columns: selectedColumns,
        filters,
        maxRows: 10,
      });
      setPreviewData(preview);
    }
  }, [showPreview, data, selectedColumns, filters]);

  const handleExport = async () => {
    try {
      setIsExporting(true);
      setExportError(null);

      const exportOptions = {
        filename,
        title,
        columns: selectedColumns.length > 0 ? selectedColumns : undefined,
        filters,
        metadata: {
          exportedBy: 'Home Manager',
          totalRecords: data.length,
          exportFormat: format,
        },
      };

      await dataExportService.exportData(data, format, exportOptions);

      // Close dialog on successful export
      onClose();
    } catch (_error) {
      setExportError(error.message);
    } finally {
      setIsExporting(false);
    }
  };

  const isExportDisabled = () => {
    return (
      isExporting ||
      data.length === 0 ||
      !filename.trim() ||
      selectedColumns.length === 0
    );
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth='md'
      fullWidth
      PaperProps={{
        sx: { minHeight: '60vh' },
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <DownloadIcon />
          {title}
        </Box>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ mt: 2 }}>
          {/* Export Configuration */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant='h6' gutterBottom>
                Export Configuration
              </Typography>

              <Box
                sx={{
                  display: 'grid',
                  gap: 3,
                  gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                }}
              >
                <ExportFormatSelector
                  value={format}
                  onChange={setFormat}
                  disabled={isExporting}
                />

                <TextField
                  label='Filename'
                  value={filename}
                  onChange={(e) => setFilename(e.target.value)}
                  disabled={isExporting}
                  helperText='File extension will be added automatically'
                  fullWidth
                />
              </Box>
            </CardContent>
          </Card>

          {/* Column Selection */}
          {availableColumns.length > 0 && (
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <SettingsIcon />
                  <Typography>Column Selection</Typography>
                  <Chip
                    label={`${selectedColumns.length} selected`}
                    size='small'
                    color='primary'
                    variant='outlined'
                  />
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <ColumnSelector
                  availableColumns={availableColumns}
                  selectedColumns={selectedColumns}
                  onChange={setSelectedColumns}
                  disabled={isExporting}
                />
              </AccordionDetails>
            </Accordion>
          )}

          {/* Export Preview */}
          <Accordion
            expanded={showPreview}
            onChange={(e, expanded) => setShowPreview(expanded)}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <PreviewIcon />
                <Typography>Export Preview</Typography>
                {previewData && (
                  <Chip
                    label={`${previewData.totalRecords} records`}
                    size='small'
                    color='info'
                    variant='outlined'
                  />
                )}
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              {previewData ? (
                <ExportPreview
                  data={previewData.data}
                  columns={selectedColumns}
                />
              ) : (
                <Typography color='textSecondary'>
                  Enable preview to see export data
                </Typography>
              )}
            </AccordionDetails>
          </Accordion>

          {/* Export History */}
          <Accordion
            expanded={showHistory}
            onChange={(e, expanded) => setShowHistory(expanded)}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <HistoryIcon />
                <Typography>Export History</Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <ExportHistory />
            </AccordionDetails>
          </Accordion>

          {/* Export Status */}
          {isExporting && (
            <Box sx={{ mt: 3 }}>
              <Typography variant='body2' gutterBottom>
                Exporting data...
              </Typography>
              <LinearProgress />
            </Box>
          )}

          {/* Export Error */}
          {exportError && (
            <Alert severity='error' sx={{ mt: 2 }}>
              Export failed: {exportError}
            </Alert>
          )}

          {/* Data Summary */}
          <Card sx={{ mt: 3, bgcolor: alpha('#1976d2', 0.05) }}>
            <CardContent>
              <Typography variant='body2' color='textSecondary'>
                <strong>Data Summary:</strong> {data.length} total records •{' '}
                {selectedColumns.length} columns selected
                {Object.keys(filters).length > 0 &&
                  ` • ${Object.keys(filters).length} filters applied`}
              </Typography>
            </CardContent>
          </Card>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={isExporting}>
          Cancel
        </Button>
        <Button
          onClick={handleExport}
          disabled={isExportDisabled()}
          variant='contained'
          startIcon={isExporting ? null : <DownloadIcon />}
        >
          {isExporting ? 'Exporting...' : 'Export'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export const ExportButton = ({
  data = [],
  title = 'Export Data',
  filename = 'export',
  variant = 'contained',
  size = 'medium',
  ...props
}) => {
  const [dialogOpen, setDialogOpen] = useState(false);

  const availableColumns = data.length > 0 ? Object.keys(data[0]) : [];

  return (
    <>
      <Button
        variant={variant}
        size={size}
        startIcon={<DownloadIcon />}
        onClick={() => setDialogOpen(true)}
        disabled={data.length === 0}
        {...props}
      >
        Export
      </Button>

      <DataExportDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        data={data}
        title={title}
        defaultFilename={filename}
        availableColumns={availableColumns}
      />
    </>
  );
};


ExportFormatSelector.propTypes = {
  // TODO: Define specific prop types
};
export default DataExportDialog;
