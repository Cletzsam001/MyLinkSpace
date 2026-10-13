const STORAGE = "mylinkspace-bookmarks-v3";
const LEGACY_STORAGE = "bookmark-manager-interface-v2";
const LEGACY_ARCHIVED_STORAGE = `${LEGACY_STORAGE}_archived`;
const BRAND_LOGO =
  "https://res.cloudinary.com/crvidoqc/image/upload/v1791715087/WhatsApp_Image_2026-10-11_at_11.30.23_AM_y1omqu.jpg";
const seed = [
  {
    id: "1",
    title: "Frontend Mentor",
    url: "https://www.frontendmentor.io",
    description:
      "Improve your front-end coding skills by building realistic projects. Solve free web development challenges.",
    category: "Practice",
    tags: ["Practice", "Learning", "Community"],
    createdAt: "Apr 12, 2025",
  },
  {
    id: "2",
    title: "MDN Web Docs",
    url: "https://developer.mozilla.org",
    description:
      "Roughly-spanned resources on HTML, CSS and JavaScript for web developers.",
    category: "Reference",
    tags: ["Reference", "HTML", "CSS"],
    createdAt: "Apr 11, 2025",
  },
  {
    id: "3",
    title: "React Docs",
    url: "https://react.dev",
    description:
      "The library for web and native user interfaces. Learn components, hooks and more.",
    category: "Framework",
    tags: ["JavaScript", "Framework", "Docs"],
    createdAt: "Apr 10, 2025",
  },
  {
    id: "4",
    title: "Claude",
    url: "https://claude.ai",
    description:
      "An AI assistant created by Anthropic. Useful for writing, coding, research and more.",
    category: "Tools",
    tags: ["Tools", "AI", "Learning"],
    createdAt: "Apr 09, 2025",
  },
  {
    id: "5",
    title: "Web.dev",
    url: "https://web.dev",
    description:
      "Guidance to build modern web experiences that work on every device.",
    category: "Learning",
    tags: ["Performance", "Learning", "Tools"],
    createdAt: "Apr 08, 2025",
  },
  {
    id: "6",
    title: "Tailwind CSS",
    url: "https://tailwindcss.com",
    description:
      "A utility-first CSS framework for rapidly building custom interfaces.",
    category: "CSS",
    tags: ["CSS", "Framework", "Tools"],
    createdAt: "Apr 07, 2025",
  },
];
const TAG_ICON_SOURCES = {
  all: "https://res.cloudinary.com/crvidoqc/image/upload/v1791712737/tag_d5ztrc.png",
  ai: "https://res.cloudinary.com/crvidoqc/image/upload/v1791717724/artificial-intelligence_1_spzbwo.png",
  css: "https://res.cloudinary.com/crvidoqc/image/upload/v1791713328/cascading-style-sheets_flpv7t.png",
  community: "https://res.cloudinary.com/crvidoqc/image/upload/v1791713327/group_oei4si.png",
  docs: "https://res.cloudinary.com/crvidoqc/image/upload/v1791713326/google-docs_y0yckx.png",
  framework: "https://res.cloudinary.com/crvidoqc/image/upload/v1791717629/program_hrwkxs.png",
  html: "https://res.cloudinary.com/crvidoqc/image/upload/v1791727560/css-3_bmaf2x.png",
  javascript: "https://res.cloudinary.com/crvidoqc/image/upload/v1791713323/java-script_wrnid8.png",
  learning: "https://res.cloudinary.com/crvidoqc/image/upload/v1791717725/library_jcdp7z.png",
  performance: "https://res.cloudinary.com/crvidoqc/image/upload/v1791713322/performance_odue5t.png",
  practice: "https://res.cloudinary.com/crvidoqc/image/upload/v1791713322/target_bvcmaq.png",
  reference: "https://res.cloudinary.com/crvidoqc/image/upload/v1791717508/audit_1_yw1vqj.png",
  tools: "https://res.cloudinary.com/crvidoqc/image/upload/v1791717508/support_ooahxr.png",
};

let storageNotice = "";
let recoverySnapshot = null;
let toastTimer;
let confirmResolver = null;
let previousConfirmFocus = null;
const initialState = readState();
let bookmarks = initialState.bookmarks;
let archived = initialState.archived;
let page = "home",
  search = "",
  activeTag = "All",
  editingId = null,
  sortMode = "newest";


