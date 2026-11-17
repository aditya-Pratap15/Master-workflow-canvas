# Master Workflow Canvas

A clean, minimalist, high-performance infinite canvas web application featuring a warm cream background, adaptive dotted grid, boundless zoom & pan, multi-tab support, GitHub Direct Sync, and Cross-Device Link Sharing.

Live Demo on GitHub Pages: `https://aditya-pratap15.github.io/Master-workflow-canvas/`

---

## ✨ Features

- **Multi-Tab System**:
  - **Tabs Bar**: Located at the top-left corner with sleek pill design.
  - **Circular Plus Button `(+)`**: Instantly creates a new tab with independent coordinates and state.
  - **Switch Tabs**: Seamless switching between tabs, preserving zoom, pan, and content per tab.
  - **Rename Tabs**: Double-click any tab title to rename it.

- **Cross-Device Persistence (Two Ways)**:
  1. **Direct GitHub Sync (`tabs-data.json`)**:
     - When any device opens the site, it loads the saved tabs stored in the repository's `tabs-data.json`.
     - Clicking **Push to GitHub (All Devices)** in the lock popup commits your tabs directly to the GitHub repository using a Personal Access Token (PAT).
     - Once committed, any device in the world opening your website loads those exact tabs.
  2. **Instant Cross-Device Link**:
     - Clicking **Copy Cross-Device Link** generates a URL containing all your tabs (`#data=...`).
     - Paste or send this link to your phone, tablet, or another computer—it opens your exact tabs instantly with zero setup or login needed.

- **Permanent Local Storage**:
  - Click **Save this tab (Local)** to save the tab in your browser's persistent storage.

- **Warm Cream Aesthetic**: Paper-cream background palette (`#F8F5EE`) with soft, high-contrast grid points.
- **Adaptive Dotted Grid (LOD)**: Multi-octave level-of-detail algorithm ensures grid dots maintain optimal visual spacing at any zoom level.
- **Boundless Zoom**: Zoom range from **0.0001x (0.01%)** to **10,000x (1,000,000%)** centered precisely on your cursor.
- **Intuitive Navigation**:
  - **Pan / Drag**: Left-click drag, right-click drag, or touch drag.
  - **Zoom**: Mouse wheel, trackpad pinch, or HUD buttons (`+`, `-`, `100%`).
  - **Recenter**: One-click origin reset to `(0, 0)`.

---

## 🔑 How to Set Up GitHub Push (Optional, for Direct Repo Commits)

If you want to push changes directly from your browser to your GitHub repository:
1. Go to GitHub → **Settings** → **Developer Settings** → **Personal Access Tokens** → **Fine-grained tokens**.
2. Click **Generate new token**.
3. Under **Repository access**, select `Only select repositories` and choose `Master-workflow-canvas`.
4. Under **Permissions** → **Repository permissions**, set **Contents** to `Read and write`.
5. Copy the generated token (`github_pat_...`).
6. In your canvas web app, click the mini lock button `🔒` → **Push to GitHub** → paste the token and click **Save**.
7. Now, whenever you click **Push to GitHub**, your tabs are committed to GitHub automatically and will appear on all devices!

---

## 🎮 Navigation Controls

| Action | Control |
|---|---|
| **Add New Tab** | Click the circular `+` button at the top-left |
| **Switch Tabs** | Click any tab pill |
| **Rename Tab** | Double-click the tab name |
| **Save Tab (Local)** | Lock button `🔒` → "Save this tab (Local)" |
| **Push to GitHub** | Lock button `🔒` → "Push to GitHub (All Devices)" |
| **Share Link** | Lock button `🔒` → "Copy Cross-Device Link" |
| **Delete Tab** | Lock button `🔒` → "Delete this tab" |
| **Zoom In / Out** | Mouse Wheel / Trackpad Pinch / `+` and `-` keys |
| **Pan Canvas** | Click & Drag anywhere on canvas / Touch Drag |
| **Reset Zoom (100%)** | Click `100%` on HUD or press `0` |
| **Recenter Origin** | Click the Recenter button in the bottom-right HUD |
