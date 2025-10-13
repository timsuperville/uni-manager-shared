/* eslint-env browser, es2020 */
/* global fetch, localStorage, console, URLSearchParams, AbortController, setInterval, clearInterval */
import { useState, useCallback, useRef, useEffect } from 'react';

/**
 * Content Generation Hook
 *
 * Provides AI-powered content generation functionality including:
 * - OpenAI GPT-4 integration for content creation
 * - Intelligent prompt optimization and engineering
 * - Multi-format content generation (markdown, HTML, text)
 * - Real-time generation progress tracking
 * - Content quality analysis and optimization
 * - Template library and prompt management
 * - Generation history and analytics
 * - Custom tone and style configurations
 * - SEO optimization and keyword integration
 * - Collaborative generation workflows
 */
const useContentGeneration = () => {
  // State management
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentGeneration, setCurrentGeneration] = useState(null);
  const [generationHistory, setGenerationHistory] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [error, setError] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [promptOptimizations, setPromptOptimizations] = useState([]);

  // Generation state tracking
  const [generationQueue, setGenerationQueue] = useState([]);
  const [batchProgress, setBatchProgress] = useState(null);
  const [recentPrompts, setRecentPrompts] = useState([]);
  const [savedPrompts, setSavedPrompts] = useState([]);

  // Performance and caching
  const abortControllerRef = useRef(null);
  const progressIntervalRef = useRef(null);
  const generationCacheRef = useRef(new Map());

  // API configuration
  const API_BASE = '/api/content';

  // Generic API request handler
  const apiRequest = useCallback(async (endpoint, options = {}) => {
    try {
      // Cancel previous request if still pending
      if (abortControllerRef.current && options.cancelPrevious !== false) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();
      const { signal } = abortControllerRef.current;

      const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        signal,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${typeof localStorage !== "undefined" && localStorage.getItem('token')}`,
          ...options.headers,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `HTTP ${response.status}: ${response.statusText}`
        );
      }

      const data = await response.json();
      return data;
    } catch (_error) {
      if (error.name === 'AbortError') {
        return null;
      }
      // console.error('API request failed:', error);
      throw error;
    }
  }, []);

  // Progress simulation for better UX
  const simulateProgress = useCallback((duration = 30000) => {
    setProgress(0);
    const startTime = Date.now();

    progressIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progressPercent = Math.min((elapsed / duration) * 90, 90); // Cap at 90% until completion
      setProgress(progressPercent);

      if (progressPercent >= 90) {
        clearInterval(progressIntervalRef.current);
      }
    }, 500);
  }, []);

  // Generate content using AI
  const generateContent = useCallback(
    async (generationConfig) => {
      setGenerating(true);
      setError(null);
      setProgress(0);

      try {
        // Validate required parameters
        if (!generationConfig.prompt || !generationConfig.contentType) {
          throw new Error('Prompt and content type are required');
        }

        // Check cache for similar generation
        const cacheKey = JSON.stringify({
          prompt: generationConfig.prompt,
          contentType: generationConfig.contentType,
          tone: generationConfig.tone,
          style: generationConfig.style,
          keywords: generationConfig.keywords?.slice(0, 5), // Limit for cache key
        });

        const cachedResult = generationCacheRef.current.get(cacheKey);
        if (cachedResult && Date.now() - cachedResult.timestamp < 300000) {
          // 5-minute cache
          setCurrentGeneration(cachedResult.data);
          setProgress(100);
          setGenerating(false);
          return cachedResult.data;
        }

        // Start progress simulation
        simulateProgress(generationConfig.estimatedDuration || 30000);

        // Prepare generation request
        const generationPayload = {
          prompt: generationConfig.prompt,
          contentType: generationConfig.contentType,
          format: generationConfig.format || 'markdown',
          tone: generationConfig.tone || 'professional',
          style: generationConfig.style || 'informative',
          targetAudience: generationConfig.targetAudience || 'general',
          keywords: generationConfig.keywords || [],
          length: generationConfig.length || 'medium',
          creativity: generationConfig.creativity || 0.7,
          includeOutline: generationConfig.includeOutline || false,
          seoOptimize: generationConfig.seoOptimize || false,
          language: generationConfig.language || 'en',
          customInstructions: generationConfig.customInstructions || '',
          templateId: generationConfig.templateId || null,
        };

        const result = await apiRequest('/generate', {
          method: 'POST',
          body: JSON.stringify(generationPayload),
        });

        if (result?.success) {
          const generatedContent = result.data;

          // Complete progress
          clearInterval(progressIntervalRef.current);
          setProgress(100);
          setCurrentGeneration(generatedContent);

          // Cache the result
          generationCacheRef.current.set(cacheKey, {
            data: generatedContent,
            timestamp: Date.now(),
          });

          // Add to generation history
          setGenerationHistory((prev) => [
            {
              id: Date.now().toString(),
              config: generationConfig,
              result: generatedContent,
              timestamp: new Date().toISOString(),
              duration: Date.now() - (generatedContent.startTime || Date.now()),
            },
            ...prev.slice(0, 49),
          ]); // Keep last 50 generations

          // Add prompt to recent prompts
          setRecentPrompts((prev) => {
            const newPrompts = [
              generationConfig.prompt,
              ...prev.filter((p) => p !== generationConfig.prompt),
            ];
            return newPrompts.slice(0, 20); // Keep last 20 prompts
          });

          return generatedContent;
        }

        throw new Error(result?.message || 'Content generation failed');
      } catch (_error) {
        clearInterval(progressIntervalRef.current);
        setError(error.message);
        setProgress(0);
        throw error;
      } finally {
        setGenerating(false);
      }
    },
    [apiRequest, simulateProgress]
  );

  // Optimize prompt for better generation results
  const optimizePrompt = useCallback(
    async (originalPrompt, contentType, context = {}) => {
      try {
        const result = await apiRequest('/optimize-prompt', {
          method: 'POST',
          body: JSON.stringify({
            prompt: originalPrompt,
            contentType,
            context,
          }),
        });

        if (result?.success) {
          const optimization = result.data;

          // Add to optimization history
          setPromptOptimizations((prev) => [
            {
              id: Date.now().toString(),
              original: originalPrompt,
              optimized: optimization.optimizedPrompt,
              suggestions: optimization.suggestions || [],
              improvements: optimization.improvements || [],
              timestamp: new Date().toISOString(),
            },
            ...prev.slice(0, 19),
          ]); // Keep last 20 optimizations

          return optimization;
        }

        throw new Error(result?.message || 'Prompt optimization failed');
      } catch (_error) {
        // console.error('Prompt optimization error:', error);
        return null;
      }
    },
    [apiRequest]
  );

  // Generate multiple content variations
  const generateVariations = useCallback(
    async (baseConfig, variationCount = 3) => {
      setGenerating(true);
      setError(null);
      setBatchProgress({ current: 0, total: variationCount, variations: [] });

      try {
        const variations = [];

        for (let i = 0; i < variationCount; i++) {
          setBatchProgress((prev) => ({ ...prev, current: i }));

          // Create variation config with different creativity/tone
          const variationConfig = {
            ...baseConfig,
            creativity: Math.max(
              0.3,
              Math.min(1.0, baseConfig.creativity + (Math.random() - 0.5) * 0.4)
            ),
            customInstructions:
              `${baseConfig.customInstructions || ''} Generate variation ${i + 1} with unique approach.`.trim(),
          };

          const variation = await generateContent(variationConfig);
          variations.push({
            ...variation,
            variationIndex: i + 1,
            variationConfig,
          });

          setBatchProgress((prev) => ({
            ...prev,
            current: i + 1,
            variations: [...prev.variations, variation],
          }));
        }

        setBatchProgress({
          current: variationCount,
          total: variationCount,
          variations,
          completed: true,
        });
        return variations;
      } catch (_error) {
        setError(error.message);
        throw error;
      } finally {
        setGenerating(false);
      }
    },
    [generateContent]
  );

  // Analyze generated content quality
  const analyzeGeneration = useCallback(
    async (generatedContent) => {
      try {
        const result = await apiRequest('/analyze-generation', {
          method: 'POST',
          body: JSON.stringify({
            content: generatedContent.content,
            metadata: generatedContent.metadata || {},
          }),
        });

        if (result?.success) {
          return result.data;
        }

        throw new Error(result?.message || 'Generation analysis failed');
      } catch (_error) {
        // console.error('Generation analysis error:', error);
        return null;
      }
    },
    [apiRequest]
  );

  // Load and manage templates
  const loadTemplates = useCallback(
    async (category = null) => {
      try {
        const queryParams = new URLSearchParams();
        if (category) {
          queryParams.append('category', category);
        }

        const result = await apiRequest(`/templates?${queryParams}`);

        if (result?.success) {
          setTemplates(result.data || []);
          return result.data;
        }

        return [];
      } catch (_error) {
        // console.error('Template loading error:', error);
        return [];
      }
    },
    [apiRequest]
  );

  // Save custom template
  const saveTemplate = useCallback(
    async (templateData) => {
      try {
        const result = await apiRequest('/templates', {
          method: 'POST',
          body: JSON.stringify(templateData),
        });

        if (result?.success) {
          setTemplates((prev) => [result.data, ...prev]);
          return result.data;
        }

        throw new Error(result?.message || 'Failed to save template');
      } catch (_error) {
        // console.error('Template save error:', error);
        throw error;
      }
    },
    [apiRequest]
  );

  // Save prompt for reuse
  const savePrompt = useCallback(
    async (promptData) => {
      try {
        const savedPrompt = {
          id: Date.now().toString(),
          ...promptData,
          timestamp: new Date().toISOString(),
        };

        setSavedPrompts((prev) => [savedPrompt, ...prev.slice(0, 49)]); // Keep last 50 saved prompts

        // Optionally save to backend
        const result = await apiRequest('/prompts', {
          method: 'POST',
          body: JSON.stringify(savedPrompt),
        });

        if (result?.success) {
          return result.data;
        }

        return savedPrompt;
      } catch (_error) {
        // console.error('Prompt save error:', error);
        // Still return local save even if backend fails
        return {
          id: Date.now().toString(),
          ...promptData,
          timestamp: new Date().toISOString(),
        };
      }
    },
    [apiRequest]
  );

  // Get generation analytics
  const getGenerationAnalytics = useCallback(
    async (timeframe = '30d') => {
      try {
        const result = await apiRequest(
          `/generation-analytics?timeframe=${timeframe}`
        );

        if (result?.success) {
          setAnalytics(result.data);
          return result.data;
        }

        return null;
      } catch (_error) {
        // console.error('Analytics error:', error);
        return null;
      }
    },
    [apiRequest]
  );

  // Enhanced content generation with quality control
  const generateEnhancedContent = useCallback(
    async (config) => {
      try {
        // First, optimize the prompt
        const optimizedPrompt = await optimizePrompt(
          config.prompt,
          config.contentType,
          { targetAudience: config.targetAudience, keywords: config.keywords }
        );

        // Use optimized prompt if available
        const enhancedConfig = {
          ...config,
          prompt: optimizedPrompt?.optimizedPrompt || config.prompt,
          customInstructions: [
            config.customInstructions || '',
            ...(optimizedPrompt?.improvements || []),
          ]
            .filter(Boolean)
            .join(' '),
        };

        // Generate content
        const generatedContent = await generateContent(enhancedConfig);

        // Analyze quality
        const qualityAnalysis = await analyzeGeneration(generatedContent);

        // Return enhanced result
        return {
          ...generatedContent,
          promptOptimization: optimizedPrompt,
          qualityAnalysis,
          enhanced: true,
        };
      } catch (_error) {
        // Fallback to standard generation
        // console.error(
          'Enhanced generation failed, falling back to standard:',
          error
        );
        return await generateContent(config);
      }
    },
    [generateContent, optimizePrompt, analyzeGeneration]
  );

  // Batch generation for multiple contents
  const batchGenerate = useCallback(
    async (generationConfigs) => {
      setGenerating(true);
      setError(null);
      setGenerationQueue(generationConfigs);
      setBatchProgress({
        current: 0,
        total: generationConfigs.length,
        results: [],
      });

      try {
        const results = [];

        for (let i = 0; i < generationConfigs.length; i++) {
          setBatchProgress((prev) => ({ ...prev, current: i }));

          try {
            const result = await generateContent(generationConfigs[i]);
            results.push({ success: true, data: result, index: i });
          } catch (_error) {
            results.push({ success: false, error: error.message, index: i });
          }

          setBatchProgress((prev) => ({
            ...prev,
            current: i + 1,
            results: [...prev.results, results[results.length - 1]],
          }));
        }

        setBatchProgress((prev) => ({ ...prev, completed: true }));
        return results;
      } catch (_error) {
        setError(error.message);
        throw error;
      } finally {
        setGenerating(false);
        setGenerationQueue([]);
      }
    },
    [generateContent]
  );

  // Load initial data
  useEffect(() => {
    loadTemplates();
    getGenerationAnalytics();
  }, [loadTemplates, getGenerationAnalytics]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, []);

  return {
    // State
    generating,
    progress,
    currentGeneration,
    generationHistory,
    templates,
    error,
    analytics,
    promptOptimizations,
    generationQueue,
    batchProgress,
    recentPrompts,
    savedPrompts,

    // Core generation functions
    generateContent,
    generateEnhancedContent,
    generateVariations,
    batchGenerate,

    // Prompt management
    optimizePrompt,
    savePrompt,

    // Template management
    loadTemplates,
    saveTemplate,

    // Analysis and optimization
    analyzeGeneration,
    getGenerationAnalytics,

    // Utilities
    clearError: () => setError(null),
    clearHistory: () => setGenerationHistory([]),
    clearCache: () => generationCacheRef.current.clear(),
    cancelGeneration: () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      setGenerating(false);
      setProgress(0);
    },
    resetProgress: () => {
      setProgress(0);
      setBatchProgress(null);
    },
  };
};

export default useContentGeneration;
