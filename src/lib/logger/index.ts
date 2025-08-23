/**
 * Centralized logging service for RecipeNest
 * Provides structured logging with different levels and environments
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  FATAL = 4,
}

export interface LogContext {
  userId?: string;
  requestId?: string;
  action?: string;
  metadata?: Record<string, unknown>;
}

class Logger {
  private level: LogLevel;
  private isDevelopment: boolean;
  private isClient: boolean;

  constructor() {
    this.isDevelopment = process.env.NODE_ENV !== 'production';
    this.isClient = typeof window !== 'undefined';
    
    // Set log level based on environment
    if (this.isDevelopment) {
      this.level = LogLevel.DEBUG;
    } else {
      this.level = LogLevel.WARN;
    }
  }

  private formatMessage(
    level: string,
    message: string,
    context?: LogContext
  ): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` ${JSON.stringify(context)}` : '';
    return `[${timestamp}] [${level}] ${message}${contextStr}`;
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.level;
  }

  private sendToLoggingService(
    level: string,
    message: string,
    context?: LogContext,
    error?: Error
  ): void {
    // In production, send to external logging service
    if (!this.isDevelopment && !this.isClient) {
      // TODO: Integrate with external logging service like LogTail, DataDog, etc.
      // For now, we'll just use structured console output
      const logData = {
        timestamp: new Date().toISOString(),
        level,
        message,
        context,
        error: error ? {
          message: error.message,
          stack: error.stack,
          name: error.name,
        } : undefined,
      };

      // Use console methods based on level
      switch (level) {
        case 'ERROR':
        case 'FATAL':          break;
        case 'WARN':          break;
        default:      }
    } else if (this.isDevelopment) {
      // In development, use readable console output
      const formattedMessage = this.formatMessage(level, message, context);
      
      switch (level) {
        case 'ERROR':
        case 'FATAL':          break;
        case 'WARN':          break;
        case 'INFO':          break;
        default:      }
    }
  }

  debug(message: string, context?: LogContext): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      this.sendToLoggingService('DEBUG', message, context);
    }
  }

  info(message: string, context?: LogContext): void {
    if (this.shouldLog(LogLevel.INFO)) {
      this.sendToLoggingService('INFO', message, context);
    }
  }

  warn(message: string, context?: LogContext): void {
    if (this.shouldLog(LogLevel.WARN)) {
      this.sendToLoggingService('WARN', message, context);
    }
  }

  error(message: string, error?: Error, context?: LogContext): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      this.sendToLoggingService('ERROR', message, context, error);
    }
  }

  fatal(message: string, error?: Error, context?: LogContext): void {
    if (this.shouldLog(LogLevel.FATAL)) {
      this.sendToLoggingService('FATAL', message, context, error);
      
      // In production, you might want to trigger alerts or shutdown procedures
      if (!this.isDevelopment && !this.isClient) {
        // TODO: Trigger critical alerts
      }
    }
  }

  // Helper method for API logging
  logApiRequest(
    method: string,
    path: string,
    statusCode: number,
    duration: number,
    context?: LogContext
  ): void {
    const level = statusCode >= 500 ? LogLevel.ERROR : 
                  statusCode >= 400 ? LogLevel.WARN : 
                  LogLevel.INFO;

    const message = `${method} ${path} ${statusCode} ${duration}ms`;
    
    if (level === LogLevel.ERROR) {
      this.error(message, undefined, context);
    } else if (level === LogLevel.WARN) {
      this.warn(message, context);
    } else {
      this.info(message, context);
    }
  }

  // Helper method for database query logging
  logDatabaseQuery(
    operation: string,
    table: string,
    duration: number,
    error?: Error,
    context?: LogContext
  ): void {
    const message = `DB ${operation} ${table} ${duration}ms`;
    
    if (error) {
      this.error(message, error, context);
    } else if (duration > 1000) {
      this.warn(`Slow query: ${message}`, context);
    } else if (this.isDevelopment) {
      this.debug(message, context);
    }
  }

  // Helper method for authentication events
  logAuthEvent(
    event: 'login' | 'logout' | 'signup' | 'failed_login',
    userId?: string,
    context?: LogContext
  ): void {
    const message = `Auth event: ${event}`;
    const fullContext = { ...context, userId, action: event };

    switch (event) {
      case 'failed_login':
        this.warn(message, fullContext);
        break;
      default:
        this.info(message, fullContext);
    }
  }

  // Helper method for user actions
  logUserAction(
    action: string,
    resourceType: string,
    resourceId: string | number,
    userId: string,
    context?: LogContext
  ): void {
    const message = `User action: ${action} ${resourceType} ${resourceId}`;
    const fullContext = {
      ...context,
      userId,
      action,
      resourceType,
      resourceId: String(resourceId),
    };

    this.info(message, fullContext);
  }
}

// Export singleton instance
export const logger = new Logger();

// Export for testing
export { Logger };