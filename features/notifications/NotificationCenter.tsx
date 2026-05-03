/**
 * NotificationCenter.tsx
 *
 * Shared notification panel — app-agnostic UI layer.
 * All data comes from `useNotifications`, which delegates
 * to the `NotificationAdapter` provided by the nearest
 * `<NotificationProvider>`.  This component has zero knowledge
 * of backend URLs, scope keys, or HTTP verbs.
 *
 * Features
 * ─────────
 * • Tabbed filter  — All / Unread (n) / Church / System
 * • Date-grouped list — Today / Yesterday / This Week / Older
 * • Per-row quick actions — mark read, archive, delete (on hover)
 * • Bulk actions — select-all, mark read, archive, delete
 * • Keyboard navigation — ↑ ↓ Enter  R (read)  D (delete)
 * • 30 s auto-refresh while the panel is open
 * • Toast feedback on every mutating action
 * • Popover or side-drawer positioning
 */
import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  type KeyboardEvent,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  FiBell,
  FiSettings,
  FiCheck,
  FiTrash2,
  FiX,
  FiRefreshCw,
  FiClock,
  FiUser,
  FiMail,
  FiMessageSquare,
  FiAlertCircle,
  FiArchive,
} from "react-icons/fi";
import {
  formatDistanceToNow,
  isToday,
  isYesterday,
  isThisWeek,
} from "date-fns";
import { useNotifications } from "../../hooks/useNotifications";
import type { AppNotification } from "./NotificationAdapter";
import {
  LoadingSpinner,
  Button,
  Badge,
  SearchInput,
  Pagination,
} from "@shared/components/ui";
import { NotificationModal } from "./NotificationModal";
import NotificationToast from "./NotificationToast";
import { NotificationPreferences } from "./NotificationPreferences";
import { glassBorder } from "@shared/styles/styleUtils";

// ── Constants ──────────────────────────────────────────────────────────────────

const OPEN_POLL_MS = 30_000;

const PRIORITY_ORDER: Record<string, number> = {
  urgent: 4,
  high: 3,
  normal: 2,
  low: 1,
};

const TYPE_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  user: FiUser,
  system: FiSettings,
  church: FiMessageSquare,
  work: FiMail,
  security: FiAlertCircle,
};

const PRIORITY_BADGE: Record<string, { color: string; label: string }> = {
  urgent: { color: "red", label: "Urgent" },
  high: { color: "orange", label: "High" },
  normal: { color: "blue", label: "Normal" },
  low: { color: "gray", label: "Low" },
};

// ── Types ──────────────────────────────────────────────────────────────────────

type TabFilter = "all" | "unread" | "church" | "system";
type SortField = "date" | "priority" | "type";
type SortOrder = "asc" | "desc";
type BulkAction = "markRead" | "archive" | "delete";
type PanelPosition = "right" | "left" | "popover";

interface ToastConfig {
  type: "success" | "error" | "info" | "warning";
  title: string;
  message: string;
  duration?: number;
}

export interface DropdownCoords {
  top: number;
  left: number;
  opensUpward: boolean;
}

