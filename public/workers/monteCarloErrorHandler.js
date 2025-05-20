/**
 * Monte Carlo Error Handler
 * Helper script loaded by the worker for better error handling and recovery
 */

// Error monitoring variables
let errorCount = 0;
let lastError = null;
let memoryWarningIssued = false;
let performanceCheckpoints = [];
const MAX_TOLERATED_ERRORS = 5;
const PERFORMANCE_CHECKPOINT_INTERVAL = 1000; // iterations
const MEMORY_WARNING_THRESHOLD = 0.8; // 80% of available heap

/**
 * Enhanced error handler for Monte Carlo simulations
 * Provides comprehensive error detection, classification, and recovery strategies
 */
class MonteCarloErrorHandler {
  constructor() {
    this.warningIssued = false;
    this.slowIterationCount = 0;
    this.totalIterations = 0;
    this.startTime = Date.now();
    
    // Performance thresholds - milliseconds per iteration
    this.slowIterationThreshold = 5; // ms
    this.criticalSlowThreshold = 50; // ms
    
    // Memory tracking
    this.lastMemoryUsage = 0;
    this.memoryCheckInterval = 1000; // iterations
    this.memoryCheckTimerId = null;
    this.memoryGrowthRate = 0;
    
    // Track if we're operating in recovery mode
    this.recoveryMode = false;
    this.recoveryStrategy = null;
    this.recoveryAttempts = 0;
    this.maxRecoveryAttempts = 3;
    
    // Circuit breaker pattern implementation
    this.circuitOpen = false;
    this.circuitOpenTime = 0;
    this.circuitHalfOpenAttempts = 0;
    this.circuitResetTimeout = 5000; // ms
    
    // Resource awareness
    this.resourceAware = true;
    this.resourceMetrics = {
      cpu: 0,
      memory: 0,
      network: 'unknown'
    };
    
    // Adaptive thresholds based on system capabilities
    this.adaptiveThresholds = {
      memoryUsageLimit: typeof self.performance !== 'undefined' && 
                       self.performance.memory ? 
                       self.performance.memory.jsHeapSizeLimit * 0.8 : 
                       1073741824, // 1GB default
      iterationTimeLimit: 10, // ms per iteration
      batchSizeLimit: 1000
    };
    
    // Error patterns for trend detection
    this.errorPatterns = {
      memory: 0,
      performance: 0,
      calculation: 0,
      dataStructure: 0,
      network: 0
    };
    
    // Runtime diagnostics
    this.diagnostics = {
      lastIterationCount: 0,
      lastSpeedMeasurement: 0,
      iterationsPerSecond: 0,
      memoryGrowthRatePerIteration: 0,
      abnormalPatterns: []
    };
    
    // Cross-window communication for multi-window scenarios
    this.useSharedResources = false;
    if (typeof SharedArrayBuffer !== 'undefined' && typeof Atomics !== 'undefined') {
      try {
        this.useSharedResources = true;
      } catch (e) {
        this.useSharedResources = false;
      }
    }
  }
  
  /**
   * Initialize error handler for a new simulation
   * Sets up monitoring and resets state
   */
  initialize(config) {
    this.totalIterations = config.iterations || 1000;
    this.warningIssued = false;
    this.slowIterationCount = 0;
    this.lastMemoryUsage = 0;
    this.recoveryMode = false;
    this.recoveryStrategy = null;
    this.recoveryAttempts = 0;
    this.circuitOpen = false;
    this.startTime = Date.now();
    
    // Reset error counters and patterns
    errorCount = 0;
    lastError = null;
    memoryWarningIssued = false;
    performanceCheckpoints = [];
    this.errorPatterns = {
      memory: 0,
      performance: 0,
      calculation: 0,
      dataStructure: 0,
      network: 0
    };
    
    this.diagnostics.abnormalPatterns = [];
    
    // Calibrate thresholds based on iteration count and system capabilities
    this.calibrateThresholds(config);
    
    // Add unhandled exception handler
    self.addEventListener('error', this.handleGlobalError.bind(this));
    self.addEventListener('unhandledrejection', this.handlePromiseRejection.bind(this));
    
    // Start memory monitoring if available
    if (self.performance && self.performance.memory) {
      this.startMemoryMonitoring();
    }
    
    // Network condition detection if available
    this.detectNetworkConditions();
    
    // Detect browser tab visibility for better resource management
    if (typeof document !== 'undefined' && document.addEventListener) {
      document.addEventListener('visibilitychange', () => {
        this.adaptToVisibilityChange();
      });
    }
  }
  
  /**
   * Adapt thresholds based on browser visibility
   * Conserve resources when tab is not visible
   */
  adaptToVisibilityChange() {
    if (typeof document === 'undefined') return;
    
    if (document.hidden) {
      // Page is not visible, throttle processing
      this.adaptiveThresholds.batchSizeLimit = Math.floor(this.adaptiveThresholds.batchSizeLimit * 0.5);
      this.issueWarning({
        type: 'visibility_change',
        message: 'Page hidden, throttling simulation to conserve resources',
        throttleRatio: 0.5
      });
    } else {
      // Page visible again, restore processing
      this.calibrateThresholds({
        iterations: this.totalIterations
      });
      this.issueWarning({
        type: 'visibility_change',
        message: 'Page visible, restoring normal simulation parameters'
      });
    }
  }
  
