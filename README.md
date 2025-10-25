# Art track for Sight
Frame
Blend
Shadow

## Idea
Goal: user draws a doodle of an object or scene, and the app turns it into a basic 3D model or low poly scene they can view/download.

Output meshes should not be super detailed, maybe a few hundred thousand triangles max? Aim for processing time of <30 seconds.

So basic walkthrough of using the app:
1 User draws something on a blank canvas
2 User presses generate and waits for 3D preview to appear
3 User can see and rotate the 3D model and download the file (format might be .glb, .fbx, or .obj)

So the canvas has to be able to export a png for the ML model. Possible options to look into: 
p5.js (easy to implement drawing stuff with mouse/trackpad)
Konva.js
Paper.js

Zero-1-to-3 can generate multiple views from a single sketch, would help later so the 3D model has depth.
(Alternative: Stability.ai, has subscription)

For the 3D viewer, we can use three.js (ie react-three-fiber), through which we'll load and rotate around the model (ie .glb file). We might have a grid and axes, etc (later implementation). a small FastAPI service. 
Example Endpoints:
POST /jobs -> upload doodle, includes PNG file
GET /jobs/{id} -> check job status
GET /assets/{id} -> download generated model

We'll keep the generated a local folder and automatically delete them after some time has passed, so no DB is needed.

## Sketch -> 3D pipeline
First we'll have to standardize the image to a fixed resolution, convert to grayscale for the geometry model, and then use the colored image to pass the information for baking the texture.
Maybe it will also reduce noise and close gaps between lines.

To convert 2d to 3d we can try some models:
TripoSR, InstantMesh: can make quick meshes from 2d
Check pricing of models if not free

Optimizing the mesh? May include smoothing, reducing vertices, generating UV maps, baking simple texture based on original sketch.

Let's focus on black and white drawings before adding different colors, as colors entails baking the drawing texture onto the mesh.

## Zero123++




