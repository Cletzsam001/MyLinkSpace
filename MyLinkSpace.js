// =============================================
// MyLinkSpace - our bookmark manager
//
// The HTML and CSS (UI & Structure) were done by:
// Samuel Olaniran (Lead), Kafayah Olaniyan,
// Sulaimon Akintunde, Oladejo Aisha
//
// This JavaScript file is split into parts.
// Find your task and read your part from top to bottom.
//
//   SHARED CODE (used by all tasks)
//   TASK 2: Bookmark CRUD
//   TASK 3: LocalStorage
//   TASK 4: Search & Filters
//   TASK 5: URL & Favicon
//   TASK 6: Import & Export
//   START THE APP (at the very bottom)
// =============================================



// =============================================
// SHARED CODE (used by all tasks)
//
// This part is used by everyone. It holds the
// bookmark lists, the pop-up message, switching
// between pages, and the phone menu.
// =============================================

// The app logo (used as a backup icon for tags)
const LOGO = "https://res.cloudinary.com/crvidoqc/image/upload/v1791715087/WhatsApp_Image_2026-10-11_at_11.30.23_AM_y1omqu.jpg";

// These two lists hold all our bookmarks. Every task uses them.
let bookmarks = []; // active bookmarks
let archived = [];  // archived bookmarks

// Which page we are on: "home" or "archived"
let currentPage = "home";

// Used to hide the pop-up message after 2 seconds
let messageTimer;

// Shows a small message in the corner, then hides it
function showMessage(text) {
  const toast = document.getElementById("toast");
  toast.textContent = text;
  toast.classList.add("show");
  clearTimeout(messageTimer);
  messageTimer = setTimeout(function () {
    toast.classList.remove("show");
  }, 2200);
}

// Draws the whole screen again (sidebar + the page we are on)
function showPage() {
  showTagList(); // from Task 4

  const homeBtn = document.getElementById("homeBtn");
  const archivedBtn = document.getElementById("archivedBtn");

  if (currentPage === "home") {
    document.getElementById("homePage").hidden = false;
    document.getElementById("archivedPage").hidden = true;
    homeBtn.classList.add("active");
    archivedBtn.classList.remove("active");
    showHomePage(); // from Task 2
  } else {
    document.getElementById("homePage").hidden = true;
    document.getElementById("archivedPage").hidden = false;
    homeBtn.classList.remove("active");
    archivedBtn.classList.add("active");
    showArchivedPage(); // from Task 2
  }
}

// Moves to another page and clears the search
function goToPage(page) {
  currentPage = page;
  searchText = "";      // from Task 4
  selectedTag = "All";  // from Task 4
  document.getElementById("searchInput").value = "";
  closeMenu();
  showPage();
}

// Opens the sidebar menu on phones
function openMenu() {
  document.getElementById("sidebar").classList.add("open");
  document.getElementById("overlay").classList.add("open");
  document.body.classList.add("menu-open"); // stop the page behind from scrolling
}

// Closes the sidebar menu on phones
function closeMenu() {
  document.getElementById("sidebar").classList.remove("open");
  document.getElementById("overlay").classList.remove("open");
  document.body.classList.remove("menu-open");
}

// Connect the page and menu buttons
document.getElementById("homeBtn").addEventListener("click", function () {
  goToPage("home");
});
document.getElementById("archivedBtn").addEventListener("click", function () {
  goToPage("archived");
});
document.getElementById("openMenuBtn").addEventListener("click", openMenu);
document.getElementById("closeMenuBtn").addEventListener("click", closeMenu);
document.getElementById("overlay").addEventListener("click", closeMenu);

// If the screen gets wide (phone turned sideways, window resized),
// close the phone menu so it doesn't stay stuck open
window.addEventListener("resize", function () {
  if (window.innerWidth > 760) {
    closeMenu();
  }
});

// Pressing the Escape key closes the form and the phone menu
document.addEventListener("keydown", function (event) {
  if (event.key === "Escape") {
    closeForm(); // from Task 2
    closeMenu();
  }
});

// END OF SHARED CODE



