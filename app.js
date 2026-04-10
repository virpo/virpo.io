const fontModes = ["font-pixel", "font-sans", "font-serif"];
const paletteModes = [
  "palette-cherry",
  "palette-ember",
  "palette-cobalt",
  "palette-mint",
  "palette-gold",
];
const cornerModes = ["corners-sharp", "corners-round", "corners-pixel"];
const focusModes = ["writing", "projects", "japan", "about"];
const { buildFactHeadline } = window.factUtils;

const state = {
  theme: "light",
  font: "font-serif",
  palette: "palette-cherry",
  corners: "corners-round",
  focus: "writing",
};

const icons = {
  play: `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path class="icon-fill" d="M8 6.75 18 12 8 17.25Z"></path>
    </svg>
  `,
  pause: `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect class="icon-fill" x="7" y="6" width="3.6" height="12" rx="1.3"></rect>
      <rect class="icon-fill" x="13.4" y="6" width="3.6" height="12" rx="1.3"></rect>
    </svg>
  `,
  reset: `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M19 8.5A8 8 0 1 0 20 12"></path>
      <path d="M19 4.5v4h-4"></path>
    </svg>
  `,
  themeLight: `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 4.5v2.2"></path>
      <path d="M12 17.3v2.2"></path>
      <path d="m6.7 6.7 1.6 1.6"></path>
      <path d="m15.7 15.7 1.6 1.6"></path>
      <path d="M4.5 12h2.2"></path>
      <path d="M17.3 12h2.2"></path>
      <path d="m6.7 17.3 1.6-1.6"></path>
      <path d="m15.7 8.3 1.6-1.6"></path>
      <circle cx="12" cy="12" r="3.3"></circle>
    </svg>
  `,
  themeDark: `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M17.2 14.9A6.8 6.8 0 0 1 9.1 6.8 7.7 7.7 0 1 0 17.2 14.9Z"></path>
    </svg>
  `,
};

let redrawLife = null;

function saveState() {
  window.localStorage.setItem("virpo-style-state", JSON.stringify(state));
}

function setIcon(target, name) {
  if (!target) return;
  target.innerHTML = icons[name] ?? "";
}

function initializeIcons() {
  setIcon(document.getElementById("theme-icon"), state.theme === "dark" ? "themeDark" : "themeLight");
  setIcon(document.getElementById("life-reset-icon"), "reset");
  setIcon(document.getElementById("life-play-icon"), "pause");
}

function formatTodayMeta(record, now) {
  if (typeof record.year !== "number") return "";
  if (record.year < 0) return `${Math.abs(record.year)} years BC`;

  const anniversary = now.getFullYear() - record.year;
  if (anniversary <= 0) return `${record.year}`;
  return `${anniversary} years ago (${record.year})`;
}

