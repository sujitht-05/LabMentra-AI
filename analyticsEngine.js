/**
 * LabMentra AI - Chart.js Learning Analytics Engine
 */

class AnalyticsEngine {
  constructor() {
    this.radarChart = null;
    this.lineChart = null;
    this.doughnutChart = null;
  }

  /**
   * Initializes or updates analytics charts
   */
  renderAnalytics(containerIds, studentProfile) {
    if (typeof Chart === 'undefined') {
      console.warn('Chart.js library not loaded yet.');
      return;
    }

    // 1. Concept Mastery Radar Chart
    const radarCtx = document.getElementById(containerIds.radarCanvas);
    if (radarCtx) {
      if (this.radarChart) this.radarChart.destroy();
      const labels = Object.keys(studentProfile.masteryScores).map(k => {
        const item = CONCEPT_REGISTRY[k];
        return item ? item.name : k;
      });
      const scores = Object.values(studentProfile.masteryScores);

      this.radarChart = new Chart(radarCtx, {
        type: 'radar',
        data: {
          labels: labels,
          datasets: [{
            label: 'Concept Mastery Score (%)',
            data: scores,
            backgroundColor: 'rgba(37, 99, 235, 0.25)',
            borderColor: '#2563eb',
            pointBackgroundColor: '#1d4ed8',
            pointBorderColor: '#fff',
            pointHoverBackgroundColor: '#fff',
            pointHoverBorderColor: '#1d4ed8'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            r: {
              angleLines: { color: '#e2e8f0' },
              grid: { color: '#f1f5f9' },
              suggestedMin: 0,
              suggestedMax: 100,
              ticks: { stepSize: 20 }
            }
          },
          plugins: {
            legend: { position: 'top' }
          }
        }
      });
    }

    // 2. Performance Trend Line Chart
    const lineCtx = document.getElementById(containerIds.lineCanvas);
    if (lineCtx) {
      if (this.lineChart) this.lineChart.destroy();
      this.lineChart = new Chart(lineCtx, {
        type: 'line',
        data: {
          labels: ['Session 1', 'Session 2', 'Session 3', 'Session 4', 'Session 5 (Latest)'],
          datasets: [
            {
              label: 'Accuracy Score (%)',
              data: [65, 78, 72, 88, 94],
              borderColor: '#10b981',
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              fill: true,
              tension: 0.3
            },
            {
              label: 'Procedural Precision',
              data: [50, 70, 80, 85, 92],
              borderColor: '#6366f1',
              borderDash: [5, 5],
              fill: false
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: { min: 0, max: 100 }
          }
        }
      });
    }

    // 3. Error Breakdown Doughnut Chart
    const doughnutCtx = document.getElementById(containerIds.doughnutCanvas);
    if (doughnutCtx) {
      if (this.doughnutChart) this.doughnutChart.destroy();
      this.doughnutChart = new Chart(doughnutCtx, {
        type: 'doughnut',
        data: {
          labels: ['Procedural Sequence', 'Volumetric Precision', 'Safety & Hazards', 'Calculation Errors'],
          datasets: [{
            data: [35, 40, 15, 10],
            backgroundColor: ['#f59e0b', '#ef4444', '#8b5cf6', '#3b82f6']
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'bottom' }
          }
        }
      });
    }
  }
}

const analyticsEngine = new AnalyticsEngine();
