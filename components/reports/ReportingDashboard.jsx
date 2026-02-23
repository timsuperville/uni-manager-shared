import React, { useState, useEffect, useMemo } from "react";
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  Tooltip,
  Menu,
  MenuList,
  MenuItem as MenuItemComponent,
  Badge,
} from "@mui/material";
import {
  Add as AddIcon,
  PlayArrow as RunIcon,
  Download as DownloadIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as PreviewIcon,
  Schedule as ScheduleIcon,
  MoreVert as MoreIcon,
  Assessment as ReportIcon,
  Dashboard as DashboardIcon,
  TableChart as TableIcon,
  PieChart as ChartIcon,
  Timeline as TrendIcon,
  Settings as SettingsIcon,
  Refresh as RefreshIcon,
  FileDownload as ExportIcon,
} from "@mui/icons-material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/adapters/dayjs";
import dayjs from "dayjs";

import { useNotification } from "../../shared/hooks/useNotification";
import LoadingSpinner from "../../shared/components/LoadingSpinner";
import EnvironmentDebugBanner from "../EnvironmentDebugBanner.jsx";
import reportingService from "../services/reportingService";

const REPORT_TYPE_ICONS = {
  tabular: TableIcon,
  chart: ChartIcon,
  dashboard: DashboardIcon,
  analytical: TrendIcon,
  executive: SettingsIcon,
};

const REPORT_CATEGORIES = [
  { value: "financial", label: "Financial", color: "success" },
  { value: "membership", label: "Membership", color: "primary" },
  { value: "events", label: "Events", color: "warning" },
  { value: "executive", label: "Executive", color: "error" },
  { value: "operational", label: "Operational", color: "info" },
  { value: "custom", label: "Custom", color: "default" },
];

const EXPORT_FORMATS = [
  { value: "pdf", label: "PDF", icon: "📄" },
  { value: "excel", label: "Excel", icon: "📊" },
  { value: "csv", label: "CSV", icon: "📋" },
  { value: "json", label: "JSON", icon: "🔧" },
];

/**
 * Main Reporting Dashboard Component
 */
