/* ═══════════════════════════════════════════════════════
   guide-to-nicos-mcps.js
   ═══════════════════════════════════════════════════════ */

/* ── Copy Buttons ─────────────────────────────────────── */

const COPY_ICON =
  '<svg viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>';
const CHECK_ICON =
  '<svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>';

/* ── External Tab Behavior ────────────────────────────── */

document.querySelectorAll("a").forEach((link) => {
  link.target = "_blank";
  const relValues = new Set(
    (link.getAttribute("rel") || "").split(/\s+/).filter(Boolean),
  );
  relValues.add("noopener");
  relValues.add("noreferrer");
  link.setAttribute("rel", Array.from(relValues).join(" "));
});

document.querySelectorAll(".copy-btn").forEach((btn) => {
  btn.addEventListener("click", async () => {
    const targetSelector = btn.getAttribute("data-copy-target");
    const targetEl = targetSelector ? document.querySelector(targetSelector) : null;
    const codeEl = btn.closest(".code-block")?.querySelector("code");
    const textToCopy = targetEl?.textContent || codeEl?.textContent || "";
    if (!textToCopy) return;

    try {
      await navigator.clipboard.writeText(textToCopy);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = textToCopy;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    const orig = btn.innerHTML;
    btn.innerHTML = CHECK_ICON + " Copied!";
    setTimeout(() => {
      btn.innerHTML = orig;
    }, 2000);
  });
});

/* ── Mobile Nav ───────────────────────────────────────── */

const toggle = document.querySelector(".nav-toggle");
const nav = document.querySelector(".nav");
const overlay = document.querySelector(".nav-overlay");

function openNav() {
  nav.classList.add("open");
  overlay.classList.add("open");
  toggle.setAttribute("aria-expanded", "true");
}

function closeNav() {
  nav.classList.remove("open");
  overlay.classList.remove("open");
  toggle.setAttribute("aria-expanded", "false");
}

toggle.addEventListener("click", () =>
  nav.classList.contains("open") ? closeNav() : openNav(),
);
overlay.addEventListener("click", closeNav);

nav.querySelectorAll(".nav-link").forEach((link) =>
  link.addEventListener("click", () => {
    if (window.matchMedia("(max-width: 56rem)").matches) closeNav();
  }),
);

/* ── Scroll Spy ───────────────────────────────────────── */

const sections = document.querySelectorAll("h2[id], h3[id]");
const navLinks = document.querySelectorAll(".nav-link");

const obs = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        navLinks.forEach((l) => l.classList.remove("active"));
        const a = document.querySelector(
          `.nav-link[href="#${entry.target.id}"]`,
        );
        if (a) a.classList.add("active");
      }
    });
  },
  { rootMargin: "-10% 0px -80% 0px" },
);

sections.forEach((s) => obs.observe(s));

/* ── Data Flow (Chart.js) ────────────────────────────── */

let dataFlowChart = null;