async function initializeToday() {
  const now = new Date();
  const dateEl = document.getElementById("today-date");
  const emojiEl = document.getElementById("today-emoji");
  const fact = document.getElementById("today-fact");
  const meta = document.getElementById("today-meta");

  if (!dateEl || !emojiEl || !fact || !meta) return;

  dateEl.textContent = now.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
  fact.textContent = "Loading today's anniversary…";
  meta.textContent = "";

  try {
    const response = await fetch("./data/today-facts.json", { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`today facts request failed: ${response.status}`);
    }

    const records = await response.json();
    const key = `${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    const record = records.find((item) => item.dateKey === key);

    if (!record) {
      throw new Error(`today fact missing for ${key}`);
    }

    const headline = buildFactHeadline(record) || record.displayHeadline || record.event;
    emojiEl.textContent = record.emoji || "•";
    fact.textContent = headline;
    meta.textContent = formatTodayMeta(record, now);
  } catch (error) {
    console.error(error);
    emojiEl.textContent = "🔧";
    fact.textContent = "A serious anniversary card goes here.";
  }
}

function applyState() {
  document.body.classList.toggle("theme-dark", state.theme === "dark");
  document.body.classList.toggle("is-japan-mode", state.focus === "japan");

  fontModes.forEach((name) => document.body.classList.remove(name));
  paletteModes.forEach((name) => document.body.classList.remove(name));
  cornerModes.forEach((name) => document.body.classList.remove(name));

  document.body.classList.add(state.font, state.palette, state.corners);

  document.querySelectorAll(".font-chip").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.font === state.font);
  });
  document.querySelectorAll(".palette-chip").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.palette === state.palette);
  });
  document.querySelectorAll(".corner-chip").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.corners === state.corners);
  });

  const themeToggle = document.getElementById("theme-toggle");
  if (themeToggle) {
    themeToggle.setAttribute("aria-pressed", String(state.theme === "dark"));
  }

  setIcon(document.getElementById("theme-icon"), state.theme === "dark" ? "themeDark" : "themeLight");

  if (typeof redrawLife === "function") {
    redrawLife();
  }

  saveState();
}

function initializeSavedState() {
  const saved = window.localStorage.getItem("virpo-style-state");
  if (!saved) return;
  try {
    const parsed = JSON.parse(saved);
    if (parsed.theme) state.theme = parsed.theme;
    if (parsed.font) state.font = parsed.font === "font-sans" ? "font-serif" : parsed.font;
    if (parsed.palette) state.palette = parsed.palette;
    if (parsed.corners) state.corners = parsed.corners;
    if (parsed.focus && focusModes.includes(parsed.focus)) state.focus = parsed.focus;
  } catch {
    // ignore invalid saved state
  }
}

function initializeStyleControls() {
  document.querySelectorAll(".font-chip").forEach((button) => {
    button.addEventListener("click", () => {
      state.font = button.dataset.font;
      applyState();
    });
  });

  document.querySelectorAll(".palette-chip").forEach((button) => {
    button.addEventListener("click", () => {
      state.palette = button.dataset.palette;
      applyState();
    });
  });

  document.querySelectorAll(".corner-chip").forEach((button) => {
    button.addEventListener("click", () => {
      state.corners = button.dataset.corners;
      applyState();
    });
  });
}

function initializeThemeToggle() {
  const button = document.getElementById("theme-toggle");
  if (!button) return;

  button.addEventListener("click", () => {
    state.theme = state.theme === "dark" ? "light" : "dark";
    applyState();
  });
}

function animateFlip(elements, mutate) {
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const before = new Map(elements.map((element) => [element, element.getBoundingClientRect()]));

  mutate();

  if (reducedMotion) return;

  elements.forEach((element) => {
    const first = before.get(element);
    const last = element.getBoundingClientRect();
    const deltaX = first.left - last.left;
    const deltaY = first.top - last.top;

    if (Math.abs(deltaX) < 0.5 && Math.abs(deltaY) < 0.5) return;

    element.animate(
      [
        {
          transform: `translate(${deltaX}px, ${deltaY}px)`,
          filter: "brightness(1.02)",
        },
        {
          transform: "translate(0, 0)",
          filter: "brightness(1)",
        },
      ],
      {
        duration: 320,
        easing: "cubic-bezier(0.22, 1, 0.36, 1)",
      },
    );
  });
}

function initializeFocusMenu() {
  const contentFlow = document.querySelector(".content-flow");
  const columns = document.querySelector(".columns");
  const leftColumn = document.querySelector(".column--left");
  const controlBox = document.querySelector(".control-box");
  const tokyoHomeBox = document.querySelector(".tokyo-home-box");
  const projectsShelf = document.querySelector(".projects-shelf");
  const rightColumn = document.querySelector(".column--right");
  const writingBox = document.querySelector(".writing-box");
  const aboutBox = document.querySelector(".about-box");
  const menuButtons = [...document.querySelectorAll(".menu-pill[data-focus]")];
  const japanShelf = document.getElementById("japan-corner");
  const japanStack = document.querySelector(".japan-shelf__stack");

  if (
    !contentFlow ||
    !columns ||
    !leftColumn ||
    !controlBox ||
    !tokyoHomeBox ||
    !projectsShelf ||
    !rightColumn ||
    !writingBox ||
    !aboutBox ||
    !japanStack ||
    menuButtons.length === 0
  ) {
    return;
  }

  const syncFocusUi = () => {
    menuButtons.forEach((button) => {
      const isActive = button.dataset.focus === state.focus;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-pressed", String(isActive));
    });

    writingBox.classList.toggle("is-focused", state.focus === "writing");
    aboutBox.classList.toggle("is-focused", state.focus === "about");
    projectsShelf.classList.toggle("is-focused", state.focus === "projects");
    japanShelf?.classList.toggle("is-focused", state.focus === "japan");
    document.body.classList.toggle("is-japan-mode", state.focus === "japan");
  };

  const applyFocusLayout = (animate = false) => {
    const topLevelPanels = [columns, japanShelf, projectsShelf, tokyoHomeBox].filter(Boolean);
    const rightPanels = [writingBox, aboutBox];
    const movePanels = () => {
      if (state.focus === "japan") {
        japanStack.prepend(tokyoHomeBox);
        contentFlow.append(japanShelf);
        contentFlow.append(columns);
        contentFlow.append(projectsShelf);
      } else if (state.focus === "projects") {
        controlBox.after(tokyoHomeBox);
        contentFlow.append(projectsShelf);
        contentFlow.append(columns);
        contentFlow.append(japanShelf);
      } else {
        controlBox.after(tokyoHomeBox);
        contentFlow.append(columns);
        contentFlow.append(projectsShelf);
        contentFlow.append(japanShelf);
      }

      if (state.focus === "about") {
        rightColumn.prepend(aboutBox);
        rightColumn.append(writingBox);
      } else {
        rightColumn.prepend(writingBox);
        rightColumn.append(aboutBox);
      }

      syncFocusUi();
    };

    if (animate) {
      animateFlip([...topLevelPanels, ...rightPanels], movePanels);
    } else {
      movePanels();
    }

    applyState();
    saveState();
  };

  menuButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const nextFocus = button.dataset.focus;
      if (!nextFocus || nextFocus === state.focus) return;
      state.focus = nextFocus;
      applyFocusLayout(true);
    });
  });

  applyFocusLayout(false);
}

function initializeFaceTracker() {
  document.querySelectorAll(".face-tracker").forEach((container) => {
    if (container.dataset.initialized === "true") return;
    container.dataset.initialized = "true";

    const img = document.createElement("img");
    img.className = "face-image";
    img.alt = "Peter Hraska face tracker";
    container.appendChild(img);

    const basePath = container.dataset.basePath;
    const P_MIN = -15;
    const P_MAX = 15;
    const STEP = 3;

    const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
    const quantizeToGrid = (value) => {
      const raw = P_MIN + ((value + 1) * (P_MAX - P_MIN)) / 2;
      const snapped = Math.round(raw / STEP) * STEP;
      return clamp(snapped, P_MIN, P_MAX);
    };
    const sanitize = (value) => Number(value).toFixed(1).replace("-", "m").replace(".", "p");
    const gridToFilename = (px, py) => `gaze_px${sanitize(px)}_py${sanitize(py)}_256.webp`;

    const setFromClient = (clientX, clientY) => {
      const rect = container.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const nx = (clientX - centerX) / (rect.width / 2);
      const ny = (centerY - clientY) / (rect.height / 2);
      const px = quantizeToGrid(clamp(nx, -1, 1));
      const py = quantizeToGrid(clamp(ny, -1, 1));
      img.src = `${basePath}${gridToFilename(px, py)}`;
    };

    const rect = container.getBoundingClientRect();
    setFromClient(rect.left + rect.width / 2, rect.top + rect.height / 2);

    window.addEventListener("mousemove", (event) => {
      setFromClient(event.clientX, event.clientY);
    });
  });
}

function initializeLifeGame() {
  const canvas = document.getElementById("life-canvas");
  const lifeBox = canvas?.closest(".life-box");
  const topRow = document.querySelector(".top-row");
  const brandBox = document.querySelector(".brand-box");
  const lifeActions = document.querySelector(".life-actions");
  const resetButton = document.getElementById("life-reset");
  const playButton = document.getElementById("life-play-toggle");
  const playIcon = document.getElementById("life-play-icon");
  if (!canvas || !resetButton || !playButton || !playIcon) return;

  const ctx = canvas.getContext("2d");
  const tickDelay = 1800;
  let cols = 21;
  let rows = 5;
  let grid = [];
  let isRunning = true;
  let boardMetrics = null;
  let paintValue = null;

  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const emptyGrid = (rowCount = rows, colCount = cols) =>
    Array.from({ length: rowCount }, () => Array.from({ length: colCount }, () => 0));

  const placePattern = (target, pattern, startX, startY) => {
    pattern.forEach((row, y) => {
      [...row].forEach((value, x) => {
        if (value !== "#") return;
        const nextRow = target[startY + y];
        if (!nextRow || typeof nextRow[startX + x] === "undefined") return;
        nextRow[startX + x] = 1;
      });
    });
  };

  const seededGrid = (rowCount = rows, colCount = cols) => {
    const next = emptyGrid(rowCount, colCount);
    const anchor = Math.max(1, Math.floor((colCount - 21) / 2));

    placePattern(next, [".#.", "..#", "###"], anchor + 1, 0);
    placePattern(next, ["##", "##"], anchor + 7, 1);
    placePattern(next, ["###", "#.."], anchor + 12, 0);
    placePattern(next, ["##.", ".##"], anchor + 17, 2);
    return next;
  };

  const remapGrid = (sourceGrid, nextRows, nextCols) => {
    if (!sourceGrid.length || !sourceGrid[0]?.length) {
      return seededGrid(nextRows, nextCols);
    }

    const next = emptyGrid(nextRows, nextCols);
    const sourceRows = sourceGrid.length;
    const sourceCols = sourceGrid[0].length;

    sourceGrid.forEach((row, y) => {
      row.forEach((value, x) => {
        if (!value) return;
        const mappedX = Math.round((x / Math.max(1, sourceCols - 1)) * Math.max(0, nextCols - 1));
        const mappedY = Math.round((y / Math.max(1, sourceRows - 1)) * Math.max(0, nextRows - 1));
        next[mappedY][mappedX] = 1;
      });
    });

    return next;
  };

  const roundRect = (x, y, width, height, radius, fill, stroke) => {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    if (fill) {
      ctx.fillStyle = fill;
      ctx.fill();
    }
    if (stroke) {
      ctx.strokeStyle = stroke;
      ctx.stroke();
    }
  };

  const updateCanvasSize = () => {
    const dpr = window.devicePixelRatio || 1;
    const { width, height } = canvas.getBoundingClientRect();
    canvas.width = Math.max(1, Math.round(width * dpr));
    canvas.height = Math.max(1, Math.round(height * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  const measureBoard = () => {
    const canvasRect = canvas.getBoundingClientRect();
    const styles = getComputedStyle(lifeBox || canvas);
    const borderX =
      (Number.parseFloat(styles.borderLeftWidth) || 0) + (Number.parseFloat(styles.borderRightWidth) || 0);
    const boxGap = Number.parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--box-gap")) || 2;
    const height = Math.max(1, canvasRect.height);
    const nextRows = height >= 72 ? 6 : 5;
    const targetGap = clamp(Math.round(height * 0.045), 2, 3);
    const cellSize = (height - targetGap * Math.max(0, nextRows - 1)) / nextRows;
    const gap = nextRows > 1 ? (height - nextRows * cellSize) / (nextRows - 1) : 0;
    const stride = cellSize + gap;
    const idealCols = nextRows * 4 + 1;
    let nextCols = idealCols;

    if (topRow && brandBox && lifeActions && !window.matchMedia("(max-width: 820px)").matches) {
      const topWidth = topRow.getBoundingClientRect().width;
      const brandWidth = brandBox.getBoundingClientRect().width;
      const actionsWidth = lifeActions.getBoundingClientRect().width;
      const reservedMenuWidth = 260;
      const maxLifeWidth = Math.max(
        stride * 12 - gap,
        topWidth - brandWidth - actionsWidth - reservedMenuWidth - boxGap * 3,
      );
      nextCols = clamp(Math.floor((maxLifeWidth + gap) / stride), 12, idealCols);
    }

    const boardWidth = cellSize * nextCols + gap * Math.max(0, nextCols - 1);
    return {
      width: boardWidth,
      height,
      cellSize,
      gap,
      rows: nextRows,
      cols: nextCols,
      boardWidth,
      borderX,
      radius: Math.max(2, Math.min(5, cellSize * 0.24)),
    };
  };

  const syncBoardGeometry = () => {
    const firstPass = measureBoard();

    if (lifeBox && !window.matchMedia("(max-width: 820px)").matches) {
      const targetWidth = Math.ceil(firstPass.boardWidth + firstPass.borderX);
      if (Math.abs(lifeBox.getBoundingClientRect().width - targetWidth) > 1) {
        lifeBox.style.width = `${targetWidth}px`;
      }
    } else if (lifeBox) {
      lifeBox.style.width = "";
    }

    const nextMetrics = measureBoard();
    const boardSizeChanged = !boardMetrics || nextMetrics.rows !== rows || nextMetrics.cols !== cols;
    boardMetrics = nextMetrics;

    if (boardSizeChanged) {
      const previousGrid = grid;
      rows = nextMetrics.rows;
      cols = nextMetrics.cols;
      grid = previousGrid.length ? remapGrid(previousGrid, rows, cols) : seededGrid(rows, cols);
    }
  };

  const cellRect = (x, y) => {
    const stride = boardMetrics.cellSize + boardMetrics.gap;
    return {
      x: x * stride,
      y: y * stride,
      size: boardMetrics.cellSize,
    };
  };

  const cellFromClient = (clientX, clientY) => {
    if (!boardMetrics) return null;
    const rect = canvas.getBoundingClientRect();
    const localX = clientX - rect.left;
    const localY = clientY - rect.top;
    const stride = boardMetrics.cellSize + boardMetrics.gap;
    const col = Math.floor(localX / stride);
    const row = Math.floor(localY / stride);

    if (col < 0 || col >= cols || row < 0 || row >= rows) return null;

    const target = cellRect(col, row);
    if (
      localX < target.x ||
      localX > target.x + target.size ||
      localY < target.y ||
      localY > target.y + target.size
    ) {
      return null;
    }

    return { x: col, y: row };
  };

  const countNeighbors = (x, y) => {
    let count = 0;
    for (let dy = -1; dy <= 1; dy += 1) {
      for (let dx = -1; dx <= 1; dx += 1) {
        if (dx === 0 && dy === 0) continue;
        const nx = (x + dx + cols) % cols;
        const ny = (y + dy + rows) % rows;
        count += grid[ny][nx];
      }
    }
    return count;
  };

  const step = () => {
    grid = grid.map((row, y) =>
      row.map((value, x) => {
        const neighbors = countNeighbors(x, y);
        if (value === 1 && (neighbors === 2 || neighbors === 3)) return 1;
        if (value === 0 && neighbors === 3) return 1;
        return 0;
      }),
    );
  };

  const draw = () => {
    const styles = getComputedStyle(document.body);
    const accent = styles.getPropertyValue("--accent").trim();
    const dead = styles.getPropertyValue("--life-dead").trim();

    syncBoardGeometry();
    updateCanvasSize();

    ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);

    grid.forEach((row, y) => {
      row.forEach((value, x) => {
        const { x: cellX, y: cellY, size } = cellRect(x, y);
        const fill = value ? accent : dead;
        roundRect(cellX, cellY, size, size, boardMetrics.radius, fill, null);
      });
    });
  };

  const updatePlayButton = () => {
    playButton.setAttribute("aria-pressed", String(isRunning));
    playButton.setAttribute("aria-label", isRunning ? "Pause tiny game" : "Play tiny game");
    setIcon(playIcon, isRunning ? "pause" : "play");
  };

  const paintCell = (cell) => {
    if (!cell) return;
    grid[cell.y][cell.x] = paintValue ?? grid[cell.y][cell.x];
    draw();
  };

  const tick = () => {
    if (!isRunning) return;
    step();
    draw();
  };

  grid = seededGrid(rows, cols);
  draw();
  updatePlayButton();
  redrawLife = draw;
  window.setInterval(tick, tickDelay);

  const resizeObserver = new ResizeObserver(() => {
    draw();
  });
  if (topRow) resizeObserver.observe(topRow);
  if (lifeBox) resizeObserver.observe(lifeBox);
  resizeObserver.observe(canvas);

  playButton.addEventListener("click", () => {
    isRunning = !isRunning;
    updatePlayButton();
  });

  resetButton.addEventListener("click", () => {
    grid = seededGrid(rows, cols);
    draw();
  });

  canvas.addEventListener("pointerdown", (event) => {
    const cell = cellFromClient(event.clientX, event.clientY);
    if (!cell) return;
    paintValue = grid[cell.y][cell.x] ? 0 : 1;
    paintCell(cell);
    canvas.setPointerCapture(event.pointerId);
  });

  canvas.addEventListener("pointermove", (event) => {
    if (paintValue === null) return;
    paintCell(cellFromClient(event.clientX, event.clientY));
  });

  const releasePaint = () => {
    paintValue = null;
  };

  canvas.addEventListener("pointerup", releasePaint);
  canvas.addEventListener("pointerleave", releasePaint);
  canvas.addEventListener("pointercancel", releasePaint);
}

window.addEventListener("DOMContentLoaded", () => {
  initializeSavedState();
  initializeIcons();
  initializeToday();
  initializeThemeToggle();
  initializeStyleControls();
  initializeFocusMenu();
  initializeFaceTracker();
  initializeLifeGame();
  applyState();
});
