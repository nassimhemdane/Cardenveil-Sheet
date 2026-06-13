const FONT_STEPS = [12, 14, 16, 18, 20, 24, 28];
const EDITOR_SELECTOR = '[data-rich-text="true"]';
const editorEntries = new Map();

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function looksLikeHtml(value) {
  return /<([a-z][^/\s>]*)(?:[\s\S]*?)>/i.test(String(value || ""));
}

function toEditorHtml(value, mode) {
  const raw = String(value || "");
  if (!raw.trim()) return "<p><br></p>";
  if (looksLikeHtml(raw)) return raw;
  if (mode === "single") {
    return escapeHtml(raw.replace(/\r?\n/g, " "));
  }
  return raw
    .split(/\r?\n/)
    .map((line) => `<p>${line ? escapeHtml(line) : "<br>"}</p>`)
    .join("");
}

function normalizeComparableHtml(value) {
  return String(value || "")
    .replace(/<p><br><\/p>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getStoredHtml(content, mode) {
  const html = mode === "single" ? content.innerHTML : content.innerHTML;
  const text = content.textContent.replace(/\u00a0/g, " ").trim();
  if (!text && !/<img|<br|<span|<strong|<em|<u|<s|<strike|<b|<i/i.test(html)) {
    return "";
  }
  return html;
}

function getCurrentSelection() {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
    return null;
  }
  return selection;
}

function getCurrentFontSize(entry) {
  const selection = window.getSelection();
  const anchor = selection?.anchorNode;
  const node = anchor?.nodeType === Node.TEXT_NODE ? anchor.parentElement : anchor;
  const fallbackNode = node && entry.content.contains(node) ? node : entry.content;
  const size = parseInt(window.getComputedStyle(fallbackNode).fontSize, 10);
  return Number.isFinite(size) ? size : 14;
}

function getNextFontSize(entry, direction) {
  const current = getCurrentFontSize(entry);
  const fallbackIndex = FONT_STEPS.findIndex((step) => step >= current);
  const currentIndex = fallbackIndex === -1 ? FONT_STEPS.length - 1 : fallbackIndex;
  const nextIndex = Math.max(0, Math.min(FONT_STEPS.length - 1, currentIndex + direction));
  return FONT_STEPS[nextIndex];
}

function ensureToolbar() {
  let toolbar = document.getElementById("richTextBubbleMenu");
  if (toolbar) return toolbar;

  toolbar = document.createElement("div");
  toolbar.id = "richTextBubbleMenu";
  toolbar.className = "rt-bubble-menu";

  const actions = [
    {
      key: "bold",
      label: "B",
      title: "Gras",
      run: () => document.execCommand("bold"),
      active: () => document.queryCommandState("bold")
    },
    {
      key: "italic",
      label: "I",
      title: "Italique",
      run: () => document.execCommand("italic"),
      active: () => document.queryCommandState("italic")
    },
    {
      key: "underline",
      label: "U",
      title: "Souligné",
      run: () => document.execCommand("underline"),
      active: () => document.queryCommandState("underline")
    },
    {
      key: "strike",
      label: "S",
      title: "Barré",
      run: () => document.execCommand("strikeThrough"),
      active: () => document.queryCommandState("strikeThrough")
    },
    {
      key: "shrink",
      label: "A-",
      title: "Réduire",
      run: (entry) => applyFontSize(entry, getNextFontSize(entry, -1)),
      active: () => false
    },
    {
      key: "grow",
      label: "A+",
      title: "Agrandir",
      run: (entry) => applyFontSize(entry, getNextFontSize(entry, 1)),
      active: () => false
    },
    {
      key: "clear",
      label: "Tx",
      title: "Réinitialiser",
      run: (entry) => clearFormatting(entry),
      active: () => false
    }
  ];

  actions.forEach((action) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "rt-bubble-button";
    button.dataset.action = action.key;
    button.title = action.title;
    button.textContent = action.label;
    button.addEventListener("mousedown", (event) => event.preventDefault());
    button.addEventListener("click", () => {
      const entry = window.CardenveilRichText?.activeEditor;
      if (!entry || document.body?.dataset.mode === "view") return;
      focusEntry(entry);
      action.run(entry);
      normalizeEditorMarkup(entry.content);
      syncSourceFromEditor(entry);
      refreshToolbarState();
      updateToolbarPosition(entry);
    });
    toolbar.append(button);
  });

  document.body.append(toolbar);
  return toolbar;
}

