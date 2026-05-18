/**
 * Command Palette System — Full Test Suite
 * Covers: CommandContext, useCommandPalette, useRegisterCommands, CommandPalette UI
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React, { useEffect } from 'react';
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act
} from '@testing-library/react';
import { renderHook } from '@testing-library/react';

import {
  CommandProvider,
  useCommandContext,
  NAMESPACE_LABELS
} from '../command/CommandContext';
import { useCommandPalette } from '../command/useCommandPalette';
import { useRegisterCommands } from '../command/useRegisterCommands';
import { CommandPalette } from '../command/CommandPalette';
import type { Command } from '../command/CommandContext';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <CommandProvider>{children}</CommandProvider>
);

const MOCK_COMMANDS: Command[] = [
  {
    id: 'work:dashboard',
    namespace: 'work',
    label: 'Business Dashboard',
    description: 'Go to dashboard',
    type: 'navigation',
    section: 'Navigate',
    onAction: vi.fn(),
    keywords: ['biz']
  },
  {
    id: 'church:songs',
    namespace: 'church',
    label: 'Song Sanctuary',
    description: 'Browse songs',
    type: 'navigation',
    section: 'Navigate',
    onAction: vi.fn()
  },
  {
    id: 'home:checklist',
    namespace: 'home',
    label: 'Hospitality Checklist',
    description: 'View checklists',
    type: 'action',
    section: 'Actions',
    onAction: vi.fn()
  }
];

// ─── Render helper that mounts provider + palette ─────────────────────────────

function PaletteHarness({
  commands = MOCK_COMMANDS,
  initialOpen = false
}: {
  commands?: Command[];
  initialOpen?: boolean;
}) {
  const { open, registerCommands } = useCommandContext();
  useEffect(() => {
    const dereg = registerCommands(commands);
    if (initialOpen) open();
    return dereg;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <>
      <button id="open-palette-btn" onClick={open}>
        Open Palette
      </button>
      <CommandPalette />
    </>
  );
}

function renderPalette(
  props: { commands?: Command[]; initialOpen?: boolean } = {}
) {
  return render(
    <CommandProvider>
      <PaletteHarness {...props} />
    </CommandProvider>
  );
}

// ─── JSDOM compat: mock scrollIntoView (not implemented in JSDOM) ─────────────
Element.prototype.scrollIntoView = vi.fn();

// ─── CommandContext unit tests ────────────────────────────────────────────────

describe('CommandContext', () => {
  it('provides isOpen=false by default', () => {
    const { result } = renderHook(() => useCommandContext(), { wrapper });
    expect(result.current.isOpen).toBe(false);
  });

  it('open() sets isOpen to true and resets query', () => {
    const { result } = renderHook(() => useCommandContext(), { wrapper });
    act(() => result.current.setQuery('hello'));
    act(() => result.current.open());
    expect(result.current.isOpen).toBe(true);
    expect(result.current.query).toBe('');
  });

  it('close() sets isOpen to false and resets query', () => {
    const { result } = renderHook(() => useCommandContext(), { wrapper });
    act(() => result.current.open());
    act(() => result.current.setQuery('test'));
    act(() => result.current.close());
    expect(result.current.isOpen).toBe(false);
    expect(result.current.query).toBe('');
  });

  it('toggle() flips isOpen', () => {
    const { result } = renderHook(() => useCommandContext(), { wrapper });
    act(() => result.current.toggle());
    expect(result.current.isOpen).toBe(true);
    act(() => result.current.toggle());
    expect(result.current.isOpen).toBe(false);
  });

  it('registerCommands adds commands and returns deregister', () => {
    const { result } = renderHook(() => useCommandContext(), { wrapper });
    let dereg: () => void;
    act(() => {
      dereg = result.current.registerCommands([
        {
          id: 'x:1',
          namespace: 'work',
          label: 'X',
          type: 'navigation',
          onAction: vi.fn()
        }
      ]);
    });
    expect(result.current.allCommands).toHaveLength(1);
    expect(result.current.allCommands[0].id).toBe('x:1');

    // Deregister removes it
    act(() => dereg!());
    expect(result.current.allCommands).toHaveLength(0);
  });

  it('registerCommands deduplicates by id (last-write wins)', () => {
    const { result } = renderHook(() => useCommandContext(), { wrapper });
    const actionA = vi.fn();
    const actionB = vi.fn();
    act(() => {
      result.current.registerCommands([
        {
          id: 'dup:1',
          namespace: 'work',
          label: 'First',
          type: 'navigation',
          onAction: actionA
        }
      ]);
    });
    act(() => {
      result.current.registerCommands([
        {
          id: 'dup:1',
          namespace: 'work',
          label: 'Second',
          type: 'navigation',
          onAction: actionB
        }
      ]);
    });
    expect(result.current.allCommands).toHaveLength(1);
    expect(result.current.allCommands[0].label).toBe('Second');
  });

  it('NAMESPACE_LABELS exports known namespaces', () => {
    expect(NAMESPACE_LABELS.work).toBe('Business Hub');
    expect(NAMESPACE_LABELS.church).toBe('Church Suite');
    expect(NAMESPACE_LABELS.home).toBe('Home Nucleus');
    expect(NAMESPACE_LABELS.personal).toBe('Personal Sanctuary');
  });

  it('throws when used outside CommandProvider', () => {
    // Suppress React error boundary noise in JSDOM
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => renderHook(() => useCommandContext())).toThrow(
      /CommandProvider/
    );
    spy.mockRestore();
  });
});

// ─── Filtering logic ──────────────────────────────────────────────────────────

describe('CommandContext — filtering', () => {
  it('empty query returns all commands', () => {
    const { result } = renderHook(() => useCommandContext(), { wrapper });
    act(() => result.current.registerCommands(MOCK_COMMANDS));
    expect(result.current.results).toHaveLength(MOCK_COMMANDS.length);
  });

  it('filters by label substring', () => {
    const { result } = renderHook(() => useCommandContext(), { wrapper });
    act(() => result.current.registerCommands(MOCK_COMMANDS));
    act(() => result.current.setQuery('song'));
    expect(result.current.results).toHaveLength(1);
    expect(result.current.results[0].id).toBe('church:songs');
  });

  it('filters by keyword', () => {
    const { result } = renderHook(() => useCommandContext(), { wrapper });
    act(() => result.current.registerCommands(MOCK_COMMANDS));
    act(() => result.current.setQuery('biz'));
    expect(result.current.results).toHaveLength(1);
    expect(result.current.results[0].id).toBe('work:dashboard');
  });

  it('namespace prefix >work: scopes results', () => {
    const { result } = renderHook(() => useCommandContext(), { wrapper });
    act(() => result.current.registerCommands(MOCK_COMMANDS));
    act(() => result.current.setQuery('>work:'));
    expect(result.current.results).toHaveLength(1);
    expect(result.current.results[0].namespace).toBe('work');
  });

  it('namespace prefix with content >church:song filters further', () => {
    const { result } = renderHook(() => useCommandContext(), { wrapper });
    act(() => result.current.registerCommands(MOCK_COMMANDS));
    act(() => result.current.setQuery('>church:song'));
    expect(result.current.results).toHaveLength(1);
    expect(result.current.results[0].id).toBe('church:songs');
  });

  it('returns empty array for non-matching query', () => {
    const { result } = renderHook(() => useCommandContext(), { wrapper });
    act(() => result.current.registerCommands(MOCK_COMMANDS));
    act(() => result.current.setQuery('zzznomatch'));
    expect(result.current.results).toHaveLength(0);
  });

  it('filters case-insensitively', () => {
    const { result } = renderHook(() => useCommandContext(), { wrapper });
    act(() => result.current.registerCommands(MOCK_COMMANDS));
    act(() => result.current.setQuery('SONG'));
    expect(result.current.results).toHaveLength(1);
  });
});

// ─── useRegisterCommands ──────────────────────────────────────────────────────

describe('useRegisterCommands', () => {
  it('stamps namespace onto commands and registers them', () => {
    const { result: ctx } = renderHook(() => useCommandContext(), { wrapper });

    renderHook(
      () =>
        useRegisterCommands('home', [
          {
            id: 'home:budget',
            label: 'Budget',
            type: 'navigation',
            onAction: vi.fn()
          }
        ]),
      { wrapper }
    );

    // The shared wrapper shares a single context — test with a combined harness instead
    function Combined() {
      useRegisterCommands('home', [
        {
          id: 'home:budget2',
          label: 'Budget2',
          type: 'navigation',
          onAction: vi.fn()
        }
      ]);
      return null;
    }
    const { result } = renderHook(() => useCommandContext(), {
      wrapper: ({ children }: { children: React.ReactNode }) => (
        <CommandProvider>
          <Combined />
          {children}
        </CommandProvider>
      )
    });

    expect(result.current.allCommands.some(c => c.id === 'home:budget2')).toBe(
      true
    );
    expect(
      result.current.allCommands.find(c => c.id === 'home:budget2')?.namespace
    ).toBe('home');
  });
});

// ─── useCommandPalette ────────────────────────────────────────────────────────

describe('useCommandPalette — hotkey binding', () => {
  it('binds Ctrl+K when bindHotkey=true and calls toggle', () => {
    const { result } = renderHook(
      () => useCommandPalette({ bindHotkey: true }),
      { wrapper }
    );
    expect(result.current.isOpen).toBe(false);
    act(() => {
      fireEvent.keyDown(document, { key: 'k', ctrlKey: true });
    });
    expect(result.current.isOpen).toBe(true);
  });

  it('does NOT bind when bindHotkey=false', () => {
    const { result } = renderHook(
      () => useCommandPalette({ bindHotkey: false }),
      { wrapper }
    );
    act(() => {
      fireEvent.keyDown(document, { key: 'k', ctrlKey: true });
    });
    expect(result.current.isOpen).toBe(false);
  });

  it('handleExecute closes palette and calls onAction for action type', () => {
    const onAction = vi.fn();
    const { result } = renderHook(() => useCommandPalette(), { wrapper });
    act(() => result.current.open());
    act(() =>
      result.current.handleExecute({
        id: 't:1',
        type: 'action',
        onAction,
        namespace: 'work',
        label: 'Test'
      })
    );
    expect(onAction).toHaveBeenCalled();
    expect(result.current.isOpen).toBe(false);
  });

  it('handleExecute closes palette and calls onAction for navigation type', () => {
    const onAction = vi.fn();
    const { result } = renderHook(() => useCommandPalette(), { wrapper });
    act(() => result.current.open());
    act(() =>
      result.current.handleExecute({
        id: 'n:1',
        type: 'navigation',
        href: '/dashboard',
        onAction,
        namespace: 'work',
        label: 'Dashboard'
      })
    );
    expect(onAction).toHaveBeenCalled();
    expect(result.current.isOpen).toBe(false);
  });
});

// ─── CommandPalette UI tests ──────────────────────────────────────────────────

describe('CommandPalette UI', () => {
  it('does not render when closed', () => {
    renderPalette({ initialOpen: false });
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('renders dialog when open', async () => {
    renderPalette({ initialOpen: true });
    await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());
  });

  it('contains the search input', async () => {
    renderPalette({ initialOpen: true });
    await waitFor(() =>
      expect(screen.getByRole('combobox')).toBeInTheDocument()
    );
  });

  it('shows all commands when query is empty', async () => {
    renderPalette({ commands: MOCK_COMMANDS, initialOpen: true });
    await waitFor(() => {
      expect(screen.getByText('Business Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Song Sanctuary')).toBeInTheDocument();
      expect(screen.getByText('Hospitality Checklist')).toBeInTheDocument();
    });
  });

  it('filters results as user types', async () => {
    renderPalette({ commands: MOCK_COMMANDS, initialOpen: true });
    const input = await screen.findByRole('combobox');
    fireEvent.change(input, { target: { value: 'song' } });
    expect(screen.getByText('Song Sanctuary')).toBeInTheDocument();
    expect(screen.queryByText('Business Dashboard')).toBeNull();
  });

  it('shows empty state for non-matching query', async () => {
    renderPalette({ commands: MOCK_COMMANDS, initialOpen: true });
    const input = await screen.findByRole('combobox');
    fireEvent.change(input, { target: { value: 'zzznomatch' } });
    expect(screen.getByText(/No results for/i)).toBeInTheDocument();
  });

  it('Escape key closes the palette', async () => {
    renderPalette({ initialOpen: true });
    await screen.findByRole('dialog');
    fireEvent.keyDown(screen.getByRole('combobox'), { key: 'Escape' });
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });

  it('clicking backdrop closes the palette', async () => {
    renderPalette({ initialOpen: true });
    await screen.findByRole('dialog');
    // Backdrop is the sibling div before dialog
    const backdrop = document.getElementById('command-palette-backdrop');
    expect(backdrop).toBeTruthy();
    fireEvent.click(backdrop!);
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });

  it('Enter key executes the first result and closes', async () => {
    const action = vi.fn();
    const cmds: Command[] = [
      {
        id: 'test:enter',
        namespace: 'work',
        label: 'Test Enter',
        type: 'action',
        section: 'Test',
        onAction: action
      }
    ];
    renderPalette({ commands: cmds, initialOpen: true });
    const input = await screen.findByRole('combobox');
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(action).toHaveBeenCalled();
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });

  it('clicking a result executes it and closes', async () => {
    const action = vi.fn();
    const cmds: Command[] = [
      {
        id: 'test:click',
        namespace: 'home',
        label: 'Click Test',
        type: 'action',
        section: 'Test',
        onAction: action
      }
    ];
    renderPalette({ commands: cmds, initialOpen: true });
    const item = await screen.findByText('Click Test');
    fireEvent.click(item);
    expect(action).toHaveBeenCalled();
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });

  it('has role=dialog with aria-modal=true', async () => {
    renderPalette({ initialOpen: true });
    const dialog = await screen.findByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
  });

  it('input has role=combobox and aria-expanded', async () => {
    renderPalette({ initialOpen: true });
    const input = await screen.findByRole('combobox');
    expect(input).toHaveAttribute('aria-expanded', 'true');
  });

  it('namespace badges are rendered for results', async () => {
    renderPalette({ commands: MOCK_COMMANDS, initialOpen: true });
    // Business badge for 'work' namespace
    await waitFor(() => {
      expect(screen.getByText('Business')).toBeInTheDocument();
    });
  });

  it('hint bar shows result count', async () => {
    renderPalette({ commands: MOCK_COMMANDS, initialOpen: true });
    await waitFor(() => {
      expect(
        screen.getByText(`${MOCK_COMMANDS.length} results`)
      ).toBeInTheDocument();
    });
  });

  it('ArrowDown + Enter executes second result', async () => {
    const action1 = vi.fn();
    const action2 = vi.fn();
    const cmds: Command[] = [
      {
        id: 't:1',
        namespace: 'work',
        label: 'First',
        type: 'action',
        section: 'T',
        onAction: action1
      },
      {
        id: 't:2',
        namespace: 'work',
        label: 'Second',
        type: 'action',
        section: 'T',
        onAction: action2
      }
    ];
    renderPalette({ commands: cmds, initialOpen: true });
    const input = await screen.findByRole('combobox');
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(action2).toHaveBeenCalled();
    expect(action1).not.toHaveBeenCalled();
  });
});
