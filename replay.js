/**
 * Experiment Action Replay & Timeline Playback Engine
 */

class ReplayEngine {
    constructor() {
        this.stepLogs = [];
        this.currentIndex = 0;
        this.isPlaying = false;
        this.playbackSpeed = 1;
        this.timer = null;
        this.onStepCallback = null;
    }

    loadLogs(logs, onStepCallback) {
        this.stepLogs = logs || [];
        this.currentIndex = 0;
        this.isPlaying = false;
        this.onStepCallback = onStepCallback;
        this.renderTimeline();
    }

    renderTimeline() {
        const container = document.getElementById('replayTimelineContainer');
        if (!container) return;

        let html = '<div style="display: flex; gap: 4px; padding: 10px 0; overflow-x: auto;">';
        this.stepLogs.forEach((log, idx) => {
            const isErr = log.is_error;
            const color = isErr ? '#f43f5e' : '#10b981';
            html += `
                <div class="replay-step-pill" onclick="replayEngine.jumpToStep(${idx})" style="
                    background: ${color}; opacity: ${idx === this.currentIndex ? '1.0' : '0.4'};
                    padding: 6px 12px; border-radius: 6px; font-size: 11px; font-weight: bold; cursor: pointer; white-space: nowrap;
                ">
                    Step ${log.step_index}: ${log.action_type}
                </div>
            `;
        });
        html += '</div>';
        container.innerHTML = html;
    }

    play() {
        if (this.isPlaying) return;
        this.isPlaying = true;
        this.scheduleNext();
    }

    pause() {
        this.isPlaying = false;
        if (this.timer) clearTimeout(this.timer);
    }

    jumpToStep(index) {
        if (index < 0 || index >= this.stepLogs.length) return;
        this.currentIndex = index;
        const currentLog = this.stepLogs[this.currentIndex];
        if (this.onStepCallback) this.onStepCallback(currentLog, this.currentIndex);
        this.renderTimeline();
    }

    scheduleNext() {
        if (!this.isPlaying) return;
        if (this.currentIndex >= this.stepLogs.length - 1) {
            this.pause();
            return;
        }

        const delay = 1500 / this.playbackSpeed;
        this.timer = setTimeout(() => {
            this.currentIndex++;
            const currentLog = this.stepLogs[this.currentIndex];
            if (this.onStepCallback) this.onStepCallback(currentLog, this.currentIndex);
            this.renderTimeline();
            this.scheduleNext();
        }, delay);
    }
}

const replayEngine = new ReplayEngine();
