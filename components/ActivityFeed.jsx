/**
 * Real-time Activity Tracker
 * Live activity feed with real-time updates
 */

import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Avatar,
  Chip,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Button,
  IconButton,
  Collapse,
  Divider,
  useTheme,
  alpha,
} from "@mui/material";
import {
  Person as PersonIcon,
  Group as GroupIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Send as SendIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  AccessTime as TimeIcon,
} from "@mui/icons-material";
import { formatDistanceToNow } from "date-fns";
import webSocketClient from "../services/webSocketClient";

const ActivityIcon = ({ type, action, size = "medium" }) => {
  const getIcon = () => {
    if (type === "member") {
      switch (action) {
        case "created":
          return <AddIcon fontSize={size} />;
        case "updated":
          return <EditIcon fontSize={size} />;
        case "deleted":
          return <DeleteIcon fontSize={size} />;
        default:
          return <PersonIcon fontSize={size} />;
      }
    }

    if (type === "invitation") {
      switch (action) {
        case "sent":
          return <SendIcon fontSize={size} />;
        case "accepted":
          return <CheckIcon fontSize={size} />;
        case "declined":
          return <CloseIcon fontSize={size} />;
        default:
          return <GroupIcon fontSize={size} />;
      }
    }

    return <PersonIcon fontSize={size} />;
  };

  const getColor = () => {
    switch (action) {
      case "created":
      case "sent":
      case "accepted":
        return "success";
      case "updated":
        return "info";
      case "deleted":
      case "declined":
        return "error";
      default:
        return "default";
    }
  };

  return (
    <Avatar
      sx={{
        bgcolor: `${getColor()}.main`,
        width: 32,
        height: 32,
      }}
    >
      {getIcon()}
    </Avatar>
  );
};

