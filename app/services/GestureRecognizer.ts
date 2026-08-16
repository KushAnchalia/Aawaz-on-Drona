/**
 * GestureRecognizer: Integrates MediaPipe Hands via CDN for 3D gesture tracking.
 */

declare global {
    interface Window {
        Hands: any;
        Camera: any;
        drawConnectors: any;
        drawLandmarks: any;
        HAND_CONNECTIONS: any;
    }
}

export class GestureRecognizer {
    private hands: any = null;
    private isLoaded: boolean = false;
    public trackingStatus: string = "Not Initialized";

    async init() {
        if (this.isLoaded) return;
        this.trackingStatus = "Loading Scripts...";

        try {
            // Load scripts dynamically from CDN
            await this.loadScript("https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js");
            await this.loadScript("https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js");

            this.trackingStatus = "Initializing WASM...";
            this.hands = new window.Hands({
                locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
            });

            this.hands.setOptions({
                maxNumHands: 2,
                modelComplexity: 1,
                minDetectionConfidence: 0.5, // Lowered threshold for better detection
                minTrackingConfidence: 0.5
            });

            this.hands.onResults((results: any) => {
                this.trackingStatus = results.multiHandLandmarks && results.multiHandLandmarks.length > 0 ? "Tracking Active" : "No Hands Detected";
            });

            this.isLoaded = true;
            this.trackingStatus = "WASM Loaded";
        } catch (error) {
            console.error("GestureRecognizer init failed:", error);
            this.trackingStatus = "Initialization Failed";
            throw error;
        }
    }

    private loadScript(src: string): Promise<void> {
        return new Promise((resolve, reject) => {
            const script = document.createElement("script");
            script.src = src;
            script.onload = () => resolve();
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    onResults(callback: (results: any) => void) {
        if (this.hands) {
            this.hands.onResults(callback);
        }
    }

    async send(image: HTMLVideoElement) {
        if (this.hands) {
            await this.hands.send({ image });
        }
    }

    drawLandmarks(ctx: CanvasRenderingContext2D, results: any) {
        if (!results.multiHandLandmarks) return;

        ctx.save();
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

        for (const landmarks of results.multiHandLandmarks) {
            window.drawConnectors(ctx, landmarks, window.HAND_CONNECTIONS, { color: '#00FF00', lineWidth: 5 });
            window.drawLandmarks(ctx, landmarks, { color: '#FF0000', lineWidth: 2 });
        }
        ctx.restore();
    }
}

export const gestureRecognizer = new GestureRecognizer();
