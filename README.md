# procmodl
My current testbed to mess about with some SDF based procedural modeling stuff
<br><br>
/prɔk m(ə)dɛl/ sounds kinda cool, so that'll be how I say it. Why not.

## build instructions
```diff
# todo: write build instructions
I haven't tested this on any other machines, but in theory running "build+run" on a 
unix system with npm and rust nightly installed ought to get the job done. Good luck.
```
<br>

## A note on the new model: 
This might not be possible in practice, but theoretically state should be 100% managed by Rust (and sent upwards in full with every update), JS should serve purely as a view to display state and to send user-interaction events back downwards to Rust. 
Right now I could easily pull off everything I wanted through Node without any Rust, but 
1. I have some future plans that involve a lot more intense work being done on the CPU. Sticking to this will make that transition easier
2. Rust seems kinda neat, and I've been looking for an excuse to learn it. Significantly less so with JS.

##

(Fair warning if anyone tries to look in here: I'm more concerned with experimenting with interesting techniques and languages than writing a good application. I'm really only keeping this public for some friends, do not expect high quality anything. Peace 👉😎👉 )
<br><br>

![readme-image-1](https://user-images.githubusercontent.com/30442265/121402402-d9357980-c927-11eb-9db7-61cd2624d9e9.png)

## Progress
Once I complete a few more milestones I'll toss some builds online. Until then, I guess you could follow me on [Twitter](https://twitter.com/FraserLeeee).

 - [x] Ray marching (simple, direct-lighting, written native with Rust and OpenGL)
 - [x] New application architecture with Electron, Neon, and WebGL
 - [x] Build shader from yaml
 - [x] Colour / material stage in SDF ray tracing process (`#define` playing the role of enums)
 - [x] Global Illumination
 - [x] Bounce Lighting
 - [x] Simple multi-frame average (double-buffered, multiphase shaders, gamma only in blit)
 - [x] Optionally seed randoms with UVs
 - [ ] Add embedded python
 - [ ] Shader generation through python
 - [ ] Add a bunch of python SDF Primitives and operations
 - [ ] Load / Save system 
 - [ ] Comment-based macros
 - [ ] Ortho camera and variable FOV, UI-system system
 - [ ] Text editor improvements
 - [ ] Improved html style 
 - [ ] sdf_sprite(str: 'path/png')
 - [ ] Sound design
 - [ ] DOF UI control, comment-macro
 - [ ] Inter-frame camera re-projection
 - [ ] De-noising 
 - [ ] Handle colour-space perfectly, end to end.
 - [ ] timeline at bottom for multi-frame animation
 - [ ] Ortho camera on side angle preview shortcuts (blender numpad) to line things up easier, UI button plus key shortcuts
 - [ ] Volumetric fog + real-time editing improvements
 - [ ] Custom post-processing stage via python code
