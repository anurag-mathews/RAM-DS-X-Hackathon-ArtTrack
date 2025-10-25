// We still need to install these packages
// npm install @mediapipe/face_mesh @mediapipe/camera_utils
import { FaceMesh } from "@mediapipe/face_mesh";
import { Camera } from "@mediapipe/camera_utils";

class EyeTrackingService {
    private faceMesh: FaceMesh | null = null;
    private camera: Camera | null = null;
    
    start(
        videoElement: HTMLVideoElement,
        canvasElement: HTMLCanvasElement,
        onGazeCallback: (x: number, y: number) => void
    ) {
        if (this.camera) {
            this.camera.start();
            return;
        }

        console.log("Initializing MediaPipe for Eye Tracking...");

        this.faceMesh = new FaceMesh({
            locateFile: (file) => {
                return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
            },
        });

        this.faceMesh.setOptions({
            maxNumFaces: 1,
            refineLandmarks: true, 
            minDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5,
        });

        this.faceMesh.onResults((results: any) => {
            if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
                const landmarks = results.multiFaceLandmarks[0];
                const pupil = landmarks[473]; 

                if (pupil) {
                    const x = pupil.x * canvasElement.width;
                    const y = pupil.y * canvasElement.height;
                    const mirroredX = canvasElement.width - x;

                    onGazeCallback(mirroredX, y);
                }
            }
        });

        this.camera = new Camera(videoElement, {
            onFrame: async () => {
                if (this.faceMesh) {
                    await this.faceMesh.send({ image: videoElement });
                }
            },
            width: canvasElement.width,
            height: canvasElement.height,
        });
        this.camera.start();
    }

    stop() {
        if (this.camera) {
            this.camera.stop();
            console.log("Eye tracking paused.");
        }
    }

    // full cleanup function if ever need it
    destroy() {
         if (this.camera) {
            this.camera.stop();
            this.camera = null;
         }
         if (this.faceMesh) {
            this.faceMesh.close();
            this.faceMesh = null;
         }
         console.log("Eye tracking destroyed.");
    }
}

export const eyeTracker = new EyeTrackingService();
// once imported in sketch.tsx, do:
    // const handleGaze = useCallback((x: number, y: number) => {
    
//      1. The user moves their eyes, so the eye tracker sends (x, y).
//      2. We check: "Is the mouse button being held down?"
//     if (drawingRef.current) { 
    
//         // 3. If YES, we draw.
//         executeDraw(x, y);
//     }
//     // 4. If NO, this function does nothing, and no drawing happens.

// }, [executeDraw]);
