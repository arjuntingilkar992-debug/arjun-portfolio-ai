// Edit this file to customize interactions. No framework/build step required.
const EMAIL = "arjuntingilkar992@gmail.com";
const API_BASE = "http://127.0.0.1:8000";

const menuToggle = document.getElementById("menuToggle");
const nav = document.getElementById("nav");
menuToggle?.addEventListener("click", () => {
  const open = nav.classList.toggle("open");
  menuToggle.setAttribute("aria-expanded", String(open));
});
nav?.querySelectorAll("a").forEach(link => link.addEventListener("click", () => {
  nav.classList.remove("open");
  menuToggle?.setAttribute("aria-expanded", "false");
}));

// Scroll reveal, with a graceful fallback for older browsers.
const revealItems = document.querySelectorAll(".reveal");
if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver(entries => entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add("visible");
      observer.unobserve(entry.target);
    }
  }), { threshold: 0.12 });
  revealItems.forEach(item => observer.observe(item));
} else {
  revealItems.forEach(item => item.classList.add("visible"));
}

const toast = document.getElementById("toast");
let toastTimer;
function showToast(message) {
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2300);
}
document.getElementById("copyEmail")?.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(EMAIL);
    showToast("Email copied to clipboard");
  } catch {
    window.location.href = `mailto:${EMAIL}`;
    showToast("Opening your email app");
  }
});

// Custom cursor: dot follows immediately; ring eases toward pointer.
const dot = document.getElementById("cursorDot");
const ring = document.getElementById("cursorRing");
const finePointer = window.matchMedia("(pointer: fine)").matches;
let mouseX = innerWidth / 2, mouseY = innerHeight / 2, ringX = mouseX, ringY = mouseY;
if (finePointer && dot && ring) {
  dot.style.opacity = ring.style.opacity = "1";
  window.addEventListener("mousemove", event => {
    mouseX = event.clientX; mouseY = event.clientY;
    dot.style.left = `${mouseX}px`; dot.style.top = `${mouseY}px`;
  });
  function animateRing() {
    ringX += (mouseX - ringX) * 0.16;
    ringY += (mouseY - ringY) * 0.16;
    ring.style.left = `${ringX}px`; ring.style.top = `${ringY}px`;
    requestAnimationFrame(animateRing);
  }
  animateRing();
  document.querySelectorAll("a, button, input").forEach(el => {
    el.addEventListener("mouseenter", () => ring.classList.add("hover"));
    el.addEventListener("mouseleave", () => ring.classList.remove("hover"));
  });
}

// Subtle 3D card tilt, disabled for touch and reduced-motion users.
const tiltCard = document.getElementById("tiltCard");
if (tiltCard && finePointer && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
  tiltCard.addEventListener("mousemove", event => {
    const r = tiltCard.getBoundingClientRect();
    const x = (event.clientX - r.left) / r.width - 0.5;
    const y = (event.clientY - r.top) / r.height - 0.5;
    tiltCard.style.transform = `rotateY(${x * 8}deg) rotateX(${-y * 8}deg) rotateZ(1deg)`;
  });
  tiltCard.addEventListener("mouseleave", () => tiltCard.style.transform = "rotate(2deg)");
}

// Gentle magnetic effect for primary links/buttons on fine-pointer devices.
if (finePointer && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
  document.querySelectorAll(".magnetic").forEach(el => {
    el.addEventListener("mousemove", event => {
      const r = el.getBoundingClientRect();
      const dx = event.clientX - (r.left + r.width / 2);
      const dy = event.clientY - (r.top + r.height / 2);
      el.style.transform = `translate(${dx * 0.08}px, ${dy * 0.12}px)`;
    });
    el.addEventListener("mouseleave", () => el.style.transform = "");
  });
}

// AI chat calls the Python backend. It remains usable as a frontend demo without a key.
const chatForm = document.getElementById("chatForm");
const chatInput = document.getElementById("chatInput");
const chatLog = document.getElementById("chatLog");
const aiStatus = document.getElementById("aiStatus");
const MEMORY_KEY = "arjunPortfolioAiHistory";
let chatHistory = [];
try {
  chatHistory = JSON.parse(localStorage.getItem(MEMORY_KEY) || "[]");
  if (!Array.isArray(chatHistory)) chatHistory = [];
} catch { chatHistory = []; }

function addBubble(text, role) {
  const bubble = document.createElement("div");
  bubble.className = `chat-bubble ${role}`;
  bubble.textContent = text;
  chatLog.appendChild(bubble);
  chatLog.scrollTop = chatLog.scrollHeight;
  return bubble;
}
function saveHistory() {
  chatHistory = chatHistory.slice(-12);
  try { localStorage.setItem(MEMORY_KEY, JSON.stringify(chatHistory)); } catch {}
}
function renderSavedHistory() {
  chatHistory.forEach(item => addBubble(item.content, item.role));
}
async function checkAI() {
  try {
    const response = await fetch(`${API_BASE}/health`, { signal: AbortSignal.timeout(2500) });
    if (!response.ok) throw new Error("offline");
    const data = await response.json();
    aiStatus.textContent = data.ai_configured ? "AI READY" : "ADD API KEY IN BACKEND";
  } catch {
    aiStatus.textContent = "START PYTHON BACKEND";
  }
}
renderSavedHistory();
checkAI();
chatForm?.addEventListener("submit", async event => {
  event.preventDefault();
  const message = chatInput.value.trim();
  if (!message) return;
  addBubble(message, "user");
  const previousHistory = chatHistory.slice(-12);
  chatHistory.push({ role: "user", content: message });
  saveHistory();
  chatInput.value = "";
  const waiting = addBubble("Thinking…", "assistant");
  const button = chatForm.querySelector("button");
  if (button) button.disabled = true;
  try {
    const response = await fetch(`${API_BASE}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, history: previousHistory })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.detail || "The AI backend returned an error.");
    const reply = data.reply || "No response returned.";
    waiting.textContent = reply;
    chatHistory.push({ role: "assistant", content: reply });
    saveHistory();
    aiStatus.textContent = "CONNECTED";
  } catch (error) {
    waiting.textContent = error.message.includes("Failed to fetch")
      ? "Python AI backend is not running. Start it using backend/README.md."
      : error.message;
    aiStatus.textContent = "NOT CONNECTED";
  } finally {
    if (button) button.disabled = false;
    chatInput.focus();
  }
});
