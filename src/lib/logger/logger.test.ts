import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Logger, LogLevel } from './index';

describe('Logger', () => {
  let logger: Logger;
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;
  let consoleInfoSpy: ReturnType<typeof vi.spyOn>;
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
  const originalEnv = process.env.NODE_ENV;

  beforeEach(() => {
    // Mock console methods
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleInfoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    process.env.NODE_ENV = originalEnv;
  });

  describe('Development Environment', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'development';
      logger = new Logger();
    });

    it('should log debug messages in development', () => {
      logger.debug('Debug message');
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should log info messages in development', () => {
      logger.info('Info message');
      expect(consoleInfoSpy).toHaveBeenCalled();
    });

    it('should log warning messages', () => {
      logger.warn('Warning message');
      expect(consoleWarnSpy).toHaveBeenCalled();
    });

    it('should log error messages with error object', () => {
      const error = new Error('Test error');
      logger.error('Error message', error);
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('should include context in log messages', () => {
      const context = { userId: 'user123', action: 'create_recipe' };
      logger.info('Action performed', context);
      
      const call = consoleInfoSpy.mock.calls[0][0];
      expect(call).toContain('Action performed');
      expect(call).toContain(JSON.stringify(context));
    });
  });

  describe('Production Environment', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'production';
      logger = new Logger();
    });

    it('should not log debug messages in production', () => {
      logger.debug('Debug message');
      expect(consoleLogSpy).not.toHaveBeenCalled();
    });

    it('should not log info messages in production', () => {
      logger.info('Info message');
      expect(consoleLogSpy).not.toHaveBeenCalled();
    });

    it('should log warning messages in production', () => {
      logger.warn('Warning message');
      expect(consoleWarnSpy).toHaveBeenCalled();
    });

    it('should log error messages in production', () => {
      const error = new Error('Production error');
      logger.error('Error occurred', error);
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('should output structured JSON in production', () => {
      logger.warn('Warning in production', { userId: 'user123' });
      
      const call = consoleWarnSpy.mock.calls[0][0];
      const parsed = JSON.parse(call);
      
      expect(parsed).toHaveProperty('timestamp');
      expect(parsed).toHaveProperty('level', 'WARN');
      expect(parsed).toHaveProperty('message', 'Warning in production');
      expect(parsed).toHaveProperty('context');
      expect(parsed.context).toHaveProperty('userId', 'user123');
    });
  });

  describe('Helper Methods', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'development';
      logger = new Logger();
    });

    describe('logApiRequest', () => {
      it('should log successful requests as info', () => {
        logger.logApiRequest('GET', '/api/recipes', 200, 150);
        expect(consoleInfoSpy).toHaveBeenCalled();
      });

      it('should log client errors as warnings', () => {
        logger.logApiRequest('POST', '/api/recipes', 400, 50);
        expect(consoleWarnSpy).toHaveBeenCalled();
      });

      it('should log server errors as errors', () => {
        logger.logApiRequest('GET', '/api/recipes', 500, 100);
        expect(consoleErrorSpy).toHaveBeenCalled();
      });
    });

    describe('logDatabaseQuery', () => {
      it('should log normal queries in development', () => {
        logger.logDatabaseQuery('SELECT', 'recipes', 50);
        expect(consoleLogSpy).toHaveBeenCalled();
      });

      it('should warn about slow queries', () => {
        logger.logDatabaseQuery('SELECT', 'recipes', 1500);
        expect(consoleWarnSpy).toHaveBeenCalled();
        const call = consoleWarnSpy.mock.calls[0][0];
        expect(call).toContain('Slow query');
      });

      it('should log query errors', () => {
        const error = new Error('Database connection failed');
        logger.logDatabaseQuery('INSERT', 'recipes', 100, error);
        expect(consoleErrorSpy).toHaveBeenCalled();
      });
    });

    describe('logAuthEvent', () => {
      it('should log successful login as info', () => {
        logger.logAuthEvent('login', 'user123');
        expect(consoleInfoSpy).toHaveBeenCalled();
      });

      it('should log failed login as warning', () => {
        logger.logAuthEvent('failed_login', undefined, { metadata: { email: 'test@example.com' } });
        expect(consoleWarnSpy).toHaveBeenCalled();
      });

      it('should include userId in context', () => {
        logger.logAuthEvent('logout', 'user123');
        const call = consoleInfoSpy.mock.calls[0][0];
        expect(call).toContain('user123');
      });
    });

    describe('logUserAction', () => {
      it('should log user actions with full context', () => {
        logger.logUserAction('create', 'recipe', 123, 'user456');
        
        const call = consoleInfoSpy.mock.calls[0][0];
        expect(call).toContain('User action: create recipe 123');
        expect(call).toContain('user456');
      });

      it('should handle string resource IDs', () => {
        logger.logUserAction('update', 'profile', 'profile-abc', 'user789');
        
        const call = consoleInfoSpy.mock.calls[0][0];
        expect(call).toContain('profile-abc');
      });
    });
  });

  describe('Fatal Logging', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'development';
      logger = new Logger();
    });

    it('should log fatal errors', () => {
      const error = new Error('Critical failure');
      logger.fatal('System critical error', error);
      
      expect(consoleErrorSpy).toHaveBeenCalled();
      const call = consoleErrorSpy.mock.calls[0][0];
      expect(call).toContain('FATAL');
    });

    it('should include error details in fatal logs', () => {
      const error = new Error('Database connection lost');
      error.stack = 'Error stack trace';
      
      logger.fatal('Fatal database error', error);
      
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Fatal database error'),
        error
      );
    });
  });
});