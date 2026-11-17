/**
 * Master Workflow Canvas
 * Pure vanilla JavaScript Infinite Canvas with Cream Background and Dotted Grid.
 */

(function () {
  'use strict';

  const canvas = document.getElementById('infinite-canvas');
  const ctx = canvas.getContext('2d');

  // UI Elements
  const zoomDisplay = document.getElementById('zoom-value');
  const zoomInBtn = document.getElementById('zoom-in-btn');
  const zoomOutBtn = document.getElementById('zoom-out-btn');
  const zoomResetBtn = document.getElementById('zoom-reset-btn');
  const recenterBtn = document.getElementById('recenter-btn');

  // Colors & Configuration
  const THEME = {
    bg: '#F8F5EE',
    dotBaseColor: [184, 176, 162], // #B8B0A2 in RGB
    originColor: 'rgba(224, 122, 95, 0.65)',
    baseGridSize: 40,
    minScale: 0.0001,   // 0.01% (extremely far out)
    maxScale: 10000,    // 1,000,000% (extreme zoom in)
    dotRadius: 1.25,     // screen pixels
  };

  // Canvas Transform State
  let scale = 1.0;
  let panX = 0;
  let panY = 0;
  let dpr = window.devicePixelRatio || 1;

  // Interaction State
  let isDragging = false;
  let startPointerX = 0;
  let startPointerY = 0;
  let activePointers = new Map();
  let initialPinchDistance = 0;
  let initialPinchScale = 1;
  let pinchCenter = { x: 0, y: 0 };

  /**
   * Resize Canvas to fill full screen with High-DPI support
   */
  function resize() {
    dpr = window.devicePixelRatio || 1;
    const width = window.innerWidth;
    const height = window.innerHeight;

    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';

    render();
  }

  /**
   * Convert Screen coordinate to World coordinate
   */
  function screenToWorld(sx, sy) {
    return {
      x: (sx - panX) / scale,
      y: (sy - panY) / scale
    };
  }

  /**
   * Convert World coordinate to Screen coordinate
   */
  function worldToScreen(wx, wy) {
    return {
      x: wx * scale + panX,
      y: wy * scale + panY
    };
  }

  /**
   * Apply Zoom centered at specific screen coordinate (anchor)
   */
  function zoomAt(targetScale, anchorX, anchorY) {
    const clampedScale = Math.min(Math.max(targetScale, THEME.minScale), THEME.maxScale);
    if (clampedScale === scale) return;

    // Anchor in world space before zoom
    const worldAnchor = screenToWorld(anchorX, anchorY);

    scale = clampedScale;

    // Adjust pan so worldAnchor remains at anchorX, anchorY
    panX = anchorX - worldAnchor.x * scale;
    panY = anchorY - worldAnchor.y * scale;

    updateUI();
    render();
  }

  /**
   * Update HUD and UI states
   */
  function updateUI() {
    let formattedZoom;
    const pct = scale * 100;
    if (pct >= 100) {
      formattedZoom = Math.round(pct) + '%';
    } else if (pct >= 1) {
      formattedZoom = pct.toFixed(1) + '%';
    } else {
      formattedZoom = pct.toFixed(3) + '%';
    }
    zoomDisplay.textContent = formattedZoom;
  }

  /**
   * Reset Zoom to 100% and center origin
   */
  function resetView(centerOrigin = true) {
    scale = 1.0;
    if (centerOrigin) {
      panX = window.innerWidth / 2;
      panY = window.innerHeight / 2;
    }
    updateUI();
    render();
  }

  /**
   * Calculate dynamic grid steps for infinite smooth zooming
   */
  function getGridDetails() {
    const base = THEME.baseGridSize;
    // We want the rendered screen distance between dots to stay roughly within [24px, 72px]
    const screenDistance = base * scale;
    const exponent = Math.floor(Math.log2(screenDistance / 32));
    const step = base / Math.pow(2, exponent);
    
    // Sub-dot fade effect for ultra-smooth transition
    const ratio = (base * scale) / (32 * Math.pow(2, exponent));
    const fadeAlpha = Math.min(Math.max((ratio - 1), 0), 1);

    return { step, fadeAlpha };
  }

  /**
   * Render the infinite canvas, background, and dotted grid
   */
  function render() {
    const width = window.innerWidth;
    const height = window.innerHeight;

    // Reset transform & clear
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = THEME.bg;
    ctx.fillRect(0, 0, width, height);

    // Calculate visible bounding box in world space
    const topLeft = screenToWorld(0, 0);
    const bottomRight = screenToWorld(width, height);

    const { step, fadeAlpha } = getGridDetails();

    // Align grid to integer multiples of step
    const startX = Math.floor(topLeft.x / step) * step;
    const endX = Math.ceil(bottomRight.x / step) * step;
    const startY = Math.floor(topLeft.y / step) * step;
    const endY = Math.ceil(bottomRight.y / step) * step;

    // Standard dot color
    const [r, g, b] = THEME.dotBaseColor;
    const primaryAlpha = 0.65;
    const subAlpha = primaryAlpha * fadeAlpha;

    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${primaryAlpha})`;

    // Batch draw dots as circles
    ctx.beginPath();
    const dotRadius = THEME.dotRadius;
    const subStep = step / 2;

    for (let x = startX; x <= endX; x += step) {
      const sx = x * scale + panX;
      for (let y = startY; y <= endY; y += step) {
        const sy = y * scale + panY;
        ctx.moveTo(sx + dotRadius, sy);
        ctx.arc(sx, sy, dotRadius, 0, Math.PI * 2);
      }
    }
    ctx.fill();

    // Render intermediate sub-grid dots during zoom transition if visible
    if (subAlpha > 0.05) {
      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${subAlpha})`;
      ctx.beginPath();
      for (let x = startX; x <= endX; x += subStep) {
        const isMajorX = Math.abs(x % step) < 1e-4;
        const sx = x * scale + panX;
        for (let y = startY; y <= endY; y += subStep) {
          const isMajorY = Math.abs(y % step) < 1e-4;
          // Skip dots that are part of the major grid
          if (isMajorX && isMajorY) continue;
          const sy = y * scale + panY;
          ctx.moveTo(sx + dotRadius, sy);
          ctx.arc(sx, sy, dotRadius, 0, Math.PI * 2);
        }
      }
      ctx.fill();
    }

    // Draw Subtle Origin Marker (0, 0)
    const origin = worldToScreen(0, 0);
    if (origin.x >= -20 && origin.x <= width + 20 && origin.y >= -20 && origin.y <= height + 20) {
      ctx.save();
      ctx.strokeStyle = THEME.originColor;
      ctx.lineWidth = 1.5;
      const arm = 9;

      ctx.beginPath();
      ctx.moveTo(origin.x - arm, origin.y);
      ctx.lineTo(origin.x + arm, origin.y);
      ctx.moveTo(origin.x, origin.y - arm);
      ctx.lineTo(origin.x, origin.y + arm);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(origin.x, origin.y, 2, 0, Math.PI * 2);
      ctx.fillStyle = THEME.originColor;
      ctx.fill();
      ctx.restore();
    }
  }

  // --- Pointer & Drag Events ---

  function onPointerDown(e) {
    activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (activePointers.size === 1) {
      isDragging = true;
      startPointerX = e.clientX;
      startPointerY = e.clientY;
      document.body.classList.add('is-dragging');
    } else if (activePointers.size === 2) {
      // Initiate two-finger pinch
      isDragging = false;
      const pts = Array.from(activePointers.values());
      initialPinchDistance = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      initialPinchScale = scale;
      pinchCenter = {
        x: (pts[0].x + pts[1].x) / 2,
        y: (pts[0].y + pts[1].y) / 2
      };
    }
  }

  function onPointerMove(e) {
    if (!activePointers.has(e.pointerId)) return;
    activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (activePointers.size === 1 && isDragging) {
      const dx = e.clientX - startPointerX;
      const dy = e.clientY - startPointerY;
      panX += dx;
      panY += dy;
      startPointerX = e.clientX;
      startPointerY = e.clientY;
      render();
    } else if (activePointers.size === 2) {
      // 2-finger pinch & pan
      const pts = Array.from(activePointers.values());
      const currentDistance = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      const currentCenter = {
        x: (pts[0].x + pts[1].x) / 2,
        y: (pts[0].y + pts[1].y) / 2
      };

      if (initialPinchDistance > 0) {
        const factor = currentDistance / initialPinchDistance;
        const targetScale = initialPinchScale * factor;
        zoomAt(targetScale, pinchCenter.x, pinchCenter.y);

        // Adjust pan for center shift
        panX += currentCenter.x - pinchCenter.x;
        panY += currentCenter.y - pinchCenter.y;
        pinchCenter = currentCenter;
        render();
      }
    }
  }

  function onPointerUp(e) {
    activePointers.delete(e.pointerId);

    if (activePointers.size === 0) {
      isDragging = false;
      document.body.classList.remove('is-dragging');
    } else if (activePointers.size === 1) {
      // Re-anchor single finger drag
      const remaining = activePointers.values().next().value;
      isDragging = true;
      startPointerX = remaining.x;
      startPointerY = remaining.y;
    }
  }

  // --- Wheel / Zoom Event ---

  function onWheel(e) {
    e.preventDefault();

    // Normalize wheel delta for mouse wheel and trackpad pinch
    let delta = -e.deltaY;
    if (e.ctrlKey) {
      // Trackpad pinch-to-zoom
      delta *= 0.02;
    } else if (e.deltaMode === 1) {
      // Line mode
      delta *= 0.05;
    } else {
      // Standard pixel mode
      delta *= 0.0015;
    }

    const factor = Math.exp(delta);
    zoomAt(scale * factor, e.clientX, e.clientY);
  }

  // --- Button & Keyboard Handlers ---

  zoomInBtn.addEventListener('click', () => {
    zoomAt(scale * 1.3, window.innerWidth / 2, window.innerHeight / 2);
  });

  zoomOutBtn.addEventListener('click', () => {
    zoomAt(scale / 1.3, window.innerWidth / 2, window.innerHeight / 2);
  });

  zoomResetBtn.addEventListener('click', () => {
    zoomAt(1.0, window.innerWidth / 2, window.innerHeight / 2);
  });

  recenterBtn.addEventListener('click', () => {
    resetView(true);
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === '+' || e.key === '=') {
      zoomAt(scale * 1.25, window.innerWidth / 2, window.innerHeight / 2);
    } else if (e.key === '-' || e.key === '_') {
      zoomAt(scale / 1.25, window.innerWidth / 2, window.innerHeight / 2);
    } else if (e.key === '0') {
      resetView(true);
    }
  });

  // Attach event listeners
  window.addEventListener('resize', resize);
  canvas.addEventListener('wheel', onWheel, { passive: false });
  canvas.addEventListener('pointerdown', onPointerDown);
  window.addEventListener('pointermove', onPointerMove);
  window.addEventListener('pointerup', onPointerUp);
  window.addEventListener('pointercancel', onPointerUp);

  // Prevent right-click context menu on canvas to allow smooth right-click panning
  canvas.addEventListener('contextmenu', (e) => e.preventDefault());

  // Initialize
  panX = window.innerWidth / 2;
  panY = window.innerHeight / 2;
  resize();
  updateUI();
})();