// =============================================
// TASK 2: BOOKMARK CRUD
// Done by: Patrick Chukwudi
//
// CRUD means Create, Read, Update, Delete.
// This part lets you:
//   - see your bookmarks as cards (Read)
//   - add a new bookmark (Create)
//   - edit a bookmark (Update)
//   - delete a bookmark (Delete)
//   - archive and restore bookmarks
// =============================================

// null means we are adding a new bookmark.
// If it has an id, we are editing that bookmark.
let editingId = null;

// Makes a unique id for each new bookmark
function makeId() {
  return Date.now() + "-" + Math.floor(Math.random() * 100000);
}

// Gets today's date like "2026-10-13"
function getTodayDate() {
  const today = new Date();
  let month = today.getMonth() + 1;
  let day = today.getDate();
  if (month < 10) month = "0" + month;
  if (day < 10) day = "0" + day;
  return today.getFullYear() + "-" + month + "-" + day;
}

// Changes "2025-04-12" into "Apr 12, 2025"
function formatDate(dateText) {
  const date = new Date(dateText + "T00:00:00");
  // if the date is broken, don't show "Invalid Date"
  if (isNaN(date.getTime())) {
    return "Date unavailable";
  }
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// Finds a bookmark by its id
function findBookmark(id) {
  for (let i = 0; i < bookmarks.length; i++) {
    if (bookmarks[i].id === id) {
      return bookmarks[i];
    }
  }
  return null;
}

// ----- READ: show the bookmarks -----

// Builds one bookmark card
function createCard(bookmark) {
  const card = document.createElement("article");
  card.className = "card";

  // The website icon comes from Task 5
  const icon = makeSiteIcon(bookmark);

  const category = document.createElement("span");
  category.className = "category";
  category.textContent = bookmark.category;

  const title = document.createElement("h3");
  title.textContent = bookmark.title;

  const site = document.createElement("div");
  site.className = "url";
  site.textContent = getWebsiteName(bookmark.url); // from Task 5

  const description = document.createElement("p");
  description.className = "description";
  description.textContent = bookmark.description || "No description added.";

  // show up to 4 tags
  const tagBox = document.createElement("div");
  tagBox.className = "tags";
  for (let i = 0; i < bookmark.tags.length && i < 4; i++) {
    const tag = document.createElement("span");
    tag.className = "tag";
    tag.textContent = bookmark.tags[i];
    tagBox.appendChild(tag);
  }

  // Edit, Archive and Delete buttons
  const actions = document.createElement("div");
  actions.className = "card-actions";

  const editBtn = document.createElement("button");
  editBtn.className = "small-btn";
  editBtn.textContent = "Edit";
  editBtn.addEventListener("click", function () {
    openForm(bookmark);
  });

  const archiveBtn = document.createElement("button");
  archiveBtn.className = "small-btn";
  archiveBtn.textContent = "Archive";
  archiveBtn.addEventListener("click", function () {
    archiveBookmark(bookmark.id);
  });

  const deleteBtn = document.createElement("button");
  deleteBtn.className = "small-btn danger";
  deleteBtn.textContent = "Delete";
  deleteBtn.addEventListener("click", function () {
    deleteBookmark(bookmark.id);
  });

  actions.appendChild(editBtn);
  actions.appendChild(archiveBtn);
  actions.appendChild(deleteBtn);

  // bottom row: open link button and the date
  const bottom = document.createElement("div");
  bottom.className = "card-bottom";

  const openBtn = document.createElement("button");
  openBtn.className = "open-link";
  openBtn.textContent = "Open link ↗";
  openBtn.addEventListener("click", function () {
    // "noopener" stops the other website from controlling our page
    window.open(bookmark.url, "_blank", "noopener");
  });

  const date = document.createElement("span");
  date.className = "date";
  date.textContent = formatDate(bookmark.createdAt);

  bottom.appendChild(openBtn);
  bottom.appendChild(date);

  // put the whole card together
  card.appendChild(icon);
  card.appendChild(category);
  card.appendChild(title);
  card.appendChild(site);
  card.appendChild(description);
  card.appendChild(tagBox);
  card.appendChild(actions);
  card.appendChild(bottom);

  return card;
}

// Shows the home page with all the bookmark cards
function showHomePage() {
  const list = getVisibleBookmarks(); // from Task 4 (search + filter)
  const grid = document.getElementById("bookmarkGrid");
  const emptyMessage = document.getElementById("emptyMessage");

  // page heading
  if (searchText.trim() !== "") {
    document.getElementById("homeTitle").textContent = 'Search results for "' + searchText.trim() + '"';
  } else {
    document.getElementById("homeTitle").textContent = "All bookmarks";
  }
  document.getElementById("totalCount").textContent = "(" + list.length + ")";

  if (selectedTag === "All") {
    document.getElementById("filterLabel").textContent = "Your saved links";
  } else {
    document.getElementById("filterLabel").textContent = "Filtered by " + selectedTag;
  }

  // clear the old cards and draw new ones
  grid.innerHTML = "";
  for (let i = 0; i < list.length; i++) {
    grid.appendChild(createCard(list[i]));
  }

  // if there is nothing to show, show the empty message instead
  if (list.length === 0) {
    grid.hidden = true;
    emptyMessage.hidden = false;
    if (searchText.trim() !== "" || selectedTag !== "All") {
      document.getElementById("emptyTitle").textContent = "Nothing matched your search";
      document.getElementById("emptyText").textContent = "Try another search or clear your filter.";
    } else {
      document.getElementById("emptyTitle").textContent = "No bookmarks yet";
      document.getElementById("emptyText").textContent = "Start adding your favorite links to keep them all in one place.";
    }
  } else {
    grid.hidden = false;
    emptyMessage.hidden = true;
  }
}

// Shows the archived page
function showArchivedPage() {
  const list = document.getElementById("archivedList");
  list.innerHTML = "";

  if (archived.length === 1) {
    document.getElementById("archivedSubtitle").textContent = "1 archived bookmark";
  } else {
    document.getElementById("archivedSubtitle").textContent = archived.length + " archived bookmarks";
  }

  document.getElementById("restoreAllBtn").hidden = archived.length === 0;
  document.getElementById("archivedEmpty").hidden = archived.length > 0;

  for (let i = 0; i < archived.length; i++) {
    const bookmark = archived[i];

    const row = document.createElement("div");
    row.className = "archive-row";

    const info = document.createElement("div");
    info.className = "grow";
    const title = document.createElement("h3");
    title.textContent = bookmark.title;
    const site = document.createElement("p");
    site.textContent = getWebsiteName(bookmark.url); // from Task 5
    info.appendChild(title);
    info.appendChild(site);

    // show up to 2 tags
    const tagBox = document.createElement("div");
    tagBox.className = "tags";
    for (let j = 0; j < bookmark.tags.length && j < 2; j++) {
      const tag = document.createElement("span");
      tag.className = "tag";
      tag.textContent = bookmark.tags[j];
      tagBox.appendChild(tag);
    }

    const restoreBtn = document.createElement("button");
    restoreBtn.className = "btn";
    restoreBtn.textContent = "Restore";
    restoreBtn.addEventListener("click", function () {
      restoreBookmark(bookmark.id);
    });

    row.appendChild(makeSiteIcon(bookmark)); // website icon from Task 5
    row.appendChild(info);
    row.appendChild(tagBox);
    row.appendChild(restoreBtn);
    list.appendChild(row);
  }
}

// ----- CREATE and UPDATE: the add/edit form -----

// Opens the form. If we pass a bookmark, we are editing it.
function openForm(bookmark) {
  const form = document.getElementById("bookmarkForm");

  if (bookmark) {
    // editing: fill the form with the bookmark's details
    editingId = bookmark.id;
    document.getElementById("modalTitle").textContent = "Edit Bookmark";
    document.getElementById("title").value = bookmark.title;
    document.getElementById("url").value = bookmark.url;
    document.getElementById("description").value = bookmark.description;
    document.getElementById("category").value = bookmark.category;
    document.getElementById("tags").value = bookmark.tags.join(", ");
  } else {
    // adding: start with an empty form
    editingId = null;
    document.getElementById("modalTitle").textContent = "Add Bookmark";
    form.reset();
  }

  // suggest categories we have already used
  const categoryList = document.getElementById("categoryList");
  categoryList.innerHTML = "";
  const categories = [];
  for (let i = 0; i < bookmarks.length; i++) {
    if (!categories.includes(bookmarks[i].category)) {
      categories.push(bookmarks[i].category);
    }
  }
  for (let i = 0; i < categories.length; i++) {
    const option = document.createElement("option");
    option.value = categories[i];
    categoryList.appendChild(option);
  }

  showTagPreview();
  document.getElementById("bookmarkModal").classList.remove("hidden");
}

// Closes the form and clears it
function closeForm() {
  document.getElementById("bookmarkModal").classList.add("hidden");
  document.getElementById("bookmarkForm").reset();
  document.getElementById("tagPreview").innerHTML = "";
  editingId = null;
}

// Reads the tags box. "css, html, css" becomes ["css", "html"] (max 8 tags)
function readTagsFromInput() {
  const pieces = document.getElementById("tags").value.split(",");
  const tags = [];
  for (let i = 0; i < pieces.length; i++) {
    const tag = pieces[i].trim();
    if (tag !== "" && !tags.includes(tag) && tags.length < 8) {
      tags.push(tag);
    }
  }
  return tags;
}

// Shows the tags as little bubbles while you type
function showTagPreview() {
  const preview = document.getElementById("tagPreview");
  preview.innerHTML = "";
  const tags = readTagsFromInput();
  for (let i = 0; i < tags.length; i++) {
    const tag = document.createElement("span");
    tag.className = "tag";
    tag.textContent = tags[i];
    preview.appendChild(tag);
  }
}

// Runs when you click "Save Bookmark"
function saveBookmark(event) {
  event.preventDefault(); // stop the page from reloading

  const title = document.getElementById("title").value.trim();
  const url = document.getElementById("url").value.trim();
  const description = document.getElementById("description").value.trim();
  const category = document.getElementById("category").value.trim();
  const tags = readTagsFromInput();

  // check the form before saving
  if (title === "" || category === "") {
    showMessage("Title and category are required");
    return;
  }
  if (!isValidUrl(url)) { // from Task 5
    showMessage("Please enter a valid URL starting with http:// or https://");
    return;
  }
  if (urlAlreadySaved(url, editingId)) { // from Task 5
    showMessage("A bookmark with this URL already exists.");
    return;
  }

  if (editingId === null) {
    // CREATE: add a new bookmark to the front of the list
    const newBookmark = {
      id: makeId(),
      title: title,
      url: url,
      description: description,
      category: category,
      tags: tags,
      createdAt: getTodayDate()
    };
    bookmarks.unshift(newBookmark);
  } else {
    // UPDATE: change the bookmark we are editing
    const bookmark = findBookmark(editingId);
    if (bookmark === null) {
      showMessage("This bookmark no longer exists.");
      closeForm();
      return;
    }
    bookmark.title = title;
    bookmark.url = url;
    bookmark.description = description;
    bookmark.category = category;
    bookmark.tags = tags;
  }

  // remember if we were adding or editing before closing the form
  const wasEditing = editingId !== null;
  closeForm();
  showPage();

  // saveData() is from Task 3. It tells us if saving worked.
  if (saveData()) {
    if (wasEditing) {
      showMessage("Bookmark updated");
    } else {
      showMessage("Bookmark saved");
    }
  }
}

// ----- DELETE -----

// Deletes a bookmark forever (asks first)
function deleteBookmark(id) {
  const bookmark = findBookmark(id);
  if (bookmark === null) {
    return; // it was already deleted
  }
  const sure = confirm('Delete "' + bookmark.title + '"? This cannot be undone.');
  if (!sure) {
    return;
  }

  bookmarks = bookmarks.filter(function (b) {
    return b.id !== id;
  });

  showPage();
  if (saveData()) { // from Task 3
    showMessage("Bookmark deleted");
  }
}

// ----- ARCHIVE and RESTORE -----

// Moves a bookmark into the archive
function archiveBookmark(id) {
  for (let i = 0; i < bookmarks.length; i++) {
    if (bookmarks[i].id === id) {
      const bookmark = bookmarks[i];
      bookmarks.splice(i, 1);     // take it out of the active list
      archived.unshift(bookmark); // put it in the archive
      break;
    }
  }
  showPage();
  if (saveData()) {
    showMessage("Bookmark archived");
  }
}

// Moves one bookmark back from the archive
function restoreBookmark(id) {
  for (let i = 0; i < archived.length; i++) {
    if (archived[i].id === id) {
      const bookmark = archived[i];
      archived.splice(i, 1);
      bookmarks.unshift(bookmark);
      break;
    }
  }
  showPage();
  if (saveData()) {
    showMessage("Bookmark restored");
  }
}

// Moves everything back from the archive
function restoreAll() {
  bookmarks = archived.concat(bookmarks);
  archived = [];
  showPage();
  if (saveData()) {
    showMessage("All bookmarks restored");
  }
}

// Connect the buttons for Task 2
document.getElementById("addBtn").addEventListener("click", function () {
  openForm(null);
});
document.getElementById("emptyAddBtn").addEventListener("click", function () {
  openForm(null);
});
document.getElementById("bookmarkForm").addEventListener("submit", saveBookmark);
document.getElementById("cancelBtn").addEventListener("click", closeForm);
document.getElementById("closeModalBtn").addEventListener("click", closeForm);
document.getElementById("modalBg").addEventListener("click", closeForm);
document.getElementById("tags").addEventListener("input", showTagPreview);
document.getElementById("restoreAllBtn").addEventListener("click", restoreAll);

// END OF TASK 2



// =============================================
// TASK 3: LOCALSTORAGE
// Done by: Akogun Firdaoz
//
// This part saves the bookmarks in the browser,
// so they are still there when you close and
// open the page again.
// =============================================

// These bookmarks show the very first time someone opens the app
const demoBookmarks = [
  {
    id: "1",
    title: "Frontend Mentor",
    url: "https://www.frontendmentor.io",
    description: "Improve your front-end coding skills by building realistic projects.",
    category: "Practice",
    tags: ["Practice", "Learning", "Community"],
    createdAt: "2025-04-12"
  },
  {
    id: "2",
    title: "MDN Web Docs",
    url: "https://developer.mozilla.org",
    description: "Resources on HTML, CSS and JavaScript for web developers.",
    category: "Reference",
    tags: ["Reference", "HTML", "CSS"],
    createdAt: "2025-04-11"
  },
  {
    id: "3",
    title: "React Docs",
    url: "https://react.dev",
    description: "The library for web and native user interfaces.",
    category: "Framework",
    tags: ["JavaScript", "Framework", "Docs"],
    createdAt: "2025-04-10"
  },
  {
    id: "4",
    title: "Claude",
    url: "https://claude.ai",
    description: "An AI assistant created by Anthropic.",
    category: "Tools",
    tags: ["Tools", "AI", "Learning"],
    createdAt: "2025-04-09"
  },
  {
    id: "5",
    title: "Web.dev",
    url: "https://web.dev",
    description: "Guidance to build modern web experiences that work on every device.",
    category: "Learning",
    tags: ["Performance", "Learning", "Tools"],
    createdAt: "2025-04-08"
  },
  {
    id: "6",
    title: "Tailwind CSS",
    url: "https://tailwindcss.com",
    description: "A utility-first CSS framework for building custom interfaces.",
    category: "CSS",
    tags: ["CSS", "Framework", "Tools"],
    createdAt: "2025-04-07"
  }
];

// Loads the bookmarks from the browser when the page opens
function loadData() {
  try {
    const savedBookmarks = localStorage.getItem("mylinkspace-bookmarks");
    const savedArchived = localStorage.getItem("mylinkspace-archived");

    if (savedBookmarks === null) {
      // first visit: nothing saved yet, so use the demo bookmarks
      bookmarks = demoBookmarks;
      archived = [];
    } else {
      bookmarks = cleanSavedList(JSON.parse(savedBookmarks));
      archived = cleanSavedList(JSON.parse(savedArchived));
    }
  } catch (error) {
    // the saved data is broken, so use the demo bookmarks
    bookmarks = demoBookmarks;
    archived = [];
    showMessage("Saved data could not be read. Showing demo bookmarks.");
  }
}

// Makes sure a saved list really is a list of bookmarks.
// Broken bookmarks are skipped, and missing parts are filled in,
// so one bad bookmark can't crash the whole app.
function cleanSavedList(list) {
  if (!Array.isArray(list)) {
    return [];
  }
  const goodList = [];
  for (let i = 0; i < list.length; i++) {
    const b = list[i];
    // a bookmark must have a title, a link and a category
    if (!b || typeof b.title !== "string" || typeof b.url !== "string" || typeof b.category !== "string") {
      continue;
    }
    // fill in anything that is missing
    if (!Array.isArray(b.tags)) {
      b.tags = [];
    }
    if (typeof b.description !== "string") {
      b.description = "";
    }
    if (typeof b.createdAt !== "string") {
      b.createdAt = getTodayDate(); // from Task 2
    }
    if (!b.id) {
      b.id = makeId(); // from Task 2
    }
    goodList.push(b);
  }
  return goodList;
}

// Saves the bookmarks in the browser
// (we call this every time something changes).
// Gives back true if it worked, false if it didn't.
function saveData() {
  try {
    localStorage.setItem("mylinkspace-bookmarks", JSON.stringify(bookmarks));
    localStorage.setItem("mylinkspace-archived", JSON.stringify(archived));
    return true;
  } catch (error) {
    // this happens when the browser storage is full or turned off
    // (for example in some private browsing modes)
    showMessage("Could not save. Your browser storage may be full or turned off.");
    return false;
  }
}

// END OF TASK 3



// =============================================
// TASK 4: SEARCH & FILTERS
// Done by: Samuel Olaniran, Oladejo Aisha
//
// This part handles the search box, the tag list
// in the sidebar, and sorting (newest / by title).
// =============================================

let searchText = "";    // what is typed in the search box
let selectedTag = "All"; // the tag clicked in the sidebar
let sortBy = "newest";   // "newest" or "title"

// Pictures shown next to each tag in the sidebar
const tagIcons = {
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
  tools: "https://res.cloudinary.com/crvidoqc/image/upload/v1791717508/support_ooahxr.png"
};

// Returns only the bookmarks that match the search and the tag, sorted
function getVisibleBookmarks() {
  const search = searchText.toLowerCase().trim();
  const result = [];

  for (let i = 0; i < bookmarks.length; i++) {
    const b = bookmarks[i];
    // join all the words of the bookmark together so we can search them
    const allText = (b.title + " " + b.url + " " + b.description + " " + b.category + " " + b.tags.join(" ")).toLowerCase();

    const matchesSearch = search === "" || allText.includes(search);
    const matchesTag = selectedTag === "All" || b.tags.includes(selectedTag);

    if (matchesSearch && matchesTag) {
      result.push(b);
    }
  }

  // sort the list
  if (sortBy === "title") {
    result.sort(function (a, b) {
      return a.title.localeCompare(b.title);
    });
  } else {
    result.sort(function (a, b) {
      return b.createdAt.localeCompare(a.createdAt);
    });
  }

  return result;
}

// Makes a list of every tag we have used (no repeats)
function getAllTags() {
  const tags = [];
  for (let i = 0; i < bookmarks.length; i++) {
    for (let j = 0; j < bookmarks[i].tags.length; j++) {
      const tag = bookmarks[i].tags[j];
      if (!tags.includes(tag)) {
        tags.push(tag);
      }
    }
  }
  tags.sort();
  return tags;
}

// Counts how many bookmarks have a tag
function countBookmarksWithTag(tag) {
  let count = 0;
  for (let i = 0; i < bookmarks.length; i++) {
    if (bookmarks[i].tags.includes(tag)) {
      count++;
    }
  }
  return count;
}

// Draws the tag buttons in the sidebar
function showTagList() {
  const tagList = document.getElementById("tagList");
  tagList.innerHTML = "";

  // if the chosen tag is gone (its bookmarks were deleted, archived
  // or edited), go back to showing "All"
  if (selectedTag !== "All" && !getAllTags().includes(selectedTag)) {
    selectedTag = "All";
  }

  const tags = ["All"].concat(getAllTags());

  for (let i = 0; i < tags.length; i++) {
    const tag = tags[i];

    const button = document.createElement("button");
    button.className = "nav-link";
    if (currentPage === "home" && tag === selectedTag) {
      button.classList.add("active");
    }

    const icon = document.createElement("img");
    icon.className = "tag-icon";
    icon.src = tagIcons[tag.toLowerCase()] || LOGO;
    icon.alt = "";

    const name = document.createElement("span");
    name.textContent = tag;

    const count = document.createElement("span");
    count.className = "count";
    if (tag === "All") {
      count.textContent = bookmarks.length;
    } else {
      count.textContent = countBookmarksWithTag(tag);
    }

    button.appendChild(icon);
    button.appendChild(name);
    button.appendChild(count);

    // clicking a tag shows only bookmarks with that tag
    button.addEventListener("click", function () {
      selectedTag = tag;
      currentPage = "home";
      closeMenu();
      showPage();
    });

    tagList.appendChild(button);
  }

  document.getElementById("archivedCount").textContent = archived.length;
}

// Connect the search box and sort menu for Task 4
document.getElementById("searchInput").addEventListener("input", function () {
  searchText = document.getElementById("searchInput").value;
  showHomePage();
});
document.getElementById("sortSelect").addEventListener("change", function () {
  sortBy = document.getElementById("sortSelect").value;
  showHomePage();
});

// END OF TASK 4



// =============================================
// TASK 5: URL & FAVICON
// Done by: Immanuel Oyelami, Emmanuel Henshaw
//
// This part checks that links are correct,
// stops the same link from being saved twice,
// and shows each website's little icon (favicon).
// =============================================

// Checks that the link is a proper web address
function isValidUrl(url) {
  // must start with http:// or https://
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    return false;
  }
  // links can't have spaces in them
  if (url.includes(" ")) {
    return false;
  }
  // there must be a website name after http:// (so "https://" alone is not allowed)
  return getWebsiteName(url) !== "";
}

