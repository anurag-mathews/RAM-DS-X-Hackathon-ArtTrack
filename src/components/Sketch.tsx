import React, { useEffect, useRef, useState } from "react";
import { eyeTracker } from "./eye_tracker";
import "./Sketch.css";

type Tool = "draw" | "fill" | "erase" | "reset" | "eyetrack";

const Sketch: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tool, setTool] = useState<Tool>("draw");
  const [cursor, setCursor] = useState<{ x: number; y: number } | null>(null);
  const [drawing, setDrawing] = useState(false);
  const [color, setColor] = useState<string>("#000000");
  const [thickness, setThickness] = useState<number>(20);
  const [eyeTrackingOn, setEyeTrackingOn] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // HiDPI canvas setup on mount
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = Math.max(1, window.devicePixelRatio || 1);

    const width = 960;   // logical canvas width in CSS pixels
    const height = 540;  // logical canvas height in CSS pixels

    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, width, height);
  }, []);

  const handleEyeTracking = () => {
    setEyeTrackingOn(prev => {
      const next = !prev;
      const canvas = canvasRef.current;
      if (!canvas) return prev;

      if (next) {
        let video = videoRef.current;
        if (!video) {
          video = document.createElement("video");
          video.setAttribute("playsInline", "true");
          video.style.display = "none";
          document.body.appendChild(video);
          videoRef.current = video;
        }
        eyeTracker.start(video, canvas, (x, y) => {
          setCursor({ x, y });
          if (tool === "draw") {
            const ctx = canvas.getContext("2d");
            if (!ctx) return;
            ctx.strokeStyle = color;
            ctx.lineWidth = thickness;
            ctx.lineCap = "round";
            ctx.lineTo(x, y);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(x, y);
          }
        });
      } else {
        eyeTracker.stop();
        setCursor(null);
      }
      return next;
    });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    
    if (tool === "draw") {
      draw(e);
    } else if (tool === "fill") {
      handleFill(e);
    }
  };

  const handleMouseUp = () => setDrawing(false);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!drawing) return;
    draw(e);
  };

  const draw = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
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
    } else if (tool === "erase") {
      ctx.clearRect(x - thickness, y - thickness, thickness * 2, thickness * 2);
    }
  };

  const handleFill = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor(e.clientX - rect.left);
    const y = Math.floor(e.clientY - rect.top);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    const hexToRgba = (hex: string) => {
      const h = hex.replace("#", "");
      const r = parseInt(h.substring(0, 2), 16);
      const g = parseInt(h.substring(2, 4), 16);
      const b = parseInt(h.substring(4, 6), 16);
      return [r, g, b, 255];
    };
    const fillColor = hexToRgba(color);

    const pixelPos = (y * canvas.width + x) * 4;
    const targetColor = data.slice(pixelPos, pixelPos + 4);
    if (targetColor.every((v, i) => v === fillColor[i])) return;

    const stack: [number, number][] = [[x, y]];
    while (stack.length) {
      const [cx, cy] = stack.pop()!;
      const idx = (cy * canvas.width + cx) * 4;
      if (
        cx >= 0 && cx < canvas.width &&
        cy >= 0 && cy < canvas.height &&
        data[idx] === targetColor[0] &&
        data[idx + 1] === targetColor[1] &&
        data[idx + 2] === targetColor[2] &&
        data[idx + 3] === targetColor[3]
      ) {
        data[idx] = fillColor[0];
        data[idx + 1] = fillColor[1];
        data[idx + 2] = fillColor[2];
        data[idx + 3] = fillColor[3];
        stack.push([cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]);
      }
    }
    ctx.putImageData(imageData, 0, 0);
  };

  const handleReset = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const w = parseFloat(canvas.style.width);
    const h = parseFloat(canvas.style.height);
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, w, h);
  };

  const handleToolChange = (selectedTool: Tool) => {
    setTool(selectedTool);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
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
  }> = ({ active, onClick, children, title, variant }) => (
    <button
      type="button"
      className={`btn ${variant || ""} ${active ? "active" : ""}`}
      onClick={onClick}
      title={title}
      aria-pressed={active}
    >
      {children}
    </button>
  );

  return (
    <div className="g-root">
      <header className="g-header">
        <h1 className="g-title">ArtTrack</h1>
      </header>

      <div className="g-toolbar card">
        <div className="g-tools">
          <Btn active={tool === "draw"} onClick={() => handleToolChange("draw")} title="Draw">Draw</Btn>
          <Btn active={tool === "fill"} onClick={() => handleToolChange("fill")} title="Fill">Fill</Btn>
          <Btn active={tool === "erase"} onClick={() => handleToolChange("erase")} title="Erase">Erase</Btn>
          <Btn onClick={handleReset} title="Clear">Clear</Btn>
          <Btn active={eyeTrackingOn} onClick={handleEyeTracking} title="Eye Tracking">EyeTrack</Btn>
        </div>

        <div className="g-controls">
          <label className="control">
            <span className="label">Color</span>
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="color"
              aria-label="Ink color"
            />
          </label>

          <label className="control">
            <span className="label">Size</span>
            <input
              type="range"
              min={1}
              max={80}
              value={thickness}
              onChange={(e) => setThickness(Number(e.target.value))}
              className="range"
              aria-label="Brush size"
            />
            <span className="value">{thickness}</span>
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
            {eyeTrackingOn && cursor && (
              <div
                className="pointer"
                style={{ left: cursor.x - 5, top: cursor.y - 5 }}
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