const ActivityItem = ({ activity, expanded, onToggle, showDetails = true }) => {
  const theme = useTheme();
  const { type, action, timestamp, user, target, metadata = {} } = activity;

  const getActivityDescription = () => {
    const userName = user?.name || "Someone";
    const targetName = target?.name || target?.email || "unknown";

    if (type === "member") {
      switch (action) {
        case "created":
          return `${userName} added member ${targetName}`;
        case "updated":
          return `${userName} updated member ${targetName}`;
        case "deleted":
          return `${userName} removed member ${targetName}`;
        default:
          return `${userName} performed ${action} on ${targetName}`;
      }
    }

    if (type === "invitation") {
      switch (action) {
        case "sent":
          return `${userName} sent invitation to ${targetName}`;
        case "accepted":
          return `${targetName} accepted invitation`;
        case "declined":
          return `${targetName} declined invitation`;
        default:
          return `${userName} ${action} invitation for ${targetName}`;
      }
    }

    return `${userName} performed ${action}`;
  };

  const getMetadataChips = () => {
    const chips = [];

    if (metadata.role) {
      chips.push(
        <Chip
          key="role"
          label={metadata.role}
          size="small"
          variant="outlined"
          sx={{ mr: 0.5, mb: 0.5 }}
        />
      );
    }

    if (metadata.changes) {
      Object.keys(metadata.changes).forEach((field) => {
        chips.push(
          <Chip
            key={field}
            label={`${field} changed`}
            size="small"
            color="info"
            variant="outlined"
            sx={{ mr: 0.5, mb: 0.5 }}
          />
        );
      });
    }

    return chips;
  };

  return (
    <Card
      sx={{
        mb: 1,
        transition: "all 0.2s",
        "&:hover": {
          boxShadow: theme.shadows[4],
          bgcolor: alpha(theme.palette.primary.main, 0.02),
        },
      }}
    >
      <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
        <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2 }}>
          <ActivityIcon type={type} action={action} />

          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                mb: 1,
              }}
            >
              <Typography variant="body2" sx={{ flex: 1, mr: 1 }}>
                {getActivityDescription()}
              </Typography>

              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Typography variant="caption" color="textSecondary">
                  {formatDistanceToNow(new Date(timestamp), {
                    addSuffix: true,
                  })}
                </Typography>

                {showDetails && Object.keys(metadata).length > 0 && (
                  <IconButton size="small" onClick={onToggle} sx={{ ml: 1 }}>
                    {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                  </IconButton>
                )}
              </Box>
            </Box>

            {getMetadataChips().length > 0 && (
              <Box sx={{ mb: 1 }}>{getMetadataChips()}</Box>
            )}

            {showDetails && (
              <Collapse in={expanded}>
                <Box
                  sx={{
                    mt: 2,
                    p: 2,
                    bgcolor: alpha(theme.palette.grey[500], 0.05),
                    borderRadius: 1,
                  }}
                >
                  <Typography variant="subtitle2" gutterBottom>
                    Activity Details
                  </Typography>

                  {user && (
                    <Box sx={{ mb: 1 }}>
                      <Typography variant="caption" color="textSecondary">
                        Performed by: {user.name} ({user.role})
                      </Typography>
                    </Box>
                  )}

                  {target && (
                    <Box sx={{ mb: 1 }}>
                      <Typography variant="caption" color="textSecondary">
                        Target: {target.name || target.email}
                      </Typography>
                    </Box>
                  )}

                  {metadata.changes && (
                    <Box sx={{ mb: 1 }}>
                      <Typography
                        variant="caption"
                        color="textSecondary"
                        gutterBottom
                      >
                        Changes made:
                      </Typography>
                      {Object.entries(metadata.changes).map(
                        ([field, change]) => (
                          <Box key={field} sx={{ ml: 1 }}>
                            <Typography variant="caption" color="textSecondary">
                              • {field}: {change.from} → {change.to}
                            </Typography>
                          </Box>
                        )
                      )}
                    </Box>
                  )}

                  <Typography variant="caption" color="textSecondary">
                    Timestamp: {new Date(timestamp).toLocaleString()}
                  </Typography>
                </Box>
              </Collapse>
            )}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export const ActivityFeed = ({
  maxItems = 50,
  showHeader = true,
  compact = false,
}) => {
  const [activities, setActivities] = useState([]);
  const [expandedItems, setExpandedItems] = useState(new Set());
  const [filter, setFilter] = useState("all"); // all, member, invitation
  const theme = useTheme();

  useEffect(() => {
    // Listen for real-time activity updates
    const handleMemberActivity = (data) => {
      const activity = {
        id: `member_${data.action}_${Date.now()}`,
        type: "member",
        action: data.action,
        timestamp: data.timestamp,
        user: { id: data.updatedBy, name: "User", role: "member" }, // Would be populated from user data
        target: data.member,
        metadata: data.metadata || {},
      };

      setActivities((prev) => [activity, ...prev].slice(0, maxItems));
    };

    const handleInvitationActivity = (data) => {
      const activity = {
        id: `invitation_${data.action}_${Date.now()}`,
        type: "invitation",
        action: data.action,
        timestamp: data.timestamp,
        user: { id: data.updatedBy, name: "User", role: "member" }, // Would be populated from user data
        target: data.invitation,
        metadata: data.metadata || {},
      };

      setActivities((prev) => [activity, ...prev].slice(0, maxItems));
    };

    // Register WebSocket event listeners
    webSocketClient.on("member:created", (data) =>
      handleMemberActivity({ ...data, action: "created" })
    );
    webSocketClient.on("member:updated", (data) =>
      handleMemberActivity({ ...data, action: "updated" })
    );
    webSocketClient.on("member:deleted", (data) =>
      handleMemberActivity({ ...data, action: "deleted" })
    );
    webSocketClient.on("invitation:sent", (data) =>
      handleInvitationActivity({ ...data, action: "sent" })
    );
    webSocketClient.on("invitation:accepted", (data) =>
      handleInvitationActivity({ ...data, action: "accepted" })
    );
    webSocketClient.on("invitation:declined", (data) =>
      handleInvitationActivity({ ...data, action: "declined" })
    );

    return () => {
      // Cleanup listeners
      webSocketClient.off("member:created", handleMemberActivity);
      webSocketClient.off("member:updated", handleMemberActivity);
      webSocketClient.off("member:deleted", handleMemberActivity);
      webSocketClient.off("invitation:sent", handleInvitationActivity);
      webSocketClient.off("invitation:accepted", handleInvitationActivity);
      webSocketClient.off("invitation:declined", handleInvitationActivity);
    };
  }, [maxItems]);

  const toggleExpanded = (activityId) => {
    setExpandedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(activityId)) {
        newSet.delete(activityId);
      } else {
        newSet.add(activityId);
      }
      return newSet;
    });
  };

  const filteredActivities = activities.filter(
    (activity) => filter === "all" || activity.type === filter
  );

  const clearAll = () => {
    setActivities([]);
    setExpandedItems(new Set());
  };

  if (compact) {
    return (
      <List sx={{ p: 0 }}>
        {filteredActivities.slice(0, 5).map((activity) => (
          <ListItem key={activity.id} sx={{ px: 2, py: 1 }}>
            <ListItemAvatar>
              <ActivityIcon
                type={activity.type}
                action={activity.action}
                size="small"
              />
            </ListItemAvatar>
            <ListItemText
              primary={
                <Typography variant="body2" noWrap>
                  {activity.type === "member"
                    ? `Member ${activity.action}`
                    : `Invitation ${activity.action}`}
                </Typography>
              }
              secondary={
                <Typography variant="caption" color="textSecondary">
                  {formatDistanceToNow(new Date(activity.timestamp), {
                    addSuffix: true,
                  })}
                </Typography>
              }
            />
          </ListItem>
        ))}
      </List>
    );
  }

  return (
    <Box>
      {showHeader && (
        <Box
          sx={{
            mb: 3,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 2,
          }}
        >
          <Typography
            variant="h5"
            component="h2"
            sx={{ display: "flex", alignItems: "center", gap: 1 }}
          >
            <TimeIcon />
            Recent Activity
            {activities.length > 0 && (
              <Chip
                label={`${activities.length} activities`}
                size="small"
                color="primary"
                variant="outlined"
              />
            )}
          </Typography>

          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            {["all", "member", "invitation"].map((filterType) => (
              <Chip
                key={filterType}
                label={filterType.charAt(0).toUpperCase() + filterType.slice(1)}
                onClick={() => setFilter(filterType)}
                color={filter === filterType ? "primary" : "default"}
                variant={filter === filterType ? "filled" : "outlined"}
                size="small"
              />
            ))}

            {activities.length > 0 && (
              <Button
                size="small"
                onClick={clearAll}
                variant="outlined"
                color="secondary"
              >
                Clear All
              </Button>
            )}
          </Box>
        </Box>
      )}

      {filteredActivities.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: "center", py: 4 }}>
            <TimeIcon sx={{ fontSize: 48, color: "grey.400", mb: 1 }} />
            <Typography variant="h6" color="textSecondary" gutterBottom>
              No activity yet
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Member and invitation activities will appear here in real-time.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Box>
          {filteredActivities.map((activity) => (
            <ActivityItem
              key={activity.id}
              activity={activity}
              expanded={expandedItems.has(activity.id)}
              onToggle={() => toggleExpanded(activity.id)}
              showDetails={!compact}
            />
          ))}
        </Box>
      )}
    </Box>
  );
};

