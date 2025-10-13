/**
 * Interactive Dashboard Component
 * Comprehensive dashboard with real-time data visualization, PWA support, and responsive design
 * Provides configurable widgets, drag-and-drop layout, and advanced analytics
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Grid,
  Paper,
  Box,
  Typography,
  Card,
  CardContent,
  CardHeader,
  IconButton,
  Button,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  TextField,
  Switch,
  FormControlLabel,
  Chip,
  Alert,
  Tooltip,
  Fab,
  Skeleton
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Add as AddIcon,
  Settings as SettingsIcon,
  Refresh as RefreshIcon,
  Fullscreen as FullscreenIcon,
  GridView as GridViewIcon,
  ViewList as ViewListIcon,
  FilterList as FilterListIcon,
  Download as DownloadIcon,
  Share as ShareIcon,
  MoreVert as MoreVertIcon
} from '@mui/icons-material';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import AdvancedChart from './AdvancedChart';
import { usePWA } from '../../hooks/usePWA';
import { apiService } from '../../services/apiService';

const InteractiveDashboard = ({
  title = 'Dashboard',
  apiEndpoint,
  refreshInterval = 30000,
  enableDragDrop = true,
  enableCustomization = true,
  enableExport = true,
  defaultLayout = 'grid',
  colorScheme = 'default',
  onWidgetClick,
  onDataChange,
  initialWidgets = [],
  userPermissions = {}
}) => {
  // State management
  const [widgets, setWidgets] = useState(initialWidgets);
  const [layout, setLayout] = useState(defaultLayout);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [refreshTimer, setRefreshTimer] = useState(null);

  // Dialog states
  const [addWidgetOpen, setAddWidgetOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [widgetMenuAnchor, setWidgetMenuAnchor] = useState(null);
  const [selectedWidget, setSelectedWidget] = useState(null);

  // Configuration states
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [dateRange, setDateRange] = useState('7d');

  // PWA integration
  const { isOnline, syncQueue } = usePWA();

  // Available widget types
  const widgetTypes = [
    {
      id: 'line-chart',
      name: 'Line Chart',
      description: 'Display trends over time',
      component: 'chart',
      defaultConfig: { type: 'line', height: 300 }
    },
    {
      id: 'bar-chart',
      name: 'Bar Chart',
      description: 'Compare values across categories',
      component: 'chart',
      defaultConfig: { type: 'bar', height: 300 }
    },
    {
      id: 'pie-chart',
      name: 'Pie Chart',
      description: 'Show distribution of values',
      component: 'chart',
      defaultConfig: { type: 'pie', height: 300 }
    },
    {
      id: 'metrics-card',
      name: 'Metrics Card',
      description: 'Display key performance indicators',
      component: 'metrics',
      defaultConfig: { height: 150 }
    },
    {
      id: 'table-widget',
      name: 'Data Table',
      description: 'Show detailed data in table format',
      component: 'table',
      defaultConfig: { height: 400 }
    },
    {
      id: 'progress-widget',
      name: 'Progress Tracker',
      description: 'Track progress towards goals',
      component: 'progress',
      defaultConfig: { height: 200 }
    }
  ];

  // Load dashboard data
  const loadDashboardData = useCallback(async () => {
    if (!apiEndpoint || !isOnline) return;

    try {
      setLoading(true);
      setError('');

      const response = await apiService.get(`${apiEndpoint}?range=${dateRange}`);

      if (response.success) {
        // Update widget data
        const updatedWidgets = widgets.map(widget => {
          const widgetData = response.data[widget.dataKey];
          if (widgetData) {
            return {
              ...widget,
              data: widgetData,
              lastUpdated: new Date()
            };
          }
          return widget;
        });

        setWidgets(updatedWidgets);
        setLastUpdated(new Date());

        if (onDataChange) {
          onDataChange(response.data);
        }
      } else {
        setError(response.message || 'Failed to load dashboard data');
      }
    } catch (_err) {
      setError('Failed to load dashboard data');
      // console.error('Dashboard data loading error:', err);
    } finally {
      setLoading(false);
    }
  }, [apiEndpoint, dateRange, widgets, onDataChange, isOnline]);

  // Auto-refresh setup
  useEffect(() => {
    if (autoRefresh && refreshInterval > 0 && isOnline) {
      const interval = setInterval(loadDashboardData, refreshInterval);
      setRefreshTimer(interval);

      return () => {
        if (interval) clearInterval(interval);
      };
    } else {
      if (refreshTimer) {
        clearInterval(refreshTimer);
        setRefreshTimer(null);
      }
    }
  }, [autoRefresh, refreshInterval, loadDashboardData, isOnline, refreshTimer]);

  // Initial data load
  useEffect(() => {
    loadDashboardData();
  }, [dateRange]);

  // Handle drag and drop
  const handleDragEnd = (result) => {
    if (!result.destination || !enableDragDrop) return;

    const items = Array.from(widgets);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setWidgets(items);
  };

  // Add new widget
  const addWidget = (widgetType, config = {}) => {
    const newWidget = {
      id: `widget-${Date.now()}`,
      type: widgetType.id,
      title: config.title || widgetType.name,
      component: widgetType.component,
      config: { ...widgetType.defaultConfig, ...config },
      dataKey: config.dataKey || widgetType.id,
      position: widgets.length,
      data: null,
      lastUpdated: null
    };

    setWidgets([...widgets, newWidget]);
    setAddWidgetOpen(false);
  };

  // Remove widget
  const removeWidget = (widgetId) => {
    setWidgets(widgets.filter(w => w.id !== widgetId));
    setWidgetMenuAnchor(null);
    setSelectedWidget(null);
  };

  // Update widget configuration
  const updateWidget = (widgetId, updates) => {
    setWidgets(widgets.map(w =>
      w.id === widgetId ? { ...w, ...updates } : w
    ));
  };

  // Export dashboard data
  const exportDashboard = () => {
    const exportData = {
      title,
      widgets: widgets.map(w => ({
        ...w,
        data: w.data // Include current data
      })),
      generatedAt: new Date().toISOString(),
      dateRange
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    });

    const url = URL.createObjectURL(blob);
    const link = typeof document !== "undefined" && document.createElement('a');
    link.href = url;
    link.download = `dashboard-${title.replace(/\s+/g, '_').toLowerCase()}-${Date.now()}.json`;
    link.click();

    URL.revokeObjectURL(url);
  };

  // Render widget based on type
  const renderWidget = (widget, index) => {
    const widgetProps = {
      key: widget.id,
      title: widget.title,
      data: widget.data,
      loading: loading && !widget.data,
      error: error && !widget.data ? error : null,
      colorScheme,
      onRefresh: loadDashboardData,
      onClick: onWidgetClick ? (data) => onWidgetClick(widget, data) : undefined,
      ...widget.config
    };

    let content;

    switch (widget.component) {
    case 'chart':
      content = <AdvancedChart {...widgetProps} />;
      break;

    case 'metrics':
      content = (
        <Card>
          <CardHeader
            title={widget.title}
            action={
              <IconButton onClick={(e) => {
                setWidgetMenuAnchor(e.currentTarget);
                setSelectedWidget(widget);
              }}>
                <MoreVertIcon />
              </IconButton>
            }
          />
          <CardContent>
            {widget.data ? (
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant='h3' color='primary'>
                  {widget.data.value?.toLocaleString() || '—'}
                </Typography>
                <Typography variant='body2' color='textSecondary'>
                  {widget.data.label || 'Metric'}
                </Typography>
                {widget.data.change && (
                  <Chip
                    label={`${widget.data.change > 0 ? '+' : ''}${widget.data.change}%`}
                    color={widget.data.change > 0 ? 'success' : 'error'}
                    size='small'
                    sx={{ mt: 1 }}
                  />
                )}
              </Box>
            ) : (
              <Skeleton variant='rectangular' height={60} />
            )}
          </CardContent>
        </Card>
      );
      break;

    case 'table':
      content = (
        <Card>
          <CardHeader
            title={widget.title}
            action={
              <IconButton onClick={(e) => {
                setWidgetMenuAnchor(e.currentTarget);
                setSelectedWidget(widget);
              }}>
                <MoreVertIcon />
              </IconButton>
            }
          />
          <CardContent>
            {widget.data ? (
              <Box sx={{ maxHeight: widget.config.height - 100, overflow: 'auto' }}>
                {/* Table implementation would go here */}
                <Typography>Table data: {JSON.stringify(widget.data, null, 2)}</Typography>
              </Box>
            ) : (
              <Skeleton variant='rectangular' height={widget.config.height - 100} />
            )}
          </CardContent>
        </Card>
      );
      break;

    default:
      content = (
        <Card>
          <CardContent>
            <Typography>Unknown widget type: {widget.component}</Typography>
          </CardContent>
        </Card>
      );
    }

    if (enableDragDrop) {
      return (
        <Draggable key={widget.id} draggableId={widget.id} index={index}>
          {(provided, snapshot) => (
            <div
              ref={provided.innerRef}
              {...provided.draggableProps}
              {...provided.dragHandleProps}
              style={{
                ...provided.draggableProps.style,
                opacity: snapshot.isDragging ? 0.8 : 1,
                transform: snapshot.isDragging
                  ? `${provided.draggableProps.style?.transform} rotate(5deg)`
                  : provided.draggableProps.style?.transform
              }}
            >
              <Grid item xs={12} md={6} lg={4}>
                {content}
              </Grid>
            </div>
          )}
        </Draggable>
      );
    }

    return (
      <Grid item xs={12} md={6} lg={4} key={widget.id}>
        {content}
      </Grid>
    );
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        mb: 3
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <DashboardIcon fontSize='large' color='primary' />
          <Box>
            <Typography variant='h4'>{title}</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
              {!isOnline && (
                <Chip label='Offline' size='small' color='warning' />
              )}
              {autoRefresh && isOnline && (
                <Chip
                  label={`Auto-refresh • ${lastUpdated.toLocaleTimeString()}`}
                  size='small'
                  color='primary'
                />
              )}
              {syncQueue.length > 0 && (
                <Chip
                  label={`${syncQueue.length} pending`}
                  size='small'
                  color='info'
                />
              )}
            </Box>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {/* Date Range Selector */}
          <FormControl size='small' sx={{ minWidth: 120 }}>
            <InputLabel>Time Range</InputLabel>
            <Select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              label='Time Range'
            >
              <MenuItem value='1d'>Last 24 Hours</MenuItem>
              <MenuItem value='7d'>Last 7 Days</MenuItem>
              <MenuItem value='30d'>Last 30 Days</MenuItem>
              <MenuItem value='90d'>Last 90 Days</MenuItem>
            </Select>
          </FormControl>

          {/* Layout Toggle */}
          <IconButton onClick={() => setLayout(layout === 'grid' ? 'list' : 'grid')}>
            {layout === 'grid' ? <ViewListIcon /> : <GridViewIcon />}
          </IconButton>

          {/* Refresh Button */}
          <IconButton onClick={loadDashboardData} disabled={loading}>
            <RefreshIcon />
          </IconButton>

          {/* Settings Button */}
          {enableCustomization && (
            <IconButton onClick={() => setSettingsOpen(true)}>
              <SettingsIcon />
            </IconButton>
          )}

          {/* Export Button */}
          {enableExport && (
            <IconButton onClick={exportDashboard}>
              <DownloadIcon />
            </IconButton>
          )}
        </Box>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity='error' sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Offline Warning */}
      {!isOnline && (
        <Alert severity='warning' sx={{ mb: 2 }}>
          You are offline. Dashboard data may be outdated. {syncQueue.length > 0 && `${syncQueue.length} updates are queued for when you reconnect.`}
        </Alert>
      )}

      {/* Widgets Grid */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId='dashboard-widgets'>
          {(provided) => (
            <div {...provided.droppableProps} ref={provided.innerRef}>
              <Grid container spacing={3}>
                {widgets.map((widget, index) => renderWidget(widget, index))}
                {provided.placeholder}
              </Grid>
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {/* Empty State */}
      {widgets.length === 0 && (
        <Paper
          sx={{
            p: 6,
            textAlign: 'center',
            backgroundColor: 'grey.50',
            border: '2px dashed',
            borderColor: 'grey.300'
          }}
        >
          <DashboardIcon sx={{ fontSize: 64, color: 'grey.400', mb: 2 }} />
          <Typography variant='h6' gutterBottom color='textSecondary'>
            No widgets configured
          </Typography>
          <Typography variant='body2' color='textSecondary' paragraph>
            Add widgets to start visualizing your data
          </Typography>
          <Button
            variant='contained'
            startIcon={<AddIcon />}
            onClick={() => setAddWidgetOpen(true)}
          >
            Add Widget
          </Button>
        </Paper>
      )}

      {/* Add Widget FAB */}
      {widgets.length > 0 && enableCustomization && (
        <Fab
          color='primary'
          aria-label='add widget'
          sx={{ position: 'fixed', bottom: 16, right: 16 }}
          onClick={() => setAddWidgetOpen(true)}
        >
          <AddIcon />
        </Fab>
      )}

      {/* Widget Context Menu */}
      <Menu
        anchorEl={widgetMenuAnchor}
        open={Boolean(widgetMenuAnchor)}
        onClose={() => {
          setWidgetMenuAnchor(null);
          setSelectedWidget(null);
        }}
      >
        <MenuItem onClick={() => {
          if (selectedWidget) {
            // Edit widget functionality
          }
          setWidgetMenuAnchor(null);
        }}>
          <SettingsIcon fontSize='small' sx={{ mr: 1 }} />
          Edit Widget
        </MenuItem>
        <MenuItem onClick={() => {
          if (selectedWidget) {
            removeWidget(selectedWidget.id);
          }
        }}>
          Remove Widget
        </MenuItem>
      </Menu>

      {/* Add Widget Dialog */}
      <Dialog open={addWidgetOpen} onClose={() => setAddWidgetOpen(false)} maxWidth='md' fullWidth>
        <DialogTitle>Add Widget</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            {widgetTypes.map((type) => (
              <Grid item xs={12} sm={6} md={4} key={type.id}>
                <Card
                  sx={{
                    cursor: 'pointer',
                    '&:hover': { backgroundColor: 'action.hover' }
                  }}
                  onClick={() => addWidget(type)}
                >
                  <CardContent>
                    <Typography variant='h6' gutterBottom>
                      {type.name}
                    </Typography>
                    <Typography variant='body2' color='textSecondary'>
                      {type.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddWidgetOpen(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>

      {/* Settings Dialog */}
      <Dialog open={settingsOpen} onClose={() => setSettingsOpen(false)} maxWidth='sm' fullWidth>
        <DialogTitle>Dashboard Settings</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                />
              }
              label='Auto-refresh data'
            />

            <FormControlLabel
              control={
                <Switch
                  checked={showFilters}
                  onChange={(e) => setShowFilters(e.target.checked)}
                />
              }
              label='Show filters'
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSettingsOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default InteractiveDashboard;