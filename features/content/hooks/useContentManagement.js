/* eslint-env browser, es2020 */
/* global AbortController, fetch, localStorage, console, URLSearchParams */
import { useState, useEffect, useCallback, useRef } from "react";

/**
 * Content Management Hook
 *
 * Provides comprehensive content management functionality including:
 * - Content CRUD operations with caching
 * - AI-powered content generation and optimization
 * - Real-time collaboration features
 * - Content analytics and insights
 * - Search and filtering capabilities
 * - Version control and history management
 * - Multilingual content support
 * - SEO optimization tools
 * - Performance tracking and metrics
 */
const useContentManagement = () => {
  // State management
  const [content, setContent] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [searchHistory, setSearchHistory] = useState([]);
  const [recentContent, setRecentContent] = useState([]);
  const [recommendations, setRecommendations] = useState([]);

  // Cache and performance optimization
  const cacheRef = useRef(new Map());
  const abortControllerRef = useRef(null);
  const lastFetchParams = useRef(null);

  // API base URL
  const API_BASE = "/api/content";

  // Generic API request handler with caching and error handling
  const apiRequest = useCallback(async (endpoint, options = {}) => {
    try {
      // Cancel previous request if still pending
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();
      const { signal } = abortControllerRef.current;

      const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        signal,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
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
    } catch (error) {
      if (error.name === "AbortError") {
        return null; // Request was cancelled
      }
      console.error("API request failed:", error);
      throw error;
    }
  }, []);

  // Fetch content with filtering, search, and pagination
  const fetchContent = useCallback(
    async (params = {}) => {
      setLoading(true);
      setError(null);

      try {
        // Build query parameters
        const queryParams = new URLSearchParams();

        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== "") {
            queryParams.append(key, value);
          }
        });

        // Check cache for this request
        const cacheKey = queryParams.toString();
        const cachedData = cacheRef.current.get(cacheKey);

        if (cachedData && Date.now() - cachedData.timestamp < 30000) {
          // 30-second cache
          setContent(cachedData.content);
          setPagination(cachedData.pagination);
          setLoading(false);
          return cachedData;
        }

        const result = await apiRequest(`?${queryParams}`);

        if (result) {
          setContent(result.data || []);
          setPagination(result.pagination);

          // Cache the result
          cacheRef.current.set(cacheKey, {
            content: result.data || [],
            pagination: result.pagination,
            timestamp: Date.now(),
          });

          // Update search history if this was a search
          if (params.search) {
            setSearchHistory((prev) => {
              const newHistory = [
                params.search,
                ...prev.filter((term) => term !== params.search),
              ];
              return newHistory.slice(0, 10); // Keep last 10 searches
            });
          }

          lastFetchParams.current = params;
        }
      } catch (error) {
        setError(error.message);
        setContent([]);
        setPagination(null);
      } finally {
        setLoading(false);
      }
    },
    [apiRequest]
  );

  // Create new content
  const createContent = useCallback(
    async (contentData) => {
      setLoading(true);
      setError(null);

      try {
        const result = await apiRequest("", {
          method: "POST",
          body: JSON.stringify(contentData),
        });

        if (result?.success) {
          // Add to recent content
          setRecentContent((prev) => [result.data, ...prev.slice(0, 9)]);

          // Clear cache to force refresh
          cacheRef.current.clear();

          // Refresh content list if we have previous fetch parameters
          if (lastFetchParams.current) {
            await fetchContent(lastFetchParams.current);
          }

          return result.data;
        }

        throw new Error(result?.message || "Failed to create content");
      } catch (error) {
        setError(error.message);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [apiRequest, fetchContent]
  );

  // Update existing content
  const updateContent = useCallback(
    async (contentId, updates) => {
      setLoading(true);
      setError(null);

      try {
        const result = await apiRequest(`/${contentId}`, {
          method: "PUT",
          body: JSON.stringify(updates),
        });

        if (result?.success) {
          // Update content in current list
          setContent((prev) =>
            prev.map((item) =>
              item._id === contentId ? { ...item, ...result.data } : item
            )
          );

          // Clear cache
          cacheRef.current.clear();

          return result.data;
        }

        throw new Error(result?.message || "Failed to update content");
      } catch (error) {
        setError(error.message);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [apiRequest]
  );

  // Delete content
  const deleteContent = useCallback(
    async (contentId, permanent = false) => {
      setLoading(true);
      setError(null);

      try {
        const queryParam = permanent ? "?permanent=true" : "";
        const result = await apiRequest(`/${contentId}${queryParam}`, {
          method: "DELETE",
        });

        if (result?.success) {
          // Remove from current list
          setContent((prev) => prev.filter((item) => item._id !== contentId));

          // Clear cache
          cacheRef.current.clear();

          return true;
        }

        throw new Error(result?.message || "Failed to delete content");
      } catch (error) {
        setError(error.message);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [apiRequest]
  );

  // Duplicate content
  const duplicateContent = useCallback(
    async (contentId, options = {}) => {
      setLoading(true);
      setError(null);

      try {
        const result = await apiRequest(`/${contentId}/duplicate`, {
          method: "POST",
          body: JSON.stringify(options),
        });

        if (result?.success) {
          // Add to content list
          setContent((prev) => [result.data, ...prev]);

          // Clear cache
          cacheRef.current.clear();

          return result.data;
        }

        throw new Error(result?.message || "Failed to duplicate content");
      } catch (error) {
        setError(error.message);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [apiRequest]
  );

  // Analyze content quality and SEO
  const analyzeContent = useCallback(
    async (contentId) => {
      setLoading(true);
      setError(null);

      try {
        const result = await apiRequest(`/${contentId}/analyze`, {
          method: "POST",
        });

        if (result?.success) {
          // Update content analysis in current list
          setContent((prev) =>
            prev.map((item) =>
              item._id === contentId
                ? {
                    ...item,
                    analysis: result.data,
                    qualityScore: result.data.quality?.overallScore || 0,
                  }
                : item
            )
          );

          return result.data;
        }

        throw new Error(result?.message || "Failed to analyze content");
      } catch (error) {
        setError(error.message);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [apiRequest]
  );

  // Optimize content using AI
  const optimizeContent = useCallback(
    async (contentId, autoApply = false) => {
      setLoading(true);
      setError(null);

      try {
        const result = await apiRequest(`/${contentId}/optimize`, {
          method: "POST",
          body: JSON.stringify({ autoApply }),
        });

        if (result?.success) {
          if (autoApply && result.data) {
            // Update content in current list
            setContent((prev) =>
              prev.map((item) =>
                item._id === contentId ? { ...item, ...result.data } : item
              )
            );
          }

          return result;
        }

        throw new Error(result?.message || "Failed to optimize content");
      } catch (error) {
        setError(error.message);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [apiRequest]
  );

  // Translate content to multiple languages
  const translateContent = useCallback(
    async (contentId, targetLanguages, options = {}) => {
      setLoading(true);
      setError(null);

      try {
        const result = await apiRequest(`/${contentId}/translate`, {
          method: "POST",
          body: JSON.stringify({ targetLanguages, options }),
        });

        if (result?.success) {
          // Add translated content to list
          if (result.data?.translations) {
            const translatedItems = Object.values(result.data.translations);
            setContent((prev) => [...translatedItems, ...prev]);
          }

          return result.data;
        }

        throw new Error(result?.message || "Failed to translate content");
      } catch (error) {
        setError(error.message);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [apiRequest]
  );

  // Publish content
  const publishContent = useCallback(
    async (contentId, options = {}) => {
      setLoading(true);
      setError(null);

      try {
        const result = await apiRequest(`/${contentId}/publish`, {
          method: "POST",
          body: JSON.stringify(options),
        });

        if (result?.success) {
          // Update content status
          setContent((prev) =>
            prev.map((item) =>
              item._id === contentId
                ? {
                    ...item,
                    status: "published",
                    publishedAt: new Date().toISOString(),
                  }
                : item
            )
          );

          return result.data;
        }

        throw new Error(result?.message || "Failed to publish content");
      } catch (error) {
        setError(error.message);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [apiRequest]
  );

  // Archive content
  const archiveContent = useCallback(
    async (contentId) => {
      setLoading(true);
      setError(null);

      try {
        const result = await apiRequest(`/${contentId}`, {
          method: "PUT",
          body: JSON.stringify({ status: "archived" }),
        });

        if (result?.success) {
          // Update content status
          setContent((prev) =>
            prev.map((item) =>
              item._id === contentId ? { ...item, status: "archived" } : item
            )
          );

          return result.data;
        }

        throw new Error(result?.message || "Failed to archive content");
      } catch (error) {
        setError(error.message);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [apiRequest]
  );

  // Generate content recommendations
  const generateRecommendations = useCallback(
    async (contentId = null, limit = 10) => {
      try {
        const queryParams = new URLSearchParams({ limit: limit.toString() });
        if (contentId) {
          queryParams.append("contentId", contentId);
        }

        const result = await apiRequest(`/recommendations?${queryParams}`);

        if (result?.success) {
          setRecommendations(result.data?.recommendations || []);
          return result.data;
        }

        throw new Error(
          result?.message || "Failed to generate recommendations"
        );
      } catch (error) {
        console.error("Recommendations error:", error);
        return { recommendations: [] };
      }
    },
    [apiRequest]
  );

  // Get content analytics
  const getAnalytics = useCallback(
    async (contentId = null, timeframe = "30d") => {
      try {
        const queryParams = new URLSearchParams({ timeframe });
        if (contentId) {
          queryParams.append("contentId", contentId);
        }

        const result = await apiRequest(`/analytics?${queryParams}`);

        if (result?.success) {
          return result.data;
        }

        throw new Error(result?.message || "Failed to get analytics");
      } catch (error) {
        console.error("Analytics error:", error);
        return null;
      }
    },
    [apiRequest]
  );

  // Search content with advanced filters
  const searchContent = useCallback(
    async (query, filters = {}) => {
      setLoading(true);
      setError(null);

      try {
        const queryParams = new URLSearchParams({ q: query, ...filters });
        const result = await apiRequest(`/search?${queryParams}`);

        if (result?.success) {
          setContent(result.data || []);
          setPagination(result.pagination);

          // Add to search history
          setSearchHistory((prev) => {
            const newHistory = [
              query,
              ...prev.filter((term) => term !== query),
            ];
            return newHistory.slice(0, 10);
          });

          return result.data;
        }

        throw new Error(result?.message || "Search failed");
      } catch (error) {
        setError(error.message);
        setContent([]);
      } finally {
        setLoading(false);
      }
    },
    [apiRequest]
  );

  // Get content metrics
  const getContentMetrics = useCallback(async () => {
    try {
      const result = await apiRequest("/metrics");

      if (result?.success) {
        setMetrics(result.data);
        return result.data;
      }

      return null;
    } catch (error) {
      console.error("Metrics error:", error);
      return null;
    }
  }, [apiRequest]);

  // Collaborative editing
  const handleCollaborativeEdit = useCallback(
    async (contentId, edit) => {
      try {
        const result = await apiRequest(`/${contentId}/collaborate`, {
          method: "POST",
          body: JSON.stringify({ edit }),
        });

        if (result?.success) {
          // Update content in real-time
          setContent((prev) =>
            prev.map((item) =>
              item._id === contentId
                ? { ...item, ...result.data.content }
                : item
            )
          );

          return result.data;
        }

        throw new Error(result?.message || "Collaborative edit failed");
      } catch (error) {
        console.error("Collaborative edit error:", error);
        throw error;
      }
    },
    [apiRequest]
  );

  // Load initial data and metrics
  useEffect(() => {
    getContentMetrics();
    generateRecommendations();
  }, [getContentMetrics, generateRecommendations]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    // State
    content,
    loading,
    error,
    pagination,
    metrics,
    searchHistory,
    recentContent,
    recommendations,

    // Content operations
    fetchContent,
    createContent,
    updateContent,
    deleteContent,
    duplicateContent,
    searchContent,

    // AI operations
    analyzeContent,
    optimizeContent,
    translateContent,
    generateRecommendations,

    // Publishing operations
    publishContent,
    archiveContent,

    // Analytics and insights
    getAnalytics,
    getContentMetrics,

    // Collaboration
    handleCollaborativeEdit,

    // Utilities
    clearError: () => setError(null),
    clearCache: () => cacheRef.current.clear(),
    refreshContent: () =>
      lastFetchParams.current && fetchContent(lastFetchParams.current),
  };
};

export default useContentManagement;
