/**
 * Mobile Responsiveness Utilities
 * Provides responsive design patterns, mobile-first styling, and touch optimizations
 */

import { useTheme, useMediaQuery } from "@mui/material";
import { useState, useEffect, useCallback } from "react";
import type { Theme } from "@mui/material/styles";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type Breakpoint = "mobile" | "tablet" | "desktop";

interface TouchPoint {
  x: number;
  y: number;
}

interface TouchGestureOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  threshold?: number;
}

interface TouchGestureHandlers {
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchMove: (e: React.TouchEvent) => void;
  onTouchEnd: () => void;
}

interface ViewportSize {
  width: number;
  height: number;
}

interface TouchFriendlySize {
  minHeight: number;
  minWidth: number;
  padding: string;
}

interface ResponsiveSpacing {
  x: number;
  y: number;
}

interface ResponsiveImageSize {
  width: string;
  height: string;
  maxWidth: string;
}

interface MobileDialogProps {
  fullScreen: boolean;
  maxWidth: "xs" | "sm";
  PaperProps: {
    sx: Record<string, unknown>;
  };
}

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

/** Responsive breakpoints hook */
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
    breakpoint: (isMobile
      ? "mobile"
      : isTablet
        ? "tablet"
        : "desktop") as Breakpoint,
  };
};

/** Touch gesture detection hook */
export const useTouchGestures = (
  options: TouchGestureOptions = {},
): TouchGestureHandlers => {
  const {
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    threshold = 50,
  } = options;

  const [touchStart, setTouchStart] = useState<TouchPoint | null>(null);
  const [touchEnd, setTouchEnd] = useState<TouchPoint | null>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY,
    });
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
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

/** Viewport size hook with debouncing */
export const useViewport = (): ViewportSize => {
  const [viewport, setViewport] = useState<ViewportSize>({
    width: typeof window !== "undefined" ? window.innerWidth : 0,
    height: typeof window !== "undefined" ? window.innerHeight : 0,
  });

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;

    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setViewport({
          width: window.innerWidth,
          height: window.innerHeight,
        });
      }, 150);
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      clearTimeout(timeoutId);
    };
  }, []);

  return viewport;
};

