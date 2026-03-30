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
    const code = btn.closest(".code-block").querySelector("code");
    try {
      await navigator.clipboard.writeText(code.textContent);
    } catch {
      const r = document.createRange();
      r.selectNodeContents(code);
      const s = window.getSelection();
      s.removeAllRanges();
      s.addRange(r);
      document.execCommand("copy");
      s.removeAllRanges();
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
