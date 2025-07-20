/**
 * Progress indicator utilities for user feedback
 */

export class ProgressIndicator {
  private interval: NodeJS.Timeout | null = null;
  private frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
  private currentFrame = 0;
  private message = '';

  /**
   * Start the progress indicator
   */
  start(message: string = 'Processing'): void {
    this.message = message;
    this.currentFrame = 0;
    
    // Clear any existing interval
    this.stop();
    
    // Start the spinner
    this.interval = setInterval(() => {
      process.stdout.write(`\r${this.frames[this.currentFrame]} ${this.message}...`);
      this.currentFrame = (this.currentFrame + 1) % this.frames.length;
    }, 100);
  }

  /**
   * Update the progress message
   */
  updateMessage(message: string): void {
    this.message = message;
  }

  /**
   * Stop the progress indicator
   */
  stop(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
      // Clear the line
      process.stdout.write('\r' + ' '.repeat(50) + '\r');
    }
  }

  /**
   * Show a simple static message
   */
  static showMessage(message: string): void {
    console.log(`🤔 ${message}...`);
  }
}
