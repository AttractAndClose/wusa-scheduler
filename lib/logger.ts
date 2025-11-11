// lib/logger.ts

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';

  private shouldLog(level: LogLevel): boolean {
    if (this.isDevelopment) return true;
    // In production, only log warnings and errors
    return level === 'warn' || level === 'error';
  }

  private formatMessage(level: LogLevel, message: string, ...args: any[]): string {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
    return `${prefix} ${message}`;
  }

  debug(message: string, ...args: any[]): void {
    if (this.shouldLog('debug')) {
      console.debug(this.formatMessage('debug', message), ...args);
    }
  }

  info(message: string, ...args: any[]): void {
    if (this.shouldLog('info')) {
      console.info(this.formatMessage('info', message), ...args);
    }
  }

  warn(message: string, ...args: any[]): void {
    if (this.shouldLog('warn')) {
      console.warn(this.formatMessage('warn', message), ...args);
    }
  }

  error(message: string, error?: Error | unknown, ...args: any[]): void {
    if (this.shouldLog('error')) {
      const errorDetails = error instanceof Error 
        ? { message: error.message, stack: error.stack }
        : error;
      console.error(
        this.formatMessage('error', message),
        errorDetails,
        ...args
      );
    }
  }
}

// Export singleton instance
export const logger = new Logger();

// Export type for use in other files
export type { LogLevel };


