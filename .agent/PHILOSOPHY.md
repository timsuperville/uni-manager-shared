# Shared Engineering Philosophy

## I. The Shared-First Mandate
Before creating a new UI component, modal pattern, or API utility in an application, verify if it belongs in `@timsuperville/shared`. Code duplication across domain apps increases maintenance overhead and leads to style drift.

## II. Clean Abstraction Layers
- **Tokens & CSS Variables**: Primitives define CSS variables (`--bg-primary`, `--accent-violet`, `--glass-bg`). Components consume tokens without knowing the parent app.
- **Theme Resilience**: Components must seamlessly render in both Light and Dark Liquid Glass themes.
- **Pure Functions & Headless Hooks**: Logic is separated from presentation. Utilities and hooks are unit tested in isolation from the DOM where possible.

## III. Non-Breaking Evolution
As a shared library consumed across multiple repositories, all breaking changes to exported signatures must be versioned and coordinated. Avoid silent signature alterations.
