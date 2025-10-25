import React, { useRef, useState } from "react";
import { eyeTracker } from "./eye_tracker";


type Tool = "draw" | "fill" | "erase" | "reset";

const Sketch: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [tool, setTool] = useState<Tool>("draw");
    const [drawing, setDrawing] = useState(false);
    const [color, setColor] = useState<string>("#000000");
    const [thickness, setThickness] = useState<number>(20);

    const handleMouseDown = (e: React.MouseEvent) => {
        setDrawing(true);
        if (tool === "draw") {
            draw(e);
        } else if (tool === "fill") {
            handleFill(e);
        }
    };

    const handleMouseUp = () => {
        setDrawing(false);
    };

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
            ctx.clearRect(x - thickness/2, y - thickness/2, thickness, thickness);
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

        // Get pixel data
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        // Convert hex color to RGBA
        const hexToRgba = (hex: string) => {
            const h = hex.replace("#", "");
            const r = parseInt(h.substring(0, 2), 16);
            const g = parseInt(h.substring(2, 4), 16);
            const b = parseInt(h.substring(4, 6), 16);
            return [r, g, b, 255];
        };
        const fillColor = hexToRgba(color);

        // Get target color at clicked pixel
        const pixelPos = (y * canvas.width + x) * 4;
        const targetColor = data.slice(pixelPos, pixelPos + 4);

        // If already filled, do nothing
        if (targetColor.every((v, i) => v === fillColor[i])) return;

        // Flood fill algorithm (4-way)
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
                stack.push([cx + 1, cy]);
                stack.push([cx - 1, cy]);
                stack.push([cx, cy + 1]);
                stack.push([cx, cy - 1]);
            }
        }

        ctx.putImageData(imageData, 0, 0);
    };
    const handleReset = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    };

    const handleToolChange = (selectedTool: Tool) => {
        setTool(selectedTool);
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.beginPath();
    };

    const handleEyeTracking = () => {
        console.log("Eye tracking on/off");
    };

    const handleSubmit = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const dataURL = canvas.toDataURL();
        // Submit logic here (e.g., send dataURL to server)
        alert("Submitted!");
    };

    return (
        <div style={{ padding: 20 }}>
            <h2>ArtTrack Sketchpad</h2>
            <div style={{ marginBottom: 10 }}>
                <button
                    onClick={() => handleToolChange("draw")}
                    style={{ background: tool === "draw" ? "#ddd" : undefined }}
                >
                    Draw
                </button>
                <input
                    type="color"
                    value={color}
                    onChange={e => setColor(e.target.value)}
                    style={{ margin: "0 8px", verticalAlign: "middle" }}
                />
                <label style={{ margin: "0 8px", verticalAlign: "middle" }}>
                    Thickness:
                    <input
                        type="range"
                        min={1}
                        max={100}
                        value={thickness}
                        onChange={e => setThickness(Number(e.target.value))}
                        style={{ marginLeft: 4, verticalAlign: "middle" }}
                    />
                    <span style={{ marginLeft: 4 }}>{thickness}</span>
                </label>
                <button
                    onClick={() => { handleToolChange("fill"); }}
                    style={{ background: tool === "fill" ? "#ddd" : undefined }}
                >
                    Fill
                </button>
                <button
                    onClick={() => handleToolChange("erase")}
                    style={{ background: tool === "erase" ? "#ddd" : undefined }}
                >
                    Erase
                </button>
                <button onClick={handleEyeTracking} title="Eye Tracking">
                    <span role="img" aria-label="eye">👁️</span>
                </button>
                <button
                    onClick={() => { handleToolChange("reset"); handleReset(); }}
                    style={{ background: tool === "reset" ? "#ddd" : undefined }}
                >
                    Reset
                </button>
            </div>
            <canvas
                ref={canvasRef}
                width={1280}
                height={720}
                style={{
                    border: "1px solid #333",
                    background: "#fff",
                    display: "block",
                    marginBottom: 10,
                }}
                onMouseDown={handleMouseDown}
                onMouseUp={handleMouseUp}
                onMouseOut={handleMouseUp}
                onMouseMove={handleMouseMove}
            />
            <button onClick={handleSubmit}>Submit</button>
        </div>
    );
};

export default Sketch;