/** Mobile-optimized dialog hook */
export const useMobileDialog = (): MobileDialogProps => {
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

/** Mobile navigation state hook */
export const useMobileNavigation = () => {
  const { isMobile } = useResponsive();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleMobileMenu = useCallback(() => {
    setMobileMenuOpen((prev) => !prev);
  }, []);

  const closeMobileMenu = useCallback(() => {
    setMobileMenuOpen(false);
  }, []);

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

// ---------------------------------------------------------------------------
// Table utilities
// ---------------------------------------------------------------------------

interface TableColumn {
  essential?: boolean;
  mobile?: boolean;
  tablet?: boolean;
  [key: string]: unknown;
}

export const useResponsiveTable = (columns: TableColumn[]) => {
  const { isMobile, isTablet } = useResponsive();

  const getVisibleColumns = useCallback((): TableColumn[] => {
    if (isMobile) {
      return columns.filter((col) => col.essential || col.mobile);
    }
    if (isTablet) {
      return columns.filter((col) => col.essential || col.tablet || col.mobile);
    }
    return columns;
  }, [columns, isMobile, isTablet]);

  const getTableLayout = useCallback((): "card" | "table" => {
    return isMobile ? "card" : "table";
  }, [isMobile]);

  return {
    visibleColumns: getVisibleColumns(),
    layout: getTableLayout(),
    showActions: !isMobile,
  };
};

// ---------------------------------------------------------------------------
// Form utilities
// ---------------------------------------------------------------------------

export const useMobileForm = () => {
  const { isMobile } = useResponsive();

  const getFormLayout = useCallback(
    () => ({
      spacing: isMobile ? 2 : 3,
      direction: "column" as const,
      fullWidth: true,
      size: (isMobile ? "small" : "medium") as "small" | "medium",
    }),
    [isMobile],
  );

  const getInputProps = useCallback(
    () => ({
      size: (isMobile ? "small" : "medium") as "small" | "medium",
      variant: "outlined" as const,
      fullWidth: true,
      sx: {
        "& .MuiInputBase-input": {
          fontSize: isMobile ? "16px" : "14px",
        },
      },
    }),
    [isMobile],
  );

  return {
    formLayout: getFormLayout(),
    inputProps: getInputProps(),
    isMobile,
  };
};

// ---------------------------------------------------------------------------
// Pure utility functions
// ---------------------------------------------------------------------------

/** Returns a font size string for the given breakpoint. */
export const getResponsiveFontSize = (
  breakpoint: Breakpoint,
  sizes: Partial<Record<Breakpoint, string>> = {},
): string => {
  const defaultSizes: Record<Breakpoint, string> = {
    mobile: "14px",
    tablet: "16px",
    desktop: "18px",
  };
  const fontSizes = { ...defaultSizes, ...sizes };
  return fontSizes[breakpoint] ?? fontSizes.desktop;
};

/** Returns a spacing object for the given breakpoint. */
export const getResponsiveSpacing = (
  breakpoint: Breakpoint,
  spacing: Partial<Record<Breakpoint, ResponsiveSpacing>> = {},
): ResponsiveSpacing => {
  const defaultSpacing: Record<Breakpoint, ResponsiveSpacing> = {
    mobile: { x: 16, y: 12 },
    tablet: { x: 24, y: 16 },
    desktop: { x: 32, y: 24 },
  };
  const spacingValues = { ...defaultSpacing, ...spacing };
  return spacingValues[breakpoint] ?? spacingValues.desktop;
};

/** Returns min-height/min-width/padding for a touch-friendly button. */
export const getTouchFriendlySize = (
  size: "small" | "medium" | "large" = "medium",
): TouchFriendlySize => {
  const sizes: Record<"small" | "medium" | "large", TouchFriendlySize> = {
    small: { minHeight: 44, minWidth: 44, padding: "8px 12px" },
    medium: { minHeight: 48, minWidth: 48, padding: "12px 16px" },
    large: { minHeight: 56, minWidth: 56, padding: "16px 24px" },
  };
  return sizes[size];
};

/** Returns the number of grid columns for the given breakpoint. */
export const getResponsiveColumns = (
  breakpoint: Breakpoint | "largeScreen",
  columns: Partial<Record<Breakpoint | "largeScreen", number>> = {},
): number => {
  const defaultColumns: Record<Breakpoint | "largeScreen", number> = {
    mobile: 1,
    tablet: 2,
    desktop: 3,
    largeScreen: 4,
  };
  const columnConfig = { ...defaultColumns, ...columns };
  return columnConfig[breakpoint] ?? columnConfig.desktop;
};

/** Converts a breakpoint-keyed styles map into MUI `sx` media query keys. */
export const createResponsiveStyles = (
  theme: Theme,
  styles: Partial<Record<Breakpoint, Record<string, unknown>>>,
): Record<string, unknown> => {
  const responsiveStyles: Record<string, unknown> = {};

  (Object.keys(styles) as Breakpoint[]).forEach((breakpoint) => {
    if (breakpoint === "mobile") {
      responsiveStyles[theme.breakpoints.down("sm")] = styles[breakpoint];
    } else if (breakpoint === "tablet") {
      responsiveStyles[theme.breakpoints.between("sm", "md")] =
        styles[breakpoint];
    } else if (breakpoint === "desktop") {
      responsiveStyles[theme.breakpoints.up("md")] = styles[breakpoint];
    }
  });

  return responsiveStyles;
};

/** CSS env() safe-area padding object for iPhone X+. */
export const getSafeAreaPadding = () => ({
  paddingTop: "env(safe-area-inset-top)",
  paddingBottom: "env(safe-area-inset-bottom)",
  paddingLeft: "env(safe-area-inset-left)",
  paddingRight: "env(safe-area-inset-right)",
});

/** Returns image sizing styles for the given breakpoint. */
export const getResponsiveImageSize = (
  breakpoint: Breakpoint,
  sizes: Partial<Record<Breakpoint, ResponsiveImageSize>> = {},
): ResponsiveImageSize => {
  const defaultSizes: Record<Breakpoint, ResponsiveImageSize> = {
    mobile: { width: "100%", height: "auto", maxWidth: "100%" },
    tablet: { width: "auto", height: "auto", maxWidth: "600px" },
    desktop: { width: "auto", height: "auto", maxWidth: "800px" },
  };
  const imageSizes = { ...defaultSizes, ...sizes };
  return imageSizes[breakpoint] ?? imageSizes.desktop;
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
