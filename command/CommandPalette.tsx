import React, { useEffect, useRef, useState, useCallback } from "react";
import { useCommandContext } from "./CommandContext";
import type { Command, CommandNamespace } from "./CommandContext";
import { flex1 } from "@shared/styles/styleUtils";

/**
 * CommandPalette — Universal Command Core Omnibox
 *
 * Liquid Glass overlay triggered by Ctrl+K (or ⌘K on Mac).
 * Mounts once inside each app's Layout. Reads from CommandContext.
 *
 * Design Identity: Sovereign Obsidian glass — inky void background,
 * prismatic cyan/violet accent, sharp typography, micro-animations.
 *
 * Accessibility:
 *   - role="dialog" aria-modal="true" aria-label="Command Palette"
 *   - Input: role="combobox", aria-expanded, aria-autocomplete
 *   - Results: role="listbox" with role="option" per item
 *   - Keyboard: ArrowUp/Down navigates, Enter executes, Escape closes
 */

// ── Types ────────────────────────────────────────────────────────────────────

interface NsPaletteEntry {
  bg: string;
  border: string;
  text: string;
  label: string;
}

interface KbdBadgeProps {
  keys?: string[];
}

interface NsBadgeProps {
  namespace: CommandNamespace | string;
}

interface ResultRowProps {
  command: Command;
  isActive: boolean;
  onHover: () => void;
  onExecute: () => void;
}

interface SectionHeaderProps {
  label: string;
}

interface EmptyStateProps {
  query: string;
}

interface HintBarProps {
  resultCount: number;
}

// ── Namespace badge colours ───────────────────────────────────────────────────

const NS_PALETTE: Record<string, NsPaletteEntry> = {
  work: {
    bg: "hsla(210,100%,56%,0.15)",
    border: "hsla(210,100%,56%,0.3)",
    text: "hsl(210,100%,75%)",
    label: "Business",
  },
  church: {
    bg: "hsla(270,85%,65%,0.15)",
    border: "hsla(270,85%,65%,0.3)",
    text: "hsl(270,85%,80%)",
    label: "Church",
  },
  home: {
    bg: "hsla(160,60%,50%,0.15)",
    border: "hsla(160,60%,50%,0.3)",
    text: "hsl(160,70%,65%)",
    label: "Home",
  },
  personal: {
    bg: "hsla(280,70%,60%,0.15)",
    border: "hsla(280,70%,60%,0.3)",
    text: "hsl(280,80%,78%)",
    label: "Personal",
  },
  playback: {
    bg: "hsla(38,95%,55%,0.15)",
    border: "hsla(38,95%,55%,0.3)",
    text: "hsl(38,100%,70%)",
    label: "Playback",
  },
  admin: {
    bg: "hsla(187,84%,44%,0.15)",
    border: "hsla(187,84%,44%,0.3)",
    text: "hsl(187,84%,65%)",
    label: "Admin",
  },
  universal: {
    bg: "hsla(230,50%,60%,0.15)",
    border: "hsla(230,50%,60%,0.3)",
    text: "hsl(230,70%,78%)",
    label: "Ecosystem",
  },
};

function getNamespaceStyle(ns: string): NsPaletteEntry {
  return (
    NS_PALETTE[ns] ?? {
      bg: "hsla(220,14%,60%,0.15)",
      border: "hsla(220,14%,60%,0.3)",
      text: "hsl(220,14%,75%)",
      label: ns ?? "Global",
    }
  );
}

// ── Kbd shortcut badge ────────────────────────────────────────────────────────

function KbdBadge({ keys }: KbdBadgeProps) {
  if (!keys?.length) return null;
  return (
    <span style={{ display: "flex", gap: "2px", flexShrink: 0 }}>
      {keys.map((k, i) => (
        <kbd
          key={i}
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            minWidth: "20px",
            height: "20px",
            padding: "0 4px",
            borderRadius: "4px",
            fontSize: "10px",
            fontFamily: "var(--font-mono, monospace)",
            color: "var(--text-muted, #94a3b8)",
            background: "hsla(220,20%,18%,0.8)",
            border: "1px solid hsla(220,20%,30%,0.6)",
            letterSpacing: "0",
          }}
        >
          {k}
        </kbd>
      ))}
    </span>
  );
}

// ── Namespace pill ────────────────────────────────────────────────────────────

