export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

interface LogEntry {
  level: LogLevel
  message: string
  optionalParams: any[]
}

class Logger {
  private logLevel: LogLevel
  private deferredLogs: LogEntry[] = []

  constructor(logLevel: LogLevel = LogLevel.INFO) {
    this.logLevel = logLevel
  }

  private shouldLog(level: LogLevel): boolean {
    const levels = Object.values(LogLevel)
    const currentIndex = levels.indexOf(this.logLevel)
    const targetIndex = levels.indexOf(level)
    return targetIndex >= currentIndex
  }

  private formatMessage(level: LogLevel, message: string): string {
    const timestamp = new Date().toISOString()
    return `[${timestamp}] [${level}] ${message}`
  }

  private addLogEntry(level: LogLevel, message: string, optionalParams: any[]): void {
    const logEntry: LogEntry = { level, message, optionalParams }
    this.deferredLogs.push(logEntry)
  }

  public debug(message: string, ...optionalParams: any[]): void {
    this.log(LogLevel.DEBUG, message, ...optionalParams)
  }

  public info(message: string, ...optionalParams: any[]): void {
    this.log(LogLevel.INFO, message, ...optionalParams)
  }

  public warn(message: string, ...optionalParams: any[]): void {
    this.log(LogLevel.WARN, message, ...optionalParams)
  }

  public error(message: string, ...optionalParams: any[]): void {
    this.log(LogLevel.ERROR, message, ...optionalParams)
  }

  private log(level: LogLevel, message: string, ...optionalParams: any[]): void {
    if (this.shouldLog(level)) {
      console.log(this.formatMessage(level, message), ...optionalParams)
    }
  }

  public setLogLevel(level: LogLevel): void {
    this.logLevel = level
  }

  public deferred(message: string, level: LogLevel = LogLevel.INFO, ...optionalParams: any[]): void {
    this.addLogEntry(level, message, optionalParams)
  }

  public flushDeferredLogs(): void {
    this.deferredLogs.forEach((logEntry) => {
      if (this.shouldLog(logEntry.level)) {
        console.log(this.formatMessage(logEntry.level, logEntry.message), ...logEntry.optionalParams)
      }
    })
    this.deferredLogs = []
  }

  public clearDeferredLogs(): void {
    this.deferredLogs = []
  }
}

const devEnvirements = [
  'development',
  'test',
  'TEST',
  'local',
  'LOCAL',
  'DEV',
  'dev',
]

let process_ = ''
try {
  // @ts-expect-error ---
  // eslint-disable-next-line node/prefer-global/process
  process_ = process ? process?.env?.NODE_ENV : ''
} // eslint-disable-next-line unused-imports/no-unused-vars
catch (_e: any) { process_ = '' }
const isDev = devEnvirements.includes(process_) || devEnvirements.includes(import.meta.env.MODE)

let logLevel = LogLevel.DEBUG
if (!isDev)
  logLevel = LogLevel.INFO
export const logger = new Logger(logLevel)

// EXAMPLES
/*
  const logger = new Logger(LogLevel.DEBUG);

  // Defer log messages with specific levels
  logger.deferred("This is a deferred debug message.", LogLevel.DEBUG);
  logger.deferred("This is a deferred info message.", LogLevel.INFO);
  logger.deferred("This is a deferred warning message.", LogLevel.WARN);
  logger.deferred("This is a deferred error message.", LogLevel.ERROR);

  // These messages won't appear immediately
  console.log("Deferred logging in action...");

  // Flush deferred logs to output them
  logger.flushDeferredLogs();

  // After flushing, logs are output immediately
  logger.debug("This debug message is logged immediately.");

* */