  /**
   * Detect network conditions if available
   * Adapts simulation parameters to network quality
   */
  detectNetworkConditions() {
    if (typeof navigator !== 'undefined' && 'connection' in navigator) {
      const connection = navigator.connection;
      
      if (connection) {
        this.resourceMetrics.network = connection.effectiveType || 'unknown';
        
        // Save data mode detection
        if (connection.saveData) {
          this.adaptiveThresholds.batchSizeLimit = Math.min(this.adaptiveThresholds.batchSizeLimit, 200);
          this.issueWarning({
            type: 'save_data',
            message: 'Data saver mode detected, optimizing for lower data usage',
            batchSizeLimit: this.adaptiveThresholds.batchSizeLimit
          });
        }
        
        // Adapt batch size based on network quality
        if (connection.effectiveType === '2g') {
          this.adaptiveThresholds.batchSizeLimit = Math.min(this.adaptiveThresholds.batchSizeLimit, 100);
        } else if (connection.effectiveType === '3g') {
          this.adaptiveThresholds.batchSizeLimit = Math.min(this.adaptiveThresholds.batchSizeLimit, 250);
        }
        
        // Listen for connection changes
        connection.addEventListener('change', () => {
          this.resourceMetrics.network = connection.effectiveType || 'unknown';
          this.issueWarning({
            type: 'network_change',
            message: `Network conditions changed to ${connection.effectiveType}`,
            effectiveType: connection.effectiveType
          });
          
          // Recalibrate based on new network conditions
          this.calibrateThresholds({
            iterations: this.totalIterations
          });
        });
      }
    }
  }
  
  /**
   * Calibrate thresholds based on simulation configuration
   * and system capabilities
   */
  calibrateThresholds(config) {
    // Adjust thresholds based on iteration count
    if (config.iterations > 10000) {
      // Large simulations need tighter controls
      this.slowIterationThreshold = 3;
      this.criticalSlowThreshold = 30;
      this.adaptiveThresholds.batchSizeLimit = 500;
    } else if (config.iterations > 5000) {
      this.slowIterationThreshold = 5;
      this.criticalSlowThreshold = 40;
      this.adaptiveThresholds.batchSizeLimit = 750;
    }
    
    // Adjust thresholds based on parameters complexity
    if (config.parameters && config.parameters.length > 8) {
      // More parameters means more complex calculations
      this.slowIterationThreshold *= 1.5;
      this.criticalSlowThreshold *= 1.2;
    }
    
    // Adjust based on scenario count if available
    if (config.scenarios && config.scenarios.length > 3) {
      this.slowIterationThreshold *= 1.3;
    }
    
    // Precision level adjustment
    if (config.precision === 'High') {
      this.adaptiveThresholds.batchSizeLimit = Math.floor(this.adaptiveThresholds.batchSizeLimit * 0.8);
      this.slowIterationThreshold *= 1.5;
    } else if (config.precision === 'Preview') {
      this.adaptiveThresholds.batchSizeLimit = Math.floor(this.adaptiveThresholds.batchSizeLimit * 1.5);
    }
    
    // Adjust for Vietnam-specific tariff optimizations
    if (config.countryCode === 'VN' || (config.productInfo && config.productInfo.hsCode)) {
      // Vietnam tariff models are typically more complex
      this.slowIterationThreshold *= 1.2;
    }
    
    // Device capability detection (simplified)
    if (typeof navigator !== 'undefined') {
      // CPU cores detection
      if (navigator.hardwareConcurrency) {
        if (navigator.hardwareConcurrency <= 4) {
          // Lower-end device, be more conservative
          this.adaptiveThresholds.batchSizeLimit = Math.min(this.adaptiveThresholds.batchSizeLimit, 300);
          this.slowIterationThreshold *= 1.5;
          this.criticalSlowThreshold *= 1.5;
        } else if (navigator.hardwareConcurrency >= 8) {
          // Higher-end device, can be more aggressive
          this.adaptiveThresholds.batchSizeLimit = Math.min(this.adaptiveThresholds.batchSizeLimit * 1.5, 1500);
        }
      }
      
      // Device memory detection
      if (navigator.deviceMemory) {
        if (navigator.deviceMemory <= 4) {
          // Devices with less RAM
          this.adaptiveThresholds.batchSizeLimit = Math.min(this.adaptiveThresholds.batchSizeLimit, Math.max(100, navigator.deviceMemory * 100));
        } else if (navigator.deviceMemory >= 8) {
          // Devices with more RAM
          this.adaptiveThresholds.memoryUsageLimit *= 1.2; // Allow using more memory
        }
      }
      
      // Mobile detection
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      if (isMobile) {
        // Mobile devices need more conservative settings
        this.adaptiveThresholds.batchSizeLimit = Math.min(this.adaptiveThresholds.batchSizeLimit, 250);
        this.adaptiveThresholds.memoryUsageLimit *= 0.8; // Be more conservative with memory
      }
    }
    
    // Battery status detection if available
    if (typeof navigator !== 'undefined' && 'getBattery' in navigator) {
      navigator.getBattery().then(battery => {
        if (battery.level < 0.2 && !battery.charging) {
          // Low battery and not charging, be very conservative
          this.adaptiveThresholds.batchSizeLimit = Math.min(this.adaptiveThresholds.batchSizeLimit, 100);
          this.issueWarning({
            type: 'low_battery',
            message: 'Low battery detected, optimizing for power efficiency',
            batteryLevel: battery.level,
            batchSizeAdjusted: true
          });
        }
      }).catch(() => {
        // Ignore errors if battery API is not available
      });
    }
  }
  
