import React, { useEffect, useRef, useState } from "react";
import { eyeTracker } from "./eye_tracker";
import "./Sketch.css";

type Tool = "draw" | "fill" | "erase" | "reset" | "eyetrack";

const MAX_HISTORY = 30;

const Sketch: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tool, setTool] = useState<Tool>("draw");

  const pointerRef = useRef<HTMLDivElement>(null);
  const lastGazeRef = useRef<{ x: number; y: number } | null>(null);

  const [drawing, setDrawing] = useState(false);
  const [color, setColor] = useState<string>("#000000");
  const [thickness, setThickness] = useState<number>(16);

  const [eyeTrackingOn, setEyeTrackingOn] = useState(false);
  const [gazeDrawing, setGazeDrawing] = useState(false);

  const [gain, setGain] = useState<number>(3);
  const [smooth, setSmooth] = useState<number>(0.25);

  const [canUndo, setCanUndo] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);

  const gazeActiveRef = useRef(false);
  const colorRef = useRef(color);
  const thicknessRef = useRef(thickness);

  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  const historyRef = useRef<ImageData[]>([]);

  useEffect(() => { gazeActiveRef.current = gazeDrawing; }, [gazeDrawing]);
  useEffect(() => { colorRef.current = color; }, [color]);
  useEffect(() => { thicknessRef.current = thickness; }, [thickness]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    const width = 960, height = 540;

    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, width, height);

    pushHistory();
  }, []);

  useEffect(() => {
    if (eyeTrackingOn) eyeTracker.setOptions({ gain, smooth });
  }, [gain, smooth, eyeTrackingOn]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === "z" || e.key === "Z")) {
        e.preventDefault();
        handleUndo();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const getCtx = () => {
    const canvas = canvasRef.current;
    if (!canvas) return null as unknown as CanvasRenderingContext2D | null;
    return canvas.getContext("2d");
  };

  const pushHistory = () => {
    const canvas = canvasRef.current;
    const ctx = getCtx();
    if (!canvas || !ctx) return;
    const snap = ctx.getImageData(0, 0, canvas.width, canvas.height);
    historyRef.current.push(snap);
    if (historyRef.current.length > MAX_HISTORY) historyRef.current.shift();
    setCanUndo(historyRef.current.length > 1);
  };

  const handleUndo = () => {
    const canvas = canvasRef.current;
    const ctx = getCtx();
    if (!canvas || !ctx) return;
    if (historyRef.current.length <= 1) return;
    historyRef.current.pop();
    const prev = historyRef.current[historyRef.current.length - 1];
    ctx.putImageData(prev, 0, 0);
    setCanUndo(historyRef.current.length > 1);
  };

  const handleEyeTracking = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (!eyeTrackingOn) {
      let video = videoRef.current;
      if (!video) {
        video = document.createElement("video");
        video.setAttribute("playsInline", "true");
        video.autoplay = true;
        video.muted = true;
        video.width = canvas.width;
        video.height = canvas.height;
        Object.assign(video.style, {
          position: "fixed",
          left: "-99999px",
          top: "0",
          opacity: "0",
          pointerEvents: "none"
        });
        document.body.appendChild(video);
        videoRef.current = video;
      }
      try {
        await eyeTracker.start(
          video!,
          canvas,
          (x, y) => {
            lastGazeRef.current = { x, y };
            const p = pointerRef.current;
            if (p) {
              p.style.left = `${x}px`;
              p.style.top = `${y}px`;
              p.style.width = `${thicknessRef.current}px`;
              p.style.height = `${thicknessRef.current}px`;
              p.style.backgroundColor = colorRef.current;
            }

            if (!gazeActiveRef.current) return;
            const ctx = getCtx();
            if (!ctx) return;
            ctx.strokeStyle = colorRef.current;
            ctx.lineWidth = thicknessRef.current;
            ctx.lineCap = "round";
            ctx.lineTo(x, y);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(x, y);
            lastPointRef.current = { x, y };
          },
          { gain, smooth, mirror: true }
        );
        setEyeTrackingOn(true);
      } catch (e) {
        console.error(e);
        setEyeTrackingOn(false);
        setGazeDrawing(false);
      }
    } else {
      eyeTracker.stop();
      setEyeTrackingOn(false);
      setGazeDrawing(false);
    }
  };

  const handleGazeStartStop = (next: boolean) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setGazeDrawing(next);
    if (next) {
      pushHistory();
      const ctx = getCtx();
      if (!ctx) return;
      ctx.beginPath();
      const gp = lastGazeRef.current;
      if (gp) {
        ctx.moveTo(gp.x, gp.y);
        lastPointRef.current = { x: gp.x, y: gp.y };
      }
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    const ctx = getCtx();
    if (!canvas || !ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (tool === "draw" && e.shiftKey) {
      pushHistory();
      const prev = lastPointRef.current;
      if (prev) {
        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineWidth = thickness;
        ctx.lineCap = "round";
        ctx.moveTo(prev.x, prev.y);
        ctx.lineTo(x, y);
        ctx.stroke();
        ctx.beginPath();
      }
      lastPointRef.current = { x, y };
      return;
    }

    if (tool === "fill") {
      pushHistory();
      handleFill(e);
      return;
    }

    pushHistory();
    setDrawing(true);
    ctx.beginPath();
    ctx.moveTo(x, y);
    lastPointRef.current = { x, y };

    if (tool === "draw") {
      draw(e);
    }
  };

  const handleMouseUp = () => setDrawing(false);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!drawing) return;
    draw(e);
  };

  const draw = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    const ctx = getCtx();
    if (!canvas || !ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (tool === "draw") {
      ctx.strokeStyle = color;
      ctx.lineWidth = thickness;
      ctx.lineCap = "round";
      ctx.lineTo(x, y);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x, y);
      lastPointRef.current = { x, y };
    } else if (tool === "erase") {
      ctx.clearRect(x - thickness, y - thickness, thickness * 2, thickness * 2);
    }
  };

  const handleFill = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    const ctx = getCtx();
    if (!canvas || !ctx) return;

    const rect = canvas.getBoundingClientRect();
    const xCSS = e.clientX - rect.left;
    const yCSS = e.clientY - rect.top;

    const styleW = parseFloat(canvas.style.width || `${rect.width}`);
    const styleH = parseFloat(canvas.style.height || `${rect.height}`);
    const sx = canvas.width / styleW;
    const sy = canvas.height / styleH;

    const x = Math.floor(xCSS * sx);
    const y = Math.floor(yCSS * sy);

    const width = canvas.width;
    const height = canvas.height;

    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;

    const getIdx = (px: number, py: number) => (py * width + px) * 4;

    const startIdx = getIdx(x, y);
    const target = [data[startIdx], data[startIdx + 1], data[startIdx + 2], data[startIdx + 3]] as const;

    const hex = color.replace("#", "");
    const fill = [
      parseInt(hex.substring(0, 2), 16),
      parseInt(hex.substring(2, 4), 16),
      parseInt(hex.substring(4, 6), 16),
      255,
    ] as const;

    if (target[0] === fill[0] && target[1] === fill[1] && target[2] === fill[2] && target[3] === fill[3]) {
      return;
    }

    const visited = new Uint8Array(width * height);
    const stack: [number, number][] = [[x, y]];
    const toColor: number[] = [];
    let touchesEdge = false;

    const match = (idx: number) =>
      data[idx] === target[0] &&
      data[idx + 1] === target[1] &&
      data[idx + 2] === target[2] &&
      data[idx + 3] === target[3];

    while (stack.length) {
      const [cx, cy] = stack.pop()!;
      if (cx < 0 || cy < 0 || cx >= width || cy >= height) continue;
      const pi = cy * width + cx;
      if (visited[pi]) continue;
      const di = pi * 4;
      if (!match(di)) continue;

      visited[pi] = 1;
      toColor.push(di);

      if (cx === 0 || cy === 0 || cx === width - 1 || cy === height - 1) touchesEdge = true;

      stack.push([cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]);
    }

    if (touchesEdge || toColor.length === 0) {
      setCanUndo(historyRef.current.length > 1);
      return;
    }

    for (let i = 0; i < toColor.length; i++) {
      const idx = toColor[i];
      data[idx] = fill[0];
      data[idx + 1] = fill[1];
      data[idx + 2] = fill[2];
      data[idx + 3] = fill[3];
    }
    ctx.putImageData(imageData, 0, 0);

    lastPointRef.current = { x: Math.round(xCSS), y: Math.round(yCSS) };
  };

  const handleReset = () => {
    const canvas = canvasRef.current;
    const ctx = getCtx();
    if (!canvas || !ctx) return;
    pushHistory();
    const w = parseFloat(canvas.style.width);
    const h = parseFloat(canvas.style.height);
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, w, h);
    lastPointRef.current = null;
  };

  const handleToolChange = (selectedTool: Tool) => {
    setTool(selectedTool);
    const ctx = getCtx();
    if (!ctx) return;
    ctx.beginPath();
  };

  const handleSubmit = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataURL = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = dataURL;
    a.download = "face-drawing.png";
    a.click();
  };

  const Btn: React.FC<{
    active?: boolean;
    onClick: () => void;
    children: React.ReactNode;
    title?: string;
    variant?: "primary" | "ghost";
    disabled?: boolean;
  }> = ({ active, onClick, children, title, variant, disabled }) => (
    <button
      type="button"
      className={`btn ${variant || ""} ${active ? "active" : ""}`}
      onClick={onClick}
      title={title}
      aria-pressed={active}
      disabled={disabled}
    >
      {children}
    </button>
  );

  return (
    <div className="g-root">
      <header className="g-header">
        <h1 className="g-title">Sightboard</h1>
      </header>

      <div className="g-toolbar card">
        <div className="g-row">
          <div className="g-segment">
            <Btn active={tool === "draw"} onClick={() => handleToolChange("draw")} title="Draw">Draw</Btn>
            <Btn active={tool === "erase"} onClick={() => handleToolChange("erase")} title="Erase">Erase</Btn>
            <Btn active={tool === "fill"} onClick={() => handleToolChange("fill")} title="Fill">Fill</Btn>
            <Btn onClick={handleReset} title="Clear">Clear</Btn>
            <Btn onClick={handleUndo} title="Undo (Ctrl+Z)" disabled={!canUndo}>Undo</Btn>
          </div>

          <div className="g-segment">
            <Btn active={eyeTrackingOn} onClick={handleEyeTracking} title="Toggle Head Tracking">
              {eyeTrackingOn ? "Head Tracking: On" : "Head Tracking: Off"}
            </Btn>
            {eyeTrackingOn && (
              <Btn
                active={gazeDrawing}
                onClick={() => handleGazeStartStop(!gazeDrawing)}
                title={gazeDrawing ? "Stop gaze drawing" : "Start gaze drawing"}
              >
                {gazeDrawing ? "Stop" : "Start"}
              </Btn>
            )}
          </div>
        </div>

        <div className="g-row">
          <label className="control">
            <span className="label">Color</span>
            <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="color" />
          </label>

          <label className="control">
            <span className="label">Size</span>
            <input className="range" type="range" min={1} max={80} value={thickness} onChange={(e) => setThickness(Number(e.target.value))} />
            <span className="badge">{thickness}</span>
          </label>

          <label className="control">
            <span className="label">Sensitivity</span>
            <input className="range" type="range" min={1} max={8} step={0.1} value={gain} onChange={(e) => setGain(Number(e.target.value))} />
            <span className="badge">{gain.toFixed(1)}×</span>
          </label>

          <label className="control">
            <span className="label">Blending</span>
            <input className="range" type="range" min={0} max={0.95} step={0.05} value={smooth} onChange={(e) => setSmooth(Number(e.target.value))} />
            <span className="badge">{smooth.toFixed(2)}</span>
          </label>

          <Btn variant="primary" onClick={handleSubmit} title="Export PNG">Export</Btn>
        </div>
      </div>

      <main className="g-main">
        <div className="canvas-card card">
          <div className="canvas-wrap">
            <canvas
              ref={canvasRef}
              className="canvas"
              onMouseDown={handleMouseDown}
              onMouseUp={handleMouseUp}
              onMouseOut={handleMouseUp}
              onMouseMove={handleMouseMove}
            />
            {eyeTrackingOn && (
              <div
                ref={pointerRef}
                className="pointer"
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  width: `${thickness}px`,
                  height: `${thickness}px`,
                  transform: "translate(-50%, -50%)",
                  borderRadius: "50%",
                  backgroundColor: color,
                  border: "none",
                  boxShadow: "none",
                  pointerEvents: "none"
                }}
                aria-hidden="true"
              />
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Sketch;