function hideToolbar() {
  ensureToolbar().classList.remove("is-visible");
}

function refreshToolbarState() {
  const toolbar = ensureToolbar();
  toolbar.querySelectorAll(".rt-bubble-button").forEach((button) => {
    const action = button.dataset.action;
    const isActive =
      (action === "bold" && document.queryCommandState("bold")) ||
      (action === "italic" && document.queryCommandState("italic")) ||
      (action === "underline" && document.queryCommandState("underline")) ||
      (action === "strike" && document.queryCommandState("strikeThrough"));
    button.classList.toggle("is-active", Boolean(isActive));
  });
}

function updateToolbarPosition(entry) {
  const toolbar = ensureToolbar();
  const selection = getCurrentSelection();
  const isEditable = document.body?.dataset.mode !== "view";
  if (!entry || !selection || !isEditable) {
    hideToolbar();
    return;
  }

  const range = selection.getRangeAt(0);
  if (!entry.content.contains(range.commonAncestorContainer)) {
    hideToolbar();
    return;
  }

  const rect = range.getBoundingClientRect();
  if (!rect.width && !rect.height) {
    hideToolbar();
    return;
  }

  toolbar.style.left = `${rect.left + rect.width / 2 + window.scrollX}px`;
  toolbar.style.top = `${rect.top + window.scrollY - 12}px`;
  toolbar.classList.add("is-visible");
  refreshToolbarState();
}

function refreshMode() {
  const editable = document.body?.dataset.mode !== "view";
  editorEntries.forEach((entry) => {
    entry.content.contentEditable = editable ? "true" : "false";
    entry.shell.classList.toggle("is-readonly", !editable);
  });
  if (!editable) hideToolbar();
}

function normalizeEditorMarkup(root) {
  root.querySelectorAll('font[size]').forEach((node) => {
    const sizeMap = {
      "1": "12px",
      "2": "14px",
      "3": "16px",
      "4": "18px",
      "5": "20px",
      "6": "24px",
      "7": "28px"
    };
    const span = document.createElement("span");
    span.style.fontSize = sizeMap[node.getAttribute("size")] || "16px";
    span.innerHTML = node.innerHTML;
    node.replaceWith(span);
  });
}

function applyRangeFontSize(range, sizePx) {
  const fragment = range.extractContents();
  const span = document.createElement("span");
  span.style.fontSize = `${sizePx}px`;
  span.append(fragment);
  range.insertNode(span);

  const selection = window.getSelection();
  if (selection) {
    const nextRange = document.createRange();
    nextRange.selectNodeContents(span);
    selection.removeAllRanges();
    selection.addRange(nextRange);
  }
}

function applyFontSize(entry, sizePx) {
  const selection = getCurrentSelection();
  if (!selection) return;
  const range = selection.getRangeAt(0);
  if (!entry.content.contains(range.commonAncestorContainer)) return;

  try {
    applyRangeFontSize(range, sizePx);
  } catch (_error) {
    document.execCommand("styleWithCSS", false, true);
    document.execCommand("fontSize", false, "4");
    normalizeEditorMarkup(entry.content);
    const container = range.commonAncestorContainer.nodeType === Node.TEXT_NODE
      ? range.commonAncestorContainer.parentElement
      : range.commonAncestorContainer;
    const sizedNodes = entry.content.querySelectorAll('span[style*="font-size"]');
    sizedNodes.forEach((node) => {
      if (node.contains(container) || node === container || container?.contains?.(node)) {
        node.style.fontSize = `${sizePx}px`;
      }
    });
  }
}

function unwrapNode(node) {
  const parent = node.parentNode;
  while (node.firstChild) {
    parent.insertBefore(node.firstChild, node);
  }
  parent.removeChild(node);
}

function clearFormatting(entry) {
  document.execCommand("removeFormat");
  entry.content.querySelectorAll("span, font, b, strong, i, em, u, s, strike").forEach((node) => {
    if (!(node instanceof HTMLElement)) return;
    if (["SPAN", "FONT"].includes(node.tagName)) {
      if (node.getAttribute("style")) {
        node.removeAttribute("style");
      }
      if (!node.attributes.length) {
        unwrapNode(node);
      }
      return;
    }
    unwrapNode(node);
  });
}