  /**
   * Start regular memory monitoring
   */
  startMemoryMonitoring() {
    if (this.memoryCheckTimerId) {
      clearInterval(this.memoryCheckTimerId);
    }
    
    this.memoryCheckTimerId = setInterval(() => {
      this.checkMemoryUsage();
    }, 5000); // Check every 5 seconds
  }
  
  /**
   * Stop memory monitoring
   */
  stopMemoryMonitoring() {
    if (this.memoryCheckTimerId) {
      clearInterval(this.memoryCheckTimerId);
      this.memoryCheckTimerId = null;
    }
  }
  
  /**
   * Check current memory usage and growth rate
   * Issues warnings and triggers recovery strategies when needed
   */
  checkMemoryUsage() {
    if (self.performance && self.performance.memory) {
      const memory = self.performance.memory;
      const usedHeapRatio = memory.usedJSHeapSize / memory.jsHeapSizeLimit;
      
      // Store for resource metrics
      this.resourceMetrics.memory = usedHeapRatio;
      
      // Issue a warning if memory usage is high
      if (usedHeapRatio > MEMORY_WARNING_THRESHOLD && !memoryWarningIssued) {
        memoryWarningIssued = true;
        this.issueWarning({
          type: 'memory',
          message: `Memory usage is high (${(usedHeapRatio * 100).toFixed(1)}% of available heap)`,
          usedHeapSize: memory.usedJSHeapSize,
          totalHeapSize: memory.jsHeapSizeLimit,
          usedHeapRatio: usedHeapRatio
        });
      }
      
      // Calculate memory growth rate
      if (this.lastMemoryUsage > 0) {
        const memoryGrowth = memory.usedJSHeapSize - this.lastMemoryUsage;
        const memoryGrowthRate = memoryGrowth / memory.usedJSHeapSize;
        this.memoryGrowthRate = memoryGrowthRate;
        
        // If memory is growing too rapidly, issue a warning
        if (memoryGrowthRate > 0.1) { // > 10% growth since last check
          this.issueWarning({
            type: 'memory_growth',
            message: `Memory usage growing rapidly (${(memoryGrowthRate * 100).toFixed(1)}% increase)`,
            growthRate: memoryGrowthRate,
            memoryGrowth: memoryGrowth
          });
          
          // Update error patterns
          this.errorPatterns.memory += 1;
          
          // If growth is extremely rapid, try recovery strategies
          if (memoryGrowthRate > 0.2) {
            // Try to force garbage collection if available
            if (typeof global !== 'undefined' && global.gc) {
              try {
                global.gc();
                this.issueWarning({
                  type: 'garbage_collection',
                  message: 'Forced garbage collection due to rapid memory growth'
                });
              } catch (e) {
                // GC not available or failed
              }
            }
            
            // If memory is critically high, enter recovery mode
            if (usedHeapRatio > 0.9) {
              this.setRecoveryMode('reduce_iterations');
            }
          }
        }
        
        // Calculate memory growth per iteration for diagnostics
        if (this.diagnostics.lastIterationCount > 0) {
          const iterationsSinceLastCheck = performanceCheckpoints.length > 0 ? 
            (performanceCheckpoints[performanceCheckpoints.length - 1].iterations - this.diagnostics.lastIterationCount) : 0;
            
          if (iterationsSinceLastCheck > 0) {
            this.diagnostics.memoryGrowthRatePerIteration = memoryGrowth / iterationsSinceLastCheck;
          }
        }
      }
      
      this.lastMemoryUsage = memory.usedJSHeapSize;
    }
  }
  
  /**
   * Add a performance checkpoint to track performance trends
   */
  addPerformanceCheckpoint(completedIterations, timeElapsed) {
    // Calculate iterations per second for resource metrics
    const now = Date.now();
    const secondsElapsed = (now - this.diagnostics.lastSpeedMeasurement) / 1000;
    
    if (secondsElapsed > 0 && this.diagnostics.lastIterationCount > 0) {
      const iterationsDone = completedIterations - this.diagnostics.lastIterationCount;
      this.diagnostics.iterationsPerSecond = iterationsDone / secondsElapsed;
    }
    
    // Update diagnostics
    this.diagnostics.lastIterationCount = completedIterations;
    this.diagnostics.lastSpeedMeasurement = now;
    
    // Add to performance checkpoints
    performanceCheckpoints.push({
      iterations: completedIterations,
      time: timeElapsed
    });
    
    // Keep only the last 10 checkpoints
    if (performanceCheckpoints.length > 10) {
      performanceCheckpoints.shift();
    }
    
    // Check for performance degradation
    this.checkPerformanceDegradation();
    
    // Detect abnormal patterns in performance data
    this.detectAbnormalPatterns();
  }
  
