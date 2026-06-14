type LogLevel = 'info' | 'warn' | 'error';

interface CrashReport {
  message: string;
  stack?: string;
  level: LogLevel;
  timestamp: string;
  extras?: Record<string, unknown>;
}

class CrashReporter {
  private enabled = false;
  private dsn: string | null = null;

  init(dsn: string): void {
    this.dsn = dsn;
    this.enabled = true;
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  captureException(error: Error, extras?: Record<string, unknown>): void {
    if (!this.enabled) return;
    const report: CrashReport = {
      message: error.message,
      stack: error.stack,
      level: 'error',
      timestamp: new Date().toISOString(),
      extras,
    };
    this.send(report);
  }

  captureMessage(message: string, level: LogLevel = 'info', extras?: Record<string, unknown>): void {
    if (!this.enabled) return;
    const report: CrashReport = {
      message,
      level,
      timestamp: new Date().toISOString(),
      extras,
    };
    this.send(report);
  }

  private send(report: CrashReport): void {
    if (!this.dsn) return;
    fetch(this.dsn, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(report),
    }).catch(() => {
      // silently fail — don't crash the crash reporter
    });
  }
}

export const crashReporter = new CrashReporter();
export default crashReporter;
