/**
 * CameraService: Handles video capture and recording for the Sign Language Agent.
 */
export class CameraService {
    private stream: MediaStream | null = null;
    private mediaRecorder: MediaRecorder | null = null;
    private chunks: Blob[] = [];

    async startCamera(videoElement: HTMLVideoElement): Promise<MediaStream> {
        try {
            this.stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    facingMode: "user"
                },
                audio: false
            });
            videoElement.srcObject = this.stream;
            return this.stream;
        } catch (error) {
            console.error("CameraService.startCamera failed:", error);
            throw error;
        }
    }

    stopCamera() {
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }
    }

    startRecording() {
        if (!this.stream) return;
        this.chunks = [];
        this.mediaRecorder = new MediaRecorder(this.stream);
        this.mediaRecorder.ondataavailable = (e) => this.chunks.push(e.data);
        this.mediaRecorder.start();
    }

    stopRecording(): Promise<Blob> {
        return new Promise((resolve) => {
            if (!this.mediaRecorder) return resolve(new Blob());
            this.mediaRecorder.onstop = () => {
                const blob = new Blob(this.chunks, { type: "video/webm" });
                resolve(blob);
            };
            this.mediaRecorder.stop();
        });
    }
}

export const cameraService = new CameraService();