  /**
   * Detect abnormal patterns in performance data
   * Identifies unusual trends that might indicate issues
   */
  detectAbnormalPatterns() {
    if (performanceCheckpoints.length < 4) return;
    
    // Check for abnormal slowdown pattern
    const recentCheckpoints = performanceCheckpoints.slice(-4);
    const timeDeltas = [];
    const iterationDeltas = [];
    
    for (let i = 1; i < recentCheckpoints.length; i++) {
      const timeDelta = recentCheckpoints[i].time - recentCheckpoints[i-1].time;
      const iterationDelta = recentCheckpoints[i].iterations - recentCheckpoints[i-1].iterations;
      
      if (iterationDelta > 0) {
        timeDeltas.push(timeDelta / iterationDelta); // time per iteration
      }
    }
    
    // Check for consistent slowdown pattern (each segment is slower than the previous)
    if (timeDeltas.length >= 3) {
      if (timeDeltas[0] < timeDeltas[1] && timeDeltas[1] < timeDeltas[2]) {
        // Consistent slowdown detected
        const pattern = {
          type: 'consistent_slowdown',
          severity: 'medium',
          timeDeltas,
          detectedAt: new Date().toISOString()
        };
        
        // Only add if this pattern isn't already reported
        if (!this.diagnostics.abnormalPatterns.some(p => p.type === 'consistent_slowdown')) {
          this.diagnostics.abnormalPatterns.push(pattern);
          
          this.issueWarning({
            type: 'abnormal_pattern',
            message: 'Consistent performance degradation pattern detected',
            pattern
          });
        }
      }
    }
    
    // Check for abnormal memory growth correlated with specific iteration ranges
    if (performanceCheckpoints.length >= 5 && this.lastMemoryUsage > 0) {
      const memoryGrowthData = this.diagnostics.memoryGrowthRatePerIteration;
      
      if (memoryGrowthData > 100000) { // Significant memory growth per iteration
        const pattern = {
          type: 'memory_leak',
          severity: 'high',
          memoryGrowthPerIteration: memoryGrowthData,
          detectedAt: new Date().toISOString()
        };
        
        if (!this.diagnostics.abnormalPatterns.some(p => p.type === 'memory_leak')) {
          this.diagnostics.abnormalPatterns.push(pattern);
          
          this.issueWarning({
            type: 'abnormal_pattern',
            message: 'Potential memory leak detected',
            pattern
          });
          
          // Recommend recovery strategy
          if (!this.recoveryMode) {
            this.setRecoveryMode('split_workload');
          }
        }
      }
    }
  }
  
  /**
   * Check for performance degradation
   * Detects slow iterations and performance trends
   */
  checkPerformanceDegradation() {
    if (performanceCheckpoints.length < 2) return;
    
    const latest = performanceCheckpoints[performanceCheckpoints.length - 1];
    const previous = performanceCheckpoints[performanceCheckpoints.length - 2];
    
    const iterationsDelta = latest.iterations - previous.iterations;
    const timeDelta = latest.time - previous.time;
    
    if (iterationsDelta <= 0) return; // Avoid division by zero
    
    const timePerIteration = timeDelta / iterationsDelta;
    
    if (timePerIteration > this.slowIterationThreshold) {
      this.slowIterationCount++;
      
      // If too many slow iterations, issue a warning
      if (this.slowIterationCount > 3 && !this.warningIssued) {
        this.warningIssued = true;
        this.issueWarning({
          type: 'performance',
          message: `Simulation performance degradation detected (${timePerIteration.toFixed(2)}ms per iteration)`,
          timePerIteration: timePerIteration,
          slowIterationCount: this.slowIterationCount
        });
      }
      
      // If critically slow, should consider recovery
      if (timePerIteration > this.criticalSlowThreshold) {
        this.handleError(new Error(`Critical performance degradation: ${timePerIteration.toFixed(2)}ms per iteration`), {
          type: 'performance_degradation',
          timePerIteration: timePerIteration
        });
        
        // Update error patterns
        this.errorPatterns.performance += 1;
      }
    }
    
    // Check for sudden performance drop (e.g., more than 3x slower)
    if (performanceCheckpoints.length >= 3) {
      const beforePrevious = performanceCheckpoints[performanceCheckpoints.length - 3];
      const earlierIterationsDelta = previous.iterations - beforePrevious.iterations;
      const earlierTimeDelta = previous.time - beforePrevious.time;
      
      if (earlierIterationsDelta > 0) {
        const earlierTimePerIteration = earlierTimeDelta / earlierIterationsDelta;
        const degradationFactor = timePerIteration / earlierTimePerIteration;
        
        if (degradationFactor > 3.0) {
          this.issueWarning({
            type: 'sudden_performance_drop',
            message: `Sudden performance drop detected (${degradationFactor.toFixed(1)}x slower)`,
            degradationFactor: degradationFactor,
            currentTimePerIteration: timePerIteration,
            previousTimePerIteration: earlierTimePerIteration
          });
          
          // Update error patterns
          this.errorPatterns.performance += 1;
          
          // Circuit breaker pattern for severe performance drops
          if (degradationFactor > 10.0 && !this.circuitOpen) {
            this.openCircuit('performance_collapse');
          }
        }
      }
    }
  }
  
