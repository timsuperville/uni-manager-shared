/**
 * Real-time Notification System
 * Live notification display with WebSocket integration
 */

import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  Badge,
  IconButton,
  Menu,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Typography,
  Box,
  Button,
  Chip,
  Divider,
  Tooltip,
  Alert,
  Snackbar,
  Paper,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  NotificationsActive as NotificationsActiveIcon,
  Person as PersonIcon,
  Group as GroupIcon,
  Event as EventIcon,
  Settings as SettingsIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  MarkChatRead as MarkReadIcon,
  Clear as ClearIcon,
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import { useRealTimeNotifications } from '../hooks/useRealTime';

const NotificationIcon = ({ type, variant = 'small' }) => {
  const size = variant === 'small' ? 'small' : 'medium';

  const iconMap = {
    member: <PersonIcon fontSize={size} />,
    invitation: <GroupIcon fontSize={size} />,
    activity: <EventIcon fontSize={size} />,
    system: <SettingsIcon fontSize={size} />,
    warning: <WarningIcon fontSize={size} />,
    info: <InfoIcon fontSize={size} />,
    success: <CheckCircleIcon fontSize={size} />,
    error: <CancelIcon fontSize={size} />,
  };

  return iconMap[type] || <InfoIcon fontSize={size} />;
};

const NotificationItem = ({
  notification,
  onClick,
  onMarkRead,
  compact = false,
}) => {
  const theme = useTheme();
  const {
    id,
    type,
    title,
    message,
    timestamp,
    read,
    priority,
    data = {},
  } = notification;

  const handleClick = () => {
    if (!read) {
      onMarkRead(id);
    }
    onClick?.(notification);
  };

  const handleMarkRead = (e) => {
    e.stopPropagation();
    onMarkRead(id);
  };

  const getPriorityColor = () => {
    switch (priority) {
      case 'high':
        return theme.palette.error.main;
      case 'medium':
        return theme.palette.warning.main;
      case 'low':
        return theme.palette.info.main;
      default:
        return theme.palette.grey[500];
    }
  };

  if (compact) {
    return (
      <ListItem
        button
        onClick={handleClick}
        sx={{
          bgcolor: read ? 'transparent' : theme.palette.action.hover,
          borderLeft: `4px solid ${getPriorityColor()}`,
          mb: 0.5,
          borderRadius: 1,
          '&:hover': {
            bgcolor: theme.palette.action.selected,
          },
        }}
      >
        <ListItemAvatar>
          <Avatar
            sx={{
              bgcolor: getPriorityColor(),
              width: 32,
              height: 32,
            }}
          >
            <NotificationIcon type={type} variant='small' />
          </Avatar>
        </ListItemAvatar>
        <ListItemText
          primary={
            <Typography
              variant='body2'
              fontWeight={read ? 'normal' : 'bold'}
              noWrap
            >
              {title}
            </Typography>
          }
          secondary={
            <Typography variant='caption' color='textSecondary' noWrap>
              {formatDistanceToNow(new Date(timestamp), { addSuffix: true })}
            </Typography>
          }
        />
        {!read && (
          <Tooltip title='Mark as read'>
            <IconButton size='small' onClick={handleMarkRead} sx={{ ml: 1 }}>
              <MarkReadIcon fontSize='small' />
            </IconButton>
          </Tooltip>
        )}
      </ListItem>
    );
  }

  return (
    <Paper
      elevation={read ? 0 : 2}
      sx={{
        p: 2,
        mb: 1,
        bgcolor: read ? 'transparent' : theme.palette.action.hover,
        borderLeft: `4px solid ${getPriorityColor()}`,
        cursor: 'pointer',
        transition: 'all 0.2s',
        '&:hover': {
          bgcolor: theme.palette.action.selected,
          elevation: 3,
        },
      }}
      onClick={handleClick}
    >
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
        <Avatar
          sx={{
            bgcolor: getPriorityColor(),
            width: 40,
            height: 40,
          }}
        >
          <NotificationIcon type={type} />
        </Avatar>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              mb: 0.5,
            }}
          >
            <Typography
              variant='subtitle2'
              fontWeight={read ? 'normal' : 'bold'}
              sx={{ flex: 1, mr: 1 }}
            >
              {title}
            </Typography>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip
                label={priority}
                size='small'
                variant='outlined'
                sx={{
                  borderColor: getPriorityColor(),
                  color: getPriorityColor(),
                  fontSize: '0.6rem',
                  height: 20,
                }}
              />
              {!read && (
                <Tooltip title='Mark as read'>
                  <IconButton size='small' onClick={handleMarkRead}>
                    <MarkReadIcon fontSize='small' />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
          </Box>

          <Typography variant='body2' color='textSecondary' sx={{ mb: 1 }}>
            {message}
          </Typography>

          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Typography variant='caption' color='textSecondary'>
              {formatDistanceToNow(new Date(timestamp), { addSuffix: true })}
            </Typography>

            {data.actionUrl && (
              <Button
                size='small'
                variant='outlined'
                onClick={(e) => {
                  e.stopPropagation();
                  // Handle action navigation
                }}
              >
                View Details
              </Button>
            )}
          </Box>
        </Box>
      </Box>
    </Paper>
  );
};

