/**
 * Advanced Session Analytics Service
 *
 * Comprehensive session tracking with behavioral analysis, device fingerprinting,
 * location tracking, session risk scoring, and security analytics integration
 */

import CryptoJS from "crypto-js";

// Global browser API declarations for linting
/* global console, navigator, screen, window, document, Intl, fetch, clearTimeout, setTimeout, clearInterval, setInterval */

class AdvancedSessionAnalyticsService {
  constructor() {
    this.apiBaseUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";
    this.sessionId = null;
    this.deviceFingerprint = null;
    this.behaviorMetrics = new Map();
    this.sessionStartTime = null;
    this.lastActivityTime = null;
    this.riskScore = 0;
    this.isTracking = false;

    // Behavioral tracking configuration
    this.behaviorConfig = {
      keystrokePatterns: true,
      mouseBehavior: true,
      scrollPatterns: true,
      clickAnalysis: true,
      navigationPatterns: true,
      typingSpeed: true,
      idleDetection: true,
      deviceOrientation: true,
    };

    // Risk scoring weights
    this.riskWeights = {
      deviceMismatch: 0.3,
      locationAnomaly: 0.25,
      behaviorDeviation: 0.2,
      suspiciousActivity: 0.15,
      timeAnomalies: 0.1,
    };

    // Behavior baselines (will be populated from user's historical data)
    this.behaviorBaselines = {
      averageTypingSpeed: null,
      mouseMovementPatterns: null,
      clickFrequency: null,
      scrollSpeed: null,
      navigationPatterns: null,
    };

    this.eventListeners = new Map();
    this.behaviorQueue = [];
    this.batchInterval = 30000; // 30 seconds
    this.batchTimer = null;
  }

  /**
   * Initialize session analytics tracking
   */
  async initialize(userId = null) {
    try {
      this.sessionId = this.generateSessionId();
      this.sessionStartTime = Date.now();
      this.lastActivityTime = Date.now();

      // Generate comprehensive device fingerprint
      this.deviceFingerprint = await this.generateDeviceFingerprint();

      // Load user behavior baselines if userId provided
      if (userId) {
        await this.loadBehaviorBaselines(userId);
      }

      // Start behavioral tracking
      this.startBehaviorTracking();

      // Initialize session with backend
      await this.initializeSession();

      // Start batch processing
      this.startBatchProcessing();

      this.isTracking = true;
      console.log("Advanced Session Analytics initialized:", this.sessionId);

      return {
        sessionId: this.sessionId,
        deviceFingerprint: this.deviceFingerprint,
        startTime: this.sessionStartTime,
      };
    } catch (error) {
      console.error("Failed to initialize session analytics:", error);
      throw error;
    }
  }

