# SightBoard

SightBoard is an experimental web-based sketchpad that lets you **draw using your eyes**.  
It combines traditional drawing tools with **head and gaze tracking**, giving users an intuitive, hands-free way to sketch directly onto a digital canvas.

You can try it at:  
**[https://sightboard.vercel.app](https://sightboard.vercel.app)**

---

## Overview

SightBoard allows you to create digital drawings using either a **mouse** or **eye-tracking** input through your webcam.  
It’s designed to feel minimal and familiar, like a simple sketchpad, while integrating experimental input control for accessibility and creative exploration.

The interface is clean, responsive, and built for both desktop and mobile screens.

---

## Features

### **Drawing Tools**
- **Draw:** Freely sketch with adjustable color and brush thickness.  
- **Erase:** Remove parts of your drawing with a configurable eraser size.  
- **Fill:** Click to fill enclosed regions with a solid color.  
  - Automatically detects target regions and prevents unwanted full-canvas fills.
- **Clear:** Resets the entire canvas to white.

---

### **Eye Tracking Mode**
SightBoard integrates gaze tracking through your webcam:
- Toggle **Head Tracking** to activate the tracker.
- When active, a **cursor** follows your gaze in real-time.
- Click **Start** to begin gaze-controlled drawing.
- Click **Stop** to pause drawing without turning off tracking.
- Adjust **Sensitivity (Gain)** to fine-tune how much your head movement affects cursor motion.
- Adjust **Smoothing** to stabilize cursor movement and reduce jitter.

All controls remain active while tracking is on.

---

### **Manual Drawing Enhancements**
- **Shift + Click Line Tool:** Hold **Shift** while clicking a new point to draw a perfectly straight line from your previous point — similar to GIMP or Photoshop behavior.
- **Undo (Ctrl + Z):** Step back through your drawing history at any time.
- **Redo (Ctrl + Y):** Redo an undone action.

---

### **Export**
- **Export PNG:** Instantly download your current drawing as a `.png` image with one click.
- File is generated locally in-browser — no data is uploaded or stored.

---

## Interface Overview

### **Top Toolbar**
Contains:
- Drawing mode selection (Draw, Erase, Fill, Clear)
- Head Tracking controls (On/Off + Start/Stop)
- Color, Size, Sensitivity, and Smoothing sliders
- Export button

Each button highlights when active. The toolbar remains fixed and responsive across devices.

---

### **Canvas**
- High-resolution 960×540 drawing surface.
- Auto-scaled for device pixel ratio for crisp rendering.
- Surrounded by a clean white workspace with a subtle black frame.

---

## Accessibility

SightBoard’s gaze control provides a creative and accessible drawing experience for:
- Users with limited hand mobility.
- Artists and designers exploring new forms of interaction.
- Educators or researchers studying human–computer interaction through vision.

All processing is done locally — **no webcam data leaves your device**.

---

## Technology

- **React (TypeScript + Vite)**
- **Web-based Eye Tracking** via lightweight in-browser tracking module
- **HTML5 Canvas API** for drawing and pixel-level manipulation
- **Responsive CSS** with adaptive scaling for mobile and desktop

---

## Future Improvements
Planned or considered enhancements:
- Multi-layer drawing and opacity controls  
- Smarter fill tolerance detection  
- Custom brush shapes and textures  
- Improved calibration and tracking feedback  

---

## Credits
Developed as a lightweight experimental art tool blending **vision**, **motion**, and **expression**.  
Built with care, simplicity, and a focus on creative accessibility.

---

### **Try it now**
**[https://sightboard.vercel.app](https://sightboard.vercel.app)**
