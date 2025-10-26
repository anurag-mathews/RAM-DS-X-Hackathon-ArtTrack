import { FaceMesh } from "@mediapipe/face_mesh";
import { Camera } from "@mediapipe/camera_utils";

type EyeTrackOptions = { gain?: number; smooth?: number; mirror?: boolean };

class EyeTrackingService {
  private faceMesh: FaceMesh | null = null;
  private camera: Camera | null = null;
  private lastRaw: { x: number; y: number } | null = null;
  private origin: { x: number; y: number } | null = null;
  private ema: { x: number; y: number } | null = null;
  private opts: Required<EyeTrackOptions> = { gain: 2.5, smooth: 0.3, mirror: true };

  setOptions(options: EyeTrackOptions) {
    this.opts = { ...this.opts, ...options };
  }

  async start(
    videoElement: HTMLVideoElement,
    canvasElement: HTMLCanvasElement,
    onGazeCallback: (x: number, y: number) => void,
    options?: EyeTrackOptions
  ) {
    if (options) this.setOptions(options);

    if (!this.faceMesh) {
      this.faceMesh = new FaceMesh({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
      });
      this.faceMesh.setOptions({
        maxNumFaces: 1,
        refineLandmarks: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });

      this.faceMesh.onResults((results: any) => {
        const lm = results.multiFaceLandmarks?.[0];
        const pupil = lm?.[473];
        if (!pupil) return;

        const rawX = pupil.x;
        const rawY = pupil.y;
        this.lastRaw = { x: rawX, y: rawY };
        if (!this.origin) this.origin = { x: rawX, y: rawY };

        const dx = (rawX - this.origin.x) * this.opts.gain;
        const dy = (rawY - this.origin.y) * this.opts.gain;
        let normX = Math.max(0, Math.min(1, this.origin.x + dx));
        let normY = Math.max(0, Math.min(1, this.origin.y + dy));

        let cx = normX * canvasElement.width;
        let cy = normY * canvasElement.height;
        if (this.opts.mirror) cx = canvasElement.width - cx;

        const a = Math.max(0, Math.min(0.95, this.opts.smooth));
        if (!this.ema) this.ema = { x: cx, y: cy };
        this.ema = { x: a * this.ema.x + (1 - a) * cx, y: a * this.ema.y + (1 - a) * cy };

        onGazeCallback(this.ema.x, this.ema.y);
      });
    }

    if (!this.camera) {
      this.camera = new Camera(videoElement, {
        onFrame: async () => {
          if (!this.faceMesh) return;
          if (videoElement.readyState < 2 || !videoElement.videoWidth || !videoElement.videoHeight) return;
          await this.faceMesh.send({ image: videoElement });
        },
        width: canvasElement.width,
        height: canvasElement.height,
      });
    }

    await this.camera.start();
  }

  calibrate() {
    if (this.lastRaw) {
      this.origin = { ...this.lastRaw };
      this.ema = null;
    }
  }

  stop() {
    if (this.camera) this.camera.stop();
  }

  destroy() {
    if (this.camera) {
      this.camera.stop();
      this.camera = null;
    }
    if (this.faceMesh) {
      this.faceMesh.close();
      this.faceMesh = null;
    }
    this.lastRaw = null;
    this.origin = null;
    this.ema = null;
  }
}

export const eyeTracker = new EyeTrackingService();
