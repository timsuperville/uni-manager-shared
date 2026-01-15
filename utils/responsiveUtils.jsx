/**
 * Mobile Responsiveness Utilities
 * Provides responsive design patterns, mobile-first styling, and touch optimizations
 */

import { useTheme, useMediaQuery } from "@mui/material";
import { useState, useEffect, useCallback } from "react";

/**
 * Responsive breakpoints hook
 */
export const useResponsive = () => {
  const theme = useTheme();

  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isTablet = useMediaQuery(theme.breakpoints.between("sm", "md"));
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));
  const isLargeScreen = useMediaQuery(theme.breakpoints.up("lg"));

  return {
    isMobile,
    isTablet,
    isDesktop,
    isLargeScreen,
    breakpoint: isMobile ? "mobile" : isTablet ? "tablet" : "desktop",
  };
};

/**
 * Touch gesture detection hook
 */
export const useTouchGestures = (options = {}) => {
  const {
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    threshold = 50,
  } = options;

  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);

  const handleTouchStart = useCallback((e) => {
    setTouchEnd(null);
    setTouchStart({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY,
    });
  }, []);

  const handleTouchMove = useCallback((e) => {
    setTouchEnd({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY,
    });
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (!touchStart || !touchEnd) return;

    const distanceX = touchStart.x - touchEnd.x;
    const distanceY = touchStart.y - touchEnd.y;
    const isLeftSwipe = distanceX > threshold;
    const isRightSwipe = distanceX < -threshold;
    const isUpSwipe = distanceY > threshold;
    const isDownSwipe = distanceY < -threshold;

    if (isLeftSwipe && onSwipeLeft) onSwipeLeft();
    if (isRightSwipe && onSwipeRight) onSwipeRight();
    if (isUpSwipe && onSwipeUp) onSwipeUp();
    if (isDownSwipe && onSwipeDown) onSwipeDown();
  }, [
    touchStart,
    touchEnd,
    threshold,
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
  ]);

  return {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
  };
};

/**
 * Viewport size hook with debouncing
 */
export const useViewport = () => {
  const [viewport, setViewport] = useState({
    width:
      typeof window !== "undefined"
        ? typeof window !== "undefined" && window.innerWidth
        : 0,
    height:
      typeof window !== "undefined"
        ? typeof window !== "undefined" && window.innerHeight
        : 0,
  });

  useEffect(() => {
    let timeoutId;

    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setViewport({
          width: typeof window !== "undefined" && window.innerWidth,
          height: typeof window !== "undefined" && window.innerHeight,
        });
      }, 150);
    };

    typeof window !== "undefined" &&
      window.addEventListener("resize", handleResize);
    return () => {
      typeof window !== "undefined" &&
        window.removeEventListener("resize", handleResize);
      clearTimeout(timeoutId);
    };
  }, []);

  return viewport;
};

/**
 * Responsive font size calculator
 */
export const getResponsiveFontSize = (breakpoint, sizes = {}) => {
  const defaultSizes = {
    mobile: "14px",
    tablet: "16px",
    desktop: "18px",
  };

  const fontSizes = { ...defaultSizes, ...sizes };
  return fontSizes[breakpoint] || fontSizes.desktop;
};

/**
 * Responsive spacing calculator
 */
export const getResponsiveSpacing = (breakpoint, spacing = {}) => {
  const defaultSpacing = {
    mobile: { x: 16, y: 12 },
    tablet: { x: 24, y: 16 },
    desktop: { x: 32, y: 24 },
  };

  const spacingValues = { ...defaultSpacing, ...spacing };
  return spacingValues[breakpoint] || spacingValues.desktop;
};

/**
 * Mobile-optimized dialog hook
 */
export const useMobileDialog = () => {
  const { isMobile } = useResponsive();

  return {
    fullScreen: isMobile,
    maxWidth: isMobile ? "xs" : "sm",
    PaperProps: {
      sx: {
        ...(isMobile && {
          margin: 0,
          width: "100%",
          height: "100%",
          maxHeight: "100%",
          borderRadius: 0,
        }),
      },
    },
  };
};

/**
 * Touch-friendly button sizing
 */
export const getTouchFriendlySize = (size = "medium") => {
  const sizes = {
    small: { minHeight: 44, minWidth: 44, padding: "8px 12px" },
    medium: { minHeight: 48, minWidth: 48, padding: "12px 16px" },
    large: { minHeight: 56, minWidth: 56, padding: "16px 24px" },
  };

  return sizes[size] || sizes.medium;
};

/**
 * Responsive grid columns calculator
 */