// Changes "https://www.example.com/page" into "example.com"
function getWebsiteName(url) {
  return url
    .replace("https://", "")
    .replace("http://", "")
    .replace("www.", "")
    .split("/")[0]
    .split("?")[0]
    .split("#")[0];
}

// Makes two links easy to compare.
// "https://example.com/" and "https://example.com" count as the same link.
function cleanUrl(url) {
  if (url.endsWith("/")) {
    return url.slice(0, -1);
  }
  return url;
}

// Checks if a link is already saved (in active or archived)
// ignoreId is the bookmark we are editing, so it doesn't match itself
function urlAlreadySaved(url, ignoreId) {
  const everything = bookmarks.concat(archived);
  for (let i = 0; i < everything.length; i++) {
    if (cleanUrl(everything[i].url) === cleanUrl(url) && everything[i].id !== ignoreId) {
      return true;
    }
  }
  return false;
}

// Makes the small website icon box for a card.
// If the icon can't load, it shows the first letter of the title.
function makeSiteIcon(bookmark) {
  const iconBox = document.createElement("div");
  iconBox.className = "site-icon";

  const favicon = document.createElement("img");
  // use the same start as the bookmark's link (http:// or https://).
  // Using https:// for an http:// site caused the SSL error in the console.
  let start = "https://";
  if (bookmark.url.startsWith("http://")) {
    start = "http://";
  }
  favicon.src = start + getWebsiteName(bookmark.url) + "/favicon.ico";
  favicon.alt = "";

  // Some websites don't allow their icon to be shown on other sites,
  // or don't have one. Then we show the first letter of the title.
  // (The red "favicon.ico" errors in the console for those sites are normal.)
  favicon.onerror = function () {
    iconBox.textContent = bookmark.title.charAt(0).toUpperCase() || "?";
  };

  iconBox.appendChild(favicon);
  return iconBox;
}

