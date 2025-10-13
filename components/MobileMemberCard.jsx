/**
 * Mobile-Optimized Member Card Component
 * Responsive member display with touch-friendly interactions
 */

import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
  Card,
  CardContent,
  CardActions,
  Avatar,
  Typography,
  IconButton,
  Chip,
  Box,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  useTheme,
  alpha,
} from '@mui/material';
import {
  MoreVert as MoreVertIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  AdminPanelSettings as AdminIcon,
  VerifiedUser as VerifiedIcon,
} from '@mui/icons-material';
import {
  useResponsive,
  useTouchGestures,
  ResponsiveText,
} from '../utils/responsiveUtils';

const MobileMemberCard = ({
  member,
  onEdit,
  onDelete,
  onContact,
  showActions = true,
  compact = false,
}) => {
  const theme = useTheme();
  const { isMobile, isTablet } = useResponsive();
  const [menuAnchor, setMenuAnchor] = useState(null);
  const menuOpen = Boolean(menuAnchor);

  // Touch gestures for card interactions
  const touchGestures = useTouchGestures({
    onLongPress: () => {
      if (isMobile && showActions) {
        setMenuAnchor(true); // Open menu on long press
      }
    },
    onDoubleTap: () => {
      if (onEdit) onEdit(member);
    },
  });

  const handleMenuOpen = (event) => {
    setMenuAnchor(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
  };

  const handleAction = (action) => {
    handleMenuClose();
    if (action === 'edit' && onEdit) onEdit(member);
    if (action === 'delete' && onDelete) onDelete(member);
    if (action === 'contact' && onContact) onContact(member);
  };

  // Get role color and icon
  const getRoleDisplay = (role) => {
    switch (role?.toLowerCase()) {
      case 'admin':
        return {
          color: 'error',
          icon: <AdminIcon sx={{ fontSize: 16 }} />,
          label: 'Admin',
        };
      case 'moderator':
        return {
          color: 'warning',
          icon: <VerifiedIcon sx={{ fontSize: 16 }} />,
          label: 'Moderator',
        };
      default:
        return {
          color: 'default',
          icon: <PersonIcon sx={{ fontSize: 16 }} />,
          label: 'Member',
        };
    }
  };

  const roleDisplay = getRoleDisplay(member.role);

  // Get member status color
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'success';
      case 'pending':
        return 'warning';
      case 'inactive':
        return 'default';
      default:
        return 'default';
    }
  };

  return (
    <Card
      sx={{
        width: '100%',
        mb: isMobile ? 1 : 2,
        cursor: 'pointer',
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          transform: isMobile ? 'none' : 'translateY(-2px)',
          boxShadow: isMobile ? 1 : 4,
        },
        '&:active': {
          transform: isMobile ? 'scale(0.98)' : 'none',
          backgroundColor: alpha(theme.palette.primary.main, 0.04),
        },
      }}
      {...touchGestures}
    >
      <CardContent
        sx={{
          p: isMobile ? 2 : 3,
          pb: isMobile && !showActions ? 2 : 1,
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: compact ? 'center' : 'flex-start',
            gap: isMobile ? 1.5 : 2,
          }}
        >
          {/* Avatar */}
          <Avatar
            src={member.avatar}
            sx={{
              width: isMobile ? (compact ? 40 : 56) : 64,
              height: isMobile ? (compact ? 40 : 56) : 64,
              bgcolor: member.avatar ? 'transparent' : 'primary.main',
              fontSize: isMobile ? (compact ? '16px' : '20px') : '24px',
            }}
          >
            {!member.avatar && (member.name?.[0] || member.email?.[0] || '?')}
          </Avatar>

          {/* Member Info */}
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            {/* Name and Actions */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                mb: compact ? 0.5 : 1,
              }}
            >
              <Box sx={{ minWidth: 0, flexGrow: 1 }}>
                <ResponsiveText
                  variant={isMobile ? 'h6' : 'h5'}
                  component='h3'
                  sx={{
                    fontWeight: 600,
                    fontSize: isMobile ? (compact ? '14px' : '16px') : '18px',
                    lineHeight: 1.2,
                    mb: 0.5,
                  }}
                  noWrap
                >
                  {member.name || 'Unknown Member'}
                </ResponsiveText>

                {/* Email */}
                <Typography
                  variant='body2'
                  color='text.secondary'
                  sx={{
                    fontSize: isMobile ? '12px' : '14px',
                    mb: compact ? 0 : 0.5,
                  }}
                  noWrap
                >
                  {member.email}
                </Typography>
              </Box>

              {/* Actions Menu */}
              {showActions && (
                <IconButton
                  size={isMobile ? 'small' : 'medium'}
                  onClick={handleMenuOpen}
                  sx={{
                    ml: 1,
                    minWidth: isMobile ? 32 : 40,
                    minHeight: isMobile ? 32 : 40,
                  }}
                >
                  <MoreVertIcon fontSize={isMobile ? 'small' : 'medium'} />
                </IconButton>
              )}
            </Box>

            {/* Role and Status Chips */}
            {!compact && (
              <Box
                sx={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 0.5,
                  mb: 1,
                }}
              >
                <Chip
                  icon={roleDisplay.icon}
                  label={roleDisplay.label}
                  size={isMobile ? 'small' : 'medium'}
                  color={roleDisplay.color}
                  variant='outlined'
                  sx={{
                    height: isMobile ? 24 : 32,
                    fontSize: isMobile ? '11px' : '12px',
                    '& .MuiChip-icon': {
                      fontSize: isMobile ? 14 : 16,
                    },
                  }}
                />

                {member.status && (
                  <Chip
                    label={member.status}
                    size={isMobile ? 'small' : 'medium'}
                    color={getStatusColor(member.status)}
                    sx={{
                      height: isMobile ? 24 : 32,
                      fontSize: isMobile ? '11px' : '12px',
                    }}
                  />
                )}
              </Box>
            )}

            {/* Additional Info */}
            {!compact && (member.phone || member.joinDate) && (
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: isMobile ? 'column' : 'row',
                  gap: isMobile ? 0.5 : 2,
                  mt: 1,
                }}
              >
                {member.phone && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <PhoneIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                    <Typography variant='caption' color='text.secondary'>
                      {member.phone}
                    </Typography>
                  </Box>
                )}

                {member.joinDate && (
                  <Typography
                    variant='caption'
                    color='text.secondary'
                    sx={{ fontSize: isMobile ? '11px' : '12px' }}
                  >
                    Joined {new Date(member.joinDate).toLocaleDateString()}
                  </Typography>
                )}
              </Box>
            )}
          </Box>
        </Box>
      </CardContent>

      {/* Quick Actions */}
      {!compact && showActions && (isMobile || isTablet) && (
        <CardActions
          sx={{
            pt: 0,
            px: 2,
            pb: 2,
            justifyContent: 'space-around',
          }}
        >
          {member.email && (
            <IconButton
              size='small'
              onClick={(e) => {
                e.stopPropagation();
                handleAction('contact');
              }}
              sx={{ minWidth: 44, minHeight: 44 }}
            >
              <EmailIcon fontSize='small' />
            </IconButton>
          )}

          {onEdit && (
            <IconButton
              size='small'
              onClick={(e) => {
                e.stopPropagation();
                handleAction('edit');
              }}
              sx={{ minWidth: 44, minHeight: 44 }}
            >
              <EditIcon fontSize='small' />
            </IconButton>
          )}
        </CardActions>
      )}

      {/* Context Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={menuOpen}
        onClose={handleMenuClose}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        sx={{
          '& .MuiPaper-root': {
            minWidth: 180,
          },
        }}
      >
        {onEdit && (
          <MenuItem onClick={() => handleAction('edit')}>
            <ListItemIcon>
              <EditIcon fontSize='small' />
            </ListItemIcon>
            <ListItemText>Edit Member</ListItemText>
          </MenuItem>
        )}

        {onContact && member.email && (
          <MenuItem onClick={() => handleAction('contact')}>
            <ListItemIcon>
              <EmailIcon fontSize='small' />
            </ListItemIcon>
            <ListItemText>Send Email</ListItemText>
          </MenuItem>
        )}

        {onEdit && onContact && <Divider />}

        {onDelete && (
          <MenuItem
            onClick={() => handleAction('delete')}
            sx={{ color: 'error.main' }}
          >
            <ListItemIcon>
              <DeleteIcon fontSize='small' color='error' />
            </ListItemIcon>
            <ListItemText>Remove Member</ListItemText>
          </MenuItem>
        )}
      </Menu>
    </Card>
  );
};

// PropTypes validation
MobileMemberCard.propTypes = {
  member: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    name: PropTypes.string,
    email: PropTypes.string.isRequired,
    avatar: PropTypes.string,
    role: PropTypes.string,
    status: PropTypes.string,
    phone: PropTypes.string,
    joinDate: PropTypes.string,
  }).isRequired,
  onEdit: PropTypes.func,
  onDelete: PropTypes.func,
  onContact: PropTypes.func,
  showActions: PropTypes.bool,
  compact: PropTypes.bool,
};

export default MobileMemberCard;
