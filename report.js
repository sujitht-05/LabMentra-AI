/**
 * Digital Signature Pad & Lab Report Generator
 */

class ReportManager {
    constructor() {
        this.signatureCanvas = null;
        this.signatureCtx = null;
        this.isDrawing = false;
    }

    initSignaturePad(canvasId) {
        this.signatureCanvas = document.getElementById(canvasId);
        if (!this.signatureCanvas) return;

        this.signatureCtx = this.signatureCanvas.getContext('2d');
        this.signatureCtx.strokeStyle = '#0284c7';
        this.signatureCtx.lineWidth = 2;
        this.signatureCtx.lineCap = 'round';

        this.signatureCanvas.addEventListener('mousedown', (e) => this.startDrawing(e));
        this.signatureCanvas.addEventListener('mousemove', (e) => this.draw(e));
        this.signatureCanvas.addEventListener('mouseup', () => this.stopDrawing());
        this.signatureCanvas.addEventListener('mouseleave', () => this.stopDrawing());

        // Touch support
        this.signatureCanvas.addEventListener('touchstart', (e) => {
            const touch = e.touches[0];
            const mouseEvent = new MouseEvent('mousedown', {
                clientX: touch.clientX,
                clientY: touch.clientY
            });
            this.signatureCanvas.dispatchEvent(mouseEvent);
        });

        this.signatureCanvas.addEventListener('touchmove', (e) => {
            const touch = e.touches[0];
            const mouseEvent = new MouseEvent('mousemove', {
                clientX: touch.clientX,
                clientY: touch.clientY
            });
            this.signatureCanvas.dispatchEvent(mouseEvent);
        });
    }

    startDrawing(e) {
        this.isDrawing = true;
        const rect = this.signatureCanvas.getBoundingClientRect();
        this.signatureCtx.beginPath();
        this.signatureCtx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    }

    draw(e) {
        if (!this.isDrawing) return;
        const rect = this.signatureCanvas.getBoundingClientRect();
        this.signatureCtx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
        this.signatureCtx.stroke();
    }

    stopDrawing() {
        this.isDrawing = false;
    }

    clearSignature() {
        if (!this.signatureCtx) return;
        this.signatureCtx.clearRect(0, 0, this.signatureCanvas.width, this.signatureCanvas.height);
    }

    getSignatureDataURL() {
        if (!this.signatureCanvas) return '';
        return this.signatureCanvas.toDataURL('image/png');
    }
}

const reportManager = new ReportManager();
