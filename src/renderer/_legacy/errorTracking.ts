import { log } from '@renderer/utils/logger';

interface ErrorContext {
  // Component/UI context
  component?: string;
  action?: string;

  // User interaction context
  user_action?: string;

  // Operation context
  operation?: string;
  endpoint?: string;

  // Error classification
  error_type?: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';

  // Task/Project context
  task_id?: string;
  project_id?: string;
  provider?: string;

  // Additional debugging info
  [key: string]: any;
}

class RendererErrorTracking {
  private sessionErrors: number = 0;
  private lastErrorTimestamp: number = 0;

  /**
   * Capture an exception in the renderer process
   */
  captureException(error: Error | unknown, context?: ErrorContext): void {
    try {
      const now = Date.now();
      if (now - this.lastErrorTimestamp < 100) {
        return;
      }
      this.lastErrorTimestamp = now;
      this.sessionErrors++;

      const errorObj = error instanceof Error ? error : new Error(String(error));
      const errorMessage = errorObj.message || 'Unknown error';
      const severity = context?.severity || this.determineSeverity(errorMessage, context);

      log.error('[ErrorTracking]', errorMessage, {
        severity,
        component: context?.component,
        action: context?.action,
        operation: context?.operation,
        endpoint: context?.endpoint,
        session_errors: this.sessionErrors,
        ...this.sanitizeContext(context),
      });
    } catch (trackingError) {
      log.warn('Failed to capture exception:', trackingError);
    }
  }

  /**
   * Capture a critical error that might affect app stability
   */
  captureCriticalError(error: Error | unknown, context?: ErrorContext): void {
    this.captureException(error, {
      ...context,
      severity: 'critical',
    });
  }

  /**
   * Track API/network errors
   */
  captureApiError(
    error: Error | unknown,
    endpoint: string,
    operation: string,
    additionalContext?: Partial<ErrorContext>
  ): void {
    this.captureException(error, {
      error_type: 'api_error',
      severity: 'medium',
      endpoint,
      operation,
      ...additionalContext,
    });
  }

  /**
   * Track component render errors
   */
  captureComponentError(
    error: Error | unknown,
    componentName: string,
    additionalContext?: Partial<ErrorContext>
  ): void {
    this.captureException(error, {
      error_type: 'render_error',
      severity: 'high',
      component: componentName,
      ...additionalContext,
    });
  }

  /**
   * Track user action errors
   */
  captureUserActionError(
    error: Error | unknown,
    action: string,
    additionalContext?: Partial<ErrorContext>
  ): void {
    this.captureException(error, {
      error_type: 'user_action_error',
      severity: 'medium',
      user_action: action,
      ...additionalContext,
    });
  }

  // Private helper methods

  private determineSeverity(
    errorMessage: string,
    context?: ErrorContext
  ): ErrorContext['severity'] {
    // Critical errors
    if (
      errorMessage.includes('FATAL') ||
      errorMessage.includes('CRASH') ||
      errorMessage.includes('Maximum update depth exceeded') ||
      context?.error_type === 'render_error'
    ) {
      return 'critical';
    }

    // High severity
    if (
      errorMessage.includes('Cannot read') ||
      errorMessage.includes('Cannot access') ||
      errorMessage.includes('is not defined') ||
      errorMessage.includes('Network request failed')
    ) {
      return 'high';
    }

    // Low severity
    if (
      errorMessage.includes('canceled') ||
      errorMessage.includes('aborted') ||
      errorMessage.includes('ResizeObserver')
    ) {
      return 'low';
    }

    return 'medium';
  }

  private classifyError(errorMessage: string): string {
    if (
      errorMessage.includes('fetch') ||
      errorMessage.includes('network') ||
      errorMessage.includes('API')
    ) {
      return 'network_error';
    }
    if (
      errorMessage.includes('render') ||
      errorMessage.includes('component') ||
      errorMessage.includes('React')
    ) {
      return 'render_error';
    }
    if (
      errorMessage.includes('TypeError') ||
      errorMessage.includes('undefined') ||
      errorMessage.includes('null')
    ) {
      return 'type_error';
    }
    if (errorMessage.includes('ReferenceError')) {
      return 'reference_error';
    }
    if (errorMessage.includes('SyntaxError')) {
      return 'syntax_error';
    }
    return 'unknown_error';
  }

  private sanitizeContext(context?: ErrorContext): Record<string, any> {
    if (!context) return {};

    const sanitized: Record<string, any> = {};
    const sensitiveKeys = ['password', 'token', 'secret', 'key', 'auth'];
    const skipKeys = [
      'severity',
      'component',
      'action',
      'user_action',
      'operation',
      'endpoint',
      'error_type',
    ];

    for (const [key, value] of Object.entries(context)) {
      // Skip already processed or sensitive keys
      if (skipKeys.includes(key)) continue;
      if (sensitiveKeys.some((sensitive) => key.toLowerCase().includes(sensitive))) continue;

      // Sanitize value
      if (typeof value === 'string') {
        sanitized[key] = value.slice(0, 200);
      } else if (typeof value === 'number' || typeof value === 'boolean') {
        sanitized[key] = value;
      } else if (value === null || value === undefined) {
        // Skip null/undefined
      } else {
        // Convert objects to string with limit
        try {
          sanitized[key] = JSON.stringify(value).slice(0, 200);
        } catch {
          // Skip if can't stringify
        }
      }
    }

    return sanitized;
  }
}

// Export singleton instance
export const errorTracking = new RendererErrorTracking();

// Export convenience functions
export function captureException(error: Error | unknown, context?: ErrorContext) {
  errorTracking.captureException(error, context);
}

export function captureApiError(
  error: Error | unknown,
  endpoint: string,
  operation: string,
  context?: Partial<ErrorContext>
) {
  errorTracking.captureApiError(error, endpoint, operation, context);
}

export function captureComponentError(
  error: Error | unknown,
  componentName: string,
  context?: Partial<ErrorContext>
) {
  errorTracking.captureComponentError(error, componentName, context);
}

// Set up global error handlers
if (typeof window !== 'undefined') {
  // Catch unhandled errors
  window.addEventListener('error', (event) => {
    errorTracking.captureException(event.error || new Error(event.message), {
      error_type: 'unhandled_error',
      severity: 'critical',
      component: 'global',
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    });
  });

  // Catch unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    errorTracking.captureException(event.reason || new Error('Unhandled Promise Rejection'), {
      error_type: 'unhandled_rejection',
      severity: 'high',
      component: 'global',
      promise: event.promise,
    });
  });
}