function NsBadge({ namespace }: NsBadgeProps) {
  const style = getNamespaceStyle(namespace);
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "2px 7px",
        borderRadius: "99px",
        fontSize: "10px",
        fontWeight: 600,
        letterSpacing: "0.04em",
        textTransform: "uppercase",
        fontFamily: "var(--font-display, sans-serif)",
        background: style.bg,
        border: `1px solid ${style.border}`,
        color: style.text,
        flexShrink: 0,
      }}
    >
      {style.label}
    </span>
  );
}

// ── Individual result row ─────────────────────────────────────────────────────

function ResultRow({ command, isActive, onHover, onExecute }: ResultRowProps) {
  return (
    <div
      id={`cmd-result-${command.id}`}
      role="option"
      aria-selected={isActive}
      data-command-id={command.id}
      onMouseEnter={onHover}
      onClick={onExecute}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "10px",
        padding: "10px 14px",
        borderRadius: "10px",
        cursor: "pointer",
        transition: "background 100ms ease",
        background: isActive ? "hsla(220,20%,20%,0.7)" : "transparent",
        border: isActive
          ? "1px solid hsla(187,84%,44%,0.25)"
          : "1px solid transparent",
        margin: "0 6px",
      }}
    >
      {/* Icon */}
      {command.icon && (
        <div
          style={{
            width: "32px",
            height: "32px",
            borderRadius: "8px",
            background: isActive
              ? "hsla(187,84%,44%,0.15)"
              : "hsla(220,20%,18%,0.6)",
            border: `1px solid ${isActive ? "hsla(187,84%,44%,0.3)" : "hsla(220,20%,28%,0.5)"}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            fontSize: "14px",
            color: isActive
              ? "var(--primary-resonance, hsl(187,84%,44%))"
              : "var(--text-muted, #94a3b8)",
            transition: "all 100ms ease",
          }}
        >
          {command.icon}
        </div>
      )}

      {/* Text */}
      <div style={{ minWidth: 0, ...flex1 }}>
        <div
          style={{
            fontSize: "13px",
            fontWeight: 500,
            fontFamily: "var(--font-body, sans-serif)",
            color: isActive
              ? "var(--text-primary, #f1f5f9)"
              : "var(--text-secondary, #94a3b8)",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            transition: "color 100ms ease",
          }}
        >
          {command.label}
        </div>
        {command.description && (
          <div
            style={{
              fontSize: "11px",
              color: "var(--text-muted, #64748b)",
              marginTop: "1px",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              fontFamily: "var(--font-body, sans-serif)",
            }}
          >
            {command.description}
          </div>
        )}
      </div>

      {/* Right meta */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          flexShrink: 0,
        }}
      >
        {command.shortcut && <KbdBadge keys={command.shortcut} />}
        <NsBadge namespace={command.namespace} />
      </div>
    </div>
  );
}

// ── Section header ────────────────────────────────────────────────────────────

function SectionHeader({ label }: SectionHeaderProps) {
  return (
    <div
      style={{
        padding: "10px 20px 4px",
        fontSize: "10px",
        fontWeight: 700,
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        color: "var(--text-muted, #64748b)",
        fontFamily: "var(--font-display, sans-serif)",
      }}
    >
      {label}
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyState({ query }: EmptyStateProps) {
  return (
    <div
      style={{
        padding: "40px 24px",
        textAlign: "center",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "8px",
      }}
    >
      <div
        style={{
          width: "44px",
          height: "44px",
          borderRadius: "12px",
          background: "hsla(220,20%,18%,0.6)",
          border: "1px solid hsla(220,20%,28%,0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "20px",
          marginBottom: "4px",
        }}
      >
        🔍
      </div>
      <p
        style={{
          fontSize: "14px",
          fontWeight: 600,
          color: "var(--text-secondary, #94a3b8)",
          fontFamily: "var(--font-display, sans-serif)",
        }}
      >
        No results for &ldquo;{query}&rdquo;
      </p>
      <p
        style={{
          fontSize: "12px",
          color: "var(--text-muted, #64748b)",
          fontFamily: "var(--font-body, sans-serif)",
        }}
      >
        Try a different search term or namespace prefix (e.g.{" "}
        <code
          style={{
            fontFamily: "var(--font-mono, monospace)",
            color: "var(--primary-resonance, hsl(187,84%,44%))",
            background: "hsla(187,84%,44%,0.1)",
            padding: "1px 5px",
            borderRadius: "4px",
          }}
        >
          &gt;work:
        </code>
        )
      </p>
    </div>
  );
}

// ── Hint bar ──────────────────────────────────────────────────────────────────

function HintBar({ resultCount }: HintBarProps) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "8px 14px",
        borderTop: "1px solid hsla(220,20%,20%,0.6)",
        fontSize: "11px",
        color: "var(--text-muted, #64748b)",
        fontFamily: "var(--font-body, sans-serif)",
      }}
    >
      <span>
        {resultCount} result{resultCount !== 1 ? "s" : ""}
      </span>
      <span style={{ display: "flex", gap: "12px" }}>
        <span>
          <KbdBadge keys={["↑", "↓"]} /> navigate
        </span>
        <span>
          <KbdBadge keys={["↵"]} /> execute
        </span>
        <span>
          <KbdBadge keys={["Esc"]} /> close
        </span>
      </span>
    </div>
  );
}

// ── Group results by section ──────────────────────────────────────────────────

function groupBySection(results: Command[]): Record<string, Command[]> {
  const grouped: Record<string, Command[]> = {};
  for (const cmd of results) {
    const sec = cmd.section ?? "Commands";
    if (!grouped[sec]) grouped[sec] = [];
    grouped[sec].push(cmd);
  }
  return grouped;
}

// ── Main CommandPalette ───────────────────────────────────────────────────────

export function CommandPalette() {
  const { isOpen, close, query, setQuery, results } = useCommandContext();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [activeIdx, setActiveIdx] = useState(0);

  // Reset active index when query changes
  useEffect(() => {
    setActiveIdx(0);
  }, [query]);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      const id = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(id);
    }
    return undefined;
  }, [isOpen]);

  // Scroll active item into view
  useEffect(() => {
    if (!listRef.current) return;
    const activeEl = listRef.current.querySelector<HTMLElement>(
      '[aria-selected="true"]',
    );
    activeEl?.scrollIntoView({ block: "nearest" });
  }, [activeIdx]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setActiveIdx((i) => Math.min(i + 1, results.length - 1));
          break;
        case "ArrowUp":
          e.preventDefault();
          setActiveIdx((i) => Math.max(i - 1, 0));
          break;
        case "Enter": {
          e.preventDefault();
          const cmd = results[activeIdx];
          if (cmd) {
            close();
            cmd.onAction?.();
          }
          break;
        }
        case "Escape":
          e.preventDefault();
          close();
          break;
        default:
          break;
      }
    },
    [results, activeIdx, close],
  );

  if (!isOpen) return null;

  const grouped = groupBySection(results);
  const flatResults = results;

  // Build flat index map from grouped order to match activeIdx
  let flatIndex = 0;
  const sections = Object.entries(grouped).map(([sectionName, cmds]) => ({
    sectionName,
    cmds: cmds.map((cmd) => ({ cmd, flatIdx: flatIndex++ })),
  }));

  return (
    <>
      {/* ─── Backdrop ─── */}
      <div
        id="command-palette-backdrop"
        role="presentation"
        onClick={close}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 999,
          background: "hsla(222,47%,4%,0.75)",
          backdropFilter: "blur(8px) saturate(120%)",
          WebkitBackdropFilter: "blur(8px) saturate(120%)",
          animation: "cmd-fade-in 150ms ease both",
        }}
      />

      {/* ─── Palette Container ─── */}
      <div
        id="command-palette"
        role="dialog"
        aria-modal="true"
        aria-label="Universal Command Palette"
        style={{
          position: "fixed",
          top: "15vh",
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 1000,
          width: "min(640px, calc(100vw - 32px))",
          background: "hsla(220,24%,10%,0.95)",
          backdropFilter: "blur(32px) saturate(180%)",
          WebkitBackdropFilter: "blur(32px) saturate(180%)",
          borderRadius: "16px",
          border: "1px solid hsla(220,20%,25%,0.5)",
          boxShadow:
            "0 4px 6px -2px hsla(0,0%,0%,0.4), 0 20px 60px -8px hsla(0,0%,0%,0.6), 0 0 0 1px hsla(220,20%,18%,0.4), inset 0 1px 0 hsla(255,100%,100%,0.05)",
          overflow: "hidden",
          animation: "cmd-slide-in 180ms cubic-bezier(0.16, 1, 0.3, 1) both",
          display: "flex",
          flexDirection: "column",
          maxHeight: "min(520px, 70vh)",
        }}
      >
        {/* ─── Search Input Area ─── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "14px 16px",
            borderBottom: "1px solid hsla(220,20%,18%,0.7)",
          }}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ color: "var(--text-muted, #64748b)", flexShrink: 0 }}
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>

          <input
            id="command-palette-input"
            ref={inputRef}
            type="text"
            role="combobox"
            aria-expanded={isOpen}
            aria-autocomplete="list"
            aria-controls="command-palette-results"
            aria-activedescendant={
              results[activeIdx]
                ? `cmd-result-${results[activeIdx].id}`
                : undefined
            }
            placeholder="Search commands… or type >work: >church: >home:"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            style={{
              background: "transparent",
              border: "none",
              outline: "none",
              fontSize: "15px",
              fontWeight: 400,
              fontFamily: "var(--font-body, sans-serif)",
              color: "var(--text-primary, #f1f5f9)",
              caretColor: "var(--primary-resonance, hsl(187,84%,44%))",
              ...flex1,
            }}
            autoComplete="off"
            spellCheck={false}
          />

          <KbdBadge keys={["Esc"]} />
        </div>

        {/* ─── Results Area ─── */}
        <div
          id="command-palette-results"
          ref={listRef}
          role="listbox"
          aria-label="Command results"
          style={{
            overflowY: "auto",
            padding: "6px 0",
            scrollbarWidth: "thin",
            scrollbarColor: "hsla(220,20%,30%,0.5) transparent",
            ...flex1,
          }}
        >
          {flatResults.length === 0 && query.trim() !== "" && (
            <EmptyState query={query} />
          )}

          {flatResults.length === 0 && query.trim() === "" && (
            <div
              style={{
                padding: "32px 24px",
                textAlign: "center",
                color: "var(--text-muted, #64748b)",
                fontSize: "13px",
                fontFamily: "var(--font-body, sans-serif)",
              }}
            >
              <div style={{ fontSize: "28px", marginBottom: "8px" }}>⌘</div>
              Type to search all commands across the ecosystem.
              <br />
              <span
                style={{
                  color: "var(--primary-resonance, hsl(187,84%,44%))",
                  fontFamily: "var(--font-mono, monospace)",
                  fontSize: "11px",
                }}
              >
                &gt;work:
              </span>{" "}
              <span
                style={{
                  color: "hsl(270,85%,80%)",
                  fontFamily: "var(--font-mono, monospace)",
                  fontSize: "11px",
                }}
              >
                &gt;church:
              </span>{" "}
              <span
                style={{
                  color: "hsl(160,70%,65%)",
                  fontFamily: "var(--font-mono, monospace)",
                  fontSize: "11px",
                }}
              >
                &gt;home:
              </span>{" "}
              — scope by namespace
            </div>
          )}

          {sections.map(({ sectionName, cmds }) => (
            <div key={sectionName}>
              <SectionHeader label={sectionName} />
              {cmds.map(({ cmd, flatIdx }) => (
                <ResultRow
                  key={cmd.id}
                  command={cmd}
                  isActive={flatIdx === activeIdx}
                  onHover={() => setActiveIdx(flatIdx)}
                  onExecute={() => {
                    close();
                    cmd.onAction?.();
                  }}
                />
              ))}
            </div>
          ))}
        </div>

        {/* ─── Hint Bar ─── */}
        <HintBar resultCount={flatResults.length} />
      </div>

      {/* ─── CSS Keyframes (injected once) ─── */}
      <style>{`
        @keyframes cmd-fade-in {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes cmd-slide-in {
          from { opacity: 0; transform: translateX(-50%) translateY(-12px) scale(0.97); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0)     scale(1);    }
        }
        #command-palette-results::-webkit-scrollbar {
          width: 4px;
        }
        #command-palette-results::-webkit-scrollbar-track {
          background: transparent;
        }
        #command-palette-results::-webkit-scrollbar-thumb {
          background: hsla(220,20%,30%,0.5);
          border-radius: 2px;
        }
      `}</style>
    </>
  );
}

// Sub-component re-exports for convenience
CommandPalette.KbdBadge = KbdBadge;
CommandPalette.NsBadge = NsBadge;
