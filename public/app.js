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

  // --- Debug Mode ---
  const isDebugMode = new URLSearchParams(window.location.search).get("mode") === "debug";

  // --- State ---
  let timetableData = null;
  let checkedSessions = new Set();
  let pendingChecked = new Set();
  let editMode = false;
  let debugDate = null; // Debug mode: virtual current date (null = use real time)
  let isViewingShared = false; // True when showing shared URL content (not own cookie data)

  // --- DOM refs ---
  const timetableEl = document.getElementById("timetable");
  const timetableContainer = document.getElementById("timetable-container");
  const siteHeader = document.querySelector(".site-header");
  const siteFooter = document.querySelector(".site-footer");
  const editBtn = document.getElementById("edit-check-btn");
  const saveBtn = document.getElementById("save-check-btn");
  const cancelBtn = document.getElementById("cancel-check-btn");
  const modalOverlay = document.getElementById("session-modal");
  const modalCloseBtn = document.getElementById("modal-close-btn");
  const modalTrack = document.getElementById("modal-track");
  const modalTime = document.getElementById("modal-time");
  const modalTags = document.getElementById("modal-tags");
  const modalTitle = document.getElementById("modal-title");
  const modalSpeakerArea = document.getElementById("modal-speaker-area");
  const modalSpeakerAvatar = document.getElementById("modal-speaker-avatar");
  const modalSpeaker = document.getElementById("modal-speaker");
  const modalGcalBtn = document.getElementById("modal-gcal-btn");
  const modalProposalBtn = document.getElementById("modal-proposal-btn");
  const modalXBtn = document.getElementById("modal-x-btn");
  const scrollTopBtn = document.getElementById("scroll-top-btn");
  const hamburgerBtn = document.getElementById("hamburger-btn");
  const headerNav = document.getElementById("header-nav");
  const shareUrlBtn = document.getElementById("share-url-btn");

  // --- Utility: Current date (debug-aware) ---
  // Returns the "current" Date. In debug mode, returns the virtual time set via UI.
  function getCurrentDate() {
    return debugDate !== null ? debugDate : new Date();
  }

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

  // --- Utility: Share URL ---
  function buildShareUrl() {
    const ids = Array.from(checkedSessions).sort((a, b) => a - b);
    const url = new URL(window.location.href);
    url.search = "";
    if (ids.length > 0) {
      url.searchParams.set("share", ids.join(","));
    }
    return url.toString();
  }

  // Returns true if share param was present in URL and applied
  function loadFromShareUrl() {
    const params = new URLSearchParams(window.location.search);
    const shareParam = params.get("share");
    if (!shareParam) return false;

    try {
      const ids = shareParam
        .split(",")
        .map(Number)
        .filter((n) => !isNaN(n) && n > 0);
      if (ids.length > 0) {
        // 共有URLがある場合は常に共有データを表示する
        // 自分のデータはCookieに保持されており、編集モード開始時に復元する
        checkedSessions = new Set(ids);
        isViewingShared = true;
        // Remove share param from URL to keep it clean
        const cleanUrl = new URL(window.location.href);
        cleanUrl.searchParams.delete("share");
        history.replaceState(null, "", cleanUrl.toString());
        return true;
      }
    } catch (e) {
      // ignore malformed params
    }
    return false;
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
    const trackHashtag = trackData ? trackData.hashtag.replace(/^#/, "") : "";
    const hashtagList = ["jawsdays2026", "jawsug", trackHashtag]
      .filter(Boolean)
      .join(",");

    let text = `${session.title}`;
    if (session.speaker) {
      text += ` by ${session.speaker}`;
    }

    const params = new URLSearchParams({ hashtags: hashtagList, text });
    if (session.proposalUrl) {
      params.set("url", session.proposalUrl);
    }
    return `https://twitter.com/intent/tweet?${params.toString()}`;
  }

  // --- Utility: Current time check ---
  function isSessionCurrent(session) {
    const now = getCurrentDate();

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
    const now = getCurrentDate();
    const jstNow = new Date(
      now.toLocaleString("en-US", { timeZone: "Asia/Tokyo" })
    );
    return jstNow.getHours() * 60 + jstNow.getMinutes();
  }

  // --- Utility: Check if today is event day ---
  function isEventDay() {
    const now = getCurrentDate();
    const jstNow = new Date(
      now.toLocaleString("en-US", { timeZone: "Asia/Tokyo" })
    );
    const jstDate = `${jstNow.getFullYear()}-${String(jstNow.getMonth() + 1).padStart(2, "0")}-${String(jstNow.getDate()).padStart(2, "0")}`;
    return jstDate === EVENT_DATE;
  }

  // --- Utility: Get event status ---
  function getEventStatus() {
    const now = getCurrentDate();
    const jstNow = new Date(
      now.toLocaleString("en-US", { timeZone: "Asia/Tokyo" })
    );
    const jstDate = `${jstNow.getFullYear()}-${String(jstNow.getMonth() + 1).padStart(2, "0")}-${String(jstNow.getDate()).padStart(2, "0")}`;

    if (jstDate < EVENT_DATE) {
      return { emoji: "🗓️", text: "開催前", key: "before" };
    } else if (jstDate > EVENT_DATE) {
      return { emoji: "✅", text: "開催終了", key: "after" };
    } else {
      const nowMin = jstNow.getHours() * 60 + jstNow.getMinutes();
      const startMin = timeToMinutes(TIME_START);
      const endMin = timeToMinutes(TIME_END);
      if (nowMin < startMin) {
        return { emoji: "🗓️", text: "開催前", key: "before" };
      } else if (nowMin >= endMin) {
        return { emoji: "✅", text: "開催終了", key: "after" };
      } else {
        return { emoji: "🎉", text: "開催中", key: "current" };
      }
    }
  }

  function updateEventStatus() {
    const statusEl = document.getElementById("event-status");
    if (!statusEl) return;
    const status = getEventStatus();
    statusEl.textContent = `${status.emoji} ${status.text}`;
    statusEl.className = `event-status event-status-${status.key}`;
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  // --- Utility: Get CSS class for tag ---
  function getTagClass(tag) {
    const t = tag.trim().toLowerCase();
    if (t === "level 200") return "level-200";
    if (t === "level 300") return "level-300";
    if (t === "level 400") return "level-400";
    return "";
  }

  // --- Utility: Group session (キーノート・懇親会・オープニング は全トラック連動) ---
  function isGroupSession(session) {
    return session.title.includes("キーノート") || session.title.includes("懇親会") || session.title.includes("オープニング");
  }

  // --- Utility: Lunch session (Track A-G, 12:00-12:15 または 12:20-12:35) ---
  function isLunchSession(session) {
    const lunchTracks = ["A", "B", "C", "D", "E", "F", "G"];
    return (
      lunchTracks.includes(session.track) &&
      ((session.start === "12:00" && session.end === "12:15") ||
        (session.start === "12:20" && session.end === "12:35"))
    );
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
      const trackHashtagList = ["jawsdays2026", "jawsug", track.hashtag.replace(/^#/, "")].filter(Boolean).join(",");
      const hashtagXUrl = `https://twitter.com/intent/tweet?hashtags=${encodeURIComponent(trackHashtagList)}`;
      th.innerHTML = `${track.name}<span class="track-hashtag"><a href="${hashtagXUrl}" target="_blank" rel="noopener">${track.hashtag}</a></span>`;
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
      lbl.dataset.time = time;
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

      // Non-session check (breaks, registration, etc.)
      // オープニング・キーノート・懇親会は選択可能なので除外
      const isNonSession =
        !session.proposalUrl &&
        (session.title.includes("休憩") ||
          session.title.includes("受付") ||
          session.title.includes("会場レイアウト変更"));

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

      // Tags HTML: ランチタグを先頭に追加し、Level/サポーターなどのタグを続ける
      const tagItems = [];
      if (isLunchSession(session)) {
        tagItems.push(`<span class="session-tag lunch-tag" aria-label="ランチセッション">🍴</span>`);
      }
      if (session.tags && session.tags.length > 0) {
        session.tags.forEach((t) => {
          const cls = getTagClass(t);
          tagItems.push(`<span class="session-tag${cls ? " " + cls : ""}">${escapeHtml(t)}</span>`);
        });
      }
      const tagsHtml = tagItems.length > 0
        ? `<span class="session-tags">${tagItems.join("")}</span>`
        : "";

      // Speaker with avatar
      let speakerHtml = "";
      if (session.speaker) {
        const avatarHtml = session.speakerImage
          ? `<img class="session-speaker-avatar" src="${escapeHtml(session.speakerImage)}" alt="${escapeHtml(session.speaker)}" loading="lazy">`
          : "";
        speakerHtml = `<span class="session-speaker">${avatarHtml}${escapeHtml(session.speaker)}</span>`;
      }

      // Checkbox - only for non-break sessions
      const checkboxHtml = !isNonSession
        ? `<input type="checkbox" class="session-check" ${checkedSessions.has(session.id) ? "checked" : ""} data-session-id="${session.id}">`
        : "";

      // Content: 時間 → タグ → タイトル → 登壇者 の順
      cell.innerHTML = `
        <span class="session-time-label">${session.start}-${session.end}</span>
        ${tagsHtml}
        <span class="session-title">${escapeHtml(session.title)}</span>
        ${speakerHtml}
        ${checkboxHtml}
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
      const trackHashtagList = ["jawsdays2026", "jawsug", track.hashtag.replace(/^#/, "")].filter(Boolean).join(",");
      const hashtagXUrl = `https://twitter.com/intent/tweet?hashtags=${encodeURIComponent(trackHashtagList)}`;
      th.innerHTML = `${track.name}<span class="track-hashtag"><a href="${hashtagXUrl}" target="_blank" rel="noopener">${track.hashtag}</a></span>`;
      timetableEl.appendChild(th);
    });
  }

  // --- Modal ---
  function openModal(session) {
    modalTrack.textContent = `Track ${session.track}`;
    modalTime.textContent = `${session.start} - ${session.end} (${session.duration}min)`;
    modalTitle.textContent = session.title;
    modalSpeaker.textContent = session.speaker || "TBD";

    // Speaker avatar in modal
    if (session.speakerImage) {
      modalSpeakerAvatar.src = session.speakerImage;
      modalSpeakerAvatar.alt = session.speaker || "";
      modalSpeakerAvatar.classList.remove("hidden");
    } else {
      modalSpeakerAvatar.src = "";
      modalSpeakerAvatar.classList.add("hidden");
    }

    // Tags with level-based CSS classes
    modalTags.innerHTML = "";
    if (session.tags && session.tags.length > 0) {
      session.tags.forEach((tag) => {
        const span = document.createElement("span");
        const cls = getTagClass(tag);
        span.className = "modal-tag" + (cls ? " " + cls : "");
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
    // 共有URLを表示中の場合は、編集モード開始時に自分のCookieデータに切り替える
    if (isViewingShared) {
      loadCheckedSessions(); // Cookieから自分のデータを再ロード
      isViewingShared = false;
      renderTimetable(); // 自分のデータで再描画してからedit-modeクラスを付ける
    }
    pendingChecked = new Set(checkedSessions);
    timetableEl.classList.add("edit-mode");
    editBtn.classList.add("hidden");
    saveBtn.classList.remove("hidden");
    cancelBtn.classList.remove("hidden");
    if (shareUrlBtn) shareUrlBtn.classList.add("hidden");
    updateBlockedSessions();
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
    if (shareUrlBtn) shareUrlBtn.classList.remove("hidden");
    renderTimetable();
    updateCurrentTimeLine();
  }

  // --- Conflict detection for attendance planning ---
  // Two sessions conflict if their time ranges overlap.
  // Standard interval overlap: targetStart < checkedEnd && checkedStart < targetEnd
  // This correctly handles all cases:
  //   - checked contains target (e.g., checked=11:00-11:50, target=11:00-11:20)
  //   - target contains checked (e.g., checked=11:00-11:20, target=11:00-11:50)
  //   - partial overlap
  //   - back-to-back sessions do NOT conflict (e.g., 11:00-11:20 and 11:20-11:40)
  function sessionConflicts(checked, target) {
    const targetStart = timeToMinutes(target.start);
    const targetEnd = timeToMinutes(target.end);
    const checkedStart = timeToMinutes(checked.start);
    const checkedEnd = timeToMinutes(checked.end);
    return targetStart < checkedEnd && checkedStart < targetEnd;
  }

  // --- Update blocked (un-checkable) sessions in edit mode ---
  function updateBlockedSessions() {
    if (!timetableData) return;
    const checkedSessionObjects = timetableData.sessions.filter(s => pendingChecked.has(s.id));

    timetableData.sessions.forEach(session => {
      const cell = timetableEl.querySelector(`.session-cell[data-session-id="${session.id}"]`);
      if (!cell) return;
      const checkbox = cell.querySelector(".session-check");
      if (!checkbox) return;

      // Already checked sessions are never blocked
      if (pendingChecked.has(session.id)) {
        cell.classList.remove("blocked");
        checkbox.disabled = false;
        return;
      }

      const isBlocked = checkedSessionObjects.some(checked => sessionConflicts(checked, session));

      if (isBlocked) {
        cell.classList.add("blocked");
        checkbox.disabled = true;
        checkbox.checked = false;
      } else {
        cell.classList.remove("blocked");
        checkbox.disabled = false;
      }
    });
  }

  // --- Checkbox handler (delegated) ---
  timetableEl.addEventListener("change", (e) => {
    if (!e.target.classList.contains("session-check")) return;
    const id = Number(e.target.dataset.sessionId);
    const cell = e.target.closest(".session-cell");
    const session = timetableData ? timetableData.sessions.find((s) => s.id === id) : null;

    if (e.target.checked) {
      pendingChecked.add(id);
      if (cell) cell.classList.add("checked");
    } else {
      pendingChecked.delete(id);
      if (cell) cell.classList.remove("checked");
    }

    // グループセッション (キーノート・懇親会) は全トラック連動で選択/解除
    if (session && isGroupSession(session)) {
      const siblings = timetableData.sessions.filter(
        (s) => s.id !== id && s.title === session.title
      );
      siblings.forEach((s) => {
        const sibCell = timetableEl.querySelector(`.session-cell[data-session-id="${s.id}"]`);
        const sibCheckbox = sibCell ? sibCell.querySelector(".session-check") : null;
        if (e.target.checked) {
          pendingChecked.add(s.id);
          if (sibCell) sibCell.classList.add("checked");
          if (sibCheckbox) sibCheckbox.checked = true;
        } else {
          pendingChecked.delete(s.id);
          if (sibCell) sibCell.classList.remove("checked");
          if (sibCheckbox) sibCheckbox.checked = false;
        }
      });
    }

    updateBlockedSessions();
  });

  // --- Current Time Line Indicator ---
  function updateCurrentTimeLine() {
    let line = timetableEl.querySelector(".current-time-line");

    // Only show on event day, within event hours
    if (!isEventDay()) {
      if (line) line.remove();
      return;
    }

    const currentMinutes = getCurrentJSTMinutes();
    const startMin = timeToMinutes(TIME_START);
    const endMin = timeToMinutes(TIME_END);

    if (currentMinutes < startMin || currentMinutes >= endMin) {
      if (line) line.remove();
      return;
    }

    // Find the base 5-min slot at or before current time
    const slotMinutes = Math.floor(currentMinutes / SLOT_MINUTES) * SLOT_MINUTES;
    const slotTime = minutesToTime(slotMinutes);
    const slotLabel = timetableEl.querySelector(`[data-time="${slotTime}"]`);

    if (!slotLabel) {
      if (line) line.remove();
      return;
    }

    // Precise sub-slot position: fraction within the 5-minute row
    const fraction = (currentMinutes % SLOT_MINUTES) / SLOT_MINUTES;
    const topPx = slotLabel.offsetTop + fraction * slotLabel.offsetHeight;

    const timeText = minutesToTime(currentMinutes);

    if (!line) {
      line = document.createElement("div");
      line.className = "current-time-line";
      line.setAttribute("aria-hidden", "true");
      const badge = document.createElement("span");
      badge.className = "current-time-badge";
      line.appendChild(badge);
      timetableEl.appendChild(line);
    }

    line.style.top = `${topPx}px`;
    const badge = line.querySelector(".current-time-badge");
    if (badge) badge.textContent = timeText;
  }

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

  // --- Detect mobile layout (body scrolls instead of timetableContainer) ---
  function isMobileLayout() {
    return window.innerWidth <= 768;
  }

  // --- Update CSS variables for fixed header/footer heights on mobile ---
  // Called on init, resize, and hamburger toggle so sticky track headers adjust correctly.
  function updateLayoutHeights() {
    if (!isMobileLayout()) return;
    if (siteHeader) {
      document.documentElement.style.setProperty(
        "--site-header-height",
        siteHeader.offsetHeight + "px"
      );
    }
    if (siteFooter) {
      document.documentElement.style.setProperty(
        "--site-footer-height",
        siteFooter.offsetHeight + "px"
      );
    }
  }

  // --- Scroll to top button ---
  function setupScrollTopButton() {
    // timetable-container handles scroll on both mobile and desktop
    function onScroll() {
      if (timetableContainer.scrollTop > SCROLL_TOP_THRESHOLD) {
        scrollTopBtn.classList.remove("hidden");
      } else {
        scrollTopBtn.classList.add("hidden");
      }
    }

    timetableContainer.addEventListener("scroll", onScroll);

    scrollTopBtn.addEventListener("click", () => {
      timetableContainer.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  // --- Hamburger menu toggle ---
  function setupHamburgerMenu() {
    if (!hamburgerBtn || !headerNav) return;

    hamburgerBtn.addEventListener("click", () => {
      const isOpen = headerNav.classList.toggle("open");
      hamburgerBtn.setAttribute("aria-expanded", isOpen ? "true" : "false");
      hamburgerBtn.setAttribute("aria-label", isOpen ? "メニューを閉じる" : "メニューを開く");

      const hamburgerIcon = hamburgerBtn.querySelector(".hamburger-icon");
      const closeIcon = hamburgerBtn.querySelector(".close-icon");
      if (hamburgerIcon) hamburgerIcon.style.display = isOpen ? "none" : "";
      if (closeIcon) closeIcon.style.display = isOpen ? "" : "none";

      // Header height changes when menu opens/closes — update CSS variables
      // so that sticky track headers and body padding adjust accordingly.
      requestAnimationFrame(updateLayoutHeights);
    });
  }

  // --- Auto-scroll to current time on load ---
  function autoScrollToCurrentTime() {
    if (!timetableData) return;

    // On non-event days, don't scroll — show from the top (9:00)
    if (!isEventDay()) return;

    // On event day, scroll to 30 minutes before current time (min: event start)
    const currentMinutes = getCurrentJSTMinutes();
    const startMin = timeToMinutes(TIME_START);
    const endMin = timeToMinutes(TIME_END);
    const targetMinutes = Math.max(startMin, currentMinutes - 30);

    // Clamp to event time range and round down to nearest slot
    const clampedMinutes = Math.max(startMin, Math.min(targetMinutes, endMin));
    const slottedMinutes = Math.floor(clampedMinutes / SLOT_MINUTES) * SLOT_MINUTES;
    const targetTime = minutesToTime(slottedMinutes);

    // Use actual DOM position for accuracy instead of manual calculation
    setTimeout(() => {
      const targetLabel = timetableEl.querySelector(`[data-time="${targetTime}"]`);
      if (!targetLabel) return;

      // timetableContainer handles scroll on both mobile and desktop
      const labelTop = targetLabel.offsetTop;
      timetableContainer.scrollTo({ top: Math.max(0, labelTop - 20), behavior: "smooth" });
    }, 100);
  }

  // --- Event Listeners ---
  editBtn.addEventListener("click", enterEditMode);
  saveBtn.addEventListener("click", () => exitEditMode(true));
  cancelBtn.addEventListener("click", () => exitEditMode(false));

  if (shareUrlBtn) {
    shareUrlBtn.addEventListener("click", () => {
      const url = buildShareUrl();
      const shareParams = new URLSearchParams({
        hashtags: "jawsdays2026,jawsug",
        text: "参加予定のセッションです！",
        url: url,
      });
      const tweetUrl = `https://twitter.com/intent/tweet?${shareParams.toString()}`;
      window.open(tweetUrl, "_blank", "noopener");
    });
  }
  modalCloseBtn.addEventListener("click", closeModal);
  modalOverlay.addEventListener("click", (e) => {
    if (e.target === modalOverlay) closeModal();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeModal();
  });

  // --- Window resize: re-measure header/footer heights for CSS variables ---
  window.addEventListener("resize", updateLayoutHeights);

  // --- Window load: re-measure after fonts/images are fully loaded ---
  // (offsetHeight at DOMContentLoaded may be off if fonts affect layout)
  window.addEventListener("load", updateLayoutHeights);

  // --- Debug Panel ---
  function setupDebugPanel() {
    if (!isDebugMode) return;

    const panel = document.createElement("div");
    panel.id = "debug-panel";
    panel.className = "debug-panel";
    panel.innerHTML = `
      <div class="debug-panel-inner">
        <span class="debug-label">🐛 デバッグモード</span>
        <label class="debug-datetime-label">
          仮想日時 (JST):
          <input type="datetime-local" id="debug-datetime" step="300">
        </label>
        <div class="debug-presets">
          <span class="debug-presets-label">プリセット:</span>
          <button class="debug-preset-btn" data-datetime="${EVENT_DATE}T08:50">開催前</button>
          <button class="debug-preset-btn" data-datetime="${EVENT_DATE}T09:05">開会直後</button>
          <button class="debug-preset-btn" data-datetime="${EVENT_DATE}T11:00">午前中</button>
          <button class="debug-preset-btn" data-datetime="${EVENT_DATE}T12:10">昼休み</button>
          <button class="debug-preset-btn" data-datetime="${EVENT_DATE}T14:00">午後</button>
          <button class="debug-preset-btn" data-datetime="${EVENT_DATE}T17:00">夕方</button>
          <button class="debug-preset-btn" data-datetime="${EVENT_DATE}T19:50">終了後</button>
          <button class="debug-preset-btn debug-preset-reset" data-datetime="">リセット (実時刻)</button>
        </div>
      </div>
    `;
    document.querySelector(".site-header").insertAdjacentElement("afterend", panel);

    const datetimeInput = document.getElementById("debug-datetime");

    function applyDebugTime(datetimeStr) {
      if (!datetimeStr) {
        debugDate = null;
        datetimeInput.value = "";
      } else {
        // datetime-local value を JST として解釈し UTC の Date に変換
        // 例: "2026-03-07T09:00" (JST) → Date.UTC(2026, 2, 7, 0, 0) (UTC+9 offset)
        const [datePart, timePart] = datetimeStr.split("T");
        const [y, mo, d] = datePart.split("-").map(Number);
        const [h, min] = timePart.split(":").map(Number);
        debugDate = new Date(Date.UTC(y, mo - 1, d, h - 9, min));
      }
      updateCurrentSessions();
      updateCurrentTimeLine();
      updateEventStatus();
      autoScrollToCurrentTime();
    }

    datetimeInput.addEventListener("change", () => {
      applyDebugTime(datetimeInput.value);
    });

    panel.querySelectorAll(".debug-preset-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const dt = btn.dataset.datetime;
        if (dt) datetimeInput.value = dt;
        applyDebugTime(dt);
      });
    });

    // デフォルト: イベント当日 09:00 JST
    datetimeInput.value = `${EVENT_DATE}T09:00`;
    applyDebugTime(`${EVENT_DATE}T09:00`);
  }

  // --- Init ---
  async function init() {
    setupDebugPanel();
    loadCheckedSessions();
    // Share URL is used only when user has no saved data (cookie)
    loadFromShareUrl();
    setupScrollTopButton();
    setupHamburgerMenu();
    updateLayoutHeights();

    try {
      const resp = await fetch("timetable.json");
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      timetableData = await resp.json();
    } catch (err) {
      timetableEl.innerHTML = `<p style="padding: 20px; color: red;">timetable.json の読み込みに失敗しました: ${err.message}</p>`;
      return;
    }

    renderTimetable();
    // Re-measure header/footer heights after render in case layout changed
    requestAnimationFrame(updateLayoutHeights);
    updateCurrentSessions(); // apply current-session highlighting immediately on load
    updateCurrentTimeLine(); // draw current time line immediately on load
    updateEventStatus();
    autoScrollToCurrentTime();

    // Periodically check for current sessions and event status
    setInterval(() => {
      updateCurrentSessions();
      updateCurrentTimeLine();
      updateEventStatus();
    }, CURRENT_CHECK_INTERVAL);
  }

  init();
})();