export const getResponsiveColumns = (breakpoint, columns = {}) => {
  const defaultColumns = {
    mobile: 1,
    tablet: 2,
    desktop: 3,
    largeScreen: 4,
  };

  const columnConfig = { ...defaultColumns, ...columns };
  return columnConfig[breakpoint] || columnConfig.desktop;
};

/**
 * Mobile navigation patterns
 */
export const useMobileNavigation = () => {
  const { isMobile } = useResponsive();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleMobileMenu = useCallback(() => {
    setMobileMenuOpen((prev) => !prev);
  }, []);

  const closeMobileMenu = useCallback(() => {
    setMobileMenuOpen(false);
  }, []);

  // Close menu on route change or outside click
  useEffect(() => {
    if (!isMobile) {
      setMobileMenuOpen(false);
    }
  }, [isMobile]);

  return {
    isMobile,
    mobileMenuOpen,
    toggleMobileMenu,
    closeMobileMenu,
  };
};

/**
 * Responsive table patterns
 */
export const useResponsiveTable = (columns) => {
  const { isMobile, isTablet } = useResponsive();

  const getVisibleColumns = useCallback(() => {
    if (isMobile) {
      // Show only essential columns on mobile
      return columns.filter((col) => col.essential || col.mobile);
    }
    if (isTablet) {
      // Show important columns on tablet
      return columns.filter((col) => col.essential || col.tablet || col.mobile);
    }
    // Show all columns on desktop
    return columns;
  }, [columns, isMobile, isTablet]);

  const getTableLayout = useCallback(() => {
    if (isMobile) {
      return "card"; // Use card layout for mobile
    }
    return "table"; // Use standard table layout
  }, [isMobile]);

  return {
    visibleColumns: getVisibleColumns(),
    layout: getTableLayout(),
    showActions: !isMobile, // Hide action buttons on mobile, use swipe instead
  };
};

/**
 * Mobile-optimized form layouts
 */
export const useMobileForm = () => {
  const { isMobile } = useResponsive();

  const getFormLayout = useCallback(() => {
    return {
      spacing: isMobile ? 2 : 3,
      direction: "column",
      fullWidth: true,
      size: isMobile ? "small" : "medium",
    };
  }, [isMobile]);

  const getInputProps = useCallback(() => {
    return {
      size: isMobile ? "small" : "medium",
      variant: "outlined",
      fullWidth: true,
      sx: {
        "& .MuiInputBase-input": {
          fontSize: isMobile ? "16px" : "14px", // Prevent zoom on iOS
        },
      },
    };
  }, [isMobile]);

  return {
    formLayout: getFormLayout(),
    inputProps: getInputProps(),
    isMobile,
  };
};

/**
 * CSS-in-JS responsive styles helper
 */
export const createResponsiveStyles = (theme, styles) => {
  const responsiveStyles = {};

  Object.keys(styles).forEach((breakpoint) => {
    if (breakpoint === "mobile") {
      responsiveStyles[theme.breakpoints.down("sm")] = styles[breakpoint];
    } else if (breakpoint === "tablet") {
      responsiveStyles[theme.breakpoints.between("sm", "md")] =
        styles[breakpoint];
    } else if (breakpoint === "desktop") {
      responsiveStyles[theme.breakpoints.up("md")] = styles[breakpoint];
    } else {
      responsiveStyles[breakpoint] = styles[breakpoint];
    }
  });

  return responsiveStyles;
};

/**
 * Safe area padding for mobile devices (iPhone X+)
 */
export const getSafeAreaPadding = () => {
  return {
    paddingTop: "env(safe-area-inset-top)",
    paddingBottom: "env(safe-area-inset-bottom)",
    paddingLeft: "env(safe-area-inset-left)",
    paddingRight: "env(safe-area-inset-right)",
  };
};

/**
 * Responsive image sizing
 */
export const getResponsiveImageSize = (breakpoint, sizes = {}) => {
  const defaultSizes = {
    mobile: { width: "100%", height: "auto", maxWidth: "100%" },
    tablet: { width: "auto", height: "auto", maxWidth: "600px" },
    desktop: { width: "auto", height: "auto", maxWidth: "800px" },
  };

  const imageSizes = { ...defaultSizes, ...sizes };
  return imageSizes[breakpoint] || imageSizes.desktop;
};

export default {
  useResponsive,
  useTouchGestures,
  useViewport,
  getResponsiveFontSize,
  getResponsiveSpacing,
  useMobileDialog,
  getTouchFriendlySize,
  getResponsiveColumns,
  useMobileNavigation,
  useResponsiveTable,
  useMobileForm,
  createResponsiveStyles,
  getSafeAreaPadding,
  getResponsiveImageSize,
};