function syncEditorFromSource(entry) {
  if (entry.updatingFromEditor) return;
  const nextHtml = toEditorHtml(entry.source.value, entry.mode);
  if (normalizeComparableHtml(entry.content.innerHTML) === normalizeComparableHtml(nextHtml)) {
    return;
  }
  entry.updatingFromSource = true;
  entry.content.innerHTML = nextHtml;
  entry.updatingFromSource = false;
}

function syncSourceFromEditor(entry) {
  if (entry.updatingFromSource) return;
  const nextValue = getStoredHtml(entry.content, entry.mode);
  if (entry.source.value === nextValue) return;
  entry.updatingFromEditor = true;
  entry.source.value = nextValue;
  entry.source.dispatchEvent(new Event("input", { bubbles: true }));
  entry.updatingFromEditor = false;
}

function focusEntry(entry) {
  entry.content.focus();
}

function createShell(source, mode) {
  const shell = document.createElement("div");
  shell.className = `${source.className || ""} rt-editor-shell rt-mode-${mode}`;
  shell.dataset.richTextShell = "true";

  const content = document.createElement("div");
  content.className = "rt-editor-content rt-editor-content-inner";
  content.contentEditable = document.body?.dataset.mode !== "view" ? "true" : "false";
  content.spellcheck = false;
  const placeholder = source.placeholder || "";
  if (placeholder) content.dataset.placeholder = placeholder;

  shell.append(content);
  source.before(shell);
  source.classList.add("rt-source-hidden");
  return { shell, content };
}

function enhanceSource(source) {
  if (!source.isConnected || editorEntries.has(source)) return;

  const mode = source.dataset.richTextMode === "multiline" ? "multiline" : "single";
  const { shell, content } = createShell(source, mode);

  const entry = {
    source,
    shell,
    content,
    mode,
    updatingFromEditor: false,
    updatingFromSource: false
  };

  content.innerHTML = toEditorHtml(source.value, mode);

  const handleInput = () => {
    normalizeEditorMarkup(content);
    syncSourceFromEditor(entry);
    updateToolbarPosition(entry);
  };

  const handleFocus = () => {
    window.CardenveilRichText.activeEditor = entry;
  };

  const handleBlur = () => {
    window.setTimeout(() => {
      const active = document.activeElement;
      if (!ensureToolbar().contains(active)) {
        hideToolbar();
      }
    }, 0);
  };

  const handleKeyDown = (event) => {
    if (mode === "single" && event.key === "Enter") {
      event.preventDefault();
    }
  };

  const handleMouseUp = () => updateToolbarPosition(entry);
  const handleKeyUp = () => updateToolbarPosition(entry);

  content.addEventListener("input", handleInput);
  content.addEventListener("focus", handleFocus);
  content.addEventListener("blur", handleBlur);
  content.addEventListener("keydown", handleKeyDown);
  content.addEventListener("mouseup", handleMouseUp);
  content.addEventListener("keyup", handleKeyUp);

  entry.sourceInputHandler = () => syncEditorFromSource(entry);
  source.addEventListener("input", entry.sourceInputHandler);
  source.addEventListener("richtextsync", entry.sourceInputHandler);

  editorEntries.set(source, entry);
}

function cleanupEditors() {
  editorEntries.forEach((entry, source) => {
    if (source.isConnected) return;
    source.removeEventListener("input", entry.sourceInputHandler);
    source.removeEventListener("richtextsync", entry.sourceInputHandler);
    entry.shell.remove();
    editorEntries.delete(source);
  });
}

function scanEditors() {
  cleanupEditors();
  document.querySelectorAll(EDITOR_SELECTOR).forEach((source) => {
    if (source.classList.contains("rt-source-hidden")) return;
    enhanceSource(source);
  });
  refreshMode();
}

const domObserver = new MutationObserver(() => {
  scanEditors();
});

window.CardenveilRichText = {
  activeEditor: null,
  refresh: scanEditors,
  refreshMode
};

document.addEventListener("selectionchange", () => {
  updateToolbarPosition(window.CardenveilRichText.activeEditor);
});

if (document.body) {
  domObserver.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["data-mode"]
  });
}

ensureToolbar();
scanEditors();
