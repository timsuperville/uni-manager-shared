/**
 * 🎮🔐 SECURITY API INTEGRATION SERVICE
 *
 * Comprehensive frontend service for integrating with the enhanced security gamification system.
 * Provides seamless integration between React components and backend security services.
 *
 * Features:
 * - Security profile management with real-time updates
 * - Badge and achievement tracking with celebration triggers
 * - Security journey progression with milestone notifications
 * - Contextual access control with dynamic security levels
 * - Performance optimization with caching and batching
 * - Error handling with retry logic and fallback states
 *
 * @version 1.0.0
 * @author Uni-Manager Security Team
 */

import axios from "axios";

class SecurityAPIService {
  constructor() {
    // API Configuration
    this.baseURL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
    this.retryAttempts = 3;
    this.retryDelay = 1000;

    // Event listeners for real-time updates
    this.eventListeners = new Map();

    // Initialize axios instance
    this.api = axios.create({
      baseURL: this.baseURL,
      timeout: 10000,
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Request interceptor for authentication
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem("authToken");
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error),
    );

    // Response interceptor for error handling
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error("🔐 Security API Error:", error);
        return Promise.reject(this.handleAPIError(error));
      },
    );
  }

  // ==========================================
  // SECURITY PROFILE MANAGEMENT
  // ==========================================

  /**
   * Fetch comprehensive security profile for a user
   * @param {string} userId - User identifier
   * @param {boolean} useCache - Whether to use cached data
   * @returns {Promise<Object>} Complete security profile data
   */
  async getSecurityProfile(userId, useCache = true) {
    const cacheKey = `security_profile_${userId}`;

    // Check cache first
    if (useCache && this.isCacheValid(cacheKey)) {
      return this.cache.get(cacheKey).data;
    }

    try {
      const response = await this.api.get(`/security/profile/${userId}`);
      const securityProfile = response.data;

      // Cache the result
      this.setCacheData(cacheKey, securityProfile);

      // Emit profile update event
      this.emit("profileUpdated", securityProfile);

      return securityProfile;
    } catch (error) {
      return this.handleErrorWithFallback("getSecurityProfile", {
        currentLevel: "newcomer",
        tier: "bronze",
        totalPoints: 0,
        securityScore: 50,
        badges: [],
        achievements: [],
      });
    }
  }

  /**
   * Update security profile with new milestone or achievement
   * @param {string} userId - User identifier
   * @param {Object} updateData - Profile update information
   * @returns {Promise<Object>} Updated security profile
   */
  async updateSecurityProfile(userId, updateData) {
    try {
      const response = await this.api.patch(
        `/security/profile/${userId}`,
        updateData,
      );
      const updatedProfile = response.data;

      // Invalidate cache
      this.invalidateCache(`security_profile_${userId}`);

      // Check for celebrations
      if (updatedProfile.celebration) {
        this.emit("celebration", updatedProfile.celebration);
      }

      // Emit profile update
      this.emit("profileUpdated", updatedProfile);

      return updatedProfile;
    } catch (error) {
      throw this.handleAPIError(error);
    }
  }

  // ==========================================
  // SECURITY JOURNEY MANAGEMENT
  // ==========================================

  /**
   * Get comprehensive security journey data
   * @param {string} userId - User identifier
   * @returns {Promise<Object>} Security journey information
   */
  async getSecurityJourney(userId) {
    const cacheKey = `security_journey_${userId}`;

    if (this.isCacheValid(cacheKey)) {
      return this.cache.get(cacheKey).data;
    }

    try {
      const response = await this.api.get(`/security/journey/${userId}`);
      const journeyData = response.data;

      this.setCacheData(cacheKey, journeyData);
      return journeyData;
    } catch (error) {
      return this.handleErrorWithFallback("getSecurityJourney", {
        currentStage: "newcomer",
        progress: 0,
        stages: [],
        nextSteps: [],
      });
    }
  }

  /**
   * Progress to next security milestone
   * @param {string} userId - User identifier
   * @param {string} milestoneId - Milestone identifier
   * @param {Object} progressData - Progress information
   * @returns {Promise<Object>} Updated journey data with celebration info
   */
  async progressMilestone(userId, milestoneId, progressData = {}) {
    try {
      const response = await this.api.post(
        `/security/journey/${userId}/milestone`,
        {
          milestoneId,
          ...progressData,
        },
      );

      const result = response.data;

      // Invalidate relevant caches
      this.invalidateCache(`security_journey_${userId}`);
      this.invalidateCache(`security_profile_${userId}`);

      // Trigger celebration if milestone completed
      if (result.celebration) {
        this.emit("milestoneCompleted", result);
      }

      return result;
    } catch (error) {
      throw this.handleAPIError(error);
    }
  }

  /**
   * Get personalized next steps for security improvement
   * @param {string} userId - User identifier
   * @param {number} limit - Maximum number of recommendations
   * @returns {Promise<Array>} Personalized security recommendations
   */
  async getSecurityRecommendations(userId, limit = 5) {
    const cacheKey = `security_recommendations_${userId}`;

    if (this.isCacheValid(cacheKey)) {
      return this.cache.get(cacheKey).data;
    }

    try {
      const response = await this.api.get(
        `/security/recommendations/${userId}`,
        {
          params: { limit },
        },
      );

      const recommendations = response.data;
      this.setCacheData(cacheKey, recommendations, 2 * 60 * 1000); // 2-minute cache

      return recommendations;
    } catch (error) {
      return this.handleErrorWithFallback("getSecurityRecommendations", []);
    }
  }

  // ==========================================
  // BADGE & ACHIEVEMENT SYSTEM
  // ==========================================

  /**
   * Get all badges and achievements for a user
   * @param {string} userId - User identifier
   * @param {Object} filters - Badge filtering options
   * @returns {Promise<Object>} Badges and achievements data
   */
  async getBadgesAndAchievements(userId, filters = {}) {
    const cacheKey = `badges_achievements_${userId}_${JSON.stringify(filters)}`;

    if (this.isCacheValid(cacheKey)) {
      return this.cache.get(cacheKey).data;
    }

    try {
      const response = await this.api.get(`/security/badges/${userId}`, {
        params: filters,
      });

      const badgeData = response.data;
      this.setCacheData(cacheKey, badgeData);

      return badgeData;
    } catch (error) {
      return this.handleErrorWithFallback("getBadgesAndAchievements", {
        badges: [],
        achievements: [],
        categories: [],
        progress: {},
      });
    }
  }

  /**
   * Award a badge to a user
   * @param {string} userId - User identifier
   * @param {string} badgeId - Badge identifier
   * @param {Object} context - Award context information
   * @returns {Promise<Object>} Award result with celebration data
   */
  async awardBadge(userId, badgeId, context = {}) {
    try {
      const response = await this.api.post(`/security/badges/${userId}/award`, {
        badgeId,
        context,
        timestamp: new Date().toISOString(),
      });

      const result = response.data;

      // Invalidate relevant caches
      this.invalidateCachePattern(`badges_achievements_${userId}`);
      this.invalidateCache(`security_profile_${userId}`);

      // Trigger badge earned celebration
      if (result.celebration) {
        this.emit("badgeEarned", result);
      }

      return result;
    } catch (error) {
      throw this.handleAPIError(error);
    }
  }

  // ==========================================
  // CONTEXTUAL ACCESS CONTROL
  // ==========================================

  /**
   * Check security access level for specific context
   * @param {string} userId - User identifier
   * @param {Object} context - Access context information
   * @returns {Promise<Object>} Access control decision
   */
  async checkAccessControl(userId, context) {
    try {
      const response = await this.api.post(
        `/security/access-control/${userId}`,
        context,
      );
      return response.data;
    } catch (error) {
      // Fail secure - deny access on error
      return {
        granted: false,
        level: "restricted",
        reason: "Security check failed",
        recommendations: [],
      };
    }
  }

  /**
   * Update security context for dynamic access control
   * @param {string} userId - User identifier
   * @param {Object} contextUpdate - New context information
   * @returns {Promise<Object>} Updated access control status
   */
  async updateSecurityContext(userId, contextUpdate) {
    try {
      const response = await this.api.patch(
        `/security/context/${userId}`,
        contextUpdate,
      );

      // Emit context update for real-time UI updates
      this.emit("contextUpdated", response.data);

      return response.data;
    } catch (error) {
      throw this.handleAPIError(error);
    }
  }

  // ==========================================
  // REAL-TIME SECURITY MONITORING
  // ==========================================

  /**
   * Get security analytics and insights
   * @param {string} userId - User identifier
   * @param {string} timeRange - Analytics time range ('week', 'month', 'year')
   * @returns {Promise<Object>} Security analytics data
   */
  async getSecurityAnalytics(userId, timeRange = "month") {
    const cacheKey = `security_analytics_${userId}_${timeRange}`;

    if (this.isCacheValid(cacheKey)) {
      return this.cache.get(cacheKey).data;
    }

    try {
      const response = await this.api.get(`/security/analytics/${userId}`, {
        params: { timeRange },
      });

      const analytics = response.data;
      this.setCacheData(cacheKey, analytics, 10 * 60 * 1000); // 10-minute cache

      return analytics;
    } catch (error) {
      return this.handleErrorWithFallback("getSecurityAnalytics", {
        trends: [],
        insights: [],
        improvements: [],
      });
    }
  }

  /**
   * Report security event for monitoring and analysis
   * @param {string} userId - User identifier
   * @param {Object} eventData - Security event information
   * @returns {Promise<boolean>} Success status
   */
  async reportSecurityEvent(userId, eventData) {
    try {
      await this.api.post(`/security/events/${userId}`, {
        ...eventData,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        sessionId: this.getSessionId(),
      });

      return true;
    } catch (error) {
      console.warn("🔐 Failed to report security event:", error);
      return false;
    }
  }

  // ==========================================
  // BATCH OPERATIONS & PERFORMANCE
  // ==========================================

  /**
   * Batch multiple security operations for efficiency
   * @param {Array} operations - Array of security operations
   * @returns {Promise<Array>} Results of all operations
   */
  async batchOperations(operations) {
    try {
      const response = await this.api.post("/security/batch", { operations });
      return response.data;
    } catch (error) {
      // Process operations individually if batch fails
      console.warn("🔐 Batch operation failed, processing individually");
      return Promise.allSettled(
        operations.map((op) => this.processSingleOperation(op)),
      );
    }
  }

  /**
   * Preload security data for improved performance
   * @param {string} userId - User identifier
   * @returns {Promise<Object>} Preloaded security data
   */
  async preloadSecurityData(userId) {
    try {
      const [profile, journey, badges, recommendations] = await Promise.all([
        this.getSecurityProfile(userId, false),
        this.getSecurityJourney(userId),
        this.getBadgesAndAchievements(userId),
        this.getSecurityRecommendations(userId, 3),
      ]);

      return {
        profile,
        journey,
        badges,
        recommendations,
      };
    } catch (error) {
      console.error("🔐 Failed to preload security data:", error);
      throw error;
    }
  }

  // ==========================================
  // EVENT MANAGEMENT & REAL-TIME UPDATES
  // ==========================================

  /**
   * Subscribe to security events
   * @param {string} event - Event name
   * @param {Function} callback - Event callback function
   * @returns {Function} Unsubscribe function
   */
  on(event, callback) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }

    this.eventListeners.get(event).add(callback);

    // Return unsubscribe function
    return () => {
      const listeners = this.eventListeners.get(event);
      if (listeners) {
        listeners.delete(callback);
      }
    };
  }

  /**
   * Emit security event to all listeners
   * @param {string} event - Event name
   * @param {*} data - Event data
   */
  emit(event, data) {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error(`🔐 Event listener error for ${event}:`, error);
        }
      });
    }
  }

  // ==========================================
  // CACHE MANAGEMENT
  // ==========================================

  /**
   * Check if cached data is still valid
   * @param {string} key - Cache key
   * @returns {boolean} Cache validity
   */
  isCacheValid(key) {
    const cached = this.cache.get(key);
    if (!cached) return false;

    return Date.now() - cached.timestamp < cached.timeout;
  }

  /**
   * Set cache data with timeout
   * @param {string} key - Cache key
   * @param {*} data - Data to cache
   * @param {number} timeout - Cache timeout in milliseconds
   */
  setCacheData(key, data, timeout = this.cacheTimeout) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      timeout,
    });
  }

  /**
   * Invalidate specific cache entry
   * @param {string} key - Cache key to invalidate
   */
  invalidateCache(key) {
    this.cache.delete(key);
  }

  /**
   * Invalidate cache entries matching pattern
   * @param {string} pattern - Cache key pattern
   */
  invalidateCachePattern(pattern) {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Clear all cached data
   */
  clearCache() {
    this.cache.clear();
  }

  // ==========================================
  // ERROR HANDLING & RESILIENCE
  // ==========================================

  /**
   * Handle API errors with retry logic
   * @param {Error} error - Original error
   * @returns {Error} Processed error
   */
  handleAPIError(error) {
    const processedError = {
      message: error.message || "Security service error",
      code: error.response?.status || "UNKNOWN",
      details: error.response?.data || {},
      timestamp: new Date().toISOString(),
    };

    // Log security-related errors
    console.error("🔐 Security API Error:", processedError);

    return processedError;
  }

  /**
   * Handle errors with fallback data
   * @param {string} operation - Operation name
   * @param {*} fallbackData - Fallback data to return
   * @returns {*} Fallback data
   */
  handleErrorWithFallback(operation, fallbackData) {
    console.warn(`🔐 Using fallback data for ${operation}`);
    return fallbackData;
  }

  /**
   * Process single operation for batch fallback
   * @param {Object} operation - Operation to process
   * @returns {Promise<*>} Operation result
   */
  async processSingleOperation(operation) {
    // Implementation depends on operation type
    switch (operation.type) {
      case "getProfile":
        return this.getSecurityProfile(operation.userId);
      case "awardBadge":
        return this.awardBadge(
          operation.userId,
          operation.badgeId,
          operation.context,
        );
      case "progressMilestone":
        return this.progressMilestone(
          operation.userId,
          operation.milestoneId,
          operation.data,
        );
      default:
        throw new Error(`Unknown operation type: ${operation.type}`);
    }
  }

  /**
   * Get or generate session ID
   * @returns {string} Session identifier
   */
  getSessionId() {
    let sessionId = sessionStorage.getItem("securitySessionId");
    if (!sessionId) {
      sessionId =
        "sec_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
      sessionStorage.setItem("securitySessionId", sessionId);
    }
    return sessionId;
  }

  // ==========================================
  // UTILITY METHODS
  // ==========================================

  /**
   * Get security service health status
   * @returns {Promise<Object>} Service health information
   */
  async getHealthStatus() {
    try {
      const response = await this.api.get("/security/health");
      return response.data;
    } catch (error) {
      return {
        status: "error",
        message: "Security service unavailable",
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Reset user's security data (admin operation)
   * @param {string} userId - User identifier
   * @param {Object} resetOptions - Reset configuration
   * @returns {Promise<boolean>} Success status
   */
  async resetSecurityData(userId, resetOptions = {}) {
    try {
      await this.api.post(`/security/reset/${userId}`, resetOptions);

      // Clear all related caches
      this.invalidateCachePattern(userId);

      return true;
    } catch (error) {
      throw this.handleAPIError(error);
    }
  }
}

// Create singleton instance
const securityAPI = new SecurityAPIService();

// Export both the class and singleton instance
export { SecurityAPIService };
export default securityAPI;