const NotificationMenu = ({
  anchorEl,
  onClose,
  notifications,
  onMarkRead,
  onClearAll,
}) => {
  const theme = useTheme();

  return (
    <Menu
      anchorEl={anchorEl}
      open={Boolean(anchorEl)}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: 360,
          maxHeight: 480,
          mt: 1,
        },
      }}
      transformOrigin={{ horizontal: 'right', vertical: 'top' }}
      anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
    >
      <Box sx={{ p: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Typography variant='h6'>Notifications</Typography>
          {notifications.length > 0 && (
            <Button size='small' onClick={onClearAll} startIcon={<ClearIcon />}>
              Clear All
            </Button>
          )}
        </Box>
      </Box>

      <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
        {notifications.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <NotificationsIcon
              sx={{ fontSize: 48, color: 'grey.400', mb: 1 }}
            />
            <Typography variant='body2' color='textSecondary'>
              No notifications
            </Typography>
          </Box>
        ) : (
          <List sx={{ p: 0 }}>
            {notifications.slice(0, 10).map((notification, index) => (
              <React.Fragment key={notification.id}>
                <NotificationItem
                  notification={notification}
                  onMarkRead={onMarkRead}
                  compact
                />
                {index < Math.min(notifications.length, 10) - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        )}
      </Box>

      {notifications.length > 10 && (
        <Box
          sx={{
            p: 2,
            borderTop: `1px solid ${theme.palette.divider}`,
            textAlign: 'center',
          }}
        >
          <Button size='small' onClick={onClose}>
            View All Notifications
          </Button>
        </Box>
      )}
    </Menu>
  );
};

export const NotificationBell = ({ onClick }) => {
  const { notifications, unreadCount, markAsRead, clearAll } =
    useRealTimeNotifications();
  const [anchorEl, setAnchorEl] = useState(null);
  const [showToast, setShowToast] = useState(false);
  const [toastNotification, setToastNotification] = useState(null);

  // Show toast for new notifications
  useEffect(() => {
    if (notifications.length > 0) {
      const latest = notifications[0];
      if (!latest.read && latest.priority === 'high') {
        setToastNotification(latest);
        setShowToast(true);
      }
    }
  }, [notifications]);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
    onClick?.(event);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleMarkRead = (notificationId) => {
    markAsRead(notificationId);
  };

  const handleClearAll = () => {
    clearAll();
    handleClose();
  };

  const handleToastClose = () => {
    setShowToast(false);
    setToastNotification(null);
  };

  return (
    <>
      <Tooltip title={`${unreadCount} unread notifications`}>
        <IconButton
          color='inherit'
          onClick={handleClick}
          sx={{
            position: 'relative',
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
            },
          }}
        >
          <Badge
            badgeContent={unreadCount}
            color='error'
            max={99}
            invisible={unreadCount === 0}
          >
            {unreadCount > 0 ? (
              <NotificationsActiveIcon />
            ) : (
              <NotificationsIcon />
            )}
          </Badge>
        </IconButton>
      </Tooltip>

      <NotificationMenu
        anchorEl={anchorEl}
        onClose={handleClose}
        notifications={notifications}
        onMarkRead={handleMarkRead}
        onClearAll={handleClearAll}
      />

      {/* Toast notification for high priority alerts */}
      <Snackbar
        open={showToast}
        autoHideDuration={6000}
        onClose={handleToastClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          onClose={handleToastClose}
          severity={toastNotification?.type === 'error' ? 'error' : 'info'}
          variant='filled'
          sx={{ width: '100%' }}
        >
          <Typography variant='subtitle2' fontWeight='bold'>
            {toastNotification?.title}
          </Typography>
          <Typography variant='body2'>{toastNotification?.message}</Typography>
        </Alert>
      </Snackbar>
    </>
  );
};

export const NotificationList = ({
  notifications = [],
  onNotificationClick,
  onMarkRead,
  maxHeight = 400,
  showActions = true,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  if (notifications.length === 0) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <NotificationsIcon sx={{ fontSize: 64, color: 'grey.400', mb: 2 }} />
        <Typography variant='h6' color='textSecondary' gutterBottom>
          No notifications
        </Typography>
        <Typography variant='body2' color='textSecondary'>
          You're all caught up! New notifications will appear here.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ maxHeight, overflow: 'auto' }}>
      {notifications.map((notification) => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onClick={onNotificationClick}
          onMarkRead={onMarkRead}
          compact={isMobile}
        />
      ))}
    </Box>
  );
};

export const NotificationPage = () => {
  const { notifications, unreadCount, markAsRead, clearAll } =
    useRealTimeNotifications();
  const [filter, setFilter] = useState('all'); // all, unread, read
  const [typeFilter, setTypeFilter] = useState('all');

  const filteredNotifications = notifications.filter((notification) => {
    const matchesReadFilter =
      filter === 'all' ||
      (filter === 'unread' && !notification.read) ||
      (filter === 'read' && notification.read);

    const matchesTypeFilter =
      typeFilter === 'all' || notification.type === typeFilter;

    return matchesReadFilter && matchesTypeFilter;
  });

  const handleNotificationClick = (notification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
    // Handle navigation based on notification data
    if (notification.data?.actionUrl) {
      // Navigate to the appropriate page
    }
  };

  const markAllAsRead = () => {
    notifications.filter((n) => !n.read).forEach((n) => markAsRead(n.id));
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box
        sx={{
          mb: 3,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 2,
        }}
      >
        <Typography variant='h4' component='h1'>
          Notifications
          {unreadCount > 0 && (
            <Chip
              label={`${unreadCount} unread`}
              color='primary'
              size='small'
              sx={{ ml: 2 }}
            />
          )}
        </Typography>

        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button
            variant='outlined'
            size='small'
            onClick={markAllAsRead}
            disabled={unreadCount === 0}
            startIcon={<MarkReadIcon />}
          >
            Mark All Read
          </Button>
          <Button
            variant='outlined'
            size='small'
            onClick={clearAll}
            disabled={notifications.length === 0}
            startIcon={<ClearIcon />}
          >
            Clear All
          </Button>
        </Box>
      </Box>

      <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {['all', 'unread', 'read'].map((filterType) => (
            <Chip
              key={filterType}
              label={filterType.charAt(0).toUpperCase() + filterType.slice(1)}
              onClick={() => setFilter(filterType)}
              color={filter === filterType ? 'primary' : 'default'}
              variant={filter === filterType ? 'filled' : 'outlined'}
            />
          ))}
        </Box>

        <Divider orientation='vertical' flexItem />

        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {['all', 'member', 'invitation', 'activity', 'system'].map((type) => (
            <Chip
              key={type}
              label={type.charAt(0).toUpperCase() + type.slice(1)}
              onClick={() => setTypeFilter(type)}
              color={typeFilter === type ? 'secondary' : 'default'}
              variant={typeFilter === type ? 'filled' : 'outlined'}
              size='small'
            />
          ))}
        </Box>
      </Box>

      <NotificationList
        notifications={filteredNotifications}
        onNotificationClick={handleNotificationClick}
        onMarkRead={markAsRead}
        maxHeight='calc(100vh - 300px)'
      />
    </Box>
  );
};

export default NotificationBell;
