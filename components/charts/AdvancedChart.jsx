/**
 * Advanced Chart Component
 * Comprehensive charting solution for data visualization across all applications
 * Enhanced with real-time updates, PWA offline support, and responsive design
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  ButtonGroup,
  Switch,
  FormControlLabel,
  Grid,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip,
  Chip
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  Fullscreen as FullscreenIcon,
  Settings as SettingsIcon,
  Timeline as TimelineIcon,
  BarChart as BarChartIcon,
  PieChart as PieChartIcon,
  ShowChart as LineChartIcon
} from '@mui/icons-material';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
  ArcElement,
  RadialLinearScale,
  Filler
} from 'chart.js';
import { Line, Bar, Pie, Doughnut, Radar, PolarArea } from 'react-chartjs-2';
import { useOffline } from '../../../shared/hooks/usePWA';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  ChartTooltip,
  Legend,
  ArcElement,
  RadialLinearScale,
  Filler
);

const AdvancedChart = ({
  title = 'Data Visualization',
  data,
  type = 'line',
  height = 400,
  refreshInterval = 0,
  onDataRefresh,
  downloadEnabled = true,
  fullscreenEnabled = true,
  realTimeEnabled = false,
  options = {},
  colorScheme = 'default',
  responsive = true,
  maintainAspectRatio = false,
  showControls = true,
  showLegend = true,
  showTooltips = true,
  animated = true,
  loading = false,
  error = null,
  className = '',
  style = {},
  onChartClick,
  onChartHover,
  plugins = []
}) => {
  // State management
  const [chartType, setChartType] = useState(type);
  const [isRealTime, setIsRealTime] = useState(realTimeEnabled);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [refreshTimer, setRefreshTimer] = useState(null);

  // Refs
  const chartRef = useRef();
  const containerRef = useRef();

  // PWA integration
  const isOffline = useOffline();

  // Color schemes
  const colorSchemes = {
    default: {
      primary: '#1976d2',
      secondary: '#dc004e',
      success: '#2e7d32',
      warning: '#ed6c02',
      error: '#d32f2f',
      info: '#0288d1'
    },
    business: {
      primary: '#1565c0',
      secondary: '#5e35b1',
      success: '#2e7d32',
      warning: '#f57c00',
      error: '#c62828',
      info: '#0277bd'
    },
    church: {
      primary: '#4a90e2',
      secondary: '#7b68ee',
      success: '#32cd32',
      warning: '#ffa500',
      error: '#dc143c',
      info: '#20b2aa'
    },
    personal: {
      primary: '#ff6b6b',
      secondary: '#4ecdc4',
      success: '#45b7d1',
      warning: '#96ceb4',
      error: '#ff7675',
      info: '#74b9ff'
    },
    dark: {
      primary: '#90caf9',
      secondary: '#f48fb1',
      success: '#a5d6a7',
      warning: '#ffcc02',
      error: '#ef5350',
      info: '#4fc3f7'
    }
  };

  // Get current color scheme
  const currentColors = colorSchemes[colorScheme] || colorSchemes.default;

  // Chart type options
  const chartTypes = [
    { value: 'line', label: 'Line Chart', icon: LineChartIcon },
    { value: 'bar', label: 'Bar Chart', icon: BarChartIcon },
    { value: 'pie', label: 'Pie Chart', icon: PieChartIcon },
    { value: 'doughnut', label: 'Doughnut Chart', icon: PieChartIcon },
    { value: 'radar', label: 'Radar Chart', icon: TimelineIcon },
    { value: 'polarArea', label: 'Polar Area', icon: BarChartIcon }
  ];

  // Process data for different chart types
  const processedData = useMemo(() => {
    if (!data) return null;

    const processedDataset = {
      ...data,
      datasets: data.datasets?.map((dataset, index) => ({
        ...dataset,
        backgroundColor: dataset.backgroundColor || generateColors(data.labels?.length || 1, currentColors, 0.2),
        borderColor: dataset.borderColor || generateColors(data.labels?.length || 1, currentColors, 1),
        borderWidth: dataset.borderWidth || 2,
        tension: chartType === 'line' ? (dataset.tension || 0.4) : 0,
        fill: chartType === 'line' ? (dataset.fill !== undefined ? dataset.fill : false) : false
      }))
    };

    return processedDataset;
  }, [data, currentColors, chartType]);

  // Default chart options
  const defaultOptions = {
    responsive,
    maintainAspectRatio,
    animation: animated ? {
      duration: 1000,
      easing: 'easeInOutQuart'
    } : false,
    plugins: {
      legend: {
        display: showLegend,
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 20
        }
      },
      tooltip: {
        enabled: showTooltips,
        mode: 'index',
        intersect: false,
        callbacks: {
          title: (context) => {
            if (context[0]?.label) {
              return context[0].label;
            }
            return '';
          },
          label: (context) => {
            const label = context.dataset.label || '';
            const value = context.parsed.y !== undefined ? context.parsed.y : context.parsed;
            return `${label}: ${typeof value === 'number' ? value.toLocaleString() : value}`;
          }
        }
      },
      title: {
        display: false // We handle title in the card header
      }
    },
    scales: chartType === 'line' || chartType === 'bar' ? {
      x: {
        display: true,
        grid: {
          display: true,
          color: 'rgba(0, 0, 0, 0.1)'
        }
      },
      y: {
        display: true,
        beginAtZero: true,
        grid: {
          display: true,
          color: 'rgba(0, 0, 0, 0.1)'
        }
      }
    } : {},
    onClick: onChartClick ? (event, elements) => {
      if (elements.length > 0) {
        const elementIndex = elements[0].index;
        const datasetIndex = elements[0].datasetIndex;
        onChartClick(event, elements, {
          elementIndex,
          datasetIndex,
          data: processedData.datasets[datasetIndex].data[elementIndex],
          label: processedData.labels[elementIndex]
        });
      }
    } : undefined,
    onHover: onChartHover,
    ...options
  };

  // Real-time data refresh
  useEffect(() => {
    if (isRealTime && refreshInterval > 0 && onDataRefresh && !isOffline) {
      const interval = setInterval(() => {
        onDataRefresh();
        setLastUpdated(new Date());
      }, refreshInterval);

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
  }, [isRealTime, refreshInterval, onDataRefresh, isOffline, refreshTimer]);

  // Handle manual refresh
  const handleRefresh = () => {
    if (onDataRefresh && !loading) {
      onDataRefresh();
      setLastUpdated(new Date());
    }
  };

  // Handle download
  const handleDownload = () => {
    if (chartRef.current) {
      const chart = chartRef.current;
      const canvas = chart.canvas;
      const url = canvas.toDataURL('image/png');

      const link = typeof document !== "undefined" && document.createElement('a');
      link.download = `${title.replace(/\s+/g, '_').toLowerCase()}_${Date.now()}.png`;
      link.href = url;
      link.click();
    }
  };

  // Handle fullscreen toggle
  const handleFullscreen = () => {
    if (containerRef.current) {
      if (!isFullscreen) {
        containerRef.current.requestFullscreen?.();
        setIsFullscreen(true);
      } else {
        typeof document !== "undefined" && document.exitFullscreen?.();
        setIsFullscreen(false);
      }
    }
  };

  // Generate colors for datasets
  function generateColors(count, colors, alpha = 1) {
    const colorValues = Object.values(colors);
    const result = [];

    for (let i = 0; i < count; i++) {
      const color = colorValues[i % colorValues.length];
      if (alpha < 1) {
        // Convert hex to rgba
        const hex = color.replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);
        result.push(`rgba(${r}, ${g}, ${b}, ${alpha})`);
      } else {
        result.push(color);
      }
    }

    return result;
  }

  // Render chart component based on type
  const renderChart = () => {
    const chartProps = {
      ref: chartRef,
      data: processedData,
      options: defaultOptions,
      height,
      plugins
    };

    switch (chartType) {
    case 'bar':
      return <Bar {...chartProps} />;
    case 'pie':
      return <Pie {...chartProps} />;
    case 'doughnut':
      return <Doughnut {...chartProps} />;
    case 'radar':
      return <Radar {...chartProps} />;
    case 'polarArea':
      return <PolarArea {...chartProps} />;
    case 'line':
    default:
      return <Line {...chartProps} />;
    }
  };

  return (
    <Card
      ref={containerRef}
      className={className}
      style={style}
      sx={{
        height: isFullscreen ? '100vh' : 'auto',
        position: isFullscreen ? 'fixed' : 'relative',
        top: isFullscreen ? 0 : 'auto',
        left: isFullscreen ? 0 : 'auto',
        right: isFullscreen ? 0 : 'auto',
        bottom: isFullscreen ? 0 : 'auto',
        zIndex: isFullscreen ? 9999 : 'auto'
      }}
    >
      <CardHeader
        title={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant='h6'>{title}</Typography>
            {isOffline && (
              <Chip label='Offline' size='small' color='warning' />
            )}
            {isRealTime && (
              <Chip
                label={`Live • ${lastUpdated.toLocaleTimeString()}`}
                size='small'
                color='success'
                sx={{ animation: 'pulse 2s infinite' }}
              />
            )}
          </Box>
        }
        action={
          showControls && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {/* Chart Type Selector */}
              <FormControl size='small' sx={{ minWidth: 120 }}>
                <InputLabel>Chart Type</InputLabel>
                <Select
                  value={chartType}
                  onChange={(e) => setChartType(e.target.value)}
                  label='Chart Type'
                >
                  {chartTypes.map((type) => (
                    <MenuItem key={type.value} value={type.value}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <type.icon fontSize='small' />
                        {type.label}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Real-time Toggle */}
              {refreshInterval > 0 && (
                <FormControlLabel
                  control={
                    <Switch
                      checked={isRealTime}
                      onChange={(e) => setIsRealTime(e.target.checked)}
                      disabled={isOffline}
                    />
                  }
                  label='Live'
                />
              )}

              {/* Action Buttons */}
              <ButtonGroup size='small'>
                {onDataRefresh && (
                  <Tooltip title='Refresh Data'>
                    <IconButton onClick={handleRefresh} disabled={loading || isOffline}>
                      <RefreshIcon />
                    </IconButton>
                  </Tooltip>
                )}

                {downloadEnabled && (
                  <Tooltip title='Download Chart'>
                    <IconButton onClick={handleDownload} disabled={loading}>
                      <DownloadIcon />
                    </IconButton>
                  </Tooltip>
                )}

                {fullscreenEnabled && (
                  <Tooltip title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}>
                    <IconButton onClick={handleFullscreen}>
                      <FullscreenIcon />
                    </IconButton>
                  </Tooltip>
                )}
              </ButtonGroup>
            </Box>
          )
        }
      />

      <CardContent>
        {/* Error State */}
        {error && (
          <Alert severity='error' sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Offline Warning */}
        {isOffline && isRealTime && (
          <Alert severity='warning' sx={{ mb: 2 }}>
            Real-time updates are disabled while offline. Data may be outdated.
          </Alert>
        )}

        {/* Loading State */}
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        )}

        {/* Chart */}
        {!loading && !error && processedData && (
          <Box sx={{ height, position: 'relative' }}>
            {renderChart()}
          </Box>
        )}

        {/* No Data State */}
        {!loading && !error && !processedData && (
          <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height,
            color: 'text.secondary'
          }}>
            <BarChartIcon sx={{ fontSize: 64, mb: 2, opacity: 0.3 }} />
            <Typography variant='h6' gutterBottom>
              No Data Available
            </Typography>
            <Typography variant='body2'>
              Data will appear here when available
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default AdvancedChart;