import "./style.css";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const messagesEl = document.querySelector<HTMLElement>("#messages")!;
const formEl = document.querySelector<HTMLFormElement>("#composer")!;
const inputEl = document.querySelector<HTMLTextAreaElement>("#input")!;
const statusEl = document.querySelector<HTMLElement>("#status")!;

function renderMessage(message: ChatMessage): void {
  const el = document.createElement("div");
  el.className = `message message--${message.role}`;
  el.textContent = message.content;
  messagesEl.append(el);
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

function renderError(text: string): void {
  const el = document.createElement("div");
  el.className = "message message--error";
  el.textContent = text;
  messagesEl.append(el);
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

async function loadHistory(): Promise<void> {
  try {
    const response = await fetch("/api/chat/history");
    const data = (await response.json()) as { messages: ChatMessage[] };
    for (const message of data.messages) renderMessage(message);
  } catch {
    // histórico é best-effort na primeira carga; segue sem ele
  }
}

async function checkHealth(): Promise<void> {
  try {
    const response = await fetch("/api/health");
    if (!response.ok) throw new Error();
    const data = (await response.json()) as { provider: string };
    statusEl.textContent = `conectado (${data.provider})`;
    statusEl.classList.remove("status--error");
  } catch {
    statusEl.textContent = "servidor indisponível";
    statusEl.classList.add("status--error");
  }
}

async function sendMessage(text: string): Promise<void> {
  renderMessage({ role: "user", content: text });

  const pending = document.createElement("div");
  pending.className = "message message--assistant message--pending";
  pending.textContent = "…";
  messagesEl.append(pending);
  messagesEl.scrollTop = messagesEl.scrollHeight;

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ message: text }),
    });
    const data = (await response.json()) as { reply?: string; error?: string };
    pending.remove();
    if (!response.ok || !data.reply) {
      renderError(data.error ?? "Falha ao obter resposta.");
      return;
    }
    renderMessage({ role: "assistant", content: data.reply });
  } catch (error) {
    pending.remove();
    renderError(
      error instanceof Error
        ? error.message
        : "Falha de conexão com o servidor local (apps/api está rodando?).",
    );
  }
}

formEl.addEventListener("submit", (event) => {
  event.preventDefault();
  const text = inputEl.value.trim();
  if (text === "") return;
  inputEl.value = "";
  inputEl.style.height = "auto";
  void sendMessage(text);
});

inputEl.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    formEl.requestSubmit();
  }
});

inputEl.addEventListener("input", () => {
  inputEl.style.height = "auto";
  inputEl.style.height = `${inputEl.scrollHeight}px`;
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // instalação como PWA é best-effort; o chat funciona sem o service worker
    });
  });
}

void checkHealth();
void loadHistory();
