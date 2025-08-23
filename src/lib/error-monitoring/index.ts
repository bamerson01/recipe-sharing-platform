import * as Sentry from '@sentry/nextjs';
import { logger } from '@/lib/logger';

export interface ErrorContext {
  userId?: string;
  action?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Centralized error monitoring that integrates logging and Sentry
 */
class ErrorMonitor {
  /**
   * Capture and report an error
   */
  captureError(
    error: Error,
    context?: ErrorContext,
    level: 'error' | 'warning' | 'fatal' = 'error'
  ): void {
    // Log the error locally
    switch (level) {
      case 'fatal':
        logger.fatal(error.message, error, context);
        break;
      case 'warning':
        logger.warn(error.message, context);
        break;
      default:
        logger.error(error.message, error, context);
    }

    // Send to Sentry in production
    if (process.env.NODE_ENV === 'production') {
      Sentry.withScope((scope) => {
        // Set context
        if (context?.userId) {
          scope.setUser({ id: context.userId });
        }
        
        if (context?.action) {
          scope.setTag('action', context.action);
        }
        
        if (context?.metadata) {
          scope.setContext('metadata', context.metadata);
        }
        
        // Set severity
        switch (level) {
          case 'fatal':
            scope.setLevel('fatal');
            break;
          case 'warning':
            scope.setLevel('warning');
            break;
          default:
            scope.setLevel('error');
        }
        
        // Capture the error
        Sentry.captureException(error);
      });
    }
  }

  /**
   * Capture a message (non-error event)
   */
  captureMessage(
    message: string,
    level: 'info' | 'warning' = 'info',
    context?: ErrorContext
  ): void {
    // Log the message
    if (level === 'warning') {
      logger.warn(message, context);
    } else {
      logger.info(message, context);
    }

    // Send to Sentry in production for important messages
    if (process.env.NODE_ENV === 'production' && level === 'warning') {
      Sentry.withScope((scope) => {
        if (context?.userId) {
          scope.setUser({ id: context.userId });
        }
        
        if (context?.metadata) {
          scope.setContext('metadata', context.metadata);
        }
        
        Sentry.captureMessage(message, level);
      });
    }
  }

  /**
   * Set user context for all subsequent errors
   */
  setUserContext(userId: string, email?: string, username?: string): void {
    Sentry.setUser({
      id: userId,
      email,
      username,
    });
  }

  /**
   * Clear user context (e.g., on logout)
   */
  clearUserContext(): void {
    Sentry.setUser(null);
  }

  /**
   * Add breadcrumb for better error context
   */
  addBreadcrumb(
    message: string,
    category: string,
    data?: Record<string, unknown>
  ): void {
    logger.debug(`Breadcrumb: ${category} - ${message}`, { metadata: data });
    
    Sentry.addBreadcrumb({
      message,
      category,
      level: 'info',
      data,
      timestamp: Date.now() / 1000,
    });
  }

  /**
   * Monitor API errors
   */
  captureApiError(
    endpoint: string,
    method: string,
    statusCode: number,
    error: Error | string,
    context?: ErrorContext
  ): void {
    const errorMessage = typeof error === 'string' ? error : error.message;
    const fullContext = {
      ...context,
      metadata: {
        ...context?.metadata,
        endpoint,
        method,
        statusCode,
      },
    };

    if (statusCode >= 500) {
      this.captureError(
        error instanceof Error ? error : new Error(errorMessage),
        fullContext,
        'error'
      );
    } else if (statusCode >= 400) {
      logger.warn(`API Error: ${method} ${endpoint} - ${statusCode}`, fullContext);
    }
  }

  /**
   * Monitor database errors
   */
  captureDatabaseError(
    operation: string,
    table: string,
    error: Error,
    context?: ErrorContext
  ): void {
    const fullContext = {
      ...context,
      metadata: {
        ...context?.metadata,
        operation,
        table,
        errorCode: (error as any).code,
      },
    };

    this.captureError(error, fullContext);
  }

  /**
   * Monitor performance issues
   */
  capturePerformanceIssue(
    operation: string,
    duration: number,
    threshold: number,
    context?: ErrorContext
  ): void {
    if (duration > threshold) {
      const message = `Performance issue: ${operation} took ${duration}ms (threshold: ${threshold}ms)`;
      
      logger.warn(message, context);
      
      if (process.env.NODE_ENV === 'production') {
        Sentry.withScope((scope) => {
          scope.setTag('performance.issue', true);
          scope.setContext('performance', {
            operation,
            duration,
            threshold,
          });
          
          Sentry.captureMessage(message, 'warning');
        });
      }
    }
  }

  /**
   * Create a transaction for performance monitoring
   */
  startTransaction(name: string, operation: string): any {
    return Sentry.startSpan({
      name,
      op: operation,
    });
  }

  /**
   * Wrap an async function with error monitoring
   */
  async wrapAsync<T>(
    fn: () => Promise<T>,
    context?: ErrorContext
  ): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      this.captureError(
        error instanceof Error ? error : new Error(String(error)),
        context
      );
      throw error;
    }
  }

  /**
   * Wrap a function with error monitoring
   */
  wrap<T>(
    fn: () => T,
    context?: ErrorContext
  ): T {
    try {
      return fn();
    } catch (error) {
      this.captureError(
        error instanceof Error ? error : new Error(String(error)),
        context
      );
      throw error;
    }
  }
}

// Export singleton instance
export const errorMonitor = new ErrorMonitor();

// Export for testing
export { ErrorMonitor };