export const ActivitySummary = ({ timeRange = "24h" }) => {
  const [summary, setSummary] = useState({
    total: 0,
    byType: {},
    byAction: {},
    trends: [],
  });

  useEffect(() => {
    // This would typically fetch activity summary from API
    // For now, we'll simulate with WebSocket data
    const updateSummary = () => {
      // Mock summary data
      setSummary({
        total: 15,
        byType: {
          member: 8,
          invitation: 7,
        },
        byAction: {
          created: 5,
          updated: 6,
          sent: 3,
          accepted: 1,
        },
        trends: [
          { hour: "12:00", count: 3 },
          { hour: "13:00", count: 5 },
          { hour: "14:00", count: 2 },
          { hour: "15:00", count: 5 },
        ],
      });
    };

    updateSummary();
    const interval = setInterval(updateSummary, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [timeRange]);

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Activity Summary ({timeRange})
        </Typography>

        <Box sx={{ display: "flex", gap: 2, mb: 2, flexWrap: "wrap" }}>
          <Chip
            label={`${summary.total} Total`}
            color="primary"
            variant="outlined"
          />
          <Chip
            label={`${summary.byType.member || 0} Members`}
            color="info"
            variant="outlined"
          />
          <Chip
            label={`${summary.byType.invitation || 0} Invitations`}
            color="success"
            variant="outlined"
          />
        </Box>

        <Divider sx={{ my: 2 }} />

        <Typography variant="subtitle2" gutterBottom>
          Activity Breakdown
        </Typography>
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
          {Object.entries(summary.byAction).map(([action, count]) => (
            <Chip
              key={action}
              label={`${count} ${action}`}
              size="small"
              variant="outlined"
            />
          ))}
        </Box>
      </CardContent>
    </Card>
  );
};

export default ActivityFeed;
