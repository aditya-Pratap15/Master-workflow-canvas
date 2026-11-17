/**
 * Master Workflow Canvas
 * Pure vanilla JavaScript Infinite Canvas with Cream Background, Dotted Grid,
 * Multi-Tab Support, Permanent Tab Saving, GitHub Direct Sync, and Cross-Device Link Sharing.
 */

(function () {
  'use strict';

  // Persistence & GitHub Configuration
  const LOCAL_STORAGE_KEY = 'MWC_SAVED_TABS_V1';
  const GITHUB_TOKEN_KEY = 'MWC_GITHUB_PAT';
  const GITHUB_REPO = 'aditya-Pratap15/Master-workflow-canvas';
  const GITHUB_FILE_PATH = 'tabs-data.json';
  const GITHUB_BRANCH = 'main';

  const canvas = document.getElementById('infinite-canvas');
  const ctx = canvas.getContext('2d');

  // Zoom HUD Elements
  const zoomDisplay = document.getElementById('zoom-value');
  const zoomInBtn = document.getElementById('zoom-in-btn');
  const zoomOutBtn = document.getElementById('zoom-out-btn');
  const zoomResetBtn = document.getElementById('zoom-reset-btn');
  const recenterBtn = document.getElementById('recenter-btn');

  // Tab & Lock UI Elements
  const tabsList = document.getElementById('tabs-list');
  const addTabBtn = document.getElementById('add-tab-btn');
  const lockTabBtn = document.getElementById('lock-tab-btn');
  const lockPopup = document.getElementById('lock-popup');
  const popupTabTitle = document.getElementById('popup-tab-title');
  const popupStatusBadge = document.getElementById('popup-status-badge');
  const popupSaveBtn = document.getElementById('popup-save-btn');
  const popupSaveLabel = document.getElementById('popup-save-label');
  const popupGithubSyncBtn = document.getElementById('popup-github-sync-btn');
  const popupGithubLabel = document.getElementById('popup-github-label');
  const githubSettingsPanel = document.getElementById('github-settings-panel');
  const githubPatInput = document.getElementById('github-pat-input');
  const saveTokenBtn = document.getElementById('save-token-btn');
  const popupShareLinkBtn = document.getElementById('popup-share-link-btn');
  const popupDeleteBtn = document.getElementById('popup-delete-btn');
  const toast = document.getElementById('toast');

  // Colors & Configuration
  const THEME = {
    bg: '#F8F5EE',
    dotBaseColor: [184, 176, 162],
    originColor: 'rgba(224, 122, 95, 0.65)',
    baseGridSize: 40,
    minScale: 0.0001,
    maxScale: 10000,
    dotRadius: 1.25,
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
  let toastTimeout = null;

  // Tabs State
  let tabs = [];
  let activeTabId = null;

  /**
   * Display toast notification
   */
  function showToast(message) {
    if (toastTimeout) clearTimeout(toastTimeout);
    toast.textContent = message;
    toast.classList.remove('hidden');
    toastTimeout = setTimeout(() => {
      toast.classList.add('hidden');
    }, 2800);
  }

  /**
   * Save permanently locked tabs to localStorage
   */
  function persistSavedTabs() {
    try {
      const savedList = tabs.filter(t => t.isSaved);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(savedList));
    } catch (e) {
      console.error('Failed to save tabs to localStorage', e);
    }
  }

  /**
   * Decode shared data from URL hash
   */
  function decodeSharedData(hashStr) {
    try {
      const raw = hashStr.replace(/^#data=/, '');
      const decoded = decodeURIComponent(escape(atob(decodeURIComponent(raw))));
      const parsed = JSON.parse(decoded);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((t, idx) => ({
          id: t.id || 'tab_shared_' + idx,
          name: t.name || 'Tab ' + (idx + 1),
          isSaved: true,
          scale: typeof t.scale === 'number' ? t.scale : 1.0,
          panX: typeof t.panX === 'number' ? t.panX : window.innerWidth / 2,
          panY: typeof t.panY === 'number' ? t.panY : window.innerHeight / 2,
          content: Array.isArray(t.content) ? t.content : []
        }));
      }
    } catch (e) {
      console.warn('Failed to parse shared URL hash data', e);
    }
    return null;
  }

  /**
   * Load permanently saved tabs from localStorage
   */
  function loadPersistedTabs() {
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((t, idx) => ({
            id: t.id || 'tab_saved_' + idx,
            name: t.name || 'Tab ' + (idx + 1),
            isSaved: true,
            scale: typeof t.scale === 'number' ? t.scale : 1.0,
            panX: typeof t.panX === 'number' ? t.panX : window.innerWidth / 2,
            panY: typeof t.panY === 'number' ? t.panY : window.innerHeight / 2,
            content: Array.isArray(t.content) ? t.content : []
          }));
        }
      }
    } catch (e) {
      console.warn('Could not read saved tabs from localStorage', e);
    }
    return null;
  }

  /**
   * Initialize tabs structure
   */
  async function initTabs() {
    // 1. Check if user opened a cross-device share link (#data=...)
    if (window.location.hash.startsWith('#data=')) {
      const shared = decodeSharedData(window.location.hash);
      if (shared && shared.length > 0) {
        tabs = shared;
        activeTabId = tabs[0].id;
        persistSavedTabs();
        history.replaceState(null, '', window.location.pathname);
        showToast('🎉 Loaded tabs from shared link!');
        finishTabInit();
        return;
      }
    }

    // 2. Check localStorage
    const localSaved = loadPersistedTabs();
    if (localSaved && localSaved.length > 0) {
      tabs = localSaved;
      activeTabId = tabs[0].id;
      finishTabInit();
      return;
    }

    // 3. Fallback: Fetch default tabs-data.json from repository
    try {
      const res = await fetch(`tabs-data.json?_t=${Date.now()}`);
      if (res.ok) {
        const repoTabs = await res.json();
        if (Array.isArray(repoTabs) && repoTabs.length > 0) {
          tabs = repoTabs.map((t, idx) => ({
            id: t.id || 'tab_repo_' + idx,
            name: t.name || 'Tab ' + (idx + 1),
            isSaved: true,
            scale: typeof t.scale === 'number' ? t.scale : 1.0,
            panX: typeof t.panX === 'number' ? t.panX : window.innerWidth / 2,
            panY: typeof t.panY === 'number' ? t.panY : window.innerHeight / 2,
            content: Array.isArray(t.content) ? t.content : []
          }));
          activeTabId = tabs[0].id;
          finishTabInit();
          return;
        }
      }
    } catch (e) {
      console.warn('Could not fetch tabs-data.json', e);
    }

    // 4. Default fresh Tab 1
    tabs = [
      {
        id: 'tab_' + Date.now(),
        name: 'Tab 1',
        isSaved: false,
        scale: 1.0,
        panX: window.innerWidth / 2,
        panY: window.innerHeight / 2,
        content: []
      }
    ];
    activeTabId = tabs[0].id;
    finishTabInit();
  }

  function finishTabInit() {
    applyCurrentTabState();
    renderTabsList();
    updateLockUI();
    const savedToken = localStorage.getItem(GITHUB_TOKEN_KEY);
    if (savedToken && githubPatInput) {
      githubPatInput.value = savedToken;
    }
  }

  /**
   * Get currently active tab
   */
  function getActiveTab() {
    return tabs.find(t => t.id === activeTabId) || tabs[0];
  }

  /**
   * Sync active tab's pan and scale from runtime variables
   */
  function syncActiveTabState() {
    const active = getActiveTab();
    if (active) {
      active.scale = scale;
      active.panX = panX;
      active.panY = panY;
      if (active.isSaved) {
        persistSavedTabs();
      }
    }
  }

  /**
   * Apply current active tab's pan and scale to runtime variables
   */
  function applyCurrentTabState() {
    const active = getActiveTab();
    if (active) {
      scale = active.scale;
      panX = active.panX;
      panY = active.panY;
      updateUI();
    }
  }

  /**
   * Render the tabs in the top navigation bar
   */
  function renderTabsList() {
    tabsList.innerHTML = '';

    tabs.forEach(tab => {
      const tabEl = document.createElement('div');
      tabEl.className = 'tab-item' + (tab.id === activeTabId ? ' active' : '');
      tabEl.dataset.tabId = tab.id;

      // Tab Title
      const titleEl = document.createElement('span');
      titleEl.className = 'tab-title';
      titleEl.textContent = tab.name;

      // Double-click to rename
      titleEl.addEventListener('dblclick', (e) => {
        e.stopPropagation();
        titleEl.contentEditable = 'true';
        titleEl.focus();
        document.execCommand('selectAll', false, null);
      });

      titleEl.addEventListener('blur', () => {
        titleEl.contentEditable = 'false';
        const newName = titleEl.textContent.trim();
        if (newName) {
          tab.name = newName;
          if (tab.isSaved) persistSavedTabs();
          if (tab.id === activeTabId) updatePopupInfo();
        } else {
          titleEl.textContent = tab.name;
        }
      });

      titleEl.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          titleEl.blur();
        }
      });

      tabEl.appendChild(titleEl);

      // Lock indicator icon if saved
      if (tab.isSaved) {
        const lockIndicator = document.createElement('span');
        lockIndicator.className = 'tab-lock-indicator';
        lockIndicator.title = 'Permanently Saved';
        lockIndicator.innerHTML = `
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
          </svg>
        `;
        tabEl.appendChild(lockIndicator);
      }

      // Switch tab on click
      tabEl.addEventListener('click', () => {
        switchTab(tab.id);
      });

      tabsList.appendChild(tabEl);
    });

    // Auto-scroll to active tab
    const activeEl = tabsList.querySelector('.tab-item.active');
    if (activeEl) {
      activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
    }
  }

  /**
   * Switch to another tab
   */
  function switchTab(targetId) {
    if (targetId === activeTabId) return;

    syncActiveTabState();
    activeTabId = targetId;
    applyCurrentTabState();
    renderTabsList();
    updateLockUI();
    closeLockPopup();
    render();
  }

  /**
   * Add a new tab
   */
  function createNewTab() {
    syncActiveTabState();

    let nextNum = tabs.length + 1;
    while (tabs.some(t => t.name === `Tab ${nextNum}`)) {
      nextNum++;
    }

    const newTab = {
      id: 'tab_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      name: `Tab ${nextNum}`,
      isSaved: false,
      scale: 1.0,
      panX: window.innerWidth / 2,
      panY: window.innerHeight / 2,
      content: []
    };

    tabs.push(newTab);
    switchTab(newTab.id);
    showToast(`Created ${newTab.name}`);
  }

  /**
   * Update Lock button styling and state
   */
  function updateLockUI() {
    const active = getActiveTab();
    if (active && active.isSaved) {
      lockTabBtn.classList.add('is-saved');
      lockTabBtn.title = 'Saved permanently — Click for options';
    } else {
      lockTabBtn.classList.remove('is-saved');
      lockTabBtn.title = 'Tab Options & Cloud Persistence';
    }
  }

  /**
   * Update Lock Popup content
   */
  function updatePopupInfo() {
    const active = getActiveTab();
    if (!active) return;

    popupTabTitle.textContent = active.name;

    if (active.isSaved) {
      popupStatusBadge.textContent = 'Permanently Saved';
      popupStatusBadge.className = 'popup-status-badge saved';
      popupSaveBtn.classList.add('is-saved');
      popupSaveLabel.textContent = 'Saved (Local Browser)';
    } else {
      popupStatusBadge.textContent = 'Temporary';
      popupStatusBadge.className = 'popup-status-badge';
      popupSaveBtn.classList.remove('is-saved');
      popupSaveLabel.textContent = 'Save this tab (Local)';
    }
  }

  /**
   * Toggle the minimal lock popup
   */
  function toggleLockPopup(e) {
    if (e) e.stopPropagation();
    const isHidden = lockPopup.classList.contains('hidden');
    if (isHidden) {
      updatePopupInfo();
      lockPopup.classList.remove('hidden');
      lockTabBtn.classList.add('active-popup');
    } else {
      closeLockPopup();
    }
  }

  function closeLockPopup() {
    lockPopup.classList.add('hidden');
    lockTabBtn.classList.remove('active-popup');
    githubSettingsPanel.classList.add('hidden');
  }

  /**
   * Handle permanently saving the current tab in browser
   */
  function handleSaveCurrentTab() {
    const active = getActiveTab();
    if (!active) return;

    syncActiveTabState();
    active.isSaved = true;
    persistSavedTabs();

    renderTabsList();
    updateLockUI();
    updatePopupInfo();
    showToast(`"${active.name}" saved in browser!`);
    setTimeout(closeLockPopup, 400);
  }

  /**
   * Handle Push / Commit to GitHub repository
   */
  async function handlePushToGitHub() {
    const token = localStorage.getItem(GITHUB_TOKEN_KEY);
    if (!token) {
      githubSettingsPanel.classList.remove('hidden');
      githubPatInput.focus();
      showToast('Enter your GitHub Personal Access Token first');
      return;
    }

    syncActiveTabState();
    const active = getActiveTab();
    if (active) active.isSaved = true;
    persistSavedTabs();
    renderTabsList();
    updateLockUI();

    showToast('Pushing to GitHub repo...');
    popupGithubLabel.textContent = 'Pushing to GitHub...';

    try {
      const fileUrl = `https://api.github.com/repos/${GITHUB_REPO}/contents/${GITHUB_FILE_PATH}`;
      
      // Get current SHA
      const getRes = await fetch(fileUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github+json'
        }
      });

      let sha = null;
      if (getRes.ok) {
        const fileInfo = await getRes.json();
        sha = fileInfo.sha;
      }

      // Prepare payload
      const tabsToCommit = tabs.filter(t => t.isSaved).length > 0 ? tabs.filter(t => t.isSaved) : tabs;
      const jsonString = JSON.stringify(tabsToCommit, null, 2);
      const utf8Base64 = btoa(unescape(encodeURIComponent(jsonString)));

      const putBody = {
        message: `sync: update canvas tabs [${new Date().toLocaleTimeString()}]`,
        content: utf8Base64,
        branch: GITHUB_BRANCH
      };
      if (sha) {
        putBody.sha = sha;
      }

      const putRes = await fetch(fileUrl, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(putBody)
      });

      if (!putRes.ok) {
        const err = await putRes.json();
        throw new Error(err.message || 'GitHub API returned an error');
      }

      showToast('✅ Saved to GitHub! Live for all devices.');
      updatePopupInfo();
      setTimeout(closeLockPopup, 500);
    } catch (err) {
      console.error('GitHub Push failed:', err);
      showToast('❌ GitHub Error: ' + (err.message || 'Check token'));
      githubSettingsPanel.classList.remove('hidden');
    } finally {
      popupGithubLabel.textContent = 'Push to GitHub (All Devices)';
    }
  }

  /**
   * Copy Cross-Device Share Link
   */
  function handleCopyShareLink() {
    syncActiveTabState();
    const tabsToShare = tabs.length > 0 ? tabs : [getActiveTab()];
    try {
      const jsonStr = JSON.stringify(tabsToShare);
      const b64 = btoa(unescape(encodeURIComponent(jsonStr)));
      const encoded = encodeURIComponent(b64);
      const shareUrl = `${window.location.origin}${window.location.pathname}#data=${encoded}`;

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(shareUrl).then(() => {
          showToast('🔗 Link copied! Open on any device.');
          setTimeout(closeLockPopup, 400);
        });
      } else {
        const temp = document.createElement('input');
        temp.value = shareUrl;
        document.body.appendChild(temp);
        temp.select();
        document.execCommand('copy');
        document.body.removeChild(temp);
        showToast('🔗 Link copied! Open on any device.');
        setTimeout(closeLockPopup, 400);
      }
    } catch (e) {
      console.error('Failed to create share link', e);
      showToast('Failed to copy link');
    }
  }

  /**
   * Handle deleting the current tab
   */
  function handleDeleteCurrentTab() {
    const active = getActiveTab();
    if (!active) return;

    const tabName = active.name;
    const currentIndex = tabs.findIndex(t => t.id === active.id);

    if (tabs.length === 1) {
      active.name = 'Tab 1';
      active.isSaved = false;
      active.scale = 1.0;
      active.panX = window.innerWidth / 2;
      active.panY = window.innerHeight / 2;
      active.content = [];
      persistSavedTabs();
      applyCurrentTabState();
      renderTabsList();
      updateLockUI();
      closeLockPopup();
      render();
      showToast('Tab reset to blank');
      return;
    }

    tabs.splice(currentIndex, 1);
    persistSavedTabs();

    const nextIndex = Math.min(currentIndex, tabs.length - 1);
    activeTabId = tabs[nextIndex].id;

    applyCurrentTabState();
    renderTabsList();
    updateLockUI();
    closeLockPopup();
    render();
    showToast(`Deleted ${tabName}`);
  }

  // --- Resize Canvas ---

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

  // --- Coordinate Transformations ---

  function screenToWorld(sx, sy) {
    return {
      x: (sx - panX) / scale,
      y: (sy - panY) / scale
    };
  }

  function worldToScreen(wx, wy) {
    return {
      x: wx * scale + panX,
      y: wy * scale + panY
    };
  }

  function zoomAt(targetScale, anchorX, anchorY) {
    const clampedScale = Math.min(Math.max(targetScale, THEME.minScale), THEME.maxScale);
    if (clampedScale === scale) return;

    const worldAnchor = screenToWorld(anchorX, anchorY);
    scale = clampedScale;

    panX = anchorX - worldAnchor.x * scale;
    panY = anchorY - worldAnchor.y * scale;

    syncActiveTabState();
    updateUI();
    render();
  }

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

  function resetView(centerOrigin = true) {
    scale = 1.0;
    if (centerOrigin) {
      panX = window.innerWidth / 2;
      panY = window.innerHeight / 2;
    }
    syncActiveTabState();
    updateUI();
    render();
  }

  function getGridDetails() {
    const base = THEME.baseGridSize;
    const screenDistance = base * scale;
    const exponent = Math.floor(Math.log2(screenDistance / 32));
    const step = base / Math.pow(2, exponent);
    
    const ratio = (base * scale) / (32 * Math.pow(2, exponent));
    const fadeAlpha = Math.min(Math.max((ratio - 1), 0), 1);

    return { step, fadeAlpha };
  }

  // --- Rendering ---

  function render() {
    const width = window.innerWidth;
    const height = window.innerHeight;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = THEME.bg;
    ctx.fillRect(0, 0, width, height);

    const topLeft = screenToWorld(0, 0);
    const bottomRight = screenToWorld(width, height);

    const { step, fadeAlpha } = getGridDetails();

    const startX = Math.floor(topLeft.x / step) * step;
    const endX = Math.ceil(bottomRight.x / step) * step;
    const startY = Math.floor(topLeft.y / step) * step;
    const endY = Math.ceil(bottomRight.y / step) * step;

    const [r, g, b] = THEME.dotBaseColor;
    const primaryAlpha = 0.65;
    const subAlpha = primaryAlpha * fadeAlpha;

    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${primaryAlpha})`;

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

    if (subAlpha > 0.05) {
      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${subAlpha})`;
      ctx.beginPath();
      for (let x = startX; x <= endX; x += subStep) {
        const isMajorX = Math.abs(x % step) < 1e-4;
        const sx = x * scale + panX;
        for (let y = startY; y <= endY; y += subStep) {
          const isMajorY = Math.abs(y % step) < 1e-4;
          if (isMajorX && isMajorY) continue;
          const sy = y * scale + panY;
          ctx.moveTo(sx + dotRadius, sy);
          ctx.arc(sx, sy, dotRadius, 0, Math.PI * 2);
        }
      }
      ctx.fill();
    }

    // Origin crosshair
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
    if (!lockPopup.classList.contains('hidden')) {
      if (!lockPopup.contains(e.target) && !lockTabBtn.contains(e.target)) {
        closeLockPopup();
      }
    }

    activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (activePointers.size === 1) {
      isDragging = true;
      startPointerX = e.clientX;
      startPointerY = e.clientY;
      document.body.classList.add('is-dragging');
    } else if (activePointers.size === 2) {
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
      syncActiveTabState();
      render();
    } else if (activePointers.size === 2) {
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

        panX += currentCenter.x - pinchCenter.x;
        panY += currentCenter.y - pinchCenter.y;
        pinchCenter = currentCenter;
        syncActiveTabState();
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
      const remaining = activePointers.values().next().value;
      isDragging = true;
      startPointerX = remaining.x;
      startPointerY = remaining.y;
    }
  }

  // --- Wheel / Zoom Event ---

  function onWheel(e) {
    e.preventDefault();

    let delta = -e.deltaY;
    if (e.ctrlKey) {
      delta *= 0.02;
    } else if (e.deltaMode === 1) {
      delta *= 0.05;
    } else {
      delta *= 0.0015;
    }

    const factor = Math.exp(delta);
    zoomAt(scale * factor, e.clientX, e.clientY);
  }

  // --- Event Listeners ---

  // Zoom HUD
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

  // Tab & Lock Controls
  addTabBtn.addEventListener('click', createNewTab);
  lockTabBtn.addEventListener('click', toggleLockPopup);
  popupSaveBtn.addEventListener('click', handleSaveCurrentTab);
  popupGithubSyncBtn.addEventListener('click', handlePushToGitHub);
  popupShareLinkBtn.addEventListener('click', handleCopyShareLink);
  popupDeleteBtn.addEventListener('click', handleDeleteCurrentTab);

  // Save GitHub Token
  saveTokenBtn.addEventListener('click', () => {
    const val = githubPatInput.value.trim();
    if (val) {
      localStorage.setItem(GITHUB_TOKEN_KEY, val);
      githubSettingsPanel.classList.add('hidden');
      showToast('GitHub token saved locally');
    } else {
      localStorage.removeItem(GITHUB_TOKEN_KEY);
      showToast('GitHub token removed');
    }
  });

  // Close popup when clicking outside
  document.addEventListener('click', (e) => {
    if (!lockPopup.classList.contains('hidden')) {
      if (!lockPopup.contains(e.target) && !lockTabBtn.contains(e.target)) {
        closeLockPopup();
      }
    }
  });

  // Keyboard Shortcuts
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeLockPopup();
    } else if (e.key === '+' || e.key === '=') {
      zoomAt(scale * 1.25, window.innerWidth / 2, window.innerHeight / 2);
    } else if (e.key === '-' || e.key === '_') {
      zoomAt(scale / 1.25, window.innerWidth / 2, window.innerHeight / 2);
    } else if (e.key === '0') {
      resetView(true);
    }
  });

  // Window Resize
  window.addEventListener('resize', resize);

  // Canvas Pointers
  canvas.addEventListener('wheel', onWheel, { passive: false });
  canvas.addEventListener('pointerdown', onPointerDown);
  window.addEventListener('pointermove', onPointerMove);
  window.addEventListener('pointerup', onPointerUp);
  window.addEventListener('pointercancel', onPointerUp);
  canvas.addEventListener('contextmenu', (e) => e.preventDefault());

  // Initialize Canvas & Tabs
  initTabs();
  resize();
})();