export interface NotificationCenterProps {
  className?: string;
  isOpen?: boolean;
  onClose?: () => void;
  position?: PanelPosition;
  dropdownCoords?: DropdownCoords | null;
  panelRef?: React.Ref<HTMLDivElement>;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function dateGroup(date: Date): string {
  if (isToday(date)) return "Today";
  if (isYesterday(date)) return "Yesterday";
  if (isThisWeek(date)) return "This Week";
  return "Older";
}

function notifId(n: AppNotification): string {
  return n.id;
}

function notifTitle(n: AppNotification): string {
  return n.subject ?? n.title ?? "No subject";
}

function notifBody(n: AppNotification): string {
  return n.body ?? n.content ?? n.message ?? "";
}

function notifDate(n: AppNotification): Date {
  return new Date(n.createdAt ?? n.timestamp ?? Date.now());
}

// ── Component ──────────────────────────────────────────────────────────────────

const NotificationCenter: React.FC<NotificationCenterProps> = ({
  className = "",
  isOpen = false,
  onClose = () => {},
  position = "right",
  dropdownCoords = null,
  panelRef,
}) => {
  // ── Local state ─────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<TabFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState<SortField>("date");
  const [sortOrder] = useState<SortOrder>("desc");

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [isMutating, setIsMutating] = useState(false);

  const [detailNotif, setDetailNotif] = useState<AppNotification | null>(null);
  const [showPrefs, setShowPrefs] = useState(false);
  const [toast, setToast] = useState<ToastConfig | null>(null);

  const listRef = useRef<HTMLDivElement>(null);

  // ── Data ────────────────────────────────────────────────────────────────────
  const {
    notifications,
    unreadCount,
    totalCount,
    isLoading,
    error,
    loadNotifications,
    markAsRead,
    markMultipleAsRead,
    markAllAsRead: _markAllAsRead,
    archiveNotification,
    deleteNotification,
    refreshNotifications,
  } = useNotifications({
    page: currentPage,
    limit: 20,
    status: activeTab === "unread" ? "unread" : undefined,
    type:
      activeTab === "church" || activeTab === "system" ? activeTab : undefined,
    search: searchQuery || undefined,
  });

  // ── Polling + reset ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;
    void loadNotifications();
    const id = setInterval(() => void refreshNotifications(), OPEN_POLL_MS);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, currentPage, activeTab, searchQuery]);

  useEffect(() => {
    setCurrentPage(1);
    setSelectedIds(new Set());
    setFocusedIndex(-1);
  }, [activeTab, searchQuery]);

  // ── Derived list ─────────────────────────────────────────────────────────────
  const processed = useMemo<AppNotification[]>(() => {
    let list = [...notifications];

    // Client-side search (server already filtered, but keep for instant UX)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (n) =>
          notifTitle(n).toLowerCase().includes(q) ||
          notifBody(n).toLowerCase().includes(q) ||
          n.type?.toLowerCase().includes(q),
      );
    }

    list.sort((a, b) => {
      let av: number | string = 0;
      let bv: number | string = 0;
      if (sortBy === "priority") {
        av = PRIORITY_ORDER[a.priority ?? ""] ?? 0;
        bv = PRIORITY_ORDER[b.priority ?? ""] ?? 0;
      } else if (sortBy === "type") {
        av = a.type ?? "";
        bv = b.type ?? "";
      } else {
        av = notifDate(a).getTime();
        bv = notifDate(b).getTime();
      }
      return sortOrder === "asc" ? (av > bv ? 1 : -1) : av < bv ? 1 : -1;
    });

    return list;
  }, [notifications, searchQuery, sortBy, sortOrder]);

  const grouped = useMemo<{ label: string; items: AppNotification[] }[]>(() => {
    const ORDER = ["Today", "Yesterday", "This Week", "Older"];
    const map = new Map<string, AppNotification[]>();
    for (const n of processed) {
      const label = dateGroup(notifDate(n));
      if (!map.has(label)) map.set(label, []);
      map.get(label)!.push(n);
    }
    return ORDER.filter((l) => map.has(l)).map((label) => ({
      label,
      items: map.get(label)!,
    }));
  }, [processed]);

  // ── Toast helper ─────────────────────────────────────────────────────────────
  const flash = useCallback((cfg: ToastConfig) => setToast(cfg), []);

  // ── Selection ─────────────────────────────────────────────────────────────────
  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    if (selectedIds.size === processed.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(processed.map(notifId)));
    }
  }, [selectedIds.size, processed]);

  // ── Single-item actions ───────────────────────────────────────────────────────
  const handleClick = useCallback(
    async (n: AppNotification) => {
      setDetailNotif(n);
      if (n.status === "unread") {
        try {
          await markAsRead(notifId(n));
        } catch {
          flash({
            type: "error",
            title: "Error",
            message: "Failed to mark as read",
            duration: 3000,
          });
        }
      }
    },
    [markAsRead, flash],
  );

  const handleMarkRead = useCallback(
    async (n: AppNotification) => {
      try {
        await markAsRead(notifId(n));
        flash({
          type: "success",
          title: "Done",
          message: "Marked as read",
          duration: 2000,
        });
      } catch {
        flash({
          type: "error",
          title: "Error",
          message: "Failed to mark as read",
          duration: 3000,
        });
      }
    },
    [markAsRead, flash],
  );

  const handleArchive = useCallback(
    async (n: AppNotification) => {
      try {
        await archiveNotification(notifId(n));
        flash({
          type: "success",
          title: "Archived",
          message: "Notification archived",
          duration: 2000,
        });
        void refreshNotifications();
      } catch {
        flash({
          type: "error",
          title: "Error",
          message: "Failed to archive",
          duration: 3000,
        });
      }
    },
    [archiveNotification, refreshNotifications, flash],
  );

  const handleDelete = useCallback(
    async (n: AppNotification) => {
      try {
        await deleteNotification(notifId(n));
        flash({
          type: "success",
          title: "Deleted",
          message: "Notification deleted",
          duration: 2000,
        });
        void refreshNotifications();
      } catch {
        flash({
          type: "error",
          title: "Error",
          message: "Failed to delete",
          duration: 3000,
        });
      }
    },
    [deleteNotification, refreshNotifications, flash],
  );

  // ── Bulk actions ──────────────────────────────────────────────────────────────
  const runBulk = useCallback(
    async (action: BulkAction) => {
      if (selectedIds.size === 0) return;
      setIsMutating(true);
      const ids = Array.from(selectedIds);
      const count = ids.length;
      const noun = `${count} notification${count > 1 ? "s" : ""}`;
      try {
        if (action === "markRead") {
          await markMultipleAsRead(ids);
          flash({
            type: "success",
            title: "Done",
            message: `${noun} marked as read`,
            duration: 3000,
          });
        } else if (action === "archive") {
          await Promise.all(ids.map((id) => archiveNotification(id)));
          flash({
            type: "success",
            title: "Done",
            message: `${noun} archived`,
            duration: 3000,
          });
        } else {
          await Promise.all(ids.map((id) => deleteNotification(id)));
          flash({
            type: "success",
            title: "Done",
            message: `${noun} deleted`,
            duration: 3000,
          });
        }
        setSelectedIds(new Set());
        void refreshNotifications();
      } catch {
        flash({
          type: "error",
          title: "Error",
          message: `Failed to ${action === "markRead" ? "mark as read" : action}`,
          duration: 3000,
        });
      } finally {
        setIsMutating(false);
      }
    },
    [
      selectedIds,
      markMultipleAsRead,
      archiveNotification,
      deleteNotification,
      refreshNotifications,
      flash,
    ],
  );

  const markAllAsRead = useCallback(async () => {
    setIsMutating(true);
    try {
      await _markAllAsRead();
      flash({
        type: "success",
        title: "Done",
        message: "All notifications marked as read",
        duration: 3000,
      });
      void refreshNotifications();
    } catch {
      flash({
        type: "error",
        title: "Error",
        message: "Failed to mark all as read",
        duration: 3000,
      });
    } finally {
      setIsMutating(false);
    }
  }, [_markAllAsRead, refreshNotifications, flash]);

  // ── Keyboard navigation ───────────────────────────────────────────────────────
  const onKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      if (!processed.length) return;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setFocusedIndex((i) => Math.min(i + 1, processed.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setFocusedIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter" && focusedIndex >= 0) {
        void handleClick(processed[focusedIndex]!);
      } else if ((e.key === "r" || e.key === "R") && focusedIndex >= 0) {
        const n = processed[focusedIndex]!;
        if (n.status === "unread") void handleMarkRead(n);
      } else if ((e.key === "d" || e.key === "D") && focusedIndex >= 0) {
        void handleDelete(processed[focusedIndex]!);
      }
    },
    [processed, focusedIndex, handleClick, handleMarkRead, handleDelete],
  );

  // ── Icon / badge helpers ──────────────────────────────────────────────────────
  const typeIcon = useCallback((n: AppNotification) => {
    const Icon = TYPE_ICON[n.type ?? ""] ?? FiBell;
    const colour =
      n.priority === "urgent"
        ? "text-red-500"
        : n.priority === "high"
          ? "text-orange-500"
          : n.priority === "normal"
            ? "text-blue-500"
            : "text-[var(--text-secondary)]";
    return <Icon className={`w-5 h-5 ${colour}`} />;
  }, []);

  const priorityBadge = useCallback((n: AppNotification) => {
    const b =
      PRIORITY_BADGE[n.priority ?? "normal"] ?? PRIORITY_BADGE["normal"]!;
    return (
      <Badge color={b.color} size="sm">
        {b.label}
      </Badge>
    );
  }, []);

  // ── Row renderer ──────────────────────────────────────────────────────────────
  const renderRow = useCallback(
    (n: AppNotification, flatIdx: number) => {
      const id = notifId(n);
      const isSelected = selectedIds.has(id);
      const isUnread = n.status === "unread";
      const isFocused = focusedIndex === flatIdx;

      return (
        <div
          key={id}
          role="option"
          aria-selected={isSelected}
          tabIndex={isFocused ? 0 : -1}
          className={[
            "relative p-4 border-b border-[var(--glass-outline)] cursor-pointer transition-colors group",
            isSelected ? "bg-[var(--primary-subtle)]" : "",
            isUnread && !isSelected ? "bg-[hsla(272,65%,62%,0.04)]" : "",
            isFocused
              ? "ring-2 ring-inset ring-[var(--primary-resonance)] ring-opacity-60"
              : "",
            "hover:bg-[var(--glass-surface-hover)]",
          ]
            .filter(Boolean)
            .join(" ")}
          onClick={() => void handleClick(n)}
        >
          {/* Checkbox */}
          <div className="absolute top-4 left-3 z-10">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={(e) => {
                e.stopPropagation();
                toggleSelect(id);
              }}
              onClick={(e) => e.stopPropagation()}
              className="w-4 h-4 rounded border-[var(--glass-outline)] bg-transparent
                text-[var(--primary-resonance)] focus:ring-[var(--primary-resonance)]"
              aria-label={`Select: ${notifTitle(n)}`}
            />
          </div>

          {/* Body */}
          <div className="ml-8">
            <div className="flex items-start justify-between gap-3">
              {/* Icon + title + body */}
              <div className="flex items-start gap-2 min-w-0">
                <span className="mt-0.5 shrink-0">{typeIcon(n)}</span>
                <div className="min-w-0">
                  <p
                    className={`text-sm font-medium truncate ${isUnread ? "text-[var(--text-primary)]" : "text-[var(--text-secondary)]"}`}
                  >
                    {isUnread && (
                      <span
                        className="inline-block w-1.5 h-1.5 rounded-full mr-2 mb-0.5
                          bg-[var(--primary-resonance)] shadow-[0_0_6px_var(--primary-glow)]"
                        aria-hidden
                      />
                    )}
                    {notifTitle(n)}
                  </p>
                  <p className="text-xs text-[var(--text-secondary)] line-clamp-2 mt-0.5">
                    {notifBody(n)}
                  </p>
                </div>
              </div>

              {/* Priority badge + timestamp */}
              <div className="flex flex-col items-end gap-1 shrink-0">
                {priorityBadge(n)}
                <span className="text-[10px] text-[var(--text-muted)] flex items-center gap-1 whitespace-nowrap">
                  <FiClock className="w-3 h-3" />
                  {formatDistanceToNow(notifDate(n), { addSuffix: true })}
                </span>
              </div>
            </div>

            {/* Type tag + quick actions */}
            <div className="flex items-center justify-between mt-2 pl-7">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span
                  className="text-[10px] tracking-wider uppercase font-semibold px-2 py-0.5
                  rounded-full bg-[var(--glass-surface)] border border-[var(--glass-outline)]
                  text-[var(--text-secondary)]"
                >
                  {n.type ?? "General"}
                </span>
                {n.module && (
                  <span
                    className="text-[10px] tracking-wider uppercase font-semibold px-2 py-0.5
                    rounded-full bg-[var(--glass-surface)] border border-[var(--glass-outline)]
                    text-[var(--text-secondary)]"
                  >
                    {n.module}
                  </span>
                )}
              </div>

              {/* Per-row actions — visible on hover / keyboard focus */}
              <div
                className="flex items-center gap-1 opacity-0 group-hover:opacity-100
                  focus-within:opacity-100 transition-opacity"
                onClick={(e) => e.stopPropagation()}
              >
                {isUnread && (
                  <button
                    className="p-1 rounded hover:bg-[var(--glass-surface)]
                      text-[var(--text-secondary)] hover:text-[var(--primary-resonance)]
                      transition-colors"
                    title="Mark as read  (R)"
                    onClick={() => void handleMarkRead(n)}
                  >
                    <FiCheck className="w-3 h-3" />
                  </button>
                )}
                <button
                  className="p-1 rounded hover:bg-[var(--glass-surface)]
                    text-[var(--text-secondary)] hover:text-amber-400 transition-colors"
                  title="Archive"
                  onClick={() => void handleArchive(n)}
                >
                  <FiArchive className="w-3 h-3" />
                </button>
                <button
                  className="p-1 rounded hover:bg-[var(--glass-surface)]
                    text-[var(--text-secondary)] hover:text-red-400 transition-colors"
                  title="Delete  (D)"
                  onClick={() => void handleDelete(n)}
                >
                  <FiTrash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    },
    [
      selectedIds,
      focusedIndex,
      handleClick,
      handleMarkRead,
      handleArchive,
      handleDelete,
      toggleSelect,
      typeIcon,
      priorityBadge,
    ],
  );

  // ── Tabs ──────────────────────────────────────────────────────────────────────
  const TABS: { id: TabFilter; label: string }[] = [
    { id: "all", label: "All" },
    {
      id: "unread",
      label: unreadCount > 0 ? `Unread (${unreadCount})` : "Unread",
    },
    { id: "church", label: "Church" },
    { id: "system", label: "System" },
  ];

  // ── Layout helpers ────────────────────────────────────────────────────────────
  const isPopover = position === "popover";

  const popoverStyle: React.CSSProperties =
    isPopover && dropdownCoords
      ? {
          position: "fixed",
          top: dropdownCoords.top,
          left: dropdownCoords.left,
          zIndex: 99000,
          width: "calc(100vw - 32px)",
          maxWidth: "420px",
          height: "620px",
          maxHeight: "calc(100vh - 40px)",
          borderRadius: "var(--radius-lg, 14px)",
          border: "1px solid var(--glass-outline)",
          background: "var(--bg-sidebar)",
          backdropFilter: "blur(24px) saturate(180%)",
          WebkitBackdropFilter: "blur(24px) saturate(180%)",
          boxShadow:
            "0 16px 48px hsla(222,47%,4%,0.55), 0 0 0 1px var(--glass-outline)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }
      : {};

  const animProps = {
    initial: {
      opacity: 0,
      y: dropdownCoords?.opensUpward ? -8 : 8,
      scale: 0.96,
    },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: dropdownCoords?.opensUpward ? -8 : 8, scale: 0.96 },
    transition: { duration: 0.15, ease: "easeOut" as const },
  };

  // ── Inner content ─────────────────────────────────────────────────────────────
  let flatIdx = -1; // mutable counter for keyboard nav index

  const content = (
    <div
      className="flex flex-col h-full relative z-10 overflow-hidden"
      role="listbox"
      aria-label="Notifications"
      onKeyDown={onKeyDown}
    >
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div
        className="shrink-0"
        style={{
          padding: "14px 16px 0",
          background: "hsla(0,0%,100%,0.02)",
          ...glassBorder,
        }}
      >
        {/* Title row */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-[var(--primary-subtle)]">
              <FiBell className="w-4 h-4 text-[var(--primary-resonance)]" />
            </span>
            <h2 className="text-sm font-semibold text-[var(--text-primary)] m-0">
              Notifications
            </h2>
          </div>

          <div className="flex items-center gap-1">
            {/* Refresh */}
            <button
              onClick={() => void refreshNotifications()}
              disabled={isLoading}
              className="p-1.5 rounded-md text-[var(--text-secondary)]
                hover:text-[var(--primary-resonance)] hover:bg-[var(--glass-surface)]
                transition-colors"
              title="Refresh"
              aria-label="Refresh notifications"
            >
              <FiRefreshCw
                className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`}
              />
            </button>

            {/* Preferences */}
            <button
              onClick={() => setShowPrefs(true)}
              className="p-1.5 rounded-md text-[var(--text-secondary)]
                hover:text-[var(--primary-resonance)] hover:bg-[var(--glass-surface)]
                transition-colors"
              title="Notification preferences"
              aria-label="Open notification preferences"
            >
              <FiSettings className="w-4 h-4" />
            </button>

            {/* Mark all read — only visible when there are unread */}
            {unreadCount > 0 && (
              <button
                onClick={() => void markAllAsRead()}
                disabled={isMutating}
                className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs
                  bg-[var(--primary-subtle)] hover:bg-[hsla(272,65%,62%,0.2)]
                  text-[var(--text-primary)] border border-[var(--primary-resonance)]
                  border-opacity-30 transition-colors disabled:opacity-50"
                title="Mark all notifications as read"
              >
                <FiCheck className="w-3.5 h-3.5 text-[var(--text-accent)]" />
                <span>Mark all read</span>
              </button>
            )}

            {/* Close — side-drawer mode only */}
            {!isPopover && (
              <button
                onClick={onClose}
                className="p-1.5 rounded-md text-[var(--text-secondary)]
                  hover:text-white hover:bg-white/10 transition-colors"
                aria-label="Close notifications"
              >
                <FiX className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Tab bar */}
        <div
          className="flex gap-0.5"
          role="tablist"
          aria-label="Filter notifications"
        >
          {TABS.map((tab) => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-2 text-xs font-medium rounded-t-md transition-colors
                border-b-2 -mb-px ${
                  activeTab === tab.id
                    ? "border-[var(--primary-resonance)] text-[var(--primary-resonance)]"
                    : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Search ─────────────────────────────────────────────────────────── */}
      <div className="shrink-0 p-3 border-b border-[var(--glass-outline)] glass-surface">
        <SearchInput
          placeholder="Search notifications…"
          value={searchQuery}
          onChange={(q: string) => {
            setSearchQuery(q);
            setCurrentPage(1);
          }}
          className="w-full input-ecclesia"
        />
      </div>

      {/* ── Bulk action bar — visible when items selected ──────────────────── */}
      {selectedIds.size > 0 && (
        <div
          className="shrink-0 px-4 py-2.5 bg-[var(--primary-subtle)]
            border-b border-[var(--primary-resonance)] border-opacity-20"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[var(--text-accent)]">
              {selectedIds.size} selected
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => void runBulk("markRead")}
                disabled={isMutating}
                className="btn-ghost flex items-center gap-1 px-2.5 py-1 text-xs
                  disabled:opacity-50"
              >
                <FiCheck className="w-3 h-3" />
                Mark Read
              </button>
              <button
                onClick={() => void runBulk("archive")}
                disabled={isMutating}
                className="btn-ghost flex items-center gap-1 px-2.5 py-1 text-xs
                  disabled:opacity-50"
              >
                <FiArchive className="w-3 h-3" />
                Archive
              </button>
              <button
                onClick={() => void runBulk("delete")}
                disabled={isMutating}
                className="church-cancel-btn p-1.5 rounded-lg text-xs disabled:opacity-50"
                title="Delete selected"
              >
                <FiTrash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── List ───────────────────────────────────────────────────────────── */}
      <div
        className="flex-1 overflow-y-auto scrollbar-responsive"
        ref={listRef}
      >
        {isLoading && notifications.length === 0 ? (
          /* Loading */
          <div className="flex items-center justify-center h-32">
            <LoadingSpinner size="md" />
          </div>
        ) : error ? (
          /* Error */
          <div className="p-6 text-center">
            <div className="w-10 h-10 mx-auto mb-3 rounded-full bg-red-500/10 flex items-center justify-center">
              <FiAlertCircle className="w-5 h-5 text-red-500" />
            </div>
            <p className="text-sm text-[var(--text-secondary)] mb-3">
              Failed to load notifications
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => void refreshNotifications()}
            >
              Try again
            </Button>
          </div>
        ) : processed.length === 0 ? (
          /* Empty state */
          <div className="p-8 text-center animate-fade-up">
            <div
              className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--glass-surface)]
              border border-[var(--glass-outline)] flex items-center justify-center shadow-lg"
            >
              <FiBell className="w-6 h-6 text-[var(--text-secondary)] opacity-50" />
            </div>
            <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-1">
              {activeTab === "unread" ? "All caught up!" : "No notifications"}
            </h3>
            <p className="text-xs text-[var(--text-secondary)]">
              {searchQuery
                ? "No notifications match your search."
                : activeTab === "unread"
                  ? "You have no unread notifications."
                  : "Notifications will appear here."}
            </p>
            <p className="mt-4 text-[10px] text-[var(--text-muted)]">
              ↑ ↓ navigate · Enter open · R read · D delete
            </p>
          </div>
        ) : (
          /* Grouped list */
          <div className="group">
            {/* Select-all sticky row */}
            <div
              className="px-4 py-2.5 border-b border-[var(--glass-outline)]
              bg-[var(--glass-surface)] sticky top-0 z-10 backdrop-blur-md
              flex items-center justify-between"
            >
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={
                    selectedIds.size === processed.length &&
                    processed.length > 0
                  }
                  onChange={toggleSelectAll}
                  className="w-4 h-4 rounded border-[var(--glass-outline)] bg-transparent
                    text-[var(--primary-resonance)] focus:ring-[var(--primary-resonance)]"
                  aria-label="Select all"
                />
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                  Select all
                </span>
              </label>
              <span className="text-[10px] text-[var(--text-muted)]">
                {processed.length} notification
                {processed.length !== 1 ? "s" : ""}
              </span>
            </div>

            {/* Date groups */}
            {grouped.map(({ label, items }) => (
              <div key={label}>
                <div
                  className="px-4 py-1.5 text-[10px] font-semibold uppercase
                  tracking-widest text-[var(--text-muted)] bg-[var(--glass-surface)]
                  border-b border-[var(--glass-outline)] sticky top-10 z-[9]
                  backdrop-blur-md"
                >
                  {label}
                </div>
                {items.map((n) => {
                  flatIdx++;
                  return renderRow(n, flatIdx);
                })}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Pagination ─────────────────────────────────────────────────────── */}
      {totalCount > 20 && (
        <div className="shrink-0 p-3 glass-bottom-nav z-10">
          <Pagination
            currentPage={currentPage}
            totalPages={Math.ceil(totalCount / 20)}
            onPageChange={setCurrentPage}
            size="sm"
          />
        </div>
      )}
    </div>
  );

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <>
      <AnimatePresence>
        {isOpen &&
          (isPopover ? (
            <motion.div
              ref={panelRef as React.RefCallback<HTMLDivElement>}
              initial={animProps.initial}
              animate={animProps.animate}
              exit={animProps.exit}
              transition={animProps.transition}
              style={popoverStyle}
              className={className}
            >
              {content}
            </motion.div>
          ) : (
            <>
              {/* Scrim */}
              <div
                className="fixed inset-0 z-40 bg-black/25"
                onClick={onClose}
                aria-hidden
              />
              {/* Side drawer */}
              <div
                className={[
                  "fixed top-0 h-full w-96 glass-sidebar z-50 shadow-2xl",
                  "transform transition-transform duration-300 ease-in-out",
                  position === "right" ? "right-0" : "left-0",
                  isOpen
                    ? "translate-x-0"
                    : position === "right"
                      ? "translate-x-full"
                      : "-translate-x-full",
                  className,
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                {content}
              </div>
            </>
          ))}
      </AnimatePresence>

      {/* Detail modal */}
      {detailNotif && (
        <NotificationModal
          notification={detailNotif}
          isOpen
          onClose={() => setDetailNotif(null)}
          onMarkAsRead={markAsRead}
          onArchive={archiveNotification}
          onDelete={deleteNotification}
        />
      )}

      {/* Preferences modal */}
      {showPrefs && (
        <NotificationPreferences isOpen onClose={() => setShowPrefs(false)} />
      )}

      {/* Toast */}
      {toast && <NotificationToast {...toast} onClose={() => setToast(null)} />}
    </>
  );
};

export { NotificationCenter };
export default NotificationCenter;