  /**
   * Issue a warning (not an error)
   * For advisory notifications
   */
  issueWarning(warning) {
    const warningWithTimestamp = {
      ...warning,
      timestamp: Date.now(),
      timeSinceStart: Date.now() - this.startTime
    };
    
    self.postMessage({
      type: 'SIMULATION_WARNING',
      warning: warningWithTimestamp
    });
  }
  
  /**
   * Handle a global unhandled error
   */
  handleGlobalError(event) {
    this.handleError(event.error || new Error(event.message), {
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      type: 'unhandled_exception'
    });
    
    // Prevent default handling
    event.preventDefault();
  }
  
  /**
   * Handle an unhandled promise rejection
   */
  handlePromiseRejection(event) {
    this.handleError(event.reason || new Error('Unhandled promise rejection'), {
      type: 'unhandled_rejection'
    });
    
    // Prevent default handling
    event.preventDefault();
  }
  
  /**
   * Primary error handling function
   * Processes errors and applies recovery strategies
   */
  handleError(error, additionalInfo = {}) {
    errorCount++;
    lastError = error;
    
    // If circuit is open, don't process errors directly
    if (this.circuitOpen) {
      this.handleErrorWithCircuitOpen(error, additionalInfo);
      return;
    }
    
    // Prepare detailed error information
    const errorDetails = {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      count: errorCount,
      timestamp: Date.now(),
      memoryUsage: self.performance && self.performance.memory ? self.performance.memory.usedJSHeapSize : null,
      memoryRatio: self.performance && self.performance.memory ? 
                  (self.performance.memory.usedJSHeapSize / self.performance.memory.jsHeapSizeLimit) : null,
      performanceStats: performanceCheckpoints.length > 0 ? performanceCheckpoints[performanceCheckpoints.length - 1] : null,
      recoveryMode: this.recoveryMode,
      recoveryStrategy: this.recoveryStrategy,
      recoveryAttempts: this.recoveryAttempts,
      diagnostics: {
        iterationsPerSecond: this.diagnostics.iterationsPerSecond,
        memoryGrowthRate: this.memoryGrowthRate,
        abnormalPatterns: this.diagnostics.abnormalPatterns
      },
      ...additionalInfo
    };
    
    // Categorize error type more specifically for better recovery
    errorDetails.errorCategory = this.categorizeError(error, additionalInfo);
    
    // Update error patterns
    this.updateErrorPatterns(errorDetails.errorCategory);
    
    // Check if we need to enter recovery mode based on error patterns
    if (this.shouldEnterRecoveryMode() && !this.recoveryMode) {
      const strategy = this.recommendRecoveryStrategy();
      if (strategy) {
        this.setRecoveryMode(strategy);
      }
    }
    
    // Send error to main thread
    self.postMessage({
      type: 'SIMULATION_ERROR',
      error: errorDetails.message,
      stack: errorDetails.stack,
      details: errorDetails
    });
    
    // If we've hit the error limit, consider opening the circuit breaker
    if (errorCount >= MAX_TOLERATED_ERRORS && !this.recoveryMode) {
      this.openCircuit('too_many_errors');
    } else if (this.recoveryMode && this.recoveryAttempts >= this.maxRecoveryAttempts) {
      // If we've tried recovery multiple times and still getting errors, open the circuit
      this.openCircuit('recovery_failure');
    }
  }
  
  /**
   * Handle errors when circuit breaker is open
   */
  handleErrorWithCircuitOpen(error, additionalInfo = {}) {
    // Only log the error but don't attempt recovery
    self.postMessage({
      type: 'SIMULATION_ERROR_CIRCUIT_OPEN',
      error: error instanceof Error ? error.message : String(error),
      details: {
        circuitOpenSince: this.circuitOpenTime,
        circuitOpenReason: additionalInfo.circuitOpenReason || 'unknown',
        ...additionalInfo
      }
    });
  }
  
  /**
   * Open the circuit breaker to prevent cascading failures
   */
  openCircuit(reason) {
    if (this.circuitOpen) return; // Already open
    
    this.circuitOpen = true;
    this.circuitOpenTime = Date.now();
    
    this.issueWarning({
      type: 'circuit_breaker_open',
      message: `Circuit breaker opened: ${reason}`,
      reason: reason,
      timestamp: this.circuitOpenTime
    });
    
    self.postMessage({
      type: 'SIMULATION_CIRCUIT_OPEN',
      reason: reason,
      timestamp: this.circuitOpenTime,
      recommendations: [
        'The simulation should be terminated',
        'Consider running with reduced iterations',
        'Try simplifying the model parameters',
        'Review resource usage on the client device'
      ]
    });
    
    // Schedule circuit half-open attempt
    setTimeout(() => {
      this.attemptHalfOpenCircuit();
    }, this.circuitResetTimeout);
  }
  
