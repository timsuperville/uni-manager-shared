/**
 * LoadingSpinner — compatibility shim for @shared/components/ui
 *
 * The canonical spinner is `Spinner` (Liquid Glass, SVG-based, CSS tokens).
 * This file re-exports it as `LoadingSpinner` to satisfy existing imports in
 * notification components that expect the `../ui/LoadingSpinner` path.
 *
 * New code should import { Spinner } from "@shared/components/ui" directly.
 *
 * @deprecated Prefer importing `{ Spinner }` from "@shared/components/ui"
 */
export { Spinner as LoadingSpinner, Spinner } from './Spinner';
export { default } from './Spinner';