function drawRoundedRect(ctx, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r);
  ctx.lineTo(x + width, y + height - r);
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  ctx.lineTo(x + r, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function initDataFlowChart() {
  const wrapper = document.querySelector(".chartjs-flow");
  const canvas = document.getElementById("data-flow-chart");
  if (!wrapper || !canvas || typeof Chart === "undefined") return;

  const flowPlugin = {
    id: "flowDiagramRenderer",
    afterDraw(chart) {
      const { ctx, chartArea } = chart;
      if (!chartArea) return;

      const rootStyles = getComputedStyle(document.documentElement);
      const nodeFill = rootStyles.getPropertyValue("--bg-secondary").trim();
      const nodeStroke = rootStyles.getPropertyValue("--separator").trim();
      const edgeColor = rootStyles.getPropertyValue("--text-tertiary").trim();
      const textColor = rootStyles.getPropertyValue("--text").trim();
      const labelBg = rootStyles.getPropertyValue("--bg").trim();
      const palette = {
        blue: rootStyles.getPropertyValue("--blue").trim() || "#007aff",
        blueHover: rootStyles.getPropertyValue("--blue-hover").trim() || "#0056b3",
        indigo: rootStyles.getPropertyValue("--indigo").trim() || "#5856d6",
        purple: rootStyles.getPropertyValue("--purple").trim() || "#af52de",
        teal: rootStyles.getPropertyValue("--teal").trim() || "#5ac8fa",
        green: rootStyles.getPropertyValue("--green").trim() || "#34c759",
        orange: rootStyles.getPropertyValue("--orange").trim() || "#ff9500",
        red: rootStyles.getPropertyValue("--red").trim() || "#ff3b30",
        yellow: rootStyles.getPropertyValue("--yellow").trim() || "#ffd60a",
        mint: rootStyles.getPropertyValue("--mint").trim() || "#00c7be",
      };
      const rootFontSize =
        parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
      const toPx = (token, fallbackPx) => {
        const raw = rootStyles.getPropertyValue(token).trim();
        if (!raw) return fallbackPx;
        if (raw.endsWith("rem")) return parseFloat(raw) * rootFontSize;
        if (raw.endsWith("px")) return parseFloat(raw);
        const numeric = parseFloat(raw);
        return Number.isFinite(numeric) ? numeric : fallbackPx;
      };
      const withAlpha = (color, alpha) => {
        if (!color) return `rgba(0, 0, 0, ${alpha})`;
        if (color.startsWith("#")) {
          let hex = color.slice(1);
          if (hex.length === 3) hex = hex.split("").map((c) => c + c).join("");
          if (hex.length === 6) {
            const int = parseInt(hex, 16);
            const r = (int >> 16) & 255;
            const g = (int >> 8) & 255;
            const b = int & 255;
            return `rgba(${r}, ${g}, ${b}, ${alpha})`;
          }
        }
        return color;
      };

      const width = chartArea.right - chartArea.left;
      const height = chartArea.bottom - chartArea.top;
      const px = (x, y) => ({
        x: chartArea.left + (x / 100) * width,
        y: chartArea.top + (y / 100) * height,
      });

      const monoFont =
        'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace';
      const isCompactLayout = width < 560;
      // Use the Apple HIG type tokens already defined in CSS.
      const titleSize = isCompactLayout
        ? toPx("--text-caption-2", 11)
        : toPx("--text-subhead", 14);
      const subSize = isCompactLayout
        ? toPx("--text-caption-2", 11)
        : toPx("--text-caption-1", 12);
      const labelSize = isCompactLayout
        ? toPx("--text-caption-2", 11)
        : toPx("--text-caption-1", 12);

      function drawArrow(start, end, options = {}) {
        const {
          label = null,
          labelOffsetX = 0,
          labelOffsetY = -10,
          stroke = edgeColor || "#636366",
          arrowHead = stroke,
          labelText = stroke,
          labelFill = labelBg || "#ffffff",
        } = options;

        ctx.save();
        ctx.strokeStyle = stroke;
        ctx.lineWidth = 1.75;
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.stroke();

        const angle = Math.atan2(end.y - start.y, end.x - start.x);
        const headLen = 8;
        ctx.fillStyle = arrowHead;
        ctx.beginPath();
        ctx.moveTo(end.x, end.y);
        ctx.lineTo(
          end.x - headLen * Math.cos(angle - Math.PI / 6),
          end.y - headLen * Math.sin(angle - Math.PI / 6),
        );
        ctx.lineTo(
          end.x - headLen * Math.cos(angle + Math.PI / 6),
          end.y - headLen * Math.sin(angle + Math.PI / 6),
        );
        ctx.closePath();
        ctx.fill();

        if (label) {
          const mid = {
            x: (start.x + end.x) / 2 + labelOffsetX,
            y: (start.y + end.y) / 2 + labelOffsetY,
          };
          ctx.font = `600 ${labelSize}px ${monoFont}`;
          const textWidth = ctx.measureText(label).width;
          const padX = 6;
          const padY = 3;
          const boxW = textWidth + padX * 2;
          const boxH = labelSize + padY * 2;
          ctx.fillStyle = labelFill;
          drawRoundedRect(
            ctx,
            mid.x - boxW / 2,
            mid.y - boxH / 2,
            boxW,
            boxH,
            4,
          );
          ctx.fill();

          ctx.fillStyle = labelText;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(label, mid.x, mid.y + 0.5);
        }
        ctx.restore();
      }

      function drawNode(node) {
        const c = px(node.x, node.y);
        const boxW = (node.w / 100) * width;
        const boxH = (node.h / 100) * height;
        const x = c.x - boxW / 2;
        const y = c.y - boxH / 2;

        ctx.save();
        ctx.fillStyle = withAlpha(node.color || nodeFill || "#f2f2f7", 0.12);
        ctx.strokeStyle = withAlpha(node.color || nodeStroke || "#c6c6c8", 0.6);
        ctx.lineWidth = 1.5;
        drawRoundedRect(ctx, x, y, boxW, boxH, 8);
        ctx.fill();
        ctx.stroke();

        // Subtle accent rail for stronger visual grouping by node.
        ctx.fillStyle = withAlpha(node.color || "#007aff", 0.28);
        drawRoundedRect(ctx, x + 1.5, y + 1.5, boxW - 3, 4, 3);
        ctx.fill();

        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        const lines = node.lines;
        const lineGap = 2;
        const linesHeight = titleSize + (lines.length - 1) * (subSize + lineGap);
        let yCursor = c.y - linesHeight / 2 + titleSize / 2;

        lines.forEach((line, index) => {
          ctx.fillStyle = index === 0 ? node.color || textColor : textColor;
          ctx.font =
            index === 0
              ? `600 ${titleSize}px ${monoFont}`
              : `500 ${subSize}px ${monoFont}`;
          ctx.fillText(line, c.x, yCursor);
          yCursor += subSize + lineGap;
        });
        ctx.restore();
      }

      const nodes = isCompactLayout
        ? {
            claude: {
              x: 27,
              y: 13,
              w: 30,
              h: 12,
              color: palette.blue,
              lines: ["Claude.ai", "or Claude Code"],
            },
            tunnel: {
              x: 27,
              y: 35,
              w: 36,
              h: 18,
              color: palette.purple,
              lines: ["Cloudflare", "Tunnel", "+ Access (auth)"],
            },
            mcp: {
              x: 73,
              y: 35,
              w: 34,
              h: 15,
              color: palette.teal,
              lines: ["MCP Server", "on NAS"],
            },
            data: {
              x: 73,
              y: 61,
              w: 34,
              h: 14,
              color: palette.green,
              lines: ["/data/*.json", "(Git-tracked)"],
            },
            github: {
              x: 73,
              y: 81,
              w: 28,
              h: 10,
              color: palette.orange,
              lines: ["GitHub", "(sync)"],
            },
          }
        : {
            claude: {
              x: 15,
              y: 28,
              w: 20,
              h: 20,
              color: palette.blue,
              lines: ["Claude.ai", "or Claude Code"],
            },
            tunnel: {
              x: 45,
              y: 28,
              w: 24,
              h: 20,
              color: palette.purple,
              lines: ["Cloudflare Tunnel", "+ Access (auth)"],
            },
            mcp: {
              x: 75,
              y: 28,
              w: 20,
              h: 20,
              color: palette.teal,
              lines: ["MCP Server", "on NAS"],
            },
            data: {
              x: 75,
              y: 58,
              w: 24,
              h: 16,
              color: palette.green,
              lines: ["/data/*.json", "(Git-tracked)"],
            },
            github: {
              x: 75,
              y: 81,
              w: 20,
              h: 12,
              color: palette.orange,
              lines: ["GitHub", "(sync)"],
            },
          };

      function box(node) {
        const c = px(node.x, node.y);
        const w = (node.w / 100) * width;
        const h = (node.h / 100) * height;
        return {
          cx: c.x,
          cy: c.y,
          left: c.x - w / 2,
          right: c.x + w / 2,
          top: c.y - h / 2,
          bottom: c.y + h / 2,
        };
      }

      const b = {
        claude: box(nodes.claude),
        tunnel: box(nodes.tunnel),
        mcp: box(nodes.mcp),
        data: box(nodes.data),
        github: box(nodes.github),
      };
      const neutralStroke = withAlpha(edgeColor || "#636366", 0.88);
      const neutralHead = withAlpha(edgeColor || "#636366", 0.95);

      // Draw nodes first so connector labels remain legible above node edges.
      Object.values(nodes).forEach(drawNode);

      if (isCompactLayout) {
        drawArrow(
          { x: b.claude.cx + 4, y: b.claude.bottom },
          { x: b.tunnel.cx + 4, y: b.tunnel.top },
          {
            label: "HTTPS / MCP calls",
            labelOffsetX: 56,
            labelOffsetY: -8,
            stroke: withAlpha(palette.red, 0.88),
            arrowHead: withAlpha(palette.red, 0.95),
            labelText: palette.red,
            labelFill: withAlpha(palette.red, 0.14),
          },
        );
        drawArrow(
          { x: b.tunnel.right, y: b.tunnel.cy - 6 },
          { x: b.mcp.left, y: b.mcp.cy - 6 },
          {
            label: "Docker local",
            labelOffsetY: -17,
            stroke: withAlpha(palette.indigo, 0.9),
            arrowHead: withAlpha(palette.indigo, 0.96),
            labelText: palette.indigo,
            labelFill: withAlpha(palette.indigo, 0.14),
          },
        );
        drawArrow(
          { x: b.mcp.left, y: b.mcp.cy + 6 },
          { x: b.tunnel.right, y: b.tunnel.cy + 6 },
          {
            label: "JSON",
            labelOffsetY: 16,
            stroke: withAlpha(palette.mint, 0.95),
            arrowHead: withAlpha(palette.mint, 0.98),
            labelText: palette.mint,
            labelFill: withAlpha(palette.mint, 0.14),
          },
        );
        drawArrow(
          { x: b.tunnel.cx - 4, y: b.tunnel.top },
          { x: b.claude.cx - 4, y: b.claude.bottom },
          {
            label: "JSON",
            labelOffsetX: -56,
            labelOffsetY: 8,
            stroke: withAlpha(palette.mint, 0.95),
            arrowHead: withAlpha(palette.mint, 0.98),
            labelText: palette.mint,
            labelFill: withAlpha(palette.mint, 0.14),
          },
        );
        drawArrow(
          { x: b.mcp.cx, y: b.mcp.bottom },
          { x: b.data.cx, y: b.data.top },
          { stroke: neutralStroke, arrowHead: neutralHead },
        );
        drawArrow(
          { x: b.data.cx, y: b.data.bottom },
          { x: b.github.cx, y: b.github.top },
          { stroke: neutralStroke, arrowHead: neutralHead },
        );
      } else {
        drawArrow(
          { x: b.claude.right, y: b.claude.cy },
          { x: b.tunnel.left, y: b.tunnel.cy },
          {
            label: "HTTPS / MCP calls",
            labelOffsetY: -24,
            stroke: withAlpha(palette.red, 0.88),
            arrowHead: withAlpha(palette.red, 0.95),
            labelText: palette.red,
            labelFill: withAlpha(palette.red, 0.14),
          },
        );
        drawArrow(
          { x: b.tunnel.right, y: b.tunnel.cy },
          { x: b.mcp.left, y: b.mcp.cy },
          {
            label: "Docker local",
            labelOffsetY: -24,
            stroke: withAlpha(palette.indigo, 0.9),
            arrowHead: withAlpha(palette.indigo, 0.96),
            labelText: palette.indigo,
            labelFill: withAlpha(palette.indigo, 0.14),
          },
        );
        drawArrow(
          { x: b.mcp.left, y: b.mcp.cy + 11 },
          { x: b.tunnel.right, y: b.tunnel.cy + 11 },
          {
            label: "JSON",
            labelOffsetY: 20,
            stroke: withAlpha(palette.mint, 0.95),
            arrowHead: withAlpha(palette.mint, 0.98),
            labelText: palette.mint,
            labelFill: withAlpha(palette.mint, 0.14),
          },
        );
        drawArrow(
          { x: b.tunnel.left, y: b.tunnel.cy + 11 },
          { x: b.claude.right, y: b.claude.cy + 11 },
          {
            label: "JSON",
            labelOffsetY: 20,
            stroke: withAlpha(palette.mint, 0.95),
            arrowHead: withAlpha(palette.mint, 0.98),
            labelText: palette.mint,
            labelFill: withAlpha(palette.mint, 0.14),
          },
        );
        drawArrow(
          { x: b.mcp.cx, y: b.mcp.bottom },
          { x: b.data.cx, y: b.data.top },
          { stroke: neutralStroke, arrowHead: neutralHead },
        );
        drawArrow(
          { x: b.data.cx, y: b.data.bottom },
          { x: b.github.cx, y: b.github.top },
          { stroke: neutralStroke, arrowHead: neutralHead },
        );
      }
    },
  };

  if (dataFlowChart) dataFlowChart.destroy();

  dataFlowChart = new Chart(canvas, {
    type: "scatter",
    data: {
      datasets: [
        {
          data: [
            { x: 0, y: 0 },
            { x: 100, y: 100 },
          ],
          pointRadius: 0,
          borderWidth: 0,
          showLine: false,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: 450,
      },
      events: [],
      plugins: {
        legend: { display: false },
        tooltip: { enabled: false },
      },
      layout: {
        padding: { top: 1, right: 1, bottom: 1, left: 1 },
      },
      scales: {
        x: {
          type: "linear",
          min: 0,
          max: 100,
          display: false,
          grid: { display: false },
          border: { display: false },
        },
        y: {
          type: "linear",
          min: 0,
          max: 100,
          display: false,
          grid: { display: false },
          border: { display: false },
        },
      },
    },
    plugins: [flowPlugin],
  });

  wrapper.classList.add("is-chart-ready");
}

initDataFlowChart();

/* ── Download Guide ───────────────────────────────────── */

document.getElementById("download-guide")?.addEventListener("click", () => {
  const el = document.getElementById("guide-md");
  if (!el) return;

  const raw = el.textContent;
  const lines = raw.split("\n");
  const indent = Math.min(
    ...lines.filter((l) => l.trim()).map((l) => l.match(/^ */)[0].length),
  );
  const text = lines.map((l) => l.slice(indent)).join("\n").trim() + "\n";
  const blob = new Blob([text], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "guide-for-claude.md";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  // Brief visual feedback
  const btn = document.getElementById("download-guide");
  const orig = btn.innerHTML;
  const icon =
    '<span class="material-symbols-outlined" aria-hidden="true">check_circle</span>';
  btn.innerHTML = icon + " Downloaded!";
  setTimeout(() => {
    btn.innerHTML = orig;
  }, 2500);
});