  /**
   * Attempt to half-open the circuit to test if issues are resolved
   */
  attemptHalfOpenCircuit() {
    if (!this.circuitOpen) return; // Not open
    
    this.circuitHalfOpenAttempts++;
    
    this.issueWarning({
      type: 'circuit_breaker_half_open',
      message: `Attempting to half-open circuit breaker (attempt ${this.circuitHalfOpenAttempts})`,
      halfOpenAttempt: this.circuitHalfOpenAttempts
    });
    
    // Reset error count for the next attempt
    errorCount = 0;
    
    // If we've tried too many times, give up
    if (this.circuitHalfOpenAttempts >= 3) {
      self.postMessage({
        type: 'SIMULATION_CIRCUIT_PERMANENT',
        message: 'Circuit breaker permanently open after multiple half-open failures',
        halfOpenAttempts: this.circuitHalfOpenAttempts
      });
      return;
    }
    
    // Enter recovery mode with most conservative strategy
    this.setRecoveryMode('minimal_operation');
    
    // Close the circuit tentatively
    this.circuitOpen = false;
    
    // Schedule another check
    setTimeout(() => {
      if (errorCount > 0) {
        // Issues still exist, re-open the circuit
        this.openCircuit('half_open_failed');
      } else {
        // Success, fully close the circuit
        this.closeCircuit();
      }
    }, 1000);
  }
  
  /**
   * Close the circuit breaker after successful recovery
   */
  closeCircuit() {
    if (!this.circuitOpen && this.circuitHalfOpenAttempts > 0) {
      this.circuitHalfOpenAttempts = 0;
      
      this.issueWarning({
        type: 'circuit_breaker_closed',
        message: 'Circuit breaker closed, simulation can continue normally'
      });
      
      // If we were in recovery mode, we can consider exiting it
      if (this.recoveryMode && this.recoveryAttempts > 0) {
        // Only exit recovery if we've been stable for a while
        setTimeout(() => {
          if (errorCount === 0) {
            this.exitRecoveryMode();
          }
        }, 2000);
      }
    }
  }
  
  /**
   * Update error pattern counts based on error category
   */
  updateErrorPatterns(category) {
    switch(category) {
      case 'memory':
        this.errorPatterns.memory += 1;
        break;
      case 'performance':
        this.errorPatterns.performance += 1;
        break;
      case 'calculation':
        this.errorPatterns.calculation += 1;
        break;
      case 'data_structure':
        this.errorPatterns.dataStructure += 1;
        break;
      case 'network':
        this.errorPatterns.network += 1;
        break;
    }
  }
  
  /**
   * Categorize error type for better recovery strategy selection
   */
  categorizeError(error, additionalInfo = {}) {
    const errorMsg = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
    const errorStack = error instanceof Error ? (error.stack || '').toLowerCase() : '';
    
    // Check for memory-related errors
    if (
      errorMsg.includes('memory') || 
      errorMsg.includes('allocation') || 
      errorMsg.includes('heap') ||
      errorStack.includes('out of memory')
    ) {
      return 'memory';
    }
    
    // Check for performance-related errors
    if (
      errorMsg.includes('timeout') || 
      errorMsg.includes('performance') || 
      errorMsg.includes('slow') || 
      additionalInfo.type === 'performance_degradation'
    ) {
      return 'performance';
    }
    
    // Check for calculation/math errors
    if (
      errorMsg.includes('nan') || 
      errorMsg.includes('infinity') || 
      errorMsg.includes('divide by zero') ||
      errorMsg.includes('undefined result') ||
      errorMsg.includes('not a number') ||
      errorMsg.includes('overflow')
    ) {
      return 'calculation';
    }
    
    // Check for data structure errors
    if (
      errorMsg.includes('invalid') || 
      errorMsg.includes('undefined') || 
      errorMsg.includes('null') || 
      errorMsg.includes('not an object') ||
      errorMsg.includes('cannot read property') ||
      errorMsg.includes('is not a function') ||
      errorMsg.includes('is not iterable')
    ) {
      return 'data_structure';
    }
    
    // Check for iteration limit errors
    if (
      errorMsg.includes('iteration') || 
      errorMsg.includes('maximum') || 
      errorMsg.includes('limit') ||
      errorMsg.includes('too many')
    ) {
      return 'iteration_limit';
    }
    
    // Check for worker-related issues
    if (
      errorMsg.includes('worker') || 
      errorMsg.includes('thread') || 
      errorMsg.includes('terminate')
    ) {
      return 'worker';
    }
    
    // Check for network issues
    if (
      errorMsg.includes('network') ||
      errorMsg.includes('connection') ||
      errorMsg.includes('offline') ||
      errorMsg.includes('fetch') ||
      errorMsg.includes('ajax') ||
      errorMsg.includes('xhr')
    ) {
      return 'network';
    }
    
    // Default
    return 'unknown';
  }
  
