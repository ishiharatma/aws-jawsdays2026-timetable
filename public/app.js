(function () {
  "use strict";

  // --- Constants ---
  const COOKIE_NAME = "jawsdays2026_checked";
  const COOKIE_DAYS = 90;
  const EVENT_DATE = "2026-03-07";
  const VENUE = "池袋サンシャインシティ";
  const TIME_START = "09:00";
  const TIME_END = "19:40";
  const SLOT_MINUTES = 5;
  const CURRENT_CHECK_INTERVAL = 60000; // 1 minute
  const SCROLL_TOP_THRESHOLD = 400; // px scrolled before showing button

  // --- State ---
  let timetableData = null;
  let checkedSessions = new Set();
  let pendingChecked = new Set();
  let editMode = false;

  // --- DOM refs ---
  const timetableEl = document.getElementById("timetable");
  const editBtn = document.getElementById("edit-check-btn");
  const saveBtn = document.getElementById("save-check-btn");
  const cancelBtn = document.getElementById("cancel-check-btn");
  const modalOverlay = document.getElementById("session-modal");
  const modalCloseBtn = document.getElementById("modal-close-btn");
  const modalTrack = document.getElementById("modal-track");
  const modalTime = document.getElementById("modal-time");
  const modalTags = document.getElementById("modal-tags");
  const modalTitle = document.getElementById("modal-title");
  const modalSpeaker = document.getElementById("modal-speaker");
  const modalGcalBtn = document.getElementById("modal-gcal-btn");
  const modalProposalBtn = document.getElementById("modal-proposal-btn");
  const modalXBtn = document.getElementById("modal-x-btn");
  const scrollTopBtn = document.getElementById("scroll-top-btn");

  // --- Utility: Time ---
  function timeToMinutes(t) {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
  }

  function minutesToTime(m) {
    const h = Math.floor(m / 60);
    const min = m % 60;
    return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
  }

  function timeToRow(t) {
    return (timeToMinutes(t) - timeToMinutes(TIME_START)) / SLOT_MINUTES;
  }

  function generateTimeSlots() {
    const slots = [];
    const startMin = timeToMinutes(TIME_START);
    const endMin = timeToMinutes(TIME_END);
    for (let m = startMin; m <= endMin; m += SLOT_MINUTES) {
      slots.push(minutesToTime(m));
    }
    return slots;
  }

  // --- Utility: Cookie ---
  function getCookie(name) {
    const match = document.cookie.match(
      new RegExp("(^| )" + name + "=([^;]+)")
    );
    return match ? decodeURIComponent(match[2]) : null;
  }

  function setCookie(name, value, days) {
    const d = new Date();
    d.setTime(d.getTime() + days * 24 * 60 * 60 * 1000);
    document.cookie = `${name}=${encodeURIComponent(value)};expires=${d.toUTCString()};path=/;SameSite=Lax`;
  }

  function loadCheckedSessions() {
    const val = getCookie(COOKIE_NAME);
    if (val) {
      try {
        const arr = JSON.parse(val);
        checkedSessions = new Set(arr);
      } catch (e) {
        checkedSessions = new Set();
      }
    }
  }

  function saveCheckedSessions() {
    const arr = Array.from(checkedSessions);
    setCookie(COOKIE_NAME, JSON.stringify(arr), COOKIE_DAYS);
  }

  // --- Utility: Google Calendar ---
  function buildGoogleCalendarUrl(session) {
    const trackLabel = session.track;
    const calTitle = `【${trackLabel}】${session.title}${session.speaker ? " by " + session.speaker : ""}`;

    const dateStr = EVENT_DATE.replace(/-/g, "");
    const startStr = session.start.replace(":", "") + "00";
    const endStr = session.end.replace(":", "") + "00";

    const params = new URLSearchParams({
      action: "TEMPLATE",
      text: calTitle,
      dates: `${dateStr}T${startStr}/${dateStr}T${endStr}`,
      ctz: "Asia/Tokyo",
      location: VENUE,
      details: session.proposalUrl
        ? `Proposal: ${session.proposalUrl}`
        : "JAWS DAYS 2026",
    });
    return `https://www.google.com/calendar/render?${params.toString()}`;
  }

  // --- Utility: X (Twitter) post URL ---
  function buildXPostUrl(session) {
    const trackData = timetableData.tracks.find((t) => t.id === session.track);
    const trackHashtag = trackData ? trackData.hashtag : "";
    const hashtags = `#jawsdays2026 #jawsug ${trackHashtag}`.trim();

    let text = `${session.title}`;
    if (session.speaker) {
      text += ` by ${session.speaker}`;
    }
    text += `\n${hashtags}`;
    if (session.proposalUrl) {
      text += `\n${session.proposalUrl}`;
    }

    const params = new URLSearchParams({ text });
    return `https://x.com/intent/post?${params.toString()}`;
  }

  // --- Utility: Current time check ---
  function isSessionCurrent(session) {
    const now = new Date();

    // Check if today is the event day (in JST)
    const jstNow = new Date(
      now.toLocaleString("en-US", { timeZone: "Asia/Tokyo" })
    );
    const jstDate = `${jstNow.getFullYear()}-${String(jstNow.getMonth() + 1).padStart(2, "0")}-${String(jstNow.getDate()).padStart(2, "0")}`;

    if (jstDate !== EVENT_DATE) return false;

    const nowMin = jstNow.getHours() * 60 + jstNow.getMinutes();
    const startMin = timeToMinutes(session.start);
    const endMin = timeToMinutes(session.end);
    return nowMin >= startMin && nowMin < endMin;
  }

  // --- Utility: Get current JST time in minutes from midnight ---
  function getCurrentJSTMinutes() {
    const now = new Date();
    const jstNow = new Date(
      now.toLocaleString("en-US", { timeZone: "Asia/Tokyo" })
    );
    return jstNow.getHours() * 60 + jstNow.getMinutes();
  }

  // --- Utility: Check if today is event day ---
  function isEventDay() {
    const now = new Date();
    const jstNow = new Date(
      now.toLocaleString("en-US", { timeZone: "Asia/Tokyo" })
    );
    const jstDate = `${jstNow.getFullYear()}-${String(jstNow.getMonth() + 1).padStart(2, "0")}-${String(jstNow.getDate()).padStart(2, "0")}`;
    return jstDate === EVENT_DATE;
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  // --- Render Timetable ---
  function renderTimetable() {
    if (!timetableData) return;
    timetableEl.innerHTML = "";

    const tracks = timetableData.tracks;
    const sessions = timetableData.sessions;
    const timeSlots = generateTimeSlots();
    const totalRows = timeSlots.length;
    const numTracks = tracks.length;

    // Grid: columns = time-label + tracks
    // Grid: rows = top header + time slots + bottom header
    const colTemplate = `var(--time-col-width) repeat(${numTracks}, var(--track-width))`;
    const rowTemplate = `auto repeat(${totalRows}, var(--row-height)) auto`;
    timetableEl.style.gridTemplateColumns = colTemplate;
    timetableEl.style.gridTemplateRows = rowTemplate;

    // === Top Header Row ===
    // Corner cell (top)
    const corner = document.createElement("div");
    corner.className = "track-header";
    corner.style.gridColumn = "1";
    corner.style.gridRow = "1";
    corner.textContent = "";
    timetableEl.appendChild(corner);

    // Track headers (top)
    tracks.forEach((track, i) => {
      const th = document.createElement("div");
      th.className = "track-header";
      th.style.gridColumn = `${i + 2}`;
      th.style.gridRow = "1";
      th.innerHTML = `${track.name}<span class="track-hashtag">${track.hashtag}</span>`;
      timetableEl.appendChild(th);
    });

    // Time labels
    timeSlots.forEach((time, i) => {
      const row = i + 2; // +2 because row 1 is header
      const lbl = document.createElement("div");
      lbl.className = "time-label";
      if (time.endsWith(":00")) {
        lbl.classList.add("hour-mark");
      }
      lbl.style.gridColumn = "1";
      lbl.style.gridRow = `${row}`;
      if (time.endsWith(":00") || time.endsWith(":30")) {
        lbl.textContent = time;
      }
      timetableEl.appendChild(lbl);
    });

    // Place sessions on grid
    sessions.forEach((session) => {
      const trackIdx = tracks.findIndex((t) => t.id === session.track);
      if (trackIdx === -1) return;

      const startRow = timeToRow(session.start) + 2; // +2 for header offset
      const span = session.duration / SLOT_MINUTES;

      if (startRow < 2 || span <= 0) return;

      const cell = document.createElement("div");
      cell.className = "session-cell";
      cell.dataset.sessionId = session.id;
      cell.style.gridColumn = `${trackIdx + 2}`;
      cell.style.gridRow = `${startRow} / span ${span}`;

      // Non-session check
      const isNonSession =
        !session.proposalUrl &&
        (session.title.includes("休憩") ||
          session.title.includes("受付") ||
          session.title.includes("会場レイアウト変更") ||
          session.title.includes("オープニング") ||
          session.title.includes("キーノート"));

      if (isNonSession) {
        cell.classList.add("non-session");
      }

      // Checked state
      if (checkedSessions.has(session.id)) {
        cell.classList.add("checked");
      }

      // Current state
      if (isSessionCurrent(session)) {
        cell.classList.add("current");
      }

      // Tags HTML
      const tagsHtml =
        session.tags && session.tags.length > 0
          ? `<span class="session-tags">${session.tags.map((t) => `<span class="session-tag">${escapeHtml(t)}</span>`).join("")}</span>`
          : "";

      // Content
      cell.innerHTML = `
        <span class="session-time-label">${session.start}-${session.end}</span>
        <span class="session-title">${escapeHtml(session.title)}</span>
        ${session.speaker ? `<span class="session-speaker">${escapeHtml(session.speaker)}</span>` : ""}
        ${tagsHtml}
        <input type="checkbox" class="session-check" ${checkedSessions.has(session.id) ? "checked" : ""} data-session-id="${session.id}">
      `;

      // Click handler
      if (!isNonSession) {
        cell.addEventListener("click", (e) => {
          if (editMode) return;
          if (e.target.classList.contains("session-check")) return;
          openModal(session);
        });
      }

      timetableEl.appendChild(cell);
    });

    // === Bottom Header Row ===
    const bottomRow = totalRows + 2; // header row (1) + time slot rows + 1

    // Corner cell (bottom)
    const cornerBottom = document.createElement("div");
    cornerBottom.className = "track-header-bottom";
    cornerBottom.style.gridColumn = "1";
    cornerBottom.style.gridRow = `${bottomRow}`;
    cornerBottom.textContent = "";
    timetableEl.appendChild(cornerBottom);

    // Track headers (bottom)
    tracks.forEach((track, i) => {
      const th = document.createElement("div");
      th.className = "track-header-bottom";
      th.style.gridColumn = `${i + 2}`;
      th.style.gridRow = `${bottomRow}`;
      th.innerHTML = `${track.name}<span class="track-hashtag">${track.hashtag}</span>`;
      timetableEl.appendChild(th);
    });
  }

  // --- Modal ---
  function openModal(session) {
    modalTrack.textContent = `Track ${session.track}`;
    modalTime.textContent = `${session.start} - ${session.end} (${session.duration}min)`;
    modalTitle.textContent = session.title;
    modalSpeaker.textContent = session.speaker || "TBD";

    // Tags
    modalTags.innerHTML = "";
    if (session.tags && session.tags.length > 0) {
      session.tags.forEach((tag) => {
        const span = document.createElement("span");
        span.className = "modal-tag";
        span.textContent = tag;
        modalTags.appendChild(span);
      });
    }

    // Google Calendar link
    modalGcalBtn.href = buildGoogleCalendarUrl(session);

    // Proposal link
    if (session.proposalUrl) {
      modalProposalBtn.href = session.proposalUrl;
      modalProposalBtn.classList.remove("hidden");
    } else {
      modalProposalBtn.classList.add("hidden");
    }

    // X post link
    modalXBtn.href = buildXPostUrl(session);
    modalXBtn.classList.remove("hidden");

    modalOverlay.classList.remove("hidden");
    document.body.style.overflow = "hidden";
  }

  function closeModal() {
    modalOverlay.classList.add("hidden");
    document.body.style.overflow = "";
  }

  // --- Edit Mode ---
  function enterEditMode() {
    editMode = true;
    pendingChecked = new Set(checkedSessions);
    timetableEl.classList.add("edit-mode");
    editBtn.classList.add("hidden");
    saveBtn.classList.remove("hidden");
    cancelBtn.classList.remove("hidden");
  }

  function exitEditMode(save) {
    editMode = false;
    timetableEl.classList.remove("edit-mode");
    editBtn.classList.remove("hidden");
    saveBtn.classList.add("hidden");
    cancelBtn.classList.add("hidden");

    if (save) {
      checkedSessions = new Set(pendingChecked);
      saveCheckedSessions();
    }
    pendingChecked = new Set();
    renderTimetable();
  }

  // --- Checkbox handler (delegated) ---
  timetableEl.addEventListener("change", (e) => {
    if (!e.target.classList.contains("session-check")) return;
    const id = Number(e.target.dataset.sessionId);
    const cell = e.target.closest(".session-cell");

    if (e.target.checked) {
      pendingChecked.add(id);
      if (cell) cell.classList.add("checked");
    } else {
      pendingChecked.delete(id);
      if (cell) cell.classList.remove("checked");
    }
  });

  // --- Update "current" sessions periodically ---
  function updateCurrentSessions() {
    if (!timetableData) return;
    timetableData.sessions.forEach((session) => {
      const cell = timetableEl.querySelector(
        `.session-cell[data-session-id="${session.id}"]`
      );
      if (!cell) return;
      if (isSessionCurrent(session)) {
        cell.classList.add("current");
      } else {
        cell.classList.remove("current");
      }
    });
  }

  // --- Scroll to top button ---
  function setupScrollTopButton() {
    window.addEventListener("scroll", () => {
      if (window.scrollY > SCROLL_TOP_THRESHOLD) {
        scrollTopBtn.classList.remove("hidden");
      } else {
        scrollTopBtn.classList.add("hidden");
      }
    });

    scrollTopBtn.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  // --- Auto-scroll to current time on load ---
  function autoScrollToCurrentTime() {
    if (!timetableData) return;

    let targetMinutes;

    if (isEventDay()) {
      // On event day, scroll to current time
      targetMinutes = getCurrentJSTMinutes();
    } else {
      // Before event day, scroll to the start of sessions (10:00)
      targetMinutes = timeToMinutes("10:00");
    }

    const startMin = timeToMinutes(TIME_START);
    const targetRow = Math.max(0, (targetMinutes - startMin) / SLOT_MINUTES);

    // Find the grid row element at the target time
    const rowHeight = parseFloat(
      getComputedStyle(document.documentElement).getPropertyValue("--row-height")
    );
    const headerHeight = document.querySelector(".site-header")
      ? document.querySelector(".site-header").offsetHeight
      : 0;
    const trackHeaderHeight = document.querySelector(".track-header")
      ? document.querySelector(".track-header").offsetHeight
      : 0;
    const containerPadding = 16;

    // Calculate scroll position: header + track header + (rows * row height) - some offset for context
    const scrollTarget =
      containerPadding + trackHeaderHeight + targetRow * rowHeight - 20;

    // Smooth scroll with a short delay to ensure DOM is ready
    setTimeout(() => {
      window.scrollTo({ top: scrollTarget, behavior: "smooth" });
    }, 100);
  }

  // --- Event Listeners ---
  editBtn.addEventListener("click", enterEditMode);
  saveBtn.addEventListener("click", () => exitEditMode(true));
  cancelBtn.addEventListener("click", () => exitEditMode(false));
  modalCloseBtn.addEventListener("click", closeModal);
  modalOverlay.addEventListener("click", (e) => {
    if (e.target === modalOverlay) closeModal();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeModal();
  });

  // --- Init ---
  async function init() {
    loadCheckedSessions();
    setupScrollTopButton();

    try {
      const resp = await fetch("timetable.json");
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      timetableData = await resp.json();
    } catch (err) {
      timetableEl.innerHTML = `<p style="padding: 20px; color: red;">timetable.json の読み込みに失敗しました: ${err.message}</p>`;
      return;
    }

    renderTimetable();
    autoScrollToCurrentTime();

    // Periodically check for current sessions
    setInterval(updateCurrentSessions, CURRENT_CHECK_INTERVAL);
  }

  init();
})();