  /**
   * Generate unique session ID
   */
  generateSessionId() {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2);
    const fingerprint = this.deviceFingerprint || "unknown";
    return CryptoJS.SHA256(`${timestamp}-${random}-${fingerprint}`).toString();
  }

  /**
   * Generate comprehensive device fingerprint
   */
  async generateDeviceFingerprint() {
    const fingerprint = {
      // Browser information
      userAgent: navigator.userAgent,
      language: navigator.language,
      languages: navigator.languages,
      platform: navigator.platform,
      cookieEnabled: navigator.cookieEnabled,
      doNotTrack: navigator.doNotTrack,

      // Screen and display
      screenWidth: screen.width,
      screenHeight: screen.height,
      screenColorDepth: screen.colorDepth,
      pixelRatio: window.devicePixelRatio,
      availableScreenWidth: screen.availWidth,
      availableScreenHeight: screen.availHeight,

      // Viewport
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,

      // Time zone and locale
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      timezoneOffset: new Date().getTimezoneOffset(),

      // Hardware information
      hardwareConcurrency: navigator.hardwareConcurrency,
      deviceMemory: navigator.deviceMemory,

      // Features detection
      localStorage: !!window.localStorage,
      sessionStorage: !!window.sessionStorage,
      indexedDB: !!window.indexedDB,
      webGL: this.detectWebGL(),
      canvas: this.generateCanvasFingerprint(),
      audio: await this.generateAudioFingerprint(),

      // Additional identifiers
      plugins: this.getPluginsList(),
      fonts: await this.detectFonts(),

      // Timestamp
      generated: Date.now(),
    };

    // Create hash of all fingerprint data
    const fingerprintString = JSON.stringify(fingerprint);
    const hash = CryptoJS.SHA256(fingerprintString).toString();

    return {
      hash,
      details: fingerprint,
    };
  }

  /**
   * Detect WebGL capabilities
   */
  detectWebGL() {
    try {
      const canvas = document.createElement("canvas");
      const gl =
        canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
      if (!gl) return null;

      return {
        vendor: gl.getParameter(gl.VENDOR),
        renderer: gl.getParameter(gl.RENDERER),
        version: gl.getParameter(gl.VERSION),
        shadingLanguageVersion: gl.getParameter(gl.SHADING_LANGUAGE_VERSION),
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Generate canvas fingerprint
   */
  generateCanvasFingerprint() {
    try {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      // Draw complex pattern
      ctx.textBaseline = "top";
      ctx.font = "14px Arial";
      ctx.fillStyle = "#f60";
      ctx.fillRect(125, 1, 62, 20);
      ctx.fillStyle = "#069";
      ctx.fillText("Session Analytics 🔒", 2, 15);
      ctx.fillStyle = "rgba(102, 204, 0, 0.7)";
      ctx.fillText("Device Fingerprinting", 4, 45);

      return canvas.toDataURL();
    } catch (error) {
      return null;
    }
  }

  /**
   * Generate audio fingerprint
   */
  async generateAudioFingerprint() {
    try {
      const audioContext = new (window.AudioContext ||
        window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const analyser = audioContext.createAnalyser();
      const gainNode = audioContext.createGain();

      oscillator.type = "triangle";
      oscillator.frequency.value = 10000;

      gainNode.gain.value = 0;

      oscillator.connect(analyser);
      analyser.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.start(0);

      const frequencyData = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(frequencyData);

      oscillator.stop();
      await audioContext.close();

      return Array.from(frequencyData.slice(0, 30)).join(",");
    } catch (error) {
      return null;
    }
  }

  /**
   * Get plugins list
   */
  getPluginsList() {
    if (!navigator.plugins) return [];

    return Array.from(navigator.plugins).map((plugin) => ({
      name: plugin.name,
      filename: plugin.filename,
      description: plugin.description,
    }));
  }

  /**
   * Detect available fonts
   */
  async detectFonts() {
    const baseFonts = ["monospace", "sans-serif", "serif"];
    const testFonts = [
      "Arial",
      "Helvetica",
      "Times New Roman",
      "Times",
      "Georgia",
      "Verdana",
      "Courier New",
      "Trebuchet MS",
      "Comic Sans MS",
      "Impact",
      "Arial Black",
      "Tahoma",
      "Lucida Console",
    ];

    const detectedFonts = [];

    for (const font of testFonts) {
      if (await this.isFontAvailable(font, baseFonts)) {
        detectedFonts.push(font);
      }
    }

    return detectedFonts;
  }

  /**
   * Check if font is available
   */
  async isFontAvailable(fontName, baseFonts) {
    const testString = "mmmmmmmmmmlli";
    const testSize = "72px";

    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    // Measure text with base fonts
    const baseWidths = baseFonts.map((baseFont) => {
      context.font = `${testSize} ${baseFont}`;
      return context.measureText(testString).width;
    });

    // Measure text with test font + base font fallback
    return baseFonts.some((baseFont, index) => {
      context.font = `${testSize} ${fontName}, ${baseFont}`;
      const width = context.measureText(testString).width;
      return width !== baseWidths[index];
    });
  }

  /**
   * Load user behavior baselines
   */
  async loadBehaviorBaselines(userId) {
    try {
      const response = await fetch(
        `${this.apiBaseUrl}/api/session-analytics/behavior-baselines/${userId}`,
        {
          credentials: "include",
        }
      );

      if (response.ok) {
        this.behaviorBaselines = await response.json();
      } else {
        console.log(
          "No existing behavior baselines found, will create new ones"
        );
      }
    } catch (error) {
      console.warn("Failed to load behavior baselines:", error);
    }
  }

  /**
   * Start behavioral tracking
   */
  startBehaviorTracking() {
    if (!this.isTracking) return;

    // Keystroke pattern analysis
    if (this.behaviorConfig.keystrokePatterns) {
      this.addEventTracker("keydown", this.trackKeystrokePatterns.bind(this));
      this.addEventTracker("keyup", this.trackKeystrokePatterns.bind(this));
    }

    // Mouse behavior tracking
    if (this.behaviorConfig.mouseBehavior) {
      this.addEventTracker("mousemove", this.trackMouseBehavior.bind(this));
      this.addEventTracker("mousedown", this.trackMouseBehavior.bind(this));
      this.addEventTracker("mouseup", this.trackMouseBehavior.bind(this));
    }

    // Click analysis
    if (this.behaviorConfig.clickAnalysis) {
      this.addEventTracker("click", this.trackClickBehavior.bind(this));
    }

    // Scroll patterns
    if (this.behaviorConfig.scrollPatterns) {
      this.addEventTracker("scroll", this.trackScrollBehavior.bind(this));
    }

    // Navigation patterns
    if (this.behaviorConfig.navigationPatterns) {
      window.addEventListener("beforeunload", this.trackNavigation.bind(this));
      window.addEventListener("popstate", this.trackNavigation.bind(this));
    }

    // Device orientation
    if (
      this.behaviorConfig.deviceOrientation &&
      window.DeviceOrientationEvent
    ) {
      window.addEventListener(
        "deviceorientation",
        this.trackDeviceOrientation.bind(this)
      );
    }

    // Idle detection
    if (this.behaviorConfig.idleDetection) {
      this.startIdleDetection();
    }
  }

  /**
   * Add event tracker with throttling
   */
  addEventTracker(eventType, handler, throttleMs = 100) {
    let lastCall = 0;
    const throttledHandler = (event) => {
      const now = Date.now();
      if (now - lastCall >= throttleMs) {
        lastCall = now;
        handler(event);
      }
    };

    document.addEventListener(eventType, throttledHandler);
    this.eventListeners.set(eventType, throttledHandler);
  }

  /**
   * Track keystroke patterns
   */
  trackKeystrokePatterns(event) {
    const timestamp = Date.now();
    this.lastActivityTime = timestamp;

    const keystrokeData = {
      type: "keystroke",
      timestamp,
      eventType: event.type,
      keyCode: event.keyCode,
      key: event.key,
      altKey: event.altKey,
      ctrlKey: event.ctrlKey,
      shiftKey: event.shiftKey,
      repeat: event.repeat,
    };

    this.addBehaviorData(keystrokeData);
    this.analyzeTypingSpeed(keystrokeData);
  }

  /**
   * Track mouse behavior
   */
  trackMouseBehavior(event) {
    const timestamp = Date.now();
    this.lastActivityTime = timestamp;

    const mouseData = {
      type: "mouse",
      timestamp,
      eventType: event.type,
      x: event.clientX,
      y: event.clientY,
      button: event.button,
      buttons: event.buttons,
      movementX: event.movementX,
      movementY: event.movementY,
    };

    this.addBehaviorData(mouseData);
    this.analyzeMousePatterns(mouseData);
  }

  /**
   * Track click behavior
   */
  trackClickBehavior(event) {
    const timestamp = Date.now();
    this.lastActivityTime = timestamp;

    const clickData = {
      type: "click",
      timestamp,
      x: event.clientX,
      y: event.clientY,
      button: event.button,
      target: event.target.tagName,
      targetId: event.target.id,
      targetClass: event.target.className,
    };

    this.addBehaviorData(clickData);
    this.analyzeClickPatterns(clickData);
  }

  /**
   * Track scroll behavior
   */
  trackScrollBehavior(event) {
    const timestamp = Date.now();
    this.lastActivityTime = timestamp;

    const scrollData = {
      type: "scroll",
      timestamp,
      scrollX: window.scrollX,
      scrollY: window.scrollY,
      deltaX: event.deltaX,
      deltaY: event.deltaY,
      deltaMode: event.deltaMode,
    };

    this.addBehaviorData(scrollData);
    this.analyzeScrollPatterns(scrollData);
  }

  /**
   * Track navigation patterns
   */
  trackNavigation(event) {
    const timestamp = Date.now();

    const navigationData = {
      type: "navigation",
      timestamp,
      eventType: event.type,
      url: window.location.href,
      referrer: document.referrer,
      sessionDuration: timestamp - this.sessionStartTime,
    };

    this.addBehaviorData(navigationData);
  }

  /**
   * Track device orientation
   */
  trackDeviceOrientation(event) {
    const timestamp = Date.now();

    const orientationData = {
      type: "orientation",
      timestamp,
      alpha: event.alpha,
      beta: event.beta,
      gamma: event.gamma,
      absolute: event.absolute,
    };

    this.addBehaviorData(orientationData);
  }

  /**
   * Start idle detection
   */
  startIdleDetection() {
    let idleTimer;
    const idleThreshold = 300000; // 5 minutes

    const resetIdleTimer = () => {
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        this.addBehaviorData({
          type: "idle",
          timestamp: Date.now(),
          duration: idleThreshold,
        });
      }, idleThreshold);
    };

    // Reset timer on any activity
    [
      "mousedown",
      "mousemove",
      "keypress",
      "scroll",
      "touchstart",
      "click",
    ].forEach((event) => {
      document.addEventListener(event, resetIdleTimer);
    });

    resetIdleTimer();
  }

  /**
   * Add behavior data to queue
   */
  addBehaviorData(data) {
    this.behaviorQueue.push(data);

    // Update risk score in real-time for certain events
    this.updateRiskScore(data);
  }

  /**
   * Analyze typing speed patterns
   */
  analyzeTypingSpeed(keystrokeData) {
    if (!this.behaviorMetrics.has("typing")) {
      this.behaviorMetrics.set("typing", {
        keystrokes: [],
        averageSpeed: 0,
        speedVariance: 0,
      });
    }

    const typing = this.behaviorMetrics.get("typing");
    typing.keystrokes.push(keystrokeData);

    // Calculate WPM if we have enough data
    if (typing.keystrokes.length >= 10) {
      const recentKeystrokes = typing.keystrokes.slice(-10);
      const timeSpan =
        recentKeystrokes[recentKeystrokes.length - 1].timestamp -
        recentKeystrokes[0].timestamp;
      const wpm = (recentKeystrokes.length / (timeSpan / 60000)) * 12; // Assuming 5 chars per word

      typing.averageSpeed = wpm;
      this.behaviorMetrics.set("typing", typing);
    }
  }

  /**
   * Analyze mouse movement patterns
   */
  analyzeMousePatterns(mouseData) {
    if (!this.behaviorMetrics.has("mouse")) {
      this.behaviorMetrics.set("mouse", {
        movements: [],
        velocity: 0,
        acceleration: 0,
        jitter: 0,
      });
    }

    const mouse = this.behaviorMetrics.get("mouse");
    mouse.movements.push(mouseData);

    // Calculate velocity and acceleration
    if (mouse.movements.length >= 2) {
      const current = mouse.movements[mouse.movements.length - 1];
      const previous = mouse.movements[mouse.movements.length - 2];

      const distance = Math.sqrt(
        Math.pow(current.x - previous.x, 2) +
          Math.pow(current.y - previous.y, 2)
      );
      const timeDiff = current.timestamp - previous.timestamp;

      if (timeDiff > 0) {
        mouse.velocity = distance / timeDiff;

        if (mouse.movements.length >= 3) {
          const prevPrevious = mouse.movements[mouse.movements.length - 3];
          const prevDistance = Math.sqrt(
            Math.pow(previous.x - prevPrevious.x, 2) +
              Math.pow(previous.y - prevPrevious.y, 2)
          );
          const prevTimeDiff = previous.timestamp - prevPrevious.timestamp;
          const prevVelocity =
            prevTimeDiff > 0 ? prevDistance / prevTimeDiff : 0;

          mouse.acceleration = (mouse.velocity - prevVelocity) / timeDiff;
        }
      }

      this.behaviorMetrics.set("mouse", mouse);
    }
  }

  /**
   * Analyze click patterns
   */
  analyzeClickPatterns(clickData) {
    if (!this.behaviorMetrics.has("clicks")) {
      this.behaviorMetrics.set("clicks", {
        clicks: [],
        frequency: 0,
        doubleClickSpeed: 0,
        patterns: [],
      });
    }

    const clicks = this.behaviorMetrics.get("clicks");
    clicks.clicks.push(clickData);

    // Calculate click frequency
    if (clicks.clicks.length >= 5) {
      const recentClicks = clicks.clicks.slice(-5);
      const timeSpan =
        recentClicks[recentClicks.length - 1].timestamp -
        recentClicks[0].timestamp;
      clicks.frequency = recentClicks.length / (timeSpan / 1000); // clicks per second
    }

    this.behaviorMetrics.set("clicks", clicks);
  }

  /**
   * Analyze scroll patterns
   */
  analyzeScrollPatterns(scrollData) {
    if (!this.behaviorMetrics.has("scroll")) {
      this.behaviorMetrics.set("scroll", {
        scrollEvents: [],
        speed: 0,
        smoothness: 0,
        patterns: [],
      });
    }

    const scroll = this.behaviorMetrics.get("scroll");
    scroll.scrollEvents.push(scrollData);

    // Calculate scroll speed
    if (scroll.scrollEvents.length >= 2) {
      const current = scroll.scrollEvents[scroll.scrollEvents.length - 1];
      const previous = scroll.scrollEvents[scroll.scrollEvents.length - 2];

      const distance = Math.abs(current.scrollY - previous.scrollY);
      const timeDiff = current.timestamp - previous.timestamp;

      if (timeDiff > 0) {
        scroll.speed = distance / timeDiff;
      }
    }

    this.behaviorMetrics.set("scroll", scroll);
  }

  /**
   * Update risk score based on behavior analysis
   */
  updateRiskScore(behaviorData) {
    let riskAdjustment = 0;

    // Check for suspicious patterns
    if (behaviorData.type === "mouse") {
      // Unrealistic mouse movements
      if (behaviorData.movementX > 1000 || behaviorData.movementY > 1000) {
        riskAdjustment += 0.1;
      }
    }

    if (behaviorData.type === "keystroke") {
      // Extremely fast typing (possible bot)
      const typing = this.behaviorMetrics.get("typing");
      if (typing && typing.averageSpeed > 200) {
        // >200 WPM is suspicious
        riskAdjustment += 0.15;
      }
    }

    if (behaviorData.type === "click") {
      // Rapid clicking patterns
      const clicks = this.behaviorMetrics.get("clicks");
      if (clicks && clicks.frequency > 10) {
        // >10 clicks per second
        riskAdjustment += 0.1;
      }
    }

    // Update overall risk score
    this.riskScore = Math.min(
      1.0,
      Math.max(0.0, this.riskScore + riskAdjustment)
    );
  }

  /**
   * Initialize session with backend
   */
  async initializeSession() {
    try {
      const sessionData = {
        sessionId: this.sessionId,
        deviceFingerprint: this.deviceFingerprint,
        startTime: this.sessionStartTime,
        userAgent: navigator.userAgent,
        ipAddress: await this.getClientIP(),
        location: await this.getGeolocation(),
        initialRiskScore: this.riskScore,
      };

      const response = await fetch(
        `${this.apiBaseUrl}/api/session-analytics/initialize`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(sessionData),
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to initialize session: ${response.statusText}`);
      }

      const result = await response.json();
      console.log("Session initialized successfully:", result);
    } catch (error) {
      console.error("Failed to initialize session:", error);
      throw error;
    }
  }

  /**
   * Get client IP address
   */
  async getClientIP() {
    try {
      const response = await fetch("https://api.ipify.org?format=json");
      const data = await response.json();
      return data.ip;
    } catch (error) {
      console.warn("Failed to get client IP:", error);
      return null;
    }
  }

  /**
   * Get geolocation if available
   */
  async getGeolocation() {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve(null);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp,
          });
        },
        (error) => {
          console.warn("Geolocation access denied or failed:", error);
          resolve(null);
        },
        {
          timeout: 10000,
          enableHighAccuracy: false,
          maximumAge: 300000, // 5 minutes
        }
      );
    });
  }

  /**
   * Start batch processing of behavior data
   */
  startBatchProcessing() {
    this.batchTimer = setInterval(() => {
      this.processBehaviorBatch();
    }, this.batchInterval);
  }

  /**
   * Process batch of behavior data
   */
  async processBehaviorBatch() {
    if (this.behaviorQueue.length === 0) return;

    try {
      const batchData = {
        sessionId: this.sessionId,
        timestamp: Date.now(),
        behaviorData: [...this.behaviorQueue],
        behaviorMetrics: Object.fromEntries(this.behaviorMetrics),
        riskScore: this.riskScore,
        sessionDuration: Date.now() - this.sessionStartTime,
        lastActivity: this.lastActivityTime,
      };

      const response = await fetch(
        `${this.apiBaseUrl}/api/session-analytics/behavior-batch`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(batchData),
          credentials: "include",
        }
      );

      if (response.ok) {
        // Clear processed data
        this.behaviorQueue.length = 0;
        console.log("Behavior batch processed successfully");
      } else {
        console.warn("Failed to process behavior batch:", response.statusText);
      }
    } catch (error) {
      console.error("Error processing behavior batch:", error);
    }
  }

  /**
   * Get current session analytics summary
   */
  getSessionSummary() {
    return {
      sessionId: this.sessionId,
      deviceFingerprint: this.deviceFingerprint?.hash,
      startTime: this.sessionStartTime,
      duration: Date.now() - this.sessionStartTime,
      lastActivity: this.lastActivityTime,
      riskScore: this.riskScore,
      behaviorMetrics: Object.fromEntries(this.behaviorMetrics),
      isTracking: this.isTracking,
      queueSize: this.behaviorQueue.length,
    };
  }

  /**
   * Update session risk score manually
   */
  updateSessionRisk(newRiskScore, reason = "Manual update") {
    this.riskScore = Math.min(1.0, Math.max(0.0, newRiskScore));

    this.addBehaviorData({
      type: "risk_update",
      timestamp: Date.now(),
      oldRiskScore: this.riskScore,
      newRiskScore,
      reason,
    });
  }

  /**
   * Stop session analytics tracking
   */
  async stopTracking() {
    if (!this.isTracking) return;

    try {
      // Process final batch
      await this.processBehaviorBatch();

      // Send session end event
      await this.endSession();

      // Clear timers
      if (this.batchTimer) {
        clearInterval(this.batchTimer);
        this.batchTimer = null;
      }

      // Remove event listeners
      for (const [eventType, handler] of this.eventListeners) {
        document.removeEventListener(eventType, handler);
      }
      this.eventListeners.clear();

      this.isTracking = false;
      console.log("Session analytics tracking stopped");
    } catch (error) {
      console.error("Error stopping session tracking:", error);
    }
  }

  /**
   * End session with backend
   */
  async endSession() {
    try {
      const endData = {
        sessionId: this.sessionId,
        endTime: Date.now(),
        duration: Date.now() - this.sessionStartTime,
        finalRiskScore: this.riskScore,
        behaviorSummary: Object.fromEntries(this.behaviorMetrics),
      };

      const response = await fetch(
        `${this.apiBaseUrl}/api/session-analytics/end`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(endData),
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to end session: ${response.statusText}`);
      }

      console.log("Session ended successfully");
    } catch (error) {
      console.error("Failed to end session:", error);
    }
  }

  /**
   * Destroy instance and cleanup
   */
  destroy() {
    this.stopTracking();
    this.behaviorQueue.length = 0;
    this.behaviorMetrics.clear();
    this.eventListeners.clear();
  }
}

export default AdvancedSessionAnalyticsService;
