/**
 * Content Management System - Component and Hook Exports
 *
 * This index file provides centralized exports for the AI-Powered Content Management System,
 * including components, hooks, and utilities for comprehensive content management functionality.
 *
 * Features:
 * - Content CRUD operations with AI enhancement
 * - Real-time collaborative editing
 * - Advanced analytics and performance tracking
 * - Multi-format content generation and optimization
 * - SEO analysis and optimization tools
 * - Social media integration and preview
 * - Accessibility compliance checking
 * - Multi-language content support
 * - Template library and prompt management
 * - Content lifecycle management
 */

// Main Content Management Components
export { default as ContentManager } from './components/ContentManager';
export { default as ContentEditor } from './components/ContentEditor';
export { default as ContentAnalytics } from './components/ContentAnalytics';
export { default as ContentPreview } from './components/ContentPreview';
export { default as AIContentGenerator } from './components/AIContentGenerator';

// Content Management Hooks
export { default as useContentManagement } from './hooks/useContentManagement';
export { default as useContentGeneration } from './hooks/useContentGeneration';

// Import components and hooks for re-export
import ContentManager from './components/ContentManager';
import ContentEditor from './components/ContentEditor';
import ContentAnalytics from './components/ContentAnalytics';
import ContentPreview from './components/ContentPreview';
import AIContentGenerator from './components/AIContentGenerator';
import useContentManagement from './hooks/useContentManagement';
import useContentGeneration from './hooks/useContentGeneration';

// Component Groups for Convenience
export const ContentComponents = {
  Manager: ContentManager,
  Editor: ContentEditor,
  Analytics: ContentAnalytics,
  Preview: ContentPreview,
  AIGenerator: AIContentGenerator,
};

export const ContentHooks = {
  useContentManagement,
  useContentGeneration,
};

// Feature-specific exports
export const AIFeatures = {
  ContentGenerator: AIContentGenerator,
  useContentGeneration,
};

export const AnalyticsFeatures = {
  ContentAnalytics,
  useContentManagement,
};

export const EditingFeatures = {
  ContentEditor,
  ContentPreview,
  useContentManagement,
};

// All-in-one export for complete content management system
export const ContentManagementSystem = {
  // Components
  Components: ContentComponents,

  // Hooks
  Hooks: ContentHooks,

  // Feature Groups
  AI: AIFeatures,
  Analytics: AnalyticsFeatures,
  Editing: EditingFeatures,

  // Main entry points
  Manager: ContentManager,
  Editor: ContentEditor,
  Generator: AIContentGenerator,
  ContentAnalytics: ContentAnalytics,
  Preview: ContentPreview,

  // Hook shortcuts
  useContent: useContentManagement,
  useAI: useContentGeneration,
};

// Default export - Main Content Manager
export default ContentManager;
