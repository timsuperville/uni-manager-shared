/**
 * Mobile-Optimized Layout Component
 * Provides responsive layout with mobile-first design patterns
 */

import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Divider,
  useTheme,
  Container,
  Fab,
  BottomNavigation,
  BottomNavigationAction,
  Paper,
  SwipeableDrawer,
} from "@mui/material";
import {
  Menu as MenuIcon,
  Home as HomeIcon,
  People as PeopleIcon,
  Settings as SettingsIcon,
  Notifications as NotificationsIcon,
  Add as AddIcon,
  Dashboard as DashboardIcon,
  Mail as MailIcon,
} from "@mui/icons-material";
import {
  useResponsive,
  useMobileNavigation,
  useTouchGestures,
  getSafeAreaPadding,
} from "../utils/responsiveUtils";

const MobileOptimizedLayout = ({
  children,
  title = "Household Manager",
  navigation = [],
  bottomNavigation = [],
  onQuickAction,
  showBottomNav = true,
  showFab = true,
}) => {
  const theme = useTheme();
  const { isMobile, isTablet } = useResponsive();
  const { mobileMenuOpen, toggleMobileMenu, closeMobileMenu } =
    useMobileNavigation();
  const [bottomNavValue, setBottomNavValue] = useState(0);

  // Default navigation items
  const defaultNavigation = [
    { label: "Dashboard", icon: <DashboardIcon />, path: "/dashboard" },
    { label: "Members", icon: <PeopleIcon />, path: "/members" },
    { label: "Invitations", icon: <MailIcon />, path: "/invitations" },
    { label: "Settings", icon: <SettingsIcon />, path: "/settings" },
  ];

  const defaultBottomNav = [
    { label: "Home", icon: <HomeIcon />, value: "home" },
    { label: "Members", icon: <PeopleIcon />, value: "members" },
    { label: "Messages", icon: <MailIcon />, value: "messages" },
    { label: "Settings", icon: <SettingsIcon />, value: "settings" },
  ];

  const navItems = navigation.length > 0 ? navigation : defaultNavigation;
  const bottomNavItems =
    bottomNavigation.length > 0 ? bottomNavigation : defaultBottomNav;

  // Touch gestures for mobile navigation
  const touchGestures = useTouchGestures({
    onSwipeRight: () => {
      if (isMobile && !mobileMenuOpen) {
        toggleMobileMenu();
      }
    },
    onSwipeLeft: () => {
      if (isMobile && mobileMenuOpen) {
        closeMobileMenu();
      }
    },
  });

  // Handle bottom navigation change
  const handleBottomNavChange = (event, newValue) => {
    setBottomNavValue(newValue);
    // Handle navigation logic here
  };

  // Close menu on orientation change
  useEffect(() => {
    const handleOrientationChange = () => {
      if (mobileMenuOpen) {
        closeMobileMenu();
      }
    };

    typeof window !== "undefined" &&
      window.addEventListener("orientationchange", handleOrientationChange);
    return () =>
      typeof window !== "undefined" &&
      window.removeEventListener("orientationchange", handleOrientationChange);
  }, [mobileMenuOpen, closeMobileMenu]);

  // Drawer content
  const DrawerContent = () => (
    <Box sx={{ width: isMobile ? 280 : 320 }}>
      <Box
        sx={{ p: 2, bgcolor: "primary.main", color: "primary.contrastText" }}
      >
        <Typography variant="h6" component="div">
          {title}
        </Typography>
        <Typography variant="body2" sx={{ opacity: 0.8 }}>
          Household Management
        </Typography>
      </Box>

      <List>
        {navItems.map((item) => (
          <ListItem key={item.label} disablePadding>
            <ListItemButton
              onClick={() => {
                // Handle navigation
                if (item.onClick) item.onClick();
                if (isMobile) closeMobileMenu();
              }}
              sx={{
                minHeight: 48,
                px: 2.5,
                py: 1.5,
              }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
              <ListItemText
                primary={item.label}
                primaryTypographyProps={{
                  fontSize: isMobile ? "14px" : "16px",
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      <Divider />

      {/* Additional menu items */}
      <List>
        <ListItem disablePadding>
          <ListItemButton>
            <ListItemIcon>
              <NotificationsIcon />
            </ListItemIcon>
            <ListItemText primary="Notifications" />
          </ListItemButton>
        </ListItem>
      </List>
    </Box>
  );

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        ...getSafeAreaPadding(),
      }}
      {...touchGestures}
    >
      {/* App Bar */}
      <AppBar
        position="fixed"
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 1,
          backgroundColor: theme.palette.primary.main,
        }}
      >
        <Toolbar>
          {(isMobile || isTablet) && (
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={toggleMobileMenu}
              sx={{
                mr: 2,
                minWidth: 44,
                minHeight: 44,
              }}
            >
              <MenuIcon />
            </IconButton>
          )}

          <Typography
            variant="h6"
            noWrap
            component="div"
            sx={{
              flexGrow: 1,
              fontSize: isMobile ? "18px" : "20px",
            }}
          >
            {title}
          </Typography>

          <IconButton
            color="inherit"
            sx={{
              minWidth: 44,
              minHeight: 44,
            }}
          >
            <NotificationsIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* Navigation Drawer */}
      {isMobile ? (
        <SwipeableDrawer
          anchor="left"
          open={mobileMenuOpen}
          onClose={closeMobileMenu}
          onOpen={toggleMobileMenu}
          swipeAreaWidth={20}
          disableSwipeToOpen={false}
          ModalProps={{
            keepMounted: true, // Better mobile performance
          }}
          sx={{
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: 280,
            },
          }}
        >
          <DrawerContent />
        </SwipeableDrawer>
      ) : (
        <Drawer
          variant="persistent"
          anchor="left"
          open={mobileMenuOpen}
          sx={{
            width: 320,
            flexShrink: 0,
            "& .MuiDrawer-paper": {
              width: 320,
              boxSizing: "border-box",
            },
          }}
        >
          <DrawerContent />
        </Drawer>
      )}

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          marginTop: "64px", // AppBar height
          marginBottom: isMobile && showBottomNav ? "56px" : 0,
          transition: theme.transitions.create(["margin"], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
          ...(!isMobile &&
            mobileMenuOpen && {
              marginLeft: "320px",
              transition: theme.transitions.create(["margin"], {
                easing: theme.transitions.easing.easeOut,
                duration: theme.transitions.duration.enteringScreen,
              }),
            }),
        }}
      >
        <Container
          maxWidth={false}
          sx={{
            px: isMobile ? 1 : 3,
            py: isMobile ? 1 : 2,
            maxWidth: isMobile ? "100%" : "1200px",
          }}
        >
          {children}
        </Container>
      </Box>

      {/* Floating Action Button */}
      {isMobile && showFab && (
        <Fab
          color="primary"
          aria-label="add"
          onClick={onQuickAction}
          sx={{
            position: "fixed",
            bottom: showBottomNav ? 72 : 16,
            right: 16,
            zIndex: 1000,
          }}
        >
          <AddIcon />
        </Fab>
      )}

      {/* Bottom Navigation */}
      {isMobile && showBottomNav && (
        <Paper
          sx={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 1000,
            paddingBottom: "env(safe-area-inset-bottom)",
          }}
          elevation={3}
        >
          <BottomNavigation
            value={bottomNavValue}
            onChange={handleBottomNavChange}
            showLabels
            sx={{
              "& .MuiBottomNavigationAction-root": {
                minWidth: 0,
                padding: "6px 0 8px",
                "& .MuiBottomNavigationAction-label": {
                  fontSize: "12px",
                  "&.Mui-selected": {
                    fontSize: "12px",
                  },
                },
              },
            }}
          >
            {bottomNavItems.map((item) => (
              <BottomNavigationAction
                key={item.value}
                label={item.label}
                value={item.value}
                icon={item.icon}
              />
            ))}
          </BottomNavigation>
        </Paper>
      )}
    </Box>
  );
};

// PropTypes validation
MobileOptimizedLayout.propTypes = {
  children: PropTypes.node.isRequired,
  title: PropTypes.string,
  navigation: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      icon: PropTypes.node.isRequired,
      path: PropTypes.string,
      onClick: PropTypes.func,
    }),
  ),
  bottomNavigation: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      icon: PropTypes.node.isRequired,
      value: PropTypes.string.isRequired,
    }),
  ),
  onQuickAction: PropTypes.func,
  showBottomNav: PropTypes.bool,
  showFab: PropTypes.bool,
};

export default MobileOptimizedLayout;
