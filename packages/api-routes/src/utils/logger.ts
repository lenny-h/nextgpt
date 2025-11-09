/**
 * Centralized logging configuration for the API service.
 * Provides structured logging with appropriate log levels and formatting.
 */

export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

interface LoggerConfig {
  name: string;
  level?: LogLevel;
}

class Logger {
  private name: string;
  private level: LogLevel;
  private logLevels: Record<LogLevel, number> = {
    DEBUG: 0,
    INFO: 1,
    WARN: 2,
    ERROR: 3,
  };

  constructor(config: LoggerConfig) {
    this.name = config.name;
    
    // Use WARN level in production, DEBUG in development
    const isDev = process.env.NODE_ENV === 'development';
    this.level = config.level || (isDev ? 'DEBUG' : 'WARN');
  }

  private shouldLog(level: LogLevel): boolean {
    return this.logLevels[level] >= this.logLevels[this.level];
  }

  private formatMessage(level: LogLevel, message: string, ...args: any[]): string {
    const timestamp = new Date().toISOString().replace('T', ' ').split('.')[0];
    const formattedArgs = args.length > 0 ? ' ' + args.map(arg => 
      typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
    ).join(' ') : '';
    
    return `${timestamp} - ${this.name} - ${level} - ${message}${formattedArgs}`;
  }

  debug(message: string, ...args: any[]): void {
    if (this.shouldLog('DEBUG')) {
      console.log(this.formatMessage('DEBUG', message, ...args));
    }
  }

  info(message: string, ...args: any[]): void {
    if (this.shouldLog('INFO')) {
      console.log(this.formatMessage('INFO', message, ...args));
    }
  }

  warn(message: string, ...args: any[]): void {
    if (this.shouldLog('WARN')) {
      console.warn(this.formatMessage('WARN', message, ...args));
    }
  }

  error(message: string, ...args: any[]): void {
    if (this.shouldLog('ERROR')) {
      console.error(this.formatMessage('ERROR', message, ...args));
    }
  }
}

/**
 * Create a logger instance with consistent formatting.
 * 
 * @param name - Name of the logger (typically the module name)
 * @param level - Optional logging level (defaults to DEBUG in dev, WARN in prod)
 * @returns Configured logger instance
 * 
 * @example
 * const logger = createLogger('chat-handler');
 * logger.info('Processing request');
 * logger.error('Failed to process', error);
 */
export function createLogger(name: string, level?: LogLevel): Logger {
  return new Logger({ name, level });
}
