/**
 * LabMentra AI - Interactive Experiment Replay Engine
 */

class ReplayEngine {
  constructor() {
    this.historyLogs = [];
    this.currentPlaybackIndex = 0;
    this.isPlaying = false;
    this.playbackSpeed = 1000; // ms per step
    this.playbackTimer = null;
    this.onStepCallback = null;
    this.onStateChangeCallback = null;
  }

  /**
   * Initializes replay buffer with an attempt log array
   */
  loadAttempt(attemptData) {
    this.stopPlayback();
    this.historyLogs = attemptData.logs || [];
    this.currentPlaybackIndex = 0;
    if (this.onStateChangeCallback) {
      this.onStateChangeCallback(this.getCurrentStep());
    }
  }

  getCurrentStep() {
    if (this.historyLogs.length === 0) return null;
    return this.historyLogs[this.currentPlaybackIndex];
  }

  getTotalSteps() {
    return this.historyLogs.length;
  }

  seekTo(index) {
    if (index >= 0 && index < this.historyLogs.length) {
      this.currentPlaybackIndex = index;
      if (this.onStepCallback) {
        this.onStepCallback(this.getCurrentStep(), this.currentPlaybackIndex, this.historyLogs.length);
      }
    }
  }

  startPlayback(onStep, speedMultiplier = 1) {
    this.stopPlayback();
    this.onStepCallback = onStep;
    this.isPlaying = true;

    const interval = Math.max(200, 1000 / speedMultiplier);

    this.playbackTimer = setInterval(() => {
      if (this.currentPlaybackIndex < this.historyLogs.length - 1) {
        this.currentPlaybackIndex++;
        if (this.onStepCallback) {
          this.onStepCallback(this.getCurrentStep(), this.currentPlaybackIndex, this.historyLogs.length);
        }
      } else {
        this.stopPlayback();
      }
    }, interval);
  }

  stopPlayback() {
    if (this.playbackTimer) {
      clearInterval(this.playbackTimer);
      this.playbackTimer = null;
    }
    this.isPlaying = false;
  }

  jumpNextError() {
    for (let i = this.currentPlaybackIndex + 1; i < this.historyLogs.length; i++) {
      if (this.historyLogs[i].isError) {
        this.seekTo(i);
        return true;
      }
    }
    return false;
  }

  jumpPrevError() {
    for (let i = this.currentPlaybackIndex - 1; i >= 0; i--) {
      if (this.historyLogs[i].isError) {
        this.seekTo(i);
        return true;
      }
    }
    return false;
  }
}

const replayEngine = new ReplayEngine();