  /**
   * Set recovery mode
   */
  setRecoveryMode(strategy) {
    this.recoveryMode = true;
    this.recoveryStrategy = strategy;
    this.recoveryAttempts += 1;
    
    // Reset error count in recovery mode
    errorCount = 0;
    
    // Issue warning about recovery mode
    this.issueWarning({
      type: 'recovery_mode',
      message: `Entering recovery mode with strategy: ${strategy}`,
      strategy: strategy,
      attempt: this.recoveryAttempts,
      timestamp: Date.now()
    });
  }
  
  /**
   * Exit recovery mode after successful recovery
   */
  exitRecoveryMode() {
    if (!this.recoveryMode) return;
    
    this.issueWarning({
      type: 'recovery_exit',
      message: `Exiting recovery mode after successful operation`,
      previousStrategy: this.recoveryStrategy,
      recoveryDuration: Date.now() - this.startTime
    });
    
    this.recoveryMode = false;
    this.recoveryStrategy = null;
  }
  
  /**
   * Check if we should enter recovery mode
   */
  shouldEnterRecoveryMode() {
    // Enter recovery mode if we've had multiple errors
    if (errorCount >= 3 && !this.recoveryMode) {
      return true;
    }
    
    // Enter recovery mode if memory is critically high
    if (memoryWarningIssued && !this.recoveryMode) {
      return true;
    }
    
    // Enter recovery mode if performance is critically degraded
    if (this.slowIterationCount > 5 && !this.recoveryMode) {
      return true;
    }
    
    // Enter recovery mode if we detect specific error patterns
    if (this.errorPatterns.memory >= 2 || 
        this.errorPatterns.performance >= 3 || 
        this.errorPatterns.calculation >= 2 ||
        this.errorPatterns.dataStructure >= 2) {
      return true;
    }
    
    // Check for abnormal patterns
    if (this.diagnostics.abnormalPatterns.length > 0 && 
        this.diagnostics.abnormalPatterns.some(p => p.severity === 'high')) {
      return true;
    }
    
    return false;
  }
  
  /**
   * Recommend a recovery strategy based on error patterns
   */
  recommendRecoveryStrategy() {
    // Determine the dominant error pattern
    const patterns = this.errorPatterns;
    const patternCounts = [
      { type: 'memory', count: patterns.memory },
      { type: 'performance', count: patterns.performance },
      { type: 'calculation', count: patterns.calculation },
      { type: 'data_structure', count: patterns.dataStructure },
      { type: 'network', count: patterns.network }
    ];
    
    // Sort by count descending
    patternCounts.sort((a, b) => b.count - a.count);
    
    // If we have a clear dominant pattern, use it for strategy
    if (patternCounts[0].count > 0 && patternCounts[0].count >= patternCounts[1].count * 2) {
      const dominantPattern = patternCounts[0].type;
      
      switch (dominantPattern) {
        case 'memory':
          // Memory issues - reduce state size and iterations
          return 'reduce_iterations';
          
        case 'performance':
          // Performance issues - simplify calculations
          return 'simplify_model';
          
        case 'calculation':
          // Calculation issues - use alternative algorithm
          return 'use_fallback_algorithm';
          
        case 'data_structure':
          // Structure issues - simplify model
          return 'simplify_model';
          
        case 'network':
          // Network issues - cache results and reduce data transfers
          return 'offline_operation';
      }
    }
    
    // Check if last error indicates a specific strategy
    if (lastError) {
      const errorCategory = this.categorizeError(lastError);
      
      switch (errorCategory) {
        case 'memory':
          return 'reduce_iterations';
          
        case 'performance':
          return 'simplify_model';
          
        case 'calculation':
          return 'use_fallback_algorithm';
          
        case 'data_structure':
          return 'simplify_model';
          
        case 'iteration_limit':
          return 'reduce_iterations';
          
        case 'worker':
          return 'split_workload';
          
        case 'network':
          return 'offline_operation';
      }
    }
    
    // If no specific error category, decide based on symptoms
    
    // Memory issues
    if (memoryWarningIssued) {
      return 'reduce_iterations';
    }
    
    // Performance issues
    if (this.slowIterationCount > 5) {
      return 'simplify_model';
    }
    
    // If recovery attempts are high, try more aggressive strategies
    if (this.recoveryAttempts >= 2) {
      return 'minimal_operation';
    }
    
    // General errors
    if (errorCount >= 3) {
      return 'retry';
    }
    
    // If we have abnormal patterns, use them to guide strategy
    if (this.diagnostics.abnormalPatterns.length > 0) {
      const pattern = this.diagnostics.abnormalPatterns[this.diagnostics.abnormalPatterns.length - 1];
      
      if (pattern.type === 'memory_leak') {
        return 'reduce_iterations';
      }
      
      if (pattern.type === 'consistent_slowdown') {
        return 'simplify_model';
      }
    }
    
    // Default strategy
    return 'split_workload';
  }
  