function ReportingDashboard() {
  const [reports, setReports] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState(0);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [runDialogOpen, setRunDialogOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [runningReports, setRunningReports] = useState(new Set());
  const [recentReports, setRecentReports] = useState([]);

  const { showNotification } = useNotification();

  // Load initial data
  useEffect(() => {
    loadReports();
    loadTemplates();
    loadRecentReports();
  }, []);

  const loadReports = async () => {
    try {
      setLoading(true);
      const data = await reportingService.getReports();
      setReports(data);
    } catch (_error) {
      showNotification("Failed to load reports", "error");
      // console.error('Error loading reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTemplates = async () => {
    try {
      const data = await reportingService.getTemplates();
      setTemplates(data);
    } catch (_error) {
      showNotification("Failed to load templates", "error");
      // console.error('Error loading templates:', error);
    }
  };

  const loadRecentReports = async () => {
    try {
      const data = await reportingService.getRecentReports();
      setRecentReports(data);
    } catch (_error) {
      // console.error('Error loading recent reports:', error);
    }
  };

  const handleRunReport = async (reportId, parameters = {}) => {
    try {
      setRunningReports((prev) => new Set([...prev, reportId]));
      const result = await reportingService.generateReport(
        reportId,
        parameters,
      );

      showNotification("Report generated successfully", "success");
      loadRecentReports();

      // Auto-download if requested
      if (parameters.autoDownload) {
        await handleDownloadReport(result.reportId, parameters.format || "pdf");
      }
    } catch (_error) {
      showNotification("Failed to generate report", "error");
      // console.error('Error generating report:', error);
    } finally {
      setRunningReports((prev) => {
        const newSet = new Set(prev);
        newSet.delete(reportId);
        return newSet;
      });
      setRunDialogOpen(false);
    }
  };

  const handleDownloadReport = async (reportId, format = "pdf") => {
    try {
      const blob = await reportingService.downloadReport(reportId, format);
      const url =
        typeof window !== "undefined" && window.URL.createObjectURL(blob);
      const link =
        typeof document !== "undefined" && document.createElement("a");
      link.href = url;
      link.download = `report-${reportId}.${format}`;
      typeof document !== "undefined" && document.body.appendChild(link);
      link.click();
      typeof document !== "undefined" && document.body.removeChild(link);
      typeof window !== "undefined" && window.URL.revokeObjectURL(url);

      showNotification("Report downloaded successfully", "success");
    } catch (_error) {
      showNotification("Failed to download report", "error");
      // console.error('Error downloading report:', error);
    }
  };

  const handleDeleteReport = async (reportId) => {
    try {
      await reportingService.deleteReport(reportId);
      showNotification("Report deleted successfully", "success");
      loadReports();
    } catch (_error) {
      showNotification("Failed to delete report", "error");
      // console.error('Error deleting report:', error);
    }
  };

  const filteredReports = useMemo(() => {
    return reports.filter((report) => {
      switch (selectedTab) {
        case 0:
          return true; // All reports
        case 1:
          return report.category === "financial";
        case 2:
          return report.category === "membership";
        case 3:
          return report.category === "events";
        case 4:
          return report.category === "executive";
        default:
          return true;
      }
    });
  }, [reports, selectedTab]);

  const getCategoryColor = (category) => {
    const categoryConfig = REPORT_CATEGORIES.find(
      (cat) => cat.value === category,
    );
    return categoryConfig ? categoryConfig.color : "default";
  };

  const getCategoryLabel = (category) => {
    const categoryConfig = REPORT_CATEGORIES.find(
      (cat) => cat.value === category,
    );
    return categoryConfig ? categoryConfig.label : category;
  };

  const getReportIcon = (type) => {
    const IconComponent = REPORT_TYPE_ICONS[type] || ReportIcon;
    return <IconComponent />;
  };

  if (loading) {
    return <LoadingSpinner message="Loading reporting dashboard..." />;
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box sx={{ p: 3 }}>
        {/* Environment Debug Banner */}
        <EnvironmentDebugBanner />

        {/* Header */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 3,
          }}
        >
          <Typography
            variant="h4"
            component="h1"
            sx={{ display: "flex", alignItems: "center", gap: 1 }}
          >
            <ReportIcon color="primary" />
            Reporting Dashboard
          </Typography>
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={() => {
                loadReports();
                loadTemplates();
                loadRecentReports();
              }}
            >
              Refresh
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setCreateDialogOpen(true)}
            >
              Create Report
            </Button>
          </Box>
        </Box>

        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Reports
                </Typography>
                <Typography variant="h4">{reports.length}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Templates Available
                </Typography>
                <Typography variant="h4">{templates.length}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Recent Executions
                </Typography>
                <Typography variant="h4">{recentReports.length}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Running Reports
                </Typography>
                <Typography variant="h4">
                  <Badge badgeContent={runningReports.size} color="primary">
                    {runningReports.size}
                  </Badge>
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Category Tabs */}
        <Paper sx={{ mb: 3 }}>
          <Tabs
            value={selectedTab}
            onChange={(e, newValue) => setSelectedTab(newValue)}
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab label="All Reports" />
            <Tab label="Financial" />
            <Tab label="Membership" />
            <Tab label="Events" />
            <Tab label="Executive" />
          </Tabs>
        </Paper>

        {/* Reports Grid */}
        <Grid container spacing={3}>
          {filteredReports.map((report) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={report.id}>
              <Card
                sx={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      mb: 2,
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      {getReportIcon(report.type)}
                      <Typography variant="h6" component="h2" noWrap>
                        {report.name}
                      </Typography>
                    </Box>
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        setMenuAnchor(e.currentTarget);
                        setSelectedReport(report);
                      }}
                    >
                      <MoreIcon />
                    </IconButton>
                  </Box>

                  <Typography
                    variant="body2"
                    color="textSecondary"
                    sx={{ mb: 2 }}
                  >
                    {report.description}
                  </Typography>

                  <Box
                    sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 2 }}
                  >
                    <Chip
                      label={getCategoryLabel(report.category)}
                      size="small"
                      color={getCategoryColor(report.category)}
                    />
                    <Chip label={report.type} size="small" variant="outlined" />
                  </Box>

                  {report.schedule && (
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        mb: 1,
                      }}
                    >
                      <ScheduleIcon fontSize="small" color="action" />
                      <Typography variant="caption" color="textSecondary">
                        {report.schedule.frequency}
                      </Typography>
                    </Box>
                  )}

                  <Typography variant="caption" color="textSecondary">
                    Last updated:{" "}
                    {dayjs(report.updatedAt).format("MMM DD, YYYY")}
                  </Typography>
                </CardContent>

                <CardActions>
                  <Button
                    size="small"
                    startIcon={
                      runningReports.has(report.id) ? (
                        <CircularProgress size={16} />
                      ) : (
                        <RunIcon />
                      )
                    }
                    disabled={runningReports.has(report.id)}
                    onClick={() => {
                      setSelectedReport(report);
                      setRunDialogOpen(true);
                    }}
                  >
                    {runningReports.has(report.id) ? "Running..." : "Run"}
                  </Button>
                  <Button
                    size="small"
                    startIcon={<PreviewIcon />}
                    onClick={() => {
                      // NOTE: Preview feature not yet implemented — shows coming-soon toast
                      showNotification("Preview feature coming soon", "info");
                    }}
                  >
                    Preview
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>

        {filteredReports.length === 0 && (
          <Paper sx={{ p: 4, textAlign: "center" }}>
            <ReportIcon sx={{ fontSize: 64, color: "text.secondary", mb: 2 }} />
            <Typography variant="h6" color="textSecondary" gutterBottom>
              No reports found
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
              Create your first report to get started with analytics and
              insights.
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setCreateDialogOpen(true)}
            >
              Create Report
            </Button>
          </Paper>
        )}

        {/* Recent Reports Section */}
        {recentReports.length > 0 && (
          <Paper sx={{ mt: 3, p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Recent Executions
            </Typography>
            <List>
              {recentReports.slice(0, 5).map((execution, index) => (
                <React.Fragment key={execution.id}>
                  <ListItem>
                    <ListItemText
                      primary={execution.reportName}
                      secondary={`Generated ${dayjs(execution.createdAt).fromNow()} • ${execution.format.toUpperCase()}`}
                    />
                    <ListItemSecondaryAction>
                      <Tooltip title="Download">
                        <IconButton
                          edge="end"
                          onClick={() =>
                            handleDownloadReport(execution.id, execution.format)
                          }
                        >
                          <DownloadIcon />
                        </IconButton>
                      </Tooltip>
                    </ListItemSecondaryAction>
                  </ListItem>
                  {index < recentReports.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </Paper>
        )}

        {/* Report Options Menu */}
        <Menu
          anchorEl={menuAnchor}
          open={Boolean(menuAnchor)}
          onClose={() => setMenuAnchor(null)}
        >
          <MenuList>
            <MenuItemComponent
              onClick={() => {
                setRunDialogOpen(true);
                setMenuAnchor(null);
              }}
            >
              <RunIcon sx={{ mr: 1 }} />
              Run Report
            </MenuItemComponent>
            <MenuItemComponent
              onClick={() => {
                // NOTE: Edit feature not yet implemented — shows coming-soon toast
                showNotification("Edit feature coming soon", "info");
                setMenuAnchor(null);
              }}
            >
              <EditIcon sx={{ mr: 1 }} />
              Edit
            </MenuItemComponent>
            <MenuItemComponent
              onClick={() => {
                // NOTE: Duplicate feature not yet implemented — shows coming-soon toast
                showNotification("Duplicate feature coming soon", "info");
                setMenuAnchor(null);
              }}
            >
              <SettingsIcon sx={{ mr: 1 }} />
              Duplicate
            </MenuItemComponent>
            <Divider />
            <MenuItemComponent
              onClick={() => {
                if (
                  typeof window !== "undefined" &&
                  window.confirm("Are you sure you want to delete this report?")
                ) {
                  handleDeleteReport(selectedReport.id);
                }
                setMenuAnchor(null);
              }}
              sx={{ color: "error.main" }}
            >
              <DeleteIcon sx={{ mr: 1 }} />
              Delete
            </MenuItemComponent>
          </MenuList>
        </Menu>

        {/* Run Report Dialog */}
        <RunReportDialog
          open={runDialogOpen}
          onClose={() => setRunDialogOpen(false)}
          report={selectedReport}
          onRun={handleRunReport}
        />

        {/* Create Report Dialog */}
        <CreateReportDialog
          open={createDialogOpen}
          onClose={() => setCreateDialogOpen(false)}
          templates={templates}
          onCreated={() => {
            loadReports();
            setCreateDialogOpen(false);
          }}
        />
      </Box>
    </LocalizationProvider>
  );
}

/**
 * Dialog for running reports with parameters
 */
function RunReportDialog({ open, onClose, report, onRun }) {
  const [parameters, setParameters] = useState({});
  const [format, setFormat] = useState("pdf");
  const [autoDownload, setAutoDownload] = useState(true);

  useEffect(() => {
    if (report) {
      // Initialize parameters based on report configuration
      const defaultParams = {};
      if (report.parameters) {
        report.parameters.forEach((param) => {
          if (param.type === "date") {
            defaultParams[param.name] = dayjs().format("YYYY-MM-DD");
          } else if (param.type === "dateRange") {
            defaultParams[`${param.name}_start`] = dayjs()
              .subtract(30, "day")
              .format("YYYY-MM-DD");
            defaultParams[`${param.name}_end`] = dayjs().format("YYYY-MM-DD");
          } else {
            defaultParams[param.name] = param.defaultValue || "";
          }
        });
      }
      setParameters(defaultParams);
    }
  }, [report]);

  const handleRun = () => {
    onRun(report.id, {
      ...parameters,
      format,
      autoDownload,
    });
  };

  if (!report) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Run Report: {report.name}</DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 2 }}>
          {/* Report Parameters */}
          {report.parameters && report.parameters.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Parameters
              </Typography>
              <Grid container spacing={2}>
                {report.parameters.map((param) => (
                  <Grid item xs={12} sm={6} key={param.name}>
                    {param.type === "date" && (
                      <DatePicker
                        label={param.label}
                        value={
                          parameters[param.name]
                            ? dayjs(parameters[param.name])
                            : null
                        }
                        onChange={(newValue) => {
                          setParameters((prev) => ({
                            ...prev,
                            [param.name]: newValue
                              ? newValue.format("YYYY-MM-DD")
                              : "",
                          }));
                        }}
                        renderInput={(params) => (
                          <TextField {...params} fullWidth />
                        )}
                      />
                    )}
                    {param.type === "text" && (
                      <TextField
                        fullWidth
                        label={param.label}
                        value={parameters[param.name] || ""}
                        onChange={(e) => {
                          setParameters((prev) => ({
                            ...prev,
                            [param.name]: e.target.value,
                          }));
                        }}
                        helperText={param.description}
                      />
                    )}
                    {param.type === "select" && (
                      <FormControl fullWidth>
                        <InputLabel>{param.label}</InputLabel>
                        <Select
                          value={parameters[param.name] || ""}
                          onChange={(e) => {
                            setParameters((prev) => ({
                              ...prev,
                              [param.name]: e.target.value,
                            }));
                          }}
                        >
                          {param.options.map((option) => (
                            <MenuItem key={option.value} value={option.value}>
                              {option.label}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    )}
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}

          {/* Export Options */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="h6" gutterBottom>
              Export Options
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Format</InputLabel>
                  <Select
                    value={format}
                    onChange={(e) => setFormat(e.target.value)}
                  >
                    {EXPORT_FORMATS.map((fmt) => (
                      <MenuItem key={fmt.value} value={fmt.value}>
                        {fmt.icon} {fmt.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Auto Download</InputLabel>
                  <Select
                    value={autoDownload}
                    onChange={(e) => setAutoDownload(e.target.value)}
                  >
                    <MenuItem value={true}>Yes</MenuItem>
                    <MenuItem value={false}>No</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" startIcon={<RunIcon />} onClick={handleRun}>
          Run Report
        </Button>
      </DialogActions>
    </Dialog>
  );
}

/**
 * Dialog for creating new reports
 */
function CreateReportDialog({ open, onClose, templates, onCreated }) {
  const [step, setStep] = useState(0);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [reportData, setReportData] = useState({
    name: "",
    description: "",
    category: "",
    type: "tabular",
  });

  const { showNotification } = useNotification();

  const handleNext = () => {
    if (step === 0 && selectedTemplate) {
      setReportData((prev) => ({
        ...prev,
        category: selectedTemplate.category,
        type: selectedTemplate.type || "tabular",
      }));
    }
    setStep(step + 1);
  };

  const handleCreate = async () => {
    try {
      await reportingService.createReport({
        ...reportData,
        templateId: selectedTemplate?.id,
      });

      showNotification("Report created successfully", "success");
      onCreated();

      // Reset form
      setStep(0);
      setSelectedTemplate(null);
      setReportData({
        name: "",
        description: "",
        category: "",
        type: "tabular",
      });
    } catch (_error) {
      showNotification("Failed to create report", "error");
      // console.error('Error creating report:', error);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Create New Report - Step {step + 1} of 3</DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 2 }}>
          {step === 0 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Choose a Template
              </Typography>
              <Grid container spacing={2}>
                {templates.map((template) => (
                  <Grid item xs={12} sm={6} md={4} key={template.id}>
                    <Card
                      sx={{
                        cursor: "pointer",
                        border: selectedTemplate?.id === template.id ? 2 : 1,
                        borderColor:
                          selectedTemplate?.id === template.id
                            ? "primary.main"
                            : "divider",
                      }}
                      onClick={() => setSelectedTemplate(template)}
                    >
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          {template.name}
                        </Typography>
                        <Typography
                          variant="body2"
                          color="textSecondary"
                          sx={{ mb: 1 }}
                        >
                          {template.description}
                        </Typography>
                        <Chip
                          label={getCategoryLabel(template.category)}
                          size="small"
                          color={getCategoryColor(template.category)}
                        />
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}

          {step === 1 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Report Details
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Report Name"
                    value={reportData.name}
                    onChange={(e) =>
                      setReportData((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    label="Description"
                    value={reportData.description}
                    onChange={(e) =>
                      setReportData((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Category</InputLabel>
                    <Select
                      value={reportData.category}
                      onChange={(e) =>
                        setReportData((prev) => ({
                          ...prev,
                          category: e.target.value,
                        }))
                      }
                    >
                      {REPORT_CATEGORIES.map((category) => (
                        <MenuItem key={category.value} value={category.value}>
                          {category.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Type</InputLabel>
                    <Select
                      value={reportData.type}
                      onChange={(e) =>
                        setReportData((prev) => ({
                          ...prev,
                          type: e.target.value,
                        }))
                      }
                    >
                      <MenuItem value="tabular">Tabular</MenuItem>
                      <MenuItem value="chart">Chart</MenuItem>
                      <MenuItem value="dashboard">Dashboard</MenuItem>
                      <MenuItem value="analytical">Analytical</MenuItem>
                      <MenuItem value="executive">Executive</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </Box>
          )}

          {step === 2 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Review and Create
              </Typography>
              <Alert severity="info" sx={{ mb: 2 }}>
                Review your report configuration before creating.
              </Alert>
              <Box
                sx={{
                  p: 2,
                  bgcolor: "background.paper",
                  border: 1,
                  borderColor: "divider",
                  borderRadius: 1,
                }}
              >
                <Typography variant="subtitle1" gutterBottom>
                  <strong>Report Name:</strong> {reportData.name}
                </Typography>
                <Typography variant="body2" gutterBottom>
                  <strong>Description:</strong> {reportData.description}
                </Typography>
                <Typography variant="body2" gutterBottom>
                  <strong>Template:</strong> {selectedTemplate?.name}
                </Typography>
                <Typography variant="body2" gutterBottom>
                  <strong>Category:</strong>{" "}
                  {getCategoryLabel(reportData.category)}
                </Typography>
                <Typography variant="body2">
                  <strong>Type:</strong> {reportData.type}
                </Typography>
              </Box>
            </Box>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        {step > 0 && <Button onClick={() => setStep(step - 1)}>Back</Button>}
        {step < 2 ? (
          <Button
            variant="contained"
            onClick={handleNext}
            disabled={step === 0 && !selectedTemplate}
          >
            Next
          </Button>
        ) : (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreate}
            disabled={!reportData.name || !selectedTemplate}
          >
            Create Report
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}

export default ReportingDashboard;