// END OF TASK 5



// =============================================
// TASK 6: IMPORT & EXPORT
// Done by: Jacob John Okon, Oluwaseun Dorcas Adesola
//
// This part lets you download all your bookmarks
// as a backup file (Export), and load them back
// from a backup file (Import).
// =============================================

// Downloads all bookmarks as a .json file
function exportBookmarks() {
  const data = { bookmarks: bookmarks, archived: archived };
  const file = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(file);
  link.download = "mylinkspace-backup.json";
  document.body.appendChild(link); // some browsers need the link on the page
  link.click();
  link.remove();
  // free up the memory used by the file after a moment
  setTimeout(function () {
    URL.revokeObjectURL(link.href);
  }, 1000);
  showMessage("Backup exported");
}

// Adds bookmarks from a backup, skipping broken ones and repeats.
// Returns how many were added.
function addImported(list, destination) {
  if (!Array.isArray(list)) {
    return 0;
  }
  let added = 0;
  for (let i = 0; i < list.length; i++) {
    const item = list[i];
    // skip bookmarks that are missing a title, category or good link
    if (!item || typeof item.title !== "string" || typeof item.category !== "string" || typeof item.url !== "string") {
      continue;
    }
    if (item.title.trim() === "" || item.category.trim() === "" || !isValidUrl(item.url)) {
      continue;
    }
    // skip links we already have
    if (urlAlreadySaved(item.url, null)) {
      continue;
    }
    // only keep tags that are words, and at most 8
    const tags = [];
    if (Array.isArray(item.tags)) {
      for (let j = 0; j < item.tags.length && tags.length < 8; j++) {
        if (typeof item.tags[j] === "string" && item.tags[j].trim() !== "") {
          tags.push(item.tags[j].trim());
        }
      }
    }

    // the date must look like "2025-04-12", otherwise use today
    let createdAt = getTodayDate();
    if (typeof item.createdAt === "string" && item.createdAt.length === 10 && formatDate(item.createdAt) !== "Date unavailable") {
      createdAt = item.createdAt;
    }

    destination.push({
      id: makeId(),
      title: item.title.trim().slice(0, 80),
      url: item.url,
      description: typeof item.description === "string" ? item.description : "",
      category: item.category.trim().slice(0, 35),
      tags: tags,
      createdAt: createdAt
    });
    added++;
  }
  return added;
}

