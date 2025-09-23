/**
 * Mobile-Optimized Invitation Card Component
 * Responsive invitation display with touch-friendly interactions
 */

import React, { useState } from "react";
import PropTypes from "prop-types";
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  IconButton,
  Chip,
  Box,
  Button,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  LinearProgress,
  useTheme,
  alpha,
} from "@mui/material";
import {
  MoreVert as MoreVertIcon,
  Email as EmailIcon,
  Delete as DeleteIcon,
  ContentCopy as CopyIcon,
  AccessTime as TimeIcon,
  CheckCircle as AcceptedIcon,
  Cancel as DeclinedIcon,
  HourglassEmpty as PendingIcon,
  Refresh as ResendIcon,
} from "@mui/icons-material";
import {
  useResponsive,
  useTouchGestures,
  ResponsiveText,
} from "../utils/responsiveUtils";

const MobileInvitationCard = ({
  invitation,
  onResend,
  onDelete,
  onCopyLink,
  showActions = true,
  compact = false,
}) => {
  const theme = useTheme();
  const { isMobile, isTablet } = useResponsive();
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const menuOpen = Boolean(menuAnchor);

  // Touch gestures for card interactions
  const touchGestures = useTouchGestures({
    onLongPress: () => {
      if (isMobile && showActions) {
        setMenuAnchor(true);
      }
    },
    onDoubleTap: () => {
      if (onCopyLink) onCopyLink(invitation);
    },
  });

  const handleMenuOpen = (event) => {
    setMenuAnchor(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
  };

  const handleAction = async (action) => {
    handleMenuClose();
    setIsLoading(true);

    try {
      if (action === "resend" && onResend) await onResend(invitation);
      if (action === "delete" && onDelete) await onDelete(invitation);
      if (action === "copy" && onCopyLink) await onCopyLink(invitation);
    } finally {
      setIsLoading(false);
    }
  };

  // Get status display properties
  const getStatusDisplay = (status) => {
    switch (status?.toLowerCase()) {
      case "accepted":
        return {
          color: "success",
          icon: <AcceptedIcon sx={{ fontSize: 16 }} />,
          label: "Accepted",
          bgColor: alpha(theme.palette.success.main, 0.1),
        };
      case "declined":
        return {
          color: "error",
          icon: <DeclinedIcon sx={{ fontSize: 16 }} />,
          label: "Declined",
          bgColor: alpha(theme.palette.error.main, 0.1),
        };
      case "pending":
      default:
        return {
          color: "warning",
          icon: <PendingIcon sx={{ fontSize: 16 }} />,
          label: "Pending",
          bgColor: alpha(theme.palette.warning.main, 0.1),
        };
    }
  };

  const statusDisplay = getStatusDisplay(invitation.status);

  // Calculate time remaining
  const getTimeRemaining = (expiresAt) => {
    if (!expiresAt) return null;

    const now = new Date();
    const expiry = new Date(expiresAt);
    const diff = expiry - now;

    if (diff <= 0) return "Expired";

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) return `${days}d ${hours}h remaining`;
    if (hours > 0) return `${hours}h remaining`;

    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${minutes}m remaining`;
  };

  const timeRemaining = getTimeRemaining(invitation.expiresAt);
  const isExpired = timeRemaining === "Expired";

  // Calculate expiry progress (for progress bar)
  const getExpiryProgress = () => {
    if (!invitation.expiresAt || !invitation.createdAt) return 0;

    const created = new Date(invitation.createdAt);
    const expires = new Date(invitation.expiresAt);
    const now = new Date();

    const total = expires - created;
    const elapsed = now - created;

    return Math.min(100, Math.max(0, (elapsed / total) * 100));
  };

  return (
    <Card
      sx={{
        width: "100%",
        mb: isMobile ? 1 : 2,
        cursor: "pointer",
        transition: "all 0.2s ease-in-out",
        borderLeft: `4px solid ${
          statusDisplay.color === "success"
            ? theme.palette.success.main
            : statusDisplay.color === "error"
              ? theme.palette.error.main
              : theme.palette.warning.main
        }`,
        backgroundColor: isExpired
          ? alpha(theme.palette.error.main, 0.02)
          : "background.paper",
        "&:hover": {
          transform: isMobile ? "none" : "translateY(-2px)",
          boxShadow: isMobile ? 1 : 4,
        },
        "&:active": {
          transform: isMobile ? "scale(0.98)" : "none",
          backgroundColor: alpha(theme.palette.primary.main, 0.04),
        },
      }}
      {...touchGestures}
    >
      {/* Loading Progress */}
      {isLoading && (
        <LinearProgress
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            zIndex: 1,
          }}
        />
      )}

      <CardContent
        sx={{
          p: isMobile ? 2 : 3,
          pb: isMobile && !showActions ? 2 : 1,
          opacity: isLoading ? 0.7 : 1,
        }}
      >
        {/* Header */}
        <Box
          sx={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            mb: compact ? 1 : 2,
          }}
        >
          <Box sx={{ minWidth: 0, flexGrow: 1 }}>
            <ResponsiveText
              variant={isMobile ? "h6" : "h5"}
              component="h3"
              sx={{
                fontWeight: 600,
                fontSize: isMobile ? (compact ? "14px" : "16px") : "18px",
                lineHeight: 1.2,
                mb: 0.5,
              }}
              noWrap
            >
              {invitation.recipientEmail || "Unknown Recipient"}
            </ResponsiveText>

            {invitation.recipientName && (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  fontSize: isMobile ? "12px" : "14px",
                  mb: 0.5,
                }}
                noWrap
              >
                {invitation.recipientName}
              </Typography>
            )}
          </Box>

          {/* Actions Menu */}
          {showActions && (
            <IconButton
              size={isMobile ? "small" : "medium"}
              onClick={handleMenuOpen}
              disabled={isLoading}
              sx={{
                ml: 1,
                minWidth: isMobile ? 32 : 40,
                minHeight: isMobile ? 32 : 40,
              }}
            >
              <MoreVertIcon fontSize={isMobile ? "small" : "medium"} />
            </IconButton>
          )}
        </Box>

        {/* Status and Role */}
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: 0.5,
            mb: compact ? 1 : 2,
          }}
        >
          <Chip
            icon={statusDisplay.icon}
            label={statusDisplay.label}
            size={isMobile ? "small" : "medium"}
            color={statusDisplay.color}
            sx={{
              height: isMobile ? 24 : 32,
              fontSize: isMobile ? "11px" : "12px",
              backgroundColor: statusDisplay.bgColor,
              "& .MuiChip-icon": {
                fontSize: isMobile ? 14 : 16,
              },
            }}
          />

          {invitation.role && (
            <Chip
              label={invitation.role}
              size={isMobile ? "small" : "medium"}
              variant="outlined"
              sx={{
                height: isMobile ? 24 : 32,
                fontSize: isMobile ? "11px" : "12px",
              }}
            />
          )}

          {isExpired && (
            <Chip
              label="Expired"
              size={isMobile ? "small" : "medium"}
              color="error"
              sx={{
                height: isMobile ? 24 : 32,
                fontSize: isMobile ? "11px" : "12px",
              }}
            />
          )}
        </Box>

        {/* Time Information */}
        {!compact && (
          <Box sx={{ mb: 2 }}>
            {/* Time Remaining */}
            {timeRemaining && (
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0.5,
                  mb: 1,
                }}
              >
                <TimeIcon sx={{ fontSize: 16, color: "text.secondary" }} />
                <Typography
                  variant="caption"
                  color={isExpired ? "error.main" : "text.secondary"}
                  sx={{ fontSize: isMobile ? "11px" : "12px" }}
                >
                  {timeRemaining}
                </Typography>
              </Box>
            )}

            {/* Expiry Progress Bar */}
            {invitation.expiresAt && !isExpired && (
              <Box sx={{ mb: 1 }}>
                <LinearProgress
                  variant="determinate"
                  value={getExpiryProgress()}
                  color={getExpiryProgress() > 80 ? "error" : "primary"}
                  sx={{
                    height: 4,
                    borderRadius: 2,
                    backgroundColor: alpha(theme.palette.grey[500], 0.2),
                  }}
                />
              </Box>
            )}

            {/* Send Date */}
            {invitation.sentAt && (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ fontSize: isMobile ? "11px" : "12px" }}
              >
                Sent {new Date(invitation.sentAt).toLocaleDateString()}
              </Typography>
            )}
          </Box>
        )}

        {/* Message Preview */}
        {!compact && invitation.message && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              fontSize: isMobile ? "12px" : "14px",
              fontStyle: "italic",
              overflow: "hidden",
              textOverflow: "ellipsis",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
            }}
          >
            {`"${invitation.message}"`}
          </Typography>
        )}
      </CardContent>

      {/* Quick Actions */}
      {!compact && showActions && (isMobile || isTablet) && (
        <CardActions
          sx={{
            pt: 0,
            px: 2,
            pb: 2,
            justifyContent: "space-around",
          }}
        >
          {onResend && invitation.status === "pending" && (
            <Button
              size="small"
              startIcon={<ResendIcon fontSize="small" />}
              onClick={(e) => {
                e.stopPropagation();
                handleAction("resend");
              }}
              disabled={isLoading || isExpired}
              sx={{ minHeight: 36 }}
            >
              Resend
            </Button>
          )}

          {onCopyLink && (
            <Button
              size="small"
              startIcon={<CopyIcon fontSize="small" />}
              onClick={(e) => {
                e.stopPropagation();
                handleAction("copy");
              }}
              disabled={isLoading}
              sx={{ minHeight: 36 }}
            >
              Copy
            </Button>
          )}
        </CardActions>
      )}

      {/* Context Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={menuOpen}
        onClose={handleMenuClose}
        anchorOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
        sx={{
          "& .MuiPaper-root": {
            minWidth: 180,
          },
        }}
      >
        {onResend && invitation.status === "pending" && !isExpired && (
          <MenuItem onClick={() => handleAction("resend")}>
            <ListItemIcon>
              <ResendIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Resend Invitation</ListItemText>
          </MenuItem>
        )}

        {onCopyLink && (
          <MenuItem onClick={() => handleAction("copy")}>
            <ListItemIcon>
              <CopyIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Copy Link</ListItemText>
          </MenuItem>
        )}

        <MenuItem
          onClick={() => window.open(`mailto:${invitation.recipientEmail}`)}
        >
          <ListItemIcon>
            <EmailIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Send Email</ListItemText>
        </MenuItem>

        <Divider />

        {onDelete && (
          <MenuItem
            onClick={() => handleAction("delete")}
            sx={{ color: "error.main" }}
          >
            <ListItemIcon>
              <DeleteIcon fontSize="small" color="error" />
            </ListItemIcon>
            <ListItemText>Delete Invitation</ListItemText>
          </MenuItem>
        )}
      </Menu>
    </Card>
  );
};

// PropTypes validation
MobileInvitationCard.propTypes = {
  invitation: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    recipientEmail: PropTypes.string.isRequired,
    recipientName: PropTypes.string,
    status: PropTypes.oneOf(["pending", "accepted", "declined"]),
    role: PropTypes.string,
    message: PropTypes.string,
    sentAt: PropTypes.string,
    expiresAt: PropTypes.string,
    createdAt: PropTypes.string,
  }).isRequired,
  onResend: PropTypes.func,
  onDelete: PropTypes.func,
  onCopyLink: PropTypes.func,
  showActions: PropTypes.bool,
  compact: PropTypes.bool,
};

export default MobileInvitationCard;
