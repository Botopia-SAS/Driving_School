/**
 * Centralized logging utility
 * Respects NODE_ENV to prevent logging in production
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogOptions {
  context?: string;
  emoji?: string;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV !== 'production';

  private formatMessage(level: LogLevel, message: string, options?: LogOptions): string {
    const emoji = options?.emoji || this.getDefaultEmoji(level);
    const context = options?.context ? `[${options.context}]` : '';
    const timestamp = new Date().toISOString();

    return `${emoji} ${timestamp} ${context} ${message}`;
  }

  private getDefaultEmoji(level: LogLevel): string {
    const emojiMap: Record<LogLevel, string> = {
      info: 'ℹ️',
      warn: '⚠️',
      error: '❌',
      debug: '🔍',
    };
    return emojiMap[level];
  }

  info(message: string, options?: LogOptions): void {
    if (this.isDevelopment) {
      console.log(this.formatMessage('info', message, options));
    }
  }

  warn(message: string, options?: LogOptions): void {
    if (this.isDevelopment) {
      console.warn(this.formatMessage('warn', message, options));
    }
  }

  error(message: string, error?: unknown, options?: LogOptions): void {
    // Always log errors, even in production (but sanitize sensitive data)
    console.error(this.formatMessage('error', message, options));
    if (error && this.isDevelopment) {
      console.error(error);
    } else if (error) {
      // In production, only log error message, not full stack trace
      console.error(error instanceof Error ? error.message : 'An error occurred');
    }
  }

  debug(message: string, data?: unknown, options?: LogOptions): void {
    if (this.isDevelopment) {
      console.log(this.formatMessage('debug', message, options));
      if (data) {
        console.log(data);
      }
    }
  }

  /**
   * Log only in development environment
   */
  dev(message: string, data?: unknown, options?: LogOptions): void {
    if (this.isDevelopment) {
      console.log(this.formatMessage('debug', message, options));
      if (data) {
        console.log(data);
      }
    }
  }
}

// Export singleton instance
export const logger = new Logger();

// Export type for consistency
export type { LogLevel, LogOptions };