const $ = (id) => document.getElementById(id);
const sections = document.querySelectorAll("[data-page-section]");

function makeId(usedIds = new Set()) {
  let id;
  do {
    id =
      globalThis.crypto?.randomUUID?.() ||
      `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  } while (usedIds.has(id));
  return id;
}
function localDateKey(date = new Date()) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}
function normalizeUrl(value) {
  if (typeof value !== "string") return null;
  try {
    const parsed = new URL(value.trim());
    return ["http:", "https:"].includes(parsed.protocol) ? parsed.href : null;
  } catch {
    return null;
  }
}
function normalizeBookmark(record, usedIds, strict = false) {
  const invalid = (message) => {
    if (strict) throw new Error(message);
    return null;
  };
  if (!record || typeof record !== "object" || Array.isArray(record)) {
    return invalid("A bookmark entry is malformed.");
  }
  const title = typeof record.title === "string" ? record.title.trim() : "";
  const category =
    typeof record.category === "string" ? record.category.trim() : "";
  const url = normalizeUrl(record.url);
  if (!title || !category || !url) {
    return invalid("Each bookmark needs a title, category, and HTTP(S) URL.");
  }
  if (strict && (title.length > 80 || category.length > 35)) {
    throw new Error("A bookmark title or category exceeds the allowed length.");
  }
  if (record.description != null && typeof record.description !== "string") {
    return invalid("Bookmark descriptions must be text.");
  }
  if (record.tags != null && !Array.isArray(record.tags)) {
    return invalid("Bookmark tags must be a list.");
  }
  if (strict && (record.tags || []).length > 8) {
    throw new Error("A bookmark cannot contain more than 8 tags.");
  }
  if (
    strict &&
    record.createdAt != null &&
    record.createdAt !== "" &&
    typeof record.createdAt !== "string"
  ) {
    throw new Error("Bookmark creation dates must be text.");
  }
  const tags = [];
  const tagKeys = new Set();
  for (const tag of record.tags || []) {
    if (typeof tag !== "string") {
      if (strict) throw new Error("Bookmark tags must contain text only.");
      continue;
    }
    const trimmed = tag.trim();
    const key = trimmed.toLowerCase();
    if (trimmed && !tagKeys.has(key)) {
      tags.push(trimmed);
      tagKeys.add(key);
    }
  }
  const rawCreatedAt = record.createdAt || new Date();
  let createdAt;
  if (typeof rawCreatedAt === "string" && /^\d{4}-\d{2}-\d{2}$/.test(rawCreatedAt)) {
    const [year, month, day] = rawCreatedAt.split("-").map(Number);
    createdAt = new Date(year, month - 1, day);
    if (
      createdAt.getFullYear() !== year ||
      createdAt.getMonth() !== month - 1 ||
      createdAt.getDate() !== day
    ) {
      createdAt = new Date(NaN);
    }
  } else {
    createdAt = new Date(rawCreatedAt);
  }
  if (Number.isNaN(createdAt.getTime())) {
    if (strict && record.createdAt) {
      throw new Error("A bookmark has an invalid creation date.");
    }
    createdAt = new Date();
  }
  const createdAtKey = localDateKey(createdAt);
  const proposedId = typeof record.id === "string" ? record.id.trim() : "";
  const id = proposedId && !usedIds.has(proposedId) ? proposedId : makeId(usedIds);
  usedIds.add(id);
  return {
    id,
    title,
    url,
    description: record.description || "",
    category,
    tags,
    createdAt: createdAtKey,
  };
}
function normalizeCollections(activeSource, archivedSource, strict = false) {
  const usedIds = new Set();
  let invalidCount = 0;
  const normalizeList = (source) => {
    if (!Array.isArray(source)) {
      if (strict) throw new Error("The backup must contain bookmark lists.");
      invalidCount += 1;
      return [];
    }
    const normalized = [];
    for (const record of source) {
      const bookmark = normalizeBookmark(record, usedIds, strict);
      if (bookmark) normalized.push(bookmark);
      else invalidCount += 1;
    }
    return normalized;
  };
  const normalizedBookmarks = normalizeList(activeSource);
  const normalizedArchived = normalizeList(archivedSource);
  return {
    bookmarks: normalizedBookmarks,
    archived: normalizedArchived,
    invalidCount,
  };
}
function readState() {
  let savedSnapshot = null;
  try {
    savedSnapshot = localStorage.getItem(STORAGE);
    if (savedSnapshot !== null) {
      try {
        const parsed = JSON.parse(savedSnapshot);
        if (
          !parsed ||
          !Array.isArray(parsed.bookmarks) ||
          !Array.isArray(parsed.archived)
        ) {
          throw new Error("Saved data has an unsupported structure.");
        }
        const normalized = normalizeCollections(
          parsed.bookmarks,
          parsed.archived,
        );
        if (normalized.invalidCount) {
          recoverySnapshot = savedSnapshot;
          storageNotice = "Some invalid saved bookmarks were skipped.";
        }
        return normalized;
      } catch {
        recoverySnapshot = savedSnapshot;
        throw new Error("Saved data could not be read.");
      }
    }
    const legacySnapshot = localStorage.getItem(LEGACY_STORAGE);
    if (legacySnapshot === null) return normalizeCollections(seed, []);
    let legacyBookmarks;
    try {
      legacyBookmarks = JSON.parse(legacySnapshot);
    } catch {
      recoverySnapshot = legacySnapshot;
      throw new Error("Older saved data could not be read.");
    }
    if (!Array.isArray(legacyBookmarks)) {
      recoverySnapshot = legacySnapshot;
      throw new Error("Older saved data has an unsupported structure.");
    }
    let legacyArchived = [];
    const archivedSnapshot = localStorage.getItem(LEGACY_ARCHIVED_STORAGE);
    if (archivedSnapshot !== null) {
      try {
        const parsedArchived = JSON.parse(archivedSnapshot);
        if (Array.isArray(parsedArchived)) {
          legacyArchived = parsedArchived;
        } else {
          throw new Error("Invalid archived list.");
        }
      } catch {
        recoverySnapshot = JSON.stringify({
          bookmarks: legacySnapshot,
          archived: archivedSnapshot,
        });
        storageNotice = "Older archived data could not be read.";
      }
    }
    const normalized = normalizeCollections(legacyBookmarks, legacyArchived);
    if (normalized.invalidCount) {
      recoverySnapshot = JSON.stringify({
        bookmarks: legacySnapshot,
        archived: archivedSnapshot,
      });
      storageNotice = "Some invalid saved bookmarks were skipped.";
    }
    return normalized;
  } catch {
    if (!storageNotice) {
      storageNotice = "Saved data could not be read; showing demo bookmarks.";
    }
    return normalizeCollections(seed, []);
  }
}
function persistState(nextBookmarks, nextArchived) {
  try {
    if (recoverySnapshot !== null) {
      const recoveryKey = `${STORAGE}-recovery`;
      if (localStorage.getItem(recoveryKey) === null) {
        localStorage.setItem(recoveryKey, recoverySnapshot);
      }
    }
    localStorage.setItem(
      STORAGE,
      JSON.stringify({ version: 1, bookmarks: nextBookmarks, archived: nextArchived }),
    );
    recoverySnapshot = null;
    return true;
  } catch {
    return false;
  }
}
function commitState(nextBookmarks, nextArchived, successMessage) {
  if (!persistState(nextBookmarks, nextArchived)) {
    toast("Could not save changes to this browser's local storage.");
    return false;
  }
  bookmarks = nextBookmarks;
  archived = nextArchived;
  render();
  if (successMessage) toast(successMessage);
  return true;
}
function cats() {
  return [...new Set(bookmarks.map((x) => x.category).filter(Boolean))].sort();
}
function allTags() {
  return [...new Set(bookmarks.flatMap((x) => x.tags || []))].sort();
}
function host(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}
function formatDate(value) {
  let date;
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split("-").map(Number);
    date = new Date(year, month - 1, day);
  } else {
    date = new Date(value);
  }
  if (Number.isNaN(date.getTime())) return "Date unavailable";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
}
function favicon(url) {
  try {
    return new URL(url).origin + "/favicon.ico";
  } catch {
    return "";
  }
}
function setPage(next) {
  page = next;
  search = "";
  activeTag = "All";
  $("bookmarkFilter").value = "";
  closeDrawer();
  render();
}
function render() {
  renderNavigation();
  sections.forEach((s) => (s.hidden = s.dataset.pageSection !== page));
  if (page === "home") renderHome();
  if (page === "archived") renderArchived();
  updateActiveNavigation();
}
function renderNavigation() {
  const nav = $("tagNavigation");
  nav.replaceChildren();
  const counts = {};
  bookmarks.forEach((b) =>
    (b.tags || []).forEach((t) => (counts[t] = (counts[t] || 0) + 1)),
  );
  ["All", ...allTags()].slice(0, 14).forEach((tag) => {
    const b = document.createElement("button");
    b.className = "nav-link tag-nav";
    b.dataset.tag = tag;
    b.type = "button";
    const icon = document.createElement("span");
    icon.className = "tag-icon";
    const imageSource = TAG_ICON_SOURCES[tag.toLowerCase()];
    if (imageSource) {
      const image = document.createElement("img");
      image.src = imageSource;
      image.alt = "";
      icon.appendChild(image);
    } else {
      const image = document.createElement("img");
      image.src = BRAND_LOGO;
      image.alt = "";
      icon.appendChild(image);
    }
    const label = document.createTextNode(tag);
    const count = document.createElement("span");
    count.className = "count";
    count.textContent = tag === "All" ? bookmarks.length : counts[tag] || 0;
    b.append(icon, label, count);
    b.addEventListener("click", () => {
      page = "home";
      activeTag = tag;
      closeDrawer();
      render();
    });
    nav.appendChild(b);
  });
  $("archivedCount").textContent = archived.length;
}
function updateActiveNavigation() {
  document
    .querySelectorAll("[data-page]")
    .forEach((b) => b.classList.toggle("active", b.dataset.page === page));
  document
    .querySelectorAll("[data-tag]")
    .forEach((b) =>
      b.classList.toggle(
        "active",
        page === "home" && b.dataset.tag === activeTag,
      ),
    );
}
function filtered() {
  const q = search.toLowerCase().trim();
  const list = bookmarks.filter(
    (b) =>
      (!q ||
        [b.title, b.url, b.description, b.category, ...(b.tags || [])]
          .join(" ")
          .toLowerCase()
          .includes(q)) &&
      (activeTag === "All" || (b.tags || []).includes(activeTag)),
  );
  if (sortMode === "title") {
    list.sort((a, b) => a.title.localeCompare(b.title));
  } else {
    list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
  return list;
}
function renderHome() {
  const list = filtered(),
    grid = $("bookmarkGrid");
  const normalizedSearch = search.trim();
  grid.replaceChildren();
  $("resultTotal").textContent = `(${list.length})`;
  $("homeTitle").childNodes[0].nodeValue = normalizedSearch
    ? `Search results for “${normalizedSearch}” `
    : "All bookmarks ";
  $("resultLabel").textContent =
    activeTag !== "All" ? `Filtered by ${activeTag}` : "Your saved links";
  list.forEach(addCard);
  const empty = !list.length;
  $("homeEmpty").hidden = !empty;
  $("bookmarkGrid").hidden = empty;
  if (empty) {
    $("emptyTitle").textContent =
      normalizedSearch || activeTag !== "All"
        ? "Nothing matched your search"
        : "No bookmarks yet";
    $("emptyText").textContent =
      normalizedSearch || activeTag !== "All"
        ? "Try another search or clear your filter."
        : "Start adding your favorite links to keep them all in one place.";
  }
}
function addCard(b) {
  const node = $("bookmarkCardTemplate").content.cloneNode(true),
    card = node.querySelector(".card"),
    img = node.querySelector(".site-favicon"),
    letter = node.querySelector(".site-letter");
  card.dataset.id = b.id;
  node.querySelector("[data-category]").textContent = b.category;
  node.querySelector("[data-title]").textContent = b.title;
  node.querySelector("[data-url]").textContent = host(b.url);
  node.querySelector("[data-description]").textContent =
    b.description || "No description added.";
  node.querySelector("[data-date]").textContent = formatDate(b.createdAt);
  node.querySelector("[data-menu]").dataset.menu = b.id;
  node.querySelector("[data-open]").dataset.open = b.id;
  img.src = favicon(b.url);
  img.onerror = () => {
    img.hidden = true;
    letter.hidden = false;
    letter.textContent = (b.title || "?")[0];
  };
  const tags = node.querySelector("[data-tags]");
  (b.tags || []).slice(0, 4).forEach((t) => {
    const s = document.createElement("span");
    s.className = "tag";
    s.textContent = t;
    tags.appendChild(s);
  });
  $("bookmarkGrid").appendChild(node);
}
function renderArchived() {
  const list = $("archivedList");
  list.replaceChildren();
  $("archivedSubtitle").textContent =
    `${archived.length} archived bookmark${archived.length === 1 ? "" : "s"}`;
  $("restoreAll").hidden = !archived.length;
  $("archivedEmpty").hidden = !!archived.length;
  archived.forEach((b) => {
    const node = $("archiveRowTemplate").content.cloneNode(true);
    node.querySelector("[data-title]").textContent = b.title;
    node.querySelector("[data-url]").textContent = host(b.url);
    node.querySelector("[data-restore]").dataset.restore = b.id;
    (b.tags || []).slice(0, 2).forEach((t) => {
      const s = document.createElement("span");
      s.className = "tag";
      s.textContent = t;
      node.querySelector("[data-tags]").appendChild(s);
    });
    $("archivedList").appendChild(node);
  });
}
function openModal(b = null) {
  editingId = b?.id || null;
  $("modalTitle").textContent = b ? "Edit Bookmark" : "Add Bookmark";
  $("bookmarkId").value = b?.id || "";
  $("title").value = b?.title || "";
  $("url").value = b?.url || "";
  $("description").value = b?.description || "";
  $("category").value = b?.category || "";
  $("tags").value = b?.tags?.join(", ") || "";
  $("categoryList").replaceChildren(
    ...cats().map((c) => {
      const o = document.createElement("option");
      o.value = c;
      return o;
    }),
  );
  renderSelectedTags();
  $("bookmarkModal").classList.remove("hidden");
}
function closeModal() {
  $("bookmarkModal").classList.add("hidden");
  $("bookmarkForm").reset();
  editingId = null;
  $("selectedTags").replaceChildren();
}
function showConfirmation({ title, message, confirmText = "Confirm" }) {
  if (confirmResolver) closeConfirmation(false);
  previousConfirmFocus = document.activeElement;
  $("confirmTitle").textContent = title;
  $("confirmMessage").textContent = message;
  $("confirmAction").textContent = confirmText;
  $("confirmModal").classList.remove("hidden");
  $("confirmCancel").focus();
  return new Promise((resolve) => {
    confirmResolver = resolve;
  });
}
function closeConfirmation(confirmed) {
  if (!confirmResolver) return;
  const resolve = confirmResolver;
  confirmResolver = null;
  $("confirmModal").classList.add("hidden");
  resolve(confirmed);
  if (previousConfirmFocus?.isConnected) previousConfirmFocus.focus();
  previousConfirmFocus = null;
}
function renderSelectedTags() {
  $("selectedTags").replaceChildren(
    ...$("tags")
      .value.split(",")
      .map((x) => x.trim())
      .filter(Boolean)
      .slice(0, 8)
      .map((x) => {
        const s = document.createElement("span");
        s.className = "tag";
        s.textContent = x;
        return s;
      }),
  );
}
function archive(id) {
  const b = bookmarks.find((x) => x.id === id);
  if (!b) return;
  commitState(
    bookmarks.filter((x) => x.id !== id),
    [b, ...archived],
    "Bookmark archived",
  );
}
function restore(id) {
  const b = archived.find((x) => x.id === id);
  if (!b) return;
  commitState(
    [b, ...bookmarks],
    archived.filter((x) => x.id !== id),
    "Bookmark restored",
  );
}
function openBookmark(id) {
  const b = bookmarks.find((x) => x.id === id);
  if (b) window.open(b.url, "_blank", "noopener,noreferrer");
}
function cardMenu(id, button) {
  document.querySelectorAll(".quick-menu").forEach((x) => x.remove());
  const b = bookmarks.find((x) => x.id === id);
  if (!b) return;
  const menu = document.createElement("div");
  menu.className = "quick-menu flex flex-col";
  [
    {
      type: "edit",
      label: "Edit",
      icon: "https://res.cloudinary.com/crvidoqc/image/upload/v1791718241/edit_sfvobp.png",
    },
    {
      type: "archive",
      label: "Archive",
      icon: "https://res.cloudinary.com/crvidoqc/image/upload/v1791718241/archive_y9bkdx.png",
    },
    {
      type: "delete",
      label: "Delete",
      icon: "https://res.cloudinary.com/crvidoqc/image/upload/v1791718241/delete_ocugeu.png",
    },
  ].forEach(({ type, label, icon }) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "flex";
    const content = document.createElement("span");
    content.className = "flex items-center gap-2";
    const image = document.createElement("img");
    image.src = icon;
    image.alt = "";
    image.className = "w-[15px] h-[15px]";
    content.append(image, document.createTextNode(label));
    btn.appendChild(content);
    btn.addEventListener("click", async () => {
      menu.remove();
      if (type === "edit") openModal(b);
      if (type === "archive") archive(id);
      if (
        type === "delete" &&
        (await showConfirmation({
          title: "Delete bookmark?",
          message: `“${b.title}” will be permanently removed. This action cannot be undone.`,
          confirmText: "Delete",
        }))
      ) {
        commitState(
          bookmarks.filter((x) => x.id !== id),
          archived,
          "Bookmark deleted",
        );
      }
    });
    menu.appendChild(btn);
  });
  document.body.appendChild(menu);
  const r = button.getBoundingClientRect();
  menu.style.top = `${r.bottom + 5}px`;
  menu.style.left = `${Math.max(8, r.right - 125)}px`;
  setTimeout(
    () =>
      document.addEventListener("click", () => menu.remove(), { once: true }),
    0,
  );
}
function exportData() {
  const blob = new Blob([JSON.stringify({ bookmarks, archived }, null, 2)], {
      type: "application/json",
    }),
    a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "mylinkspace-backup.json";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 0);
  toast("Backup exported");
}
async function importData(file) {
  if (!file) return;
  try {
    const parsed = JSON.parse(await file.text());
    if (
      !parsed ||
      typeof parsed !== "object" ||
      !Array.isArray(parsed.bookmarks) ||
      !Array.isArray(parsed.archived)
    ) {
      throw new Error("Choose a MyLinkSpace JSON backup with bookmark lists.");
    }
    const imported = normalizeCollections(
      parsed.bookmarks,
      parsed.archived,
      true,
    );
    const existingUrls = new Set(
      [...bookmarks, ...archived]
        .map((bookmark) => normalizeUrl(bookmark.url))
        .filter(Boolean),
    );
    const nextBookmarks = [...bookmarks];
    const nextArchived = [...archived];
    const usedIds = new Set(
      [...nextBookmarks, ...nextArchived].map((bookmark) => bookmark.id),
    );
    let added = 0;
    const appendImported = (source, destination) => {
      for (const bookmark of source) {
        const normalizedUrl = normalizeUrl(bookmark.url);
        if (!normalizedUrl || existingUrls.has(normalizedUrl)) continue;
        existingUrls.add(normalizedUrl);
        const id = usedIds.has(bookmark.id) ? makeId(usedIds) : bookmark.id;
        usedIds.add(id);
        destination.push({ ...bookmark, id });
        added += 1;
      }
    };
    appendImported(imported.bookmarks, nextBookmarks);
    appendImported(imported.archived, nextArchived);
    if (
      !commitState(
        nextBookmarks,
        nextArchived,
        `Imported ${added} bookmark${added === 1 ? "" : "s"}`,
      )
    ) {
      return;
    }
  } catch (error) {
    const message =
      error instanceof SyntaxError
        ? "The selected file is not valid JSON."
        : error instanceof Error
          ? error.message
          : "The backup could not be imported.";
    toast(message);
  } finally {
    $("importFile").value = "";
  }
}
function toast(msg) {
  const t = $("toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("show"), 2200);
}
function closeDrawer() {
  $("sidebar").classList.remove("open");
  $("drawerOverlay").classList.remove("open");
  document.body.classList.remove("drawer-open");
}
function toggleDrawer(open) {
  $("sidebar").classList.toggle("open", open);
  $("drawerOverlay").classList.toggle("open", open);
  document.body.classList.toggle("drawer-open", open);
}
$("addBtn").addEventListener("click", () => openModal());
$("emptyAdd").addEventListener("click", () => openModal());
$("exportBtn").addEventListener("click", exportData);
$("importBtn").addEventListener("click", () => $("importFile").click());
$("importFile").addEventListener("change", (e) => importData(e.target.files[0]));
$("confirmCancel").addEventListener("click", () => closeConfirmation(false));
$("confirmAction").addEventListener("click", () => closeConfirmation(true));
document
  .querySelectorAll("[data-confirm-close]")
  .forEach((element) =>
    element.addEventListener("click", () => closeConfirmation(false)),
  );
$("mobileMenu").addEventListener("click", () =>
  toggleDrawer(!$("sidebar").classList.contains("open")),
);
$("sidebarClose").addEventListener("click", closeDrawer);
$("drawerOverlay").addEventListener("click", closeDrawer);
document
  .querySelectorAll("[data-close]")
  .forEach((x) => x.addEventListener("click", closeModal));
$("tags").addEventListener("input", renderSelectedTags);
$("sort").addEventListener("change", (e) => {
  sortMode = e.target.value;
  renderHome();
});
$("bookmarkFilter").addEventListener("input", (e) => {
  search = e.target.value;
  renderHome();
});
$("restoreAll").addEventListener("click", () => {
  if (!archived.length) return;
  commitState([...archived, ...bookmarks], [], "All bookmarks restored");
});
document.addEventListener("click", (e) => {
  const open = e.target.closest("[data-open]");
  if (open) openBookmark(open.dataset.open);
  const menu = e.target.closest("[data-menu]");
  if (menu) {
    e.stopPropagation();
    cardMenu(menu.dataset.menu, menu);
  }
  const restoreBtn = e.target.closest("[data-restore]");
  if (restoreBtn) restore(restoreBtn.dataset.restore);
});
document
  .querySelectorAll("[data-page]")
  .forEach((b) => b.addEventListener("click", () => setPage(b.dataset.page)));
$("bookmarkForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const url = normalizeUrl($("url").value);
  if (!url) {
    toast("Please enter a valid URL");
    return;
  }
  const data = {
    title: $("title").value.trim(),
    url,
    description: $("description").value.trim(),
    category: $("category").value.trim(),
    tags: [],
  };
  const seenTags = new Set();
  for (const rawTag of $("tags").value.split(",")) {
    const tag = rawTag.trim();
    const key = tag.toLowerCase();
    if (tag && !seenTags.has(key) && data.tags.length < 8) {
      seenTags.add(key);
      data.tags.push(tag);
    }
  }
  if (!data.title || !data.category) {
    toast("Title and category are required");
    return;
  }
  const existing = editingId
    ? bookmarks.find((bookmark) => bookmark.id === editingId)
    : null;
  if (editingId && !existing) {
    toast("This bookmark no longer exists.");
    closeModal();
    render();
    return;
  }
  const duplicate = [...bookmarks, ...archived].some(
    (item) =>
      item.id !== existing?.id &&
      normalizeUrl(item.url) === data.url,
  );
  if (duplicate) {
    toast("A bookmark with this URL already exists.");
    return;
  }
  const bookmark = {
    id:
      existing?.id ||
      makeId(new Set([...bookmarks, ...archived].map((item) => item.id))),
    ...data,
    createdAt: existing?.createdAt || localDateKey(),
  };
  const nextBookmarks = existing
    ? bookmarks.map((item) => (item.id === existing.id ? bookmark : item))
    : [bookmark, ...bookmarks];
  if (
    commitState(
      nextBookmarks,
      archived,
      existing ? "Bookmark updated" : "Bookmark saved",
    )
  ) {
    closeModal();
  }
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    closeConfirmation(false);
    closeModal();
    document.querySelectorAll(".quick-menu").forEach((x) => x.remove());
    closeDrawer();
  }
});
$("bookmarkFilter").value = "";
render();
if (storageNotice) toast(storageNotice);
window.addEventListener("pageshow", () => {
  $("bookmarkFilter").value = "";
  search = "";
  renderHome();
});
