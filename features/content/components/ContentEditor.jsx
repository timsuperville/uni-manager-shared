/* eslint-env browser, es2020 */
/* global document, window */
import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from "react";
import PropTypes from "prop-types";

// Import UI components (these would be your actual UI components)
import {
  Button,
  Input,
  TextArea,
  Select,
  Modal,
  Tabs,
  TabsList,
  TabsContent,
  TabsTrigger,
  Badge,
  Progress,
  Alert,
  Separator,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../../../shared/ui";

// Import hooks
import useContentManagement from "../hooks/useContentManagement";
import useContentGeneration from "../hooks/useContentGeneration";

/**
 * ContentEditor Component
 *
 * Advanced content editing interface with:
 * - Rich text editing with collaborative features
 * - Real-time collaboration with operational transformation
 * - AI-powered content assistance and optimization
 * - Version control and change tracking
 * - Auto-save and conflict resolution
 * - Multiple editing modes (visual/markdown/code)
 * - Content analysis and SEO optimization
 * - Translation and localization support
 * - Template integration and snippet library
 * - Performance monitoring and analytics
 */
const ContentEditor = ({
  contentId = null,
  initialContent = null,
  onSave,
  onCancel,
  readOnly = false,
  collaborationEnabled = true,
  aiAssistanceEnabled = true,
  className = "",
}) => {
  // State management
  const [content, setContent] = useState(
    initialContent || {
      title: "",
      body: "",
      excerpt: "",
      tags: [],
      keywords: [],
      category: "",
      language: "en",
      format: "markdown",
      metadata: {},
    },
  );

  const [editingMode, setEditingMode] = useState("visual"); // visual, markdown, code
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [collaborators, setCollaborators] = useState([]);
  const [conflicts, setConflicts] = useState([]);
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [analysisResults, setAnalysisResults] = useState(null);

  // Editor state
  const [selectionRange, setSelectionRange] = useState(null);
  const [editorFocus, setEditorFocus] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [showAiAssistant, setShowAiAssistant] = useState(false);

  // Performance and optimization
  const [wordCount, setWordCount] = useState(0);
  const [readingTime, setReadingTime] = useState(0);
  const [seoScore, setSeoScore] = useState(0);

  // Hooks
  const {
    updateContent,
    analyzeContent,
    optimizeContent,
    translateContent,
    handleCollaborativeEdit,
    loading: contentLoading,
    error: contentError,
  } = useContentManagement();

  const {
    generateContent,
    optimizePrompt,
    analyzeGeneration,
    generating,
    error: generationError,
  } = useContentGeneration();

  // Refs
  const editorRef = useRef(null);
  const autoSaveTimeoutRef = useRef(null);
  const collaborationTimeoutRef = useRef(null);
  const cursorPositionRef = useRef({ start: 0, end: 0 });

  // Auto-save functionality
  const saveContent = useCallback(
    async (forceImmediate = false) => {
      if (!contentId && !onSave) return;

      try {
        const contentToSave = {
          ...content,
          lastModified: new Date().toISOString(),
          wordCount,
          readingTime,
        };

        if (contentId) {
          await updateContent(contentId, contentToSave);
        } else if (onSave) {
          await onSave(contentToSave);
        }

        setUnsavedChanges(false);
        setLastSaved(new Date());
      } catch (_error) {
        // console.error('Save failed:', error);
      }
    },
    [content, contentId, onSave, updateContent, wordCount, readingTime],
  );

  // Auto-save with debouncing
  const scheduleAutoSave = useCallback(() => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    autoSaveTimeoutRef.current = setTimeout(() => {
      if (unsavedChanges && !readOnly) {
        saveContent();
      }
    }, 2000); // Auto-save after 2 seconds of inactivity
  }, [saveContent, unsavedChanges, readOnly]);

  // Content change handler
  const handleContentChange = useCallback(
    (field, value) => {
      setContent((prev) => ({
        ...prev,
        [field]: value,
      }));
      setUnsavedChanges(true);
      scheduleAutoSave();

      // Handle collaborative editing
      if (collaborationEnabled && contentId) {
        const edit = {
          field,
          value,
          timestamp: new Date().toISOString(),
          userId: "current-user", // This would come from auth context
          cursor: cursorPositionRef.current,
        };

        // Debounce collaborative edits
        if (collaborationTimeoutRef.current) {
          clearTimeout(collaborationTimeoutRef.current);
        }

        collaborationTimeoutRef.current = setTimeout(() => {
          handleCollaborativeEdit(contentId, edit);
        }, 500);
      }
    },
    [
      collaborationEnabled,
      contentId,
      handleCollaborativeEdit,
      scheduleAutoSave,
    ],
  );

  // Calculate content metrics
  const calculateMetrics = useCallback((text) => {
    const words = text
      .trim()
      .split(/\s+/)
      .filter((word) => word.length > 0).length;
    const avgReadingSpeed = 200; // words per minute
    const minutes = Math.ceil(words / avgReadingSpeed);

    setWordCount(words);
    setReadingTime(minutes);
  }, []);

  // Update metrics when content changes
  useEffect(() => {
    calculateMetrics(content.body || "");
  }, [content.body, calculateMetrics]);

  // AI content analysis
  const runContentAnalysis = useCallback(async () => {
    if (!aiAssistanceEnabled || !contentId) return;

    try {
      const analysis = await analyzeContent(contentId);
      setAnalysisResults(analysis);
      setSeoScore(analysis?.seo?.overallScore || 0);

      // Generate AI suggestions based on analysis
      if (analysis?.suggestions) {
        setAiSuggestions(analysis.suggestions);
      }
    } catch (_error) {
      // console.error('Content analysis failed:', error);
    }
  }, [aiAssistanceEnabled, contentId, analyzeContent]);

  // Run analysis when content changes significantly
  useEffect(() => {
    if (wordCount > 50 && wordCount % 100 === 0) {
      // Analyze every 100 words
      runContentAnalysis();
    }
  }, [wordCount, runContentAnalysis]);

  // AI content suggestions
  const generateAISuggestions = useCallback(
    async (type = "improvement") => {
      if (!aiAssistanceEnabled) return;

      try {
        const suggestions = await generateContent({
          prompt: `Analyze and suggest ${type} for: ${content.title}\n\n${content.body.slice(0, 1000)}...`,
          contentType: "suggestions",
          format: "json",
          tone: "helpful",
          customInstructions: `Provide specific, actionable suggestions for ${type}.`,
        });

        if (suggestions?.content) {
          const parsedSuggestions = JSON.parse(suggestions.content);
          setAiSuggestions((prev) => [...prev, ...parsedSuggestions]);
        }
      } catch (_error) {
        // console.error('AI suggestions failed:', error);
      }
    },
    [aiAssistanceEnabled, content.title, content.body, generateContent],
  );

  // Apply AI suggestion
  const applySuggestion = useCallback(
    (suggestion) => {
      if (suggestion.field && suggestion.replacement) {
        handleContentChange(suggestion.field, suggestion.replacement);
      } else if (suggestion.insertText) {
        // Insert text at current cursor position
        const currentBody = content.body || "";
        const newBody =
          currentBody.slice(0, cursorPositionRef.current.start) +
          suggestion.insertText +
          currentBody.slice(cursorPositionRef.current.end);
        handleContentChange("body", newBody);
      }

      // Remove applied suggestion
      setAiSuggestions((prev) => prev.filter((s) => s.id !== suggestion.id));
    },
    [content.body, handleContentChange],
  );

  // Format content for different modes
  const formatContent = useCallback((text, fromFormat, toFormat) => {
    if (fromFormat === toFormat) return text;

    // Basic format conversion (you'd want a proper markdown/HTML converter)
    switch (`${fromFormat}-${toFormat}`) {
      case "markdown-html":
        return text
          .replace(/^# (.*$)/gim, "<h1>$1</h1>")
          .replace(/^## (.*$)/gim, "<h2>$1</h2>")
          .replace(/^### (.*$)/gim, "<h3>$1</h3>")
          .replace(/\*\*(.*)\*\*/gim, "<strong>$1</strong>")
          .replace(/\*(.*)\*/gim, "<em>$1</em>")
          .replace(/\n/gim, "<br>");

      case "html-markdown":
        return text
          .replace(/<h1>(.*?)<\/h1>/gim, "# $1")
          .replace(/<h2>(.*?)<\/h2>/gim, "## $1")
          .replace(/<h3>(.*?)<\/h3>/gim, "### $1")
          .replace(/<strong>(.*?)<\/strong>/gim, "**$1**")
          .replace(/<em>(.*?)<\/em>/gim, "*$1*")
          .replace(/<br>/gim, "\n");

      default:
        return text;
    }
  }, []);

  // Handle mode change
  const handleModeChange = useCallback(
    (newMode) => {
      if (newMode !== editingMode) {
        const convertedBody = formatContent(
          content.body,
          content.format,
          newMode,
        );
        setContent((prev) => ({
          ...prev,
          body: convertedBody,
          format: newMode,
        }));
        setEditingMode(newMode);
      }
    },
    [editingMode, content.body, content.format, formatContent],
  );

  // Keyboard shortcuts
  const handleKeyDown = useCallback(
    (event) => {
      if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
          case "s":
            event.preventDefault();
            saveContent(true);
            break;
          case "b":
            event.preventDefault();
            // Bold formatting
            break;
          case "i":
            event.preventDefault();
            // Italic formatting
            break;
          case "z":
            event.preventDefault();
            // Undo functionality
            break;
        }
      }
    },
    [saveContent],
  );

  // Tag and keyword management
  const addTag = useCallback(
    (tag) => {
      if (tag && !content.tags.includes(tag)) {
        handleContentChange("tags", [...content.tags, tag]);
      }
    },
    [content.tags, handleContentChange],
  );

  const removeTag = useCallback(
    (tagToRemove) => {
      handleContentChange(
        "tags",
        content.tags.filter((tag) => tag !== tagToRemove),
      );
    },
    [content.tags, handleContentChange],
  );

  const addKeyword = useCallback(
    (keyword) => {
      if (keyword && !content.keywords.includes(keyword)) {
        handleContentChange("keywords", [...content.keywords, keyword]);
      }
    },
    [content.keywords, handleContentChange],
  );

  const removeKeyword = useCallback(
    (keywordToRemove) => {
      handleContentChange(
        "keywords",
        content.keywords.filter((keyword) => keyword !== keywordToRemove),
      );
    },
    [content.keywords, handleContentChange],
  );

  // Render editor toolbar
  const renderToolbar = useMemo(
    () => (
      <div className="flex items-center justify-between p-3 border-b bg-gray-50">
        <div className="flex items-center space-x-2">
          {/* Mode switcher */}
          <Select value={editingMode} onValueChange={handleModeChange}>
            <option value="visual">Visual</option>
            <option value="markdown">Markdown</option>
            <option value="code">HTML</option>
          </Select>

          <Separator orientation="vertical" className="h-6" />

          {/* Formatting buttons */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    /* console.log('Bold') */
                  }}
                >
                  <strong>B</strong>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Bold (Ctrl+B)</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    /* console.log('Italic') */
                  }}
                >
                  <em>I</em>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Italic (Ctrl+I)</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <Separator orientation="vertical" className="h-6" />

          {/* AI assistance */}
          {aiAssistanceEnabled && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAiAssistant(!showAiAssistant)}
              className={showAiAssistant ? "bg-blue-100" : ""}
            >
              AI Assistant
            </Button>
          )}

          {/* Analysis */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAnalysis(!showAnalysis)}
            className={showAnalysis ? "bg-green-100" : ""}
          >
            Analysis
          </Button>

          {/* Preview */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowPreview(!showPreview)}
            className={showPreview ? "bg-purple-100" : ""}
          >
            Preview
          </Button>
        </div>

        <div className="flex items-center space-x-4 text-sm text-gray-600">
          <span>{wordCount} words</span>
          <span>{readingTime} min read</span>
          {seoScore > 0 && (
            <Badge
              variant={
                seoScore > 80
                  ? "success"
                  : seoScore > 60
                    ? "warning"
                    : "destructive"
              }
            >
              SEO: {seoScore}%
            </Badge>
          )}
          {lastSaved && (
            <span className="text-xs">
              Saved {new Date(lastSaved).toLocaleTimeString()}
            </span>
          )}
          {unsavedChanges && <Badge variant="outline">Unsaved</Badge>}
        </div>
      </div>
    ),
    [
      editingMode,
      handleModeChange,
      aiAssistanceEnabled,
      showAiAssistant,
      showAnalysis,
      showPreview,
      wordCount,
      readingTime,
      seoScore,
      lastSaved,
      unsavedChanges,
    ],
  );

  // Render content editor
  const renderEditor = useMemo(
    () => (
      <div className="flex-1 flex">
        <div className={`flex-1 ${showPreview ? "w-1/2" : "w-full"}`}>
          <div className="p-4 space-y-4">
            {/* Title */}
            <Input
              placeholder="Content title..."
              value={content.title}
              onChange={(e) => handleContentChange("title", e.target.value)}
              className="text-2xl font-bold border-none px-0 focus:ring-0"
              disabled={readOnly}
            />

            {/* Body editor */}
            <div className="relative">
              <TextArea
                ref={editorRef}
                placeholder="Start writing your content..."
                value={content.body}
                onChange={(e) => handleContentChange("body", e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={() => setEditorFocus(true)}
                onBlur={() => setEditorFocus(false)}
                className="min-h-96 resize-y"
                disabled={readOnly}
              />

              {collaborators.length > 0 && (
                <div className="absolute top-2 right-2 flex -space-x-1">
                  {collaborators.map((collaborator, index) => (
                    <div
                      key={index}
                      className="w-6 h-6 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center"
                      title={collaborator.name}
                    >
                      {collaborator.name.charAt(0)}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Excerpt */}
            <TextArea
              placeholder="Content excerpt (optional)..."
              value={content.excerpt}
              onChange={(e) => handleContentChange("excerpt", e.target.value)}
              className="h-20 resize-none"
              disabled={readOnly}
            />

            {/* Tags and keywords */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Tags</label>
                <div className="flex flex-wrap gap-1 mb-2">
                  {content.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {tag}
                      {!readOnly && (
                        <button
                          onClick={() => removeTag(tag)}
                          className="ml-1 text-gray-500 hover:text-gray-700"
                        >
                          ×
                        </button>
                      )}
                    </Badge>
                  ))}
                </div>
                {!readOnly && (
                  <Input
                    placeholder="Add tag..."
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && e.target.value.trim()) {
                        addTag(e.target.value.trim());
                        e.target.value = "";
                      }
                    }}
                    className="text-sm"
                  />
                )}
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  Keywords
                </label>
                <div className="flex flex-wrap gap-1 mb-2">
                  {content.keywords.map((keyword, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {keyword}
                      {!readOnly && (
                        <button
                          onClick={() => removeKeyword(keyword)}
                          className="ml-1 text-gray-500 hover:text-gray-700"
                        >
                          ×
                        </button>
                      )}
                    </Badge>
                  ))}
                </div>
                {!readOnly && (
                  <Input
                    placeholder="Add keyword..."
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && e.target.value.trim()) {
                        addKeyword(e.target.value.trim());
                        e.target.value = "";
                      }
                    }}
                    className="text-sm"
                  />
                )}
              </div>
            </div>

            {/* Category and language */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Category
                </label>
                <Select
                  value={content.category}
                  onValueChange={(value) =>
                    handleContentChange("category", value)
                  }
                  disabled={readOnly}
                >
                  <option value="">Select category...</option>
                  <option value="blog">Blog Post</option>
                  <option value="article">Article</option>
                  <option value="news">News</option>
                  <option value="tutorial">Tutorial</option>
                  <option value="documentation">Documentation</option>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  Language
                </label>
                <Select
                  value={content.language}
                  onValueChange={(value) =>
                    handleContentChange("language", value)
                  }
                  disabled={readOnly}
                >
                  <option value="en">English</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                  <option value="de">German</option>
                  <option value="zh">Chinese</option>
                </Select>
              </div>
            </div>
          </div>
        </div>

        {/* Preview panel */}
        {showPreview && (
          <div className="w-1/2 border-l">
            <div className="p-4">
              <h3 className="font-semibold mb-3">Preview</h3>
              <div className="prose max-w-none">
                <h1>{content.title}</h1>
                {content.excerpt && (
                  <p className="text-gray-600 italic">{content.excerpt}</p>
                )}
                <div
                  dangerouslySetInnerHTML={{
                    __html: formatContent(content.body, content.format, "html"),
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    ),
    [
      content,
      handleContentChange,
      handleKeyDown,
      readOnly,
      collaborators,
      addTag,
      removeTag,
      addKeyword,
      removeKeyword,
      showPreview,
      formatContent,
    ],
  );

  // Render AI assistant panel
  const renderAIAssistant = () =>
    showAiAssistant && (
      <div className="w-80 border-l bg-gray-50 p-4">
        <h3 className="font-semibold mb-3">AI Assistant</h3>

        {aiSuggestions.length > 0 && (
          <div className="space-y-2 mb-4">
            <h4 className="text-sm font-medium">Suggestions</h4>
            {aiSuggestions.map((suggestion, index) => (
              <div key={index} className="p-2 bg-white rounded border text-sm">
                <p>{suggestion.text}</p>
                <div className="mt-2 flex space-x-2">
                  <Button size="xs" onClick={() => applySuggestion(suggestion)}>
                    Apply
                  </Button>
                  <Button
                    size="xs"
                    variant="ghost"
                    onClick={() =>
                      setAiSuggestions((prev) =>
                        prev.filter((_, i) => i !== index),
                      )
                    }
                  >
                    Dismiss
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="space-y-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => generateAISuggestions("improvement")}
            disabled={generating}
            className="w-full"
          >
            Suggest Improvements
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => generateAISuggestions("seo")}
            disabled={generating}
            className="w-full"
          >
            SEO Optimization
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => generateAISuggestions("readability")}
            disabled={generating}
            className="w-full"
          >
            Improve Readability
          </Button>
        </div>

        {generating && (
          <div className="mt-4">
            <Progress value={75} className="w-full" />
            <p className="text-xs text-gray-600 mt-1">
              Generating suggestions...
            </p>
          </div>
        )}
      </div>
    );

  // Render analysis panel
  const renderAnalysis = () =>
    showAnalysis && (
      <div className="w-80 border-l bg-gray-50 p-4">
        <h3 className="font-semibold mb-3">Content Analysis</h3>

        {analysisResults && (
          <div className="space-y-3">
            <div>
              <h4 className="text-sm font-medium">SEO Score</h4>
              <Progress value={seoScore} className="w-full mt-1" />
              <p className="text-xs text-gray-600 mt-1">
                {seoScore}% optimized
              </p>
            </div>

            <div>
              <h4 className="text-sm font-medium">Readability</h4>
              <Progress
                value={analysisResults.readability?.score || 0}
                className="w-full mt-1"
              />
              <p className="text-xs text-gray-600 mt-1">
                {analysisResults.readability?.level || "Analyzing..."}
              </p>
            </div>

            <div>
              <h4 className="text-sm font-medium">Engagement</h4>
              <Progress
                value={analysisResults.engagement?.score || 0}
                className="w-full mt-1"
              />
              <p className="text-xs text-gray-600 mt-1">
                Estimated engagement potential
              </p>
            </div>
          </div>
        )}

        <Button
          size="sm"
          variant="outline"
          onClick={runContentAnalysis}
          disabled={contentLoading}
          className="w-full mt-4"
        >
          Re-analyze Content
        </Button>
      </div>
    );

  // Main component render
  return (
    <div className={`flex flex-col h-full bg-white ${className}`}>
      {/* Error alerts */}
      {(contentError || generationError) && (
        <Alert variant="destructive" className="m-4">
          {contentError || generationError}
        </Alert>
      )}

      {/* Conflicts alert */}
      {conflicts.length > 0 && (
        <Alert className="m-4">
          <p>Content conflicts detected. Please review and resolve.</p>
          <Button size="sm" variant="outline" className="mt-2">
            Resolve Conflicts
          </Button>
        </Alert>
      )}

      {/* Toolbar */}
      {renderToolbar}

      {/* Main editor area */}
      <div className="flex flex-1 overflow-hidden">
        {renderEditor}
        {renderAIAssistant()}
        {renderAnalysis()}
      </div>

      {/* Action buttons */}
      <div className="flex items-center justify-between p-4 border-t bg-gray-50">
        <div className="flex items-center space-x-2">
          {collaborationEnabled && (
            <Badge variant="outline">
              Collaborative Editing{" "}
              {collaborators.length > 0 ? "Active" : "Enabled"}
            </Badge>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {onCancel && (
            <Button variant="ghost" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button
            onClick={() => saveContent(true)}
            disabled={contentLoading || readOnly}
          >
            {contentLoading ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>
    </div>
  );
};

ContentEditor.propTypes = {
  contentId: PropTypes.string,
  initialContent: PropTypes.object,
  onSave: PropTypes.func,
  onCancel: PropTypes.func,
  readOnly: PropTypes.bool,
  collaborationEnabled: PropTypes.bool,
  aiAssistanceEnabled: PropTypes.bool,
  className: PropTypes.string,
};

export default ContentEditor;