// Reads the backup file you picked and adds its bookmarks
function importBookmarks(event) {
  const file = event.target.files[0];
  if (!file) {
    return;
  }

  const reader = new FileReader();
  reader.onload = function () {
    try {
      const data = JSON.parse(reader.result);
      let added = 0;
      added = added + addImported(data.bookmarks, bookmarks);
      added = added + addImported(data.archived, archived);
      showPage();
      if (saveData()) {
        if (added === 0) {
          showMessage("No new bookmarks found in that file.");
        } else if (added === 1) {
          showMessage("Imported 1 bookmark");
        } else {
          showMessage("Imported " + added + " bookmarks");
        }
      }
    } catch (error) {
      showMessage("That file is not a valid MyLinkSpace backup.");
    }
    event.target.value = ""; // so you can pick the same file again
  };
  reader.readAsText(file);
}

// Connect the buttons for Task 6
document.getElementById("exportBtn").addEventListener("click", exportBookmarks);
document.getElementById("importBtn").addEventListener("click", function () {
  // clicking Import opens the hidden file picker
  document.getElementById("importFile").click();
});
document.getElementById("importFile").addEventListener("change", importBookmarks);

// END OF TASK 6



// =============================================
// START THE APP
// This must stay at the very bottom of the file,
// so everything above is ready before it runs.
// =============================================
loadData(); // from Task 3
showPage(); // from the shared code