  /**
   * Calculate optimal batch size based on performance data
   */
  calculateOptimalBatchSize() {
    if (performanceCheckpoints.length < 2) {
      return 100; // Default size
    }
    
    // Calculate average time per iteration
    const latest = performanceCheckpoints[performanceCheckpoints.length - 1];
    const earliest = performanceCheckpoints[0];
    
    const totalIterations = latest.iterations - earliest.iterations;
    const totalTime = latest.time - earliest.time;
    
    if (totalIterations <= 0) return 100; // Default if no progress
    
    const avgTimePerIteration = totalTime / totalIterations;
    
    // Target batch completion time of 100ms for responsive UI
    const targetTime = 100; // ms
    
    // Calculate batch size to achieve target time
    let optimalBatchSize = Math.floor(targetTime / avgTimePerIteration);
    
    // Apply limits
    optimalBatchSize = Math.max(10, Math.min(optimalBatchSize, this.adaptiveThresholds.batchSizeLimit));
    
    // Adjust based on memory usage if available
    if (self.performance && self.performance.memory) {
      const memoryRatio = self.performance.memory.usedJSHeapSize / self.performance.memory.jsHeapSizeLimit;
      if (memoryRatio > 0.7) {
        // Scale down batch size as memory usage increases
        const memoryFactor = 1 - ((memoryRatio - 0.7) / 0.3);
        optimalBatchSize = Math.floor(optimalBatchSize * memoryFactor);
      }
    }
    
    // Adjust based on recovery mode
    if (this.recoveryMode) {
      switch (this.recoveryStrategy) {
        case 'reduce_iterations':
          optimalBatchSize = Math.floor(optimalBatchSize * 0.5);
          break;
        case 'simplify_model':
          optimalBatchSize = Math.floor(optimalBatchSize * 0.7);
          break;
        case 'split_workload':
          optimalBatchSize = Math.floor(optimalBatchSize * 0.3);
          break;
        case 'minimal_operation':
          optimalBatchSize = Math.max(10, Math.floor(optimalBatchSize * 0.2));
          break;
        case 'use_fallback_algorithm':
          // Don't reduce batch size as much since the fallback should be more stable
          optimalBatchSize = Math.floor(optimalBatchSize * 0.8);
          break;
      }
    }
    
    return optimalBatchSize;
  }
  
  /**
   * Get current performance metrics
   */
  getPerformanceMetrics() {
    if (performanceCheckpoints.length < 2) {
      return {
        timePerIteration: null,
        memoryUsage: this.lastMemoryUsage,
        memoryRatio: self.performance && self.performance.memory ? 
                    (self.performance.memory.usedJSHeapSize / self.performance.memory.jsHeapSizeLimit) : null,
        errorRate: errorCount / Math.max(1, this.totalIterations),
        optimalBatchSize: 100,
        recoveryMode: this.recoveryMode,
        recoveryStrategy: this.recoveryStrategy,
        iterationsPerSecond: this.diagnostics.iterationsPerSecond,
        abnormalPatternsDetected: this.diagnostics.abnormalPatterns.length > 0,
        resourceMetrics: this.resourceMetrics
      };
    }
    
    const latest = performanceCheckpoints[performanceCheckpoints.length - 1];
    const earliest = performanceCheckpoints[0];
    
    const totalIterations = latest.iterations - earliest.iterations;
    const totalTime = latest.time - earliest.time;
    
    const timePerIteration = totalIterations > 0 ? totalTime / totalIterations : null;
    
    return {
      timePerIteration,
      memoryUsage: this.lastMemoryUsage,
      memoryRatio: self.performance && self.performance.memory ? 
                  (self.performance.memory.usedJSHeapSize / self.performance.memory.jsHeapSizeLimit) : null,
      errorRate: errorCount / Math.max(1, this.totalIterations),
      optimalBatchSize: this.calculateOptimalBatchSize(),
      recoveryMode: this.recoveryMode,
      recoveryStrategy: this.recoveryStrategy,
      iterationsPerSecond: this.diagnostics.iterationsPerSecond,
      abnormalPatternsDetected: this.diagnostics.abnormalPatterns.length > 0,
      resourceMetrics: this.resourceMetrics
    };
  }
  
  /**
   * Clean up resources
   */
  cleanup() {
    this.stopMemoryMonitoring();
    
    // Remove event listeners
    self.removeEventListener('error', this.handleGlobalError);
    self.removeEventListener('unhandledrejection', this.handlePromiseRejection);
    
    // Remove visibility change listener if present
    if (typeof document !== 'undefined' && document.removeEventListener) {
      document.removeEventListener('visibilitychange', this.adaptToVisibilityChange);
    }
    
    // Clear any pending timeouts
    if (this.memoryCheckTimerId) {
      clearInterval(this.memoryCheckTimerId);
    }
  }
}

// Export the error handler
self.MonteCarloErrorHandler = MonteCarloErrorHandler;