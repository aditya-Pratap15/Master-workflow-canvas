# Master Workflow Canvas

A clean, minimalist, high-performance infinite canvas web application featuring a warm cream background, adaptive dotted grid, boundless zoom & pan, multi-tab support, and permanent tab saving.

Live Demo on GitHub Pages: `https://aditya-pratap15.github.io/Master-workflow-canvas/`

---

## ✨ Features

- **Multi-Tab System**:
  - **Tabs Bar**: Located at the top-left corner with sleek pill design.
  - **Circular Plus Button `(+)`**: Instantly creates a new tab with independent coordinates and state.
  - **Switch Tabs**: Seamless switching between tabs, preserving zoom, pan, and content per tab.
  - **Rename Tabs**: Double-click any tab title to rename it.
- **Permanent Tab Saving & Mini Lock**:
  - **Mini Lock Button `🔒`**: Placed right beside the circular plus button.
  - **Minimal Popup**: Click the lock button to toggle options to **Save this tab permanently** or **Delete this tab**.
  - **Permanent Persistence**: Once saved, the tab and its content are stored in `localStorage`, meaning whenever you open or reload the website anytime, that tab is always there.
  - **Saved Indicator**: Permanently saved tabs feature a subtle padlock indicator and persistent state.
- **Warm Cream Aesthetic**: Carefully chosen paper-cream background palette (`#F8F5EE`) with soft, high-contrast grid points.
- **Adaptive Dotted Grid (LOD)**: Multi-octave level-of-detail algorithm ensures grid dots maintain optimal visual spacing at any zoom level.
- **Boundless Zoom**: Zoom range from **0.0001x (0.01%)** to **10,000x (1,000,000%)** centered precisely on your cursor.
- **Intuitive Navigation**:
  - **Pan / Drag**: Left-click drag, right-click drag, or touch drag.
  - **Zoom**: Mouse wheel, trackpad pinch, or HUD buttons (`+`, `-`, `100%`).
  - **Recenter**: One-click origin reset to `(0, 0)`.
- **Zero Build Dependencies**: Pure HTML5 Canvas, modern CSS, and vanilla JavaScript. Runs anywhere without build tools.

---

## 🎮 Navigation Controls

| Action | Control |
|---|---|
| **Add New Tab** | Click the circular `+` button at the top-left |
| **Switch Tabs** | Click any tab pill |
| **Rename Tab** | Double-click the tab name |
| **Save / Lock Tab** | Click the mini lock button `🔒` → "Save this tab permanently" |
| **Delete Tab** | Click the mini lock button `🔒` → "Delete this tab" |
| **Zoom In / Out** | Mouse Wheel / Trackpad Pinch / `+` and `-` keys |
| **Pan Canvas** | Click & Drag anywhere on canvas / Touch Drag |
| **Reset Zoom (100%)** | Click `100%` on HUD or press `0` |
| **Recenter Origin** | Click the Recenter button in the bottom-right HUD |
