(() => {
  "use strict";

  const STORAGE_KEY = "kagefuda-desktop-v1";
  const CORRECT_NUMBER = "031711310417";
  const TASKBAR_GAP = 74;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const qs = (selector, root = document) => root.querySelector(selector);
  const qsa = (selector, root = document) => [...root.querySelectorAll(selector)];

  const defaultState = {
    activeConversation: "hayase",
    customMessages: { hayase: [], inventory: [], archive: [] },
    unread: { hayase: 1, inventory: 1, archive: 0 },
    callSolved: false,
    hintLevel: 0,
    recentCalls: [],
    notes: {},
    notifications: [
      {
        id: "handoff",
        app: "エクスプローラー",
        title: "未送信の引継ぎメモがあります",
        body: "00_夜間引継ぎ_未送信.txt",
        action: "explorerWindow",
        time: "03:16"
      },
      {
        id: "line",
        app: "LINE",
        title: "早瀬 真琴",
        body: "四回鳴るまで、切らないで。",
        action: "lineWindow",
        time: "03:17"
      }
    ]
  };

  function cloneDefaultState() {
    return JSON.parse(JSON.stringify(defaultState));
  }

  function loadState() {
    const fallback = cloneDefaultState();
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      if (!saved || typeof saved !== "object") return fallback;
      return {
        ...fallback,
        ...saved,
        customMessages: { ...fallback.customMessages, ...(saved.customMessages || {}) },
        unread: { ...fallback.unread, ...(saved.unread || {}) },
        notes: { ...fallback.notes, ...(saved.notes || {}) },
        notifications: Array.isArray(saved.notifications) ? saved.notifications : fallback.notifications,
        recentCalls: Array.isArray(saved.recentCalls) ? saved.recentCalls.slice(0, 8) : []
      };
    } catch (_error) {
      return fallback;
    }
  }

  const state = loadState();
  let saveTimer = 0;
  function persist(immediate = false) {
    const write = () => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch (_error) {
        // The experience remains usable when storage is disabled.
      }
    };
    window.clearTimeout(saveTimer);
    if (immediate) write();
    else saveTimer = window.setTimeout(write, 120);
  }

  const files = {
    handoff: {
      title: "00_夜間引継ぎ_未送信.txt",
      modified: "2026/07/10 03:16",
      size: "1 KB",
      content: [
        "夜間担当へ（未送信）",
        "",
        "第七码頭から戻った三点は、どれも同じ時刻で止まっていた。",
        "銀時計、入退室記録、録音機。",
        "",
        "保管室の内線は十二桁。普通の電話番号ではない。",
        "止まった時刻／存在しない日付／録音機のLOT番号",
        "各四桁を、その順に続けること。",
        "",
        "呼び出し音は四回。四回目より前に切ってはいけない。",
        "応答した声に名前を訊かれても、答えないこと。",
        "",
        "――早瀬"
      ].join("\r\n")
    },
    inspection: {
      title: "第七码頭_回収資料.txt",
      modified: "2026/07/10 02:58",
      size: "2 KB",
      content: [
        "第七码頭　回収資料一覧",
        "",
        "K-12　銀時計　　　　　　　停止 03:17",
        "K-13　入退室記録端末　　　　最終記録 03:17",
        "K-14　オープンリール録音機　LOT 0417",
        "",
        "回収日欄：1998/11/31",
        "※暦上に存在しない日付。原本どおり転記。",
        "※録音機は影札オークションの出品記録と照合中。"
      ].join("\r\n")
    },
    audioSummary: {
      title: "音声検査_要約.txt",
      modified: "2026/07/10 03:08",
      size: "1 KB",
      content: [
        "音声検査 要約 / K-14",
        "",
        "媒体：オープンリール",
        "LOT：0417",
        "収録時間：不明（カウンター 03:17 で固定）",
        "",
        "無音部分に周期的な呼出音を検出。",
        "波形は四周期ごとに、話者不明の音声へ切り替わる。",
        "人名への応答は禁止。原音は内線アーカイブへ隔離済み。"
      ].join("\r\n")
    },
    "deleted-call": {
      title: "削除済み通話記録.log",
      modified: "1998/11/31 03:17",
      size: "0 KB",
      content: [
        "KFA LINE CACHE / RECOVERED FRAGMENT",
        "",
        "OUT : 0317-****-0417",
        "RING: 4",
        "DEST: ARCHIVE_EXTENSION",
        "",
        "[注記] 中央四桁は回収日。",
        "       その日は暦に存在しない。",
        "",
        "DELETE REQUESTED BY: HAYASE_M",
        "DELETE STATUS: FAILED"
      ].join("\r\n")
    }
  };

  const conversations = {
    hayase: {
      name: "早瀬 真琴",
      avatar: "早",
      status: "最終アクセス 03:17",
      preview: "四回鳴るまで、切らないで。",
      time: "03:17",
      messages: [
        { kind: "date", text: "7月10日（木）" },
        { from: "them", text: "まだ端末を見てる？", time: "02:41" },
        { from: "them", text: "第七码頭から戻った録音機を探して。影札の出品記録に残ってるはず。", time: "02:43" },
        { from: "me", text: "保管室の内線が分からない", time: "02:45", read: true },
        { from: "them", text: "番号は『止まったもの／存在しないもの／戻ったもの』。全部四桁。", time: "02:46" },
        { from: "them", text: "四回鳴るまで、切らないで。声が出ても返事はしないで。", time: "03:17" }
      ]
    },
    inventory: {
      name: "夜間棚卸（3）",
      avatar: "夜",
      status: "メンバー 3人",
      preview: "端末の最終記録も03:17です",
      time: "03:12",
      messages: [
        { kind: "date", text: "7月10日（木）" },
        { from: "them", author: "坂井", text: "銀時計、また03:17で止まっています。電池交換しても同じ。", time: "03:03" },
        { from: "them", author: "室井", text: "入退室端末の最終記録も03:17です。以降のログがありません。", time: "03:08" },
        { from: "them", author: "坂井", text: "回収日が11月31日になってる。そんな日はないですよね？", time: "03:12" }
      ]
    },
    archive: {
      name: "影札 保管室",
      avatar: "影",
      status: "公式アカウント",
      preview: "観測記録への接続を確認しました",
      time: "昨日",
      messages: [
        { kind: "date", text: "昨日" },
        { from: "them", text: "影札保管室の自動応答です。落札資料は公開目録から照合してください。", time: "22:10" },
        { from: "them", text: "観測記録への接続を確認しました。欠番を見つけても、受取人の名を読み上げないでください。", time: "22:11" },
        { from: "them", text: "公開目録と観測記録を開くことができます。", time: "22:11", actions: [
          { label: "影札オークションを開く", route: "index.html" },
          { label: "観測記録を開く", route: "observer.html" }
        ] }
      ]
    }
  };

  const transcript = [
    "[回線接続 / ARCHIVE 07]",
    "四回目まで、待てたんですね。",
    "この回線は、一九九八年十一月三十一日、午前三時十七分に閉鎖されました。",
    "それでも聞こえているなら、あなたはもう目録の中にいます。",
    "録音機。銀時計。入退室記録。",
    "三つが止まった時刻を、影札の観測記録へ入力してください。コロンはいりません。",
    "欠番が現れても、受取人の名前は声に出さないで。",
    "この通話は録音されていません。これは、録音です。",
    "あなたの後ろの椅子は、最初からありましたか。",
    "四脚です。受取済みです。"
  ];

  function createSvg(symbol) {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    const use = document.createElementNS("http://www.w3.org/2000/svg", "use");
    use.setAttribute("href", `#${symbol}`);
    svg.append(use);
    return svg;
  }

  function make(tag, className, text) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
  }

  let toastTimer = 0;
  function toast(message, duration = 2800) {
    const element = qs("[data-desktop-toast]");
    if (!element) return;
    element.textContent = message;
    element.classList.add("show");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => element.classList.remove("show"), duration);
  }

  // --- Window manager ----------------------------------------------------
  const desktop = qs("#desktop");
  const windows = qsa(".os-window");
  let zIndex = 30;

  function updateTaskbar() {
    qsa("[data-task]").forEach((button) => {
      const win = document.getElementById(button.dataset.task);
      const running = Boolean(win && win.dataset.hasOpened === "true");
      const visible = Boolean(win && !win.hidden);
      button.classList.toggle("running", running);
      button.classList.toggle("active", visible && win.classList.contains("is-focused"));
      button.setAttribute("aria-pressed", String(visible));
    });
  }

  function focusWindow(win) {
    if (!win || win.hidden) return;
    windows.forEach((item) => item.classList.remove("is-focused"));
    win.classList.add("is-focused");
    zIndex += 1;
    win.style.zIndex = String(zIndex);
    updateTaskbar();
  }

  function openWindow(id) {
    if (id === "searchDirect") {
      navigateBrowser("search.html");
      return;
    }
    if (id === "auctionDirect") {
      navigateBrowser("index.html");
      return;
    }
    if (id === "observerDirect") {
      navigateBrowser("observer.html");
      return;
    }
    const win = document.getElementById(id);
    if (!win) return;
    win.hidden = false;
    win.dataset.hasOpened = "true";
    win.classList.remove("is-minimized");
    focusWindow(win);
    closeFlyouts();
    if (id === "lineWindow") window.setTimeout(() => qs("[data-message-input]")?.focus(), 80);
  }

  function closeWindow(win) {
    if (!win) return;
    if (win.id === "lineWindow" && currentCall) endCall();
    win.hidden = true;
    win.classList.remove("is-focused", "is-minimized");
    updateTaskbar();
  }

  function minimizeWindow(win) {
    if (!win) return;
    win.classList.add("is-minimized");
    win.hidden = true;
    updateTaskbar();
  }

  function maximizeWindow(win) {
    if (!win) return;
    win.classList.toggle("is-maximized");
    win.dataset.maximized = String(win.classList.contains("is-maximized"));
    focusWindow(win);
  }

  windows.forEach((win) => {
    win.addEventListener("pointerdown", () => focusWindow(win));
    qs("[data-minimize]", win)?.addEventListener("click", () => minimizeWindow(win));
    qs("[data-maximize]", win)?.addEventListener("click", () => maximizeWindow(win));
    qs("[data-close]", win)?.addEventListener("click", () => closeWindow(win));
    qs("[data-drag-handle]", win)?.addEventListener("dblclick", (event) => {
      if (!event.target.closest("button")) maximizeWindow(win);
    });
  });

  qsa("[data-open]").forEach((button) => {
    button.addEventListener("click", () => {
      const id = button.dataset.open;
      const win = document.getElementById(id);
      if (button.matches("[data-task]") && win && !win.hidden && win.classList.contains("is-focused")) {
        minimizeWindow(win);
      } else {
        openWindow(id);
      }
    });
  });

  qsa("[data-drag-handle]").forEach((handle) => {
    handle.addEventListener("pointerdown", (event) => {
      if (event.button !== 0 || event.target.closest("button") || window.innerWidth <= 760) return;
      const win = handle.closest(".os-window");
      if (!win || win.classList.contains("is-maximized")) return;
      const rect = win.getBoundingClientRect();
      const originX = event.clientX;
      const originY = event.clientY;
      let latestX = rect.left;
      let latestY = rect.top;
      win.style.left = `${rect.left}px`;
      win.style.top = `${rect.top}px`;
      win.style.right = "auto";
      win.style.bottom = "auto";
      win.style.transform = "none";
      win.classList.add("is-dragging");
      handle.setPointerCapture?.(event.pointerId);

      const move = (moveEvent) => {
        latestX = Math.min(
          Math.max(rect.left + moveEvent.clientX - originX, 0),
          Math.max(window.innerWidth - rect.width, 0)
        );
        latestY = Math.min(
          Math.max(rect.top + moveEvent.clientY - originY, 0),
          Math.max(window.innerHeight - TASKBAR_GAP - 42, 0)
        );
        win.style.left = `${latestX}px`;
        win.style.top = `${latestY}px`;
      };
      const end = () => {
        win.classList.remove("is-dragging");
        handle.removeEventListener("pointermove", move);
        handle.removeEventListener("pointerup", end);
        handle.removeEventListener("pointercancel", end);
      };
      handle.addEventListener("pointermove", move);
      handle.addEventListener("pointerup", end);
      handle.addEventListener("pointercancel", end);
    });
  });

  // --- Start menu, tray, clock, notifications ----------------------------
  const startMenu = qs("#startMenu");
  const notificationPanel = qs("#notificationPanel");
  const startButton = qs("#startButton");
  const trayButton = qs("#trayButton");

  function closeFlyouts(except) {
    if (except !== startMenu && startMenu) startMenu.hidden = true;
    if (except !== notificationPanel && notificationPanel) notificationPanel.hidden = true;
    startButton?.classList.toggle("active", Boolean(startMenu && !startMenu.hidden));
    trayButton?.classList.toggle("active", Boolean(notificationPanel && !notificationPanel.hidden));
  }

  startButton?.addEventListener("click", (event) => {
    event.stopPropagation();
    const willOpen = startMenu.hidden;
    closeFlyouts(willOpen ? startMenu : null);
    startMenu.hidden = !willOpen;
    startButton.classList.toggle("active", willOpen);
  });

  trayButton?.addEventListener("click", (event) => {
    event.stopPropagation();
    const willOpen = notificationPanel.hidden;
    closeFlyouts(willOpen ? notificationPanel : null);
    notificationPanel.hidden = !willOpen;
    trayButton.classList.toggle("active", willOpen);
  });

  document.addEventListener("pointerdown", (event) => {
    if (!event.target.closest("#startMenu, #startButton, #notificationPanel, #trayButton")) closeFlyouts();
  });

  qs("[data-power]")?.addEventListener("click", () => {
    closeFlyouts();
    toast("この端末は遠隔保管中のため、電源を切断できません。", 4200);
  });

  function renderNotifications() {
    const container = qs("[data-notifications]");
    if (!container) return;
    container.replaceChildren();
    if (!state.notifications.length) {
      container.append(make("p", "empty-notifications", "新しい通知はありません"));
      return;
    }
    state.notifications.forEach((notification) => {
      const button = make("article", "notification");
      button.tabIndex = 0;
      button.setAttribute("role", "button");
      const head = make("span", "notification-head");
      head.append(make("b", "", notification.app), make("time", "", notification.time));
      button.append(head, make("strong", "", notification.title), make("p", "", notification.body));
      const activate = () => {
        if (notification.action) openWindow(notification.action);
      };
      button.addEventListener("click", activate);
      button.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          activate();
        }
      });
      container.append(button);
    });
  }

  qs("[data-clear-notifications]")?.addEventListener("click", () => {
    state.notifications = [];
    persist();
    renderNotifications();
  });

  let clockGlitchUntil = 0;
  let clockFlip = false;
  function updateClock() {
    const now = new Date();
    const isGlitching = Date.now() < clockGlitchUntil;
    clockFlip = !clockFlip;
    const time = isGlitching && clockFlip
      ? "03:17"
      : new Intl.DateTimeFormat("ja-JP", { hour: "2-digit", minute: "2-digit", hour12: false }).format(now);
    const date = isGlitching && !clockFlip
      ? "1998/11/31"
      : `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, "0")}/${String(now.getDate()).padStart(2, "0")}`;
    qsa("[data-task-time]").forEach((element) => { element.textContent = time; });
    qsa("[data-task-date]").forEach((element) => { element.textContent = date; });
    const dateLong = new Intl.DateTimeFormat("ja-JP", { year: "numeric", month: "long", day: "numeric" }).format(now);
    const dayLong = new Intl.DateTimeFormat("ja-JP", { weekday: "long" }).format(now);
    const calendarDate = qs("[data-calendar-date]");
    const calendarDay = qs("[data-calendar-day]");
    if (calendarDate) calendarDate.textContent = dateLong;
    if (calendarDay) calendarDay.textContent = dayLong;
  }

  // --- Browser -----------------------------------------------------------
  const browserFrame = qs("#browserFrame");
  const browserAddress = qs(".browser-address input");
  const browserTitle = qs("#browserTitle");

  function normalizeRoute(route) {
    const value = String(route || "index.html").replace(/^\/+/, "");
    const allowed = /^[a-z0-9_-]+\.html(?:[?#].*)?$/i;
    return allowed.test(value) ? value : "index.html";
  }

  function navigateBrowser(route) {
    openWindow("browserWindow");
    if (!browserFrame) return;
    const safeRoute = normalizeRoute(route);
    browserFrame.src = safeRoute;
    if (browserAddress) browserAddress.value = `kagefuda.local/${safeRoute}`;
  }

  qs("[data-browser-home]")?.addEventListener("click", () => navigateBrowser("search.html"));
  qs("[data-browser-reload]")?.addEventListener("click", () => {
    try { browserFrame?.contentWindow.location.reload(); }
    catch (_error) { if (browserFrame) browserFrame.src = browserFrame.src; }
  });
  qs("[data-browser-back]")?.addEventListener("click", () => {
    try { browserFrame?.contentWindow.history.back(); } catch (_error) { toast("これより前のページはありません。"); }
  });
  qs("[data-browser-forward]")?.addEventListener("click", () => {
    try { browserFrame?.contentWindow.history.forward(); } catch (_error) { toast("これより先のページはありません。"); }
  });
  browserFrame?.addEventListener("load", () => {
    try {
      const path = browserFrame.contentWindow.location.pathname.split("/").pop() || "index.html";
      const suffix = `${browserFrame.contentWindow.location.search}${browserFrame.contentWindow.location.hash}`;
      if (browserAddress) browserAddress.value = `kagefuda.local/${path}${suffix}`;
      const pageTitle = browserFrame.contentDocument?.title?.trim() || path;
      if (browserTitle) browserTitle.textContent = `Microsoft Edge — ${pageTitle}`;
      browserFrame.title = pageTitle;
    } catch (_error) {
      if (browserAddress) browserAddress.value = "kagefuda.local/保護されたページ";
      if (browserTitle) browserTitle.textContent = "Microsoft Edge — 保護されたページ";
    }
  });

  window.addEventListener("message", (event) => {
    if (event.origin !== window.location.origin) return;
    if (event.source !== browserFrame?.contentWindow) return;
    const payload = event.data;
    if (!payload || payload.type !== "kfa-desktop" || typeof payload.action !== "string") return;
    if (payload.action === "sync-browser" && event.source === browserFrame?.contentWindow) {
      const safePath = normalizeRoute(payload.path);
      if (!safePath.startsWith("search.html")) return;
      const safeTitle = String(payload.title || "Google 検索").slice(0, 120);
      if (browserAddress) browserAddress.value = `kagefuda.local/${safePath}`;
      if (browserTitle) browserTitle.textContent = `Microsoft Edge — ${safeTitle}`;
      browserFrame.title = safeTitle;
      return;
    }
    const actions = {
      "open-line": () => openWindow("lineWindow"),
      "open-auction": () => navigateBrowser("index.html"),
      "open-observer": () => navigateBrowser("observer.html")
    };
    if (Object.hasOwn(actions, payload.action) && typeof actions[payload.action] === "function") {
      actions[payload.action]();
    }
  });

  // --- Explorer and Notepad ---------------------------------------------
  const fileGrid = qs("[data-file-grid]");
  const notepadTitle = qs("[data-notepad-title]");
  const notepadContent = qs("[data-notepad-content]");
  let activeFileId = "";
  let noteSaveTimer = 0;

  function renderFiles() {
    if (!fileGrid) return;
    fileGrid.replaceChildren();
    ["handoff", "inspection", "audioSummary"].forEach((id) => {
      const file = files[id];
      const button = make("button", "file-item");
      button.type = "button";
      button.dataset.openFile = id;
      const icon = make("span", "file-icon");
      icon.append(createSvg("i-note"));
      const details = make("span", "file-details");
      details.append(make("strong", "", file.title), make("small", "", `${file.modified}　${file.size}`));
      button.append(icon, details);
      fileGrid.append(button);
    });
  }

  function openFile(id) {
    const file = files[id];
    if (!file || !notepadContent) return;
    activeFileId = id;
    if (notepadTitle) notepadTitle.textContent = `${file.title} — メモ帳`;
    notepadContent.value = Object.prototype.hasOwnProperty.call(state.notes, id) ? state.notes[id] : file.content;
    openWindow("notepadWindow");
    window.setTimeout(() => {
      notepadContent.focus();
      notepadContent.setSelectionRange(0, 0);
    }, 80);
  }

  document.addEventListener("click", (event) => {
    const fileButton = event.target.closest("[data-open-file]");
    if (fileButton) openFile(fileButton.dataset.openFile);
  });

  notepadContent?.addEventListener("input", () => {
    if (!activeFileId) return;
    state.notes[activeFileId] = notepadContent.value;
    persist();
    window.clearTimeout(noteSaveTimer);
    noteSaveTimer = window.setTimeout(() => toast("この端末内に保存しました"), 700);
  });

  // --- LINE chats --------------------------------------------------------
  const conversationList = qs("[data-conversation-list]");
  const messageList = qs("[data-message-list]");
  const chatName = qs("[data-chat-name]");
  const chatStatus = qs("[data-chat-status]");
  const typing = qs("[data-typing]");
  const messageInput = qs("[data-message-input]");
  const lineShell = qs(".line-shell");
  const lineWindow = qs("#lineWindow");

  const chatHead = qs(".chat-head");
  if (chatHead && !qs(".mobile-chat-back", chatHead)) {
    const mobileBack = make("button", "mobile-chat-back");
    mobileBack.type = "button";
    mobileBack.setAttribute("aria-label", "トーク一覧へ戻る");
    mobileBack.append(createSvg("i-back"));
    mobileBack.addEventListener("click", () => {
      lineShell?.classList.remove("chat-selected");
      lineWindow?.classList.remove("chat-selected");
    });
    chatHead.prepend(mobileBack);
  }

  function allMessages(id) {
    const base = conversations[id]?.messages || [];
    const custom = Array.isArray(state.customMessages[id]) ? state.customMessages[id] : [];
    return [...base, ...custom];
  }

  function updateUnreadBadges() {
    const total = Object.values(state.unread).reduce((sum, value) => sum + Math.max(Number(value) || 0, 0), 0);
    qsa("[data-line-unread]").forEach((badge) => {
      badge.textContent = String(Math.min(total, 99));
      badge.hidden = total === 0;
    });
  }

  function renderConversationList(filter = "") {
    if (!conversationList) return;
    conversationList.replaceChildren();
    const query = filter.trim().normalize("NFKC").toLowerCase();
    Object.entries(conversations).forEach(([id, conversation]) => {
      const haystack = `${conversation.name} ${conversation.preview}`.normalize("NFKC").toLowerCase();
      if (query && !haystack.includes(query)) return;
      const button = make("button", "conversation-item");
      button.type = "button";
      button.dataset.conversation = id;
      button.classList.toggle("active", id === state.activeConversation);
      const avatar = make("span", `conversation-avatar avatar-${id}`, conversation.avatar);
      const name = make("strong", "", conversation.name);
      const preview = make("small", "", conversation.preview);
      const time = make("time", "", conversation.time);
      const unread = Math.max(Number(state.unread[id]) || 0, 0);
      button.append(avatar, name, preview, time);
      if (unread) {
        const unreadBadge = make("b", "conversation-unread", String(unread));
        unreadBadge.setAttribute("aria-label", `${unread}件の未読`);
        button.append(unreadBadge);
      }
      button.addEventListener("click", () => selectConversation(id));
      conversationList.append(button);
    });
    if (!conversationList.children.length) conversationList.append(make("p", "conversation-empty", "一致するトークはありません"));
  }

  function renderMessage(message) {
    if (message.kind === "date") {
      return make("div", "message-date", message.text);
    }
    if (message.kind === "system") {
      return make("div", "message-system", message.text);
    }
    const mine = message.from === "me";
    const row = make("div", `message-row ${mine ? "is-me sent" : "received"}`);
    const content = make("div", "message-content");
    if (message.author && !mine) content.append(make("span", "message-author", message.author));
    content.append(make("div", "message-bubble", String(message.text || "")));
    if (Array.isArray(message.actions)) {
      const actions = make("div", "message-actions");
      message.actions.forEach((action) => {
        const button = make("button", "message-action", action.label);
        button.type = "button";
        button.addEventListener("click", () => navigateBrowser(action.route));
        actions.append(button);
      });
      content.append(actions);
    }
    const meta = make("span", "message-meta");
    if (mine && message.read) meta.append(make("small", "", "既読"));
    meta.append(make("time", "", message.time || nowTime()));
    row.append(content, meta);
    return row;
  }

  function renderMessages() {
    if (!messageList) return;
    const conversation = conversations[state.activeConversation] || conversations.hayase;
    if (chatName) chatName.textContent = conversation.name;
    if (chatStatus) chatStatus.textContent = conversation.status;
    messageList.replaceChildren();
    allMessages(state.activeConversation).forEach((message) => messageList.append(renderMessage(message)));
    requestAnimationFrame(() => { messageList.scrollTop = messageList.scrollHeight; });
  }

  function selectConversation(id) {
    if (!conversations[id]) return;
    state.activeConversation = id;
    state.unread[id] = 0;
    persist();
    renderConversationList(qs(".line-search input")?.value || "");
    renderMessages();
    updateUnreadBadges();
    lineShell?.classList.add("chat-selected");
    lineWindow?.classList.add("chat-selected");
  }

  function nowTime() {
    return new Intl.DateTimeFormat("ja-JP", { hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date());
  }

  function appendCustomMessage(conversationId, message, markUnread = false) {
    if (!Array.isArray(state.customMessages[conversationId])) state.customMessages[conversationId] = [];
    state.customMessages[conversationId].push({ ...message, id: message.id || `${Date.now()}-${Math.random()}` });
    if (markUnread && state.activeConversation !== conversationId) {
      state.unread[conversationId] = (Number(state.unread[conversationId]) || 0) + 1;
    }
    persist();
    renderConversationList(qs(".line-search input")?.value || "");
    if (state.activeConversation === conversationId) renderMessages();
    updateUnreadBadges();
  }

  function hasCustomMessage(conversationId, id) {
    return (state.customMessages[conversationId] || []).some((message) => message.id === id);
  }

  function scriptedReply(rawText) {
    const text = rawText.normalize("NFKC").toLowerCase();
    if (text.includes("ヒント")) {
      state.hintLevel = Math.min((Number(state.hintLevel) || 0) + 1, 3);
      persist();
      return [
        "まず、ごみ箱に残った『削除済み通話記録』を見て。外側の八桁はそこにある。",
        "内線は三つの四桁。夜間引継ぎと回収資料を並べれば、中央の四桁が分かる。",
        "止まった時刻は0317、存在しない日付は1131、録音機のLOTは0417。ハイフンなしで続けて。"
      ][state.hintLevel - 1];
    }
    if (text.includes("番号") || text.includes("内線")) return "普通の電話番号じゃない。『時刻・日付・LOT』を、それぞれ四桁で続けて。";
    if (text.includes("時刻") || text.includes("止まった")) return "銀時計も入退室記録も、03:17で止まってる。コロンは要らない。";
    if (text.includes("日付") || text.includes("11月")) return "回収日は11月31日。存在しない日だからこそ、記録から消せなかった。";
    if (text.includes("録音機") || text.includes("lot")) return "録音機は影札のLOT 0417。公開目録から確認できる。";
    if (text.includes("電話") || text.includes("通話")) return "LINEの通話タブから内線を入れて。四回鳴るまで待って。実際の電話網にはつながらない。";
    if (text.includes("早瀬") || text.includes("真琴")) return "……その名前、誰から聞いたの？　私は今夜ここにいない。";
    if (text.includes("返却") || text.includes("受取")) return "返却処理はしないで。『受取済み』になったものは、受け取る前には戻せない。";
    if (/0317.?1131.?0417/.test(text)) return "合ってる。でも、ここには送らないで。通話タブへ。";
    return "その言葉は記録にない。『番号』『時刻』『日付』『録音機』のどれかを調べて。";
  }

  qs("[data-message-form]")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const value = messageInput?.value.trim();
    if (!value) return;
    appendCustomMessage(state.activeConversation, { from: "me", text: value, time: nowTime(), read: true });
    messageInput.value = "";
    if (typing) typing.hidden = false;
    const conversationId = state.activeConversation;
    window.setTimeout(() => {
      if (typing) typing.hidden = true;
      appendCustomMessage(conversationId, { from: "them", text: scriptedReply(value), time: nowTime() });
    }, reducedMotion.matches ? 180 : 780);
  });

  qs(".line-search input")?.addEventListener("input", (event) => renderConversationList(event.target.value));

  function showLineView(view) {
    const chats = view === "chats";
    const calls = view === "calls";
    const conversationPane = qs("[data-conversation-pane]");
    const chatPane = qs("[data-chat-pane]");
    const callsPane = qs("[data-calls-pane]");
    if (conversationPane) conversationPane.hidden = !chats;
    if (chatPane) chatPane.hidden = !chats;
    if (callsPane) callsPane.hidden = !calls;
    qsa("[data-line-view]").forEach((button) => button.classList.toggle("active", button.dataset.lineView === view));
    if (calls) window.setTimeout(() => qs("[data-dial-number]")?.focus(), 60);
  }

  qsa("[data-line-view]").forEach((button) => {
    button.addEventListener("click", () => {
      const view = button.dataset.lineView;
      if (view === "chats" || view === "calls") showLineView(view);
      else toast(view === "friends" ? "友だち一覧はアーカイブから復元できません。" : "この項目は管理者により無効化されています。");
    });
  });
  qs("[data-open-dialer]")?.addEventListener("click", () => showLineView("calls"));
  qs("[data-back-chats]")?.addEventListener("click", () => showLineView("chats"));
  qs("[data-line-settings]")?.addEventListener("click", () => toast("設定は遠隔管理されています。"));

  // --- LINE archive calling ---------------------------------------------
  const dialInput = qs("[data-dial-number]");
  const dialPad = qs("[data-dial-pad]");
  const callOverlay = qs("[data-call-overlay]");
  const callName = qs("[data-call-name]");
  const callNumber = qs("[data-call-number]");
  const callStatus = qs("[data-call-status]");
  const callTimer = qs("[data-call-timer]");
  const callTranscript = qs("[data-call-transcript]");
  const transcriptToggle = qs("[data-transcript-toggle]");
  const muteButton = qs("[data-toggle-mute]");
  const archiveVoice = qs("#archiveVoice");
  let audioContext = null;
  // The WAV stays on the native HTMLAudioElement path for reliable playback.
  // Web Audio is used only for short locally generated keypad/ring tones.
  let currentCall = null;

  function normalizeNumber(value) {
    return String(value || "").replace(/\D/g, "");
  }

  function formatNumber(digits) {
    const value = normalizeNumber(digits).slice(0, 12);
    if (value.length <= 4) return value;
    if (value.length <= 8) return `${value.slice(0, 4)}-${value.slice(4)}`;
    return `${value.slice(0, 4)}-${value.slice(4, 8)}-${value.slice(8)}`;
  }

  function setDialDigits(digits) {
    if (dialInput) dialInput.value = formatNumber(digits);
  }

  ["1", "2", "3", "4", "5", "6", "7", "8", "9", "*", "0", "#"].forEach((digit) => {
    if (!dialPad) return;
    const button = make("button", "dial-key", digit);
    button.type = "button";
    button.dataset.digit = digit;
    const letters = { 2: "ABC", 3: "DEF", 4: "GHI", 5: "JKL", 6: "MNO", 7: "PQRS", 8: "TUV", 9: "WXYZ", 0: "+" }[digit];
    if (letters) button.append(make("small", "", letters));
    button.addEventListener("click", () => {
      const current = normalizeNumber(dialInput?.value || "");
      if (/\d/.test(digit) && current.length < 12) setDialDigits(current + digit);
      playKeyTone(digit);
    });
    dialPad.append(button);
  });

  qs("[data-dial-delete]")?.addEventListener("click", () => {
    const current = normalizeNumber(dialInput?.value || "");
    setDialDigits(current.slice(0, -1));
  });

  function ensureAudio() {
    const Context = window.AudioContext || window.webkitAudioContext;
    if (!Context) return null;
    try {
      if (!audioContext) audioContext = new Context();
      if (audioContext.state === "suspended") {
        // Automation and some mobile browsers can leave resume() pending forever.
        // Audio readiness must never block the visible call state machine.
        try {
          const resumePromise = audioContext.resume();
          resumePromise?.catch(() => {});
        } catch (_error) {
          // The ring sequence still advances on its fixed wall-clock timers.
        }
      }
      return audioContext;
    } catch (_error) {
      return null;
    }
  }

  function unlockArchiveAudio() {
    if (!archiveVoice) return;
    try {
      archiveVoice.currentTime = 0;
      archiveVoice.muted = true;
      const promise = archiveVoice.play();
      // Start inside the user's click while muted, then keep the stream alive
      // throughout the four local rings. Never await this promise.
      promise?.catch(() => {});
    } catch (_error) {
      // connectArchiveCall will make one last direct-play attempt if needed.
    }
    ensureAudio();
  }

  function stopArchiveAudio() {
    if (!archiveVoice) return;
    archiveVoice.pause();
    archiveVoice.currentTime = 0;
    archiveVoice.muted = false;
  }

  async function playKeyTone(digit) {
    const context = await ensureAudio();
    if (!context) return;
    const map = {
      "1": [697, 1209], "2": [697, 1336], "3": [697, 1477],
      "4": [770, 1209], "5": [770, 1336], "6": [770, 1477],
      "7": [852, 1209], "8": [852, 1336], "9": [852, 1477],
      "*": [941, 1209], "0": [941, 1336], "#": [941, 1477]
    };
    const frequencies = map[digit] || [697, 1209];
    const gain = context.createGain();
    gain.gain.setValueAtTime(0.0001, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.035, context.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.1);
    gain.connect(context.destination);
    frequencies.forEach((frequency) => {
      const oscillator = context.createOscillator();
      oscillator.frequency.value = frequency;
      oscillator.connect(gain);
      oscillator.start();
      oscillator.stop(context.currentTime + 0.11);
    });
  }

  async function playRingTone(duration = 860) {
    const context = await ensureAudio();
    if (!context) {
      await new Promise((resolve) => window.setTimeout(resolve, duration));
      return;
    }
    const gain = context.createGain();
    const start = context.currentTime;
    const end = start + duration / 1000;
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.075, start + 0.025);
    gain.gain.setValueAtTime(0.075, Math.max(start + 0.03, end - 0.07));
    gain.gain.exponentialRampToValueAtTime(0.0001, end);
    gain.connect(context.destination);
    [440, 480].forEach((frequency, index) => {
      const oscillator = context.createOscillator();
      oscillator.type = index ? "sine" : "triangle";
      oscillator.frequency.value = frequency;
      oscillator.connect(gain);
      oscillator.start(start);
      oscillator.stop(end + 0.02);
    });
    await new Promise((resolve) => window.setTimeout(resolve, duration));
  }

  function clearCallTimers() {
    if (!currentCall) return;
    currentCall.timeouts.forEach((timer) => window.clearTimeout(timer));
    currentCall.timeouts = [];
    window.clearInterval(currentCall.timerInterval);
  }

  function queueCallTimeout(callback, delay) {
    if (!currentCall) return 0;
    const timer = window.setTimeout(callback, delay);
    currentCall.timeouts.push(timer);
    return timer;
  }

  function showCallOverlay(number, name = "発信先不明") {
    if (!callOverlay) return;
    callOverlay.hidden = false;
    callOverlay.classList.remove("connected", "ended", "muted");
    if (callName) callName.textContent = name;
    if (callNumber) callNumber.textContent = formatNumber(number);
    if (callStatus) callStatus.textContent = "発信しています…";
    if (callTimer) callTimer.textContent = "00:00";
    if (callTranscript) {
      callTranscript.hidden = true;
      callTranscript.textContent = "";
    }
    if (transcriptToggle) {
      transcriptToggle.hidden = true;
      transcriptToggle.textContent = "文字起こしを表示";
      transcriptToggle.setAttribute("aria-expanded", "false");
    }
    if (muteButton) {
      muteButton.setAttribute("aria-pressed", "false");
      const muteLabel = qs("span", muteButton);
      if (muteLabel) muteLabel.textContent = "ミュート";
    }
    window.setTimeout(() => qs("[data-hangup]")?.focus(), 40);
  }

  function addCallHistory(number, outcome, duration = "00:00") {
    state.recentCalls.unshift({ number: formatNumber(number), outcome, duration, time: nowTime() });
    state.recentCalls = state.recentCalls.slice(0, 8);
    persist();
    renderCallHistory();
  }

  function renderCallHistory() {
    const history = qs("[data-call-history]");
    if (!history) return;
    history.replaceChildren(make("strong", "", "最近の通話"));
    if (!state.recentCalls.length) {
      const empty = make("div", "call-history-row");
      empty.append(make("span", "", "発信先不明"), make("time", "", "昨日 03:17"));
      history.append(empty);
      return;
    }
    state.recentCalls.forEach((call) => {
      const row = make("div", "call-history-row");
      row.tabIndex = 0;
      row.setAttribute("role", "button");
      const copy = make("span", "");
      copy.append(make("b", "", call.number || "非通知"), make("small", "", `${call.outcome} ${call.duration}`));
      row.append(copy, make("time", "", call.time));
      row.addEventListener("click", () => setDialDigits(call.number));
      row.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          setDialDigits(call.number);
        }
      });
      history.append(row);
    });
  }

  async function ringSequence(requiredRings, onComplete) {
    if (!currentCall || currentCall.phase !== "ringing") return;
    currentCall.ringCount += 1;
    if (callStatus) callStatus.textContent = `呼び出し中… ${currentCall.ringCount}/${requiredRings}`;
    await playRingTone();
    if (!currentCall || currentCall.phase !== "ringing") return;
    if (currentCall.ringCount >= requiredRings) {
      queueCallTimeout(onComplete, 620);
    } else {
      queueCallTimeout(() => ringSequence(requiredRings, onComplete), 820);
    }
  }

  function startTimer() {
    if (!currentCall) return;
    currentCall.startedAt = Date.now();
    currentCall.timerInterval = window.setInterval(() => {
      if (!currentCall || currentCall.phase !== "connected") return;
      const seconds = Math.floor((Date.now() - currentCall.startedAt) / 1000);
      const display = `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
      if (callTimer) callTimer.textContent = display;
    }, 250);
  }

  function connectArchiveCall() {
    if (!currentCall || currentCall.phase !== "ringing") return;
    currentCall.phase = "connected";
    callOverlay?.classList.add("connected");
    if (callName) callName.textContent = "アーカイブ 07";
    if (callStatus) callStatus.textContent = "接続済み — 保存音声を再生中";
    if (callTranscript) callTranscript.textContent = transcript.join("\n");
    if (transcriptToggle) transcriptToggle.hidden = false;
    startTimer();
    if (!archiveVoice) {
      if (callStatus) callStatus.textContent = "音声ファイルを読み込めませんでした";
      return;
    }
    archiveVoice.currentTime = 0;
    archiveVoice.muted = false;
    if (archiveVoice.paused) {
      const retry = () => {
        const retryPromise = archiveVoice.play();
        retryPromise?.then(() => {
          if (callStatus) callStatus.textContent = "接続済み — 保存音声を再生中";
        }).catch(() => {});
      };
      try {
        const playPromise = archiveVoice.play();
        playPromise?.catch(() => {
          if (callStatus) callStatus.textContent = "音声を再生するには画面をタップしてください";
          callOverlay?.addEventListener("pointerdown", retry, { once: true });
        });
      } catch (_error) {
        if (callStatus) callStatus.textContent = "音声を再生するには画面をタップしてください";
        callOverlay?.addEventListener("pointerdown", retry, { once: true });
      }
    }
  }

  function finishArchiveCall() {
    if (!currentCall || currentCall.phase !== "connected") return;
    const number = currentCall.number;
    const duration = callTimer?.textContent || "00:00";
    currentCall.phase = "ended";
    window.clearInterval(currentCall.timerInterval);
    callOverlay?.classList.remove("connected");
    callOverlay?.classList.add("ended");
    if (callStatus) callStatus.textContent = "保存音声が終了しました";
    addCallHistory(number, "再生完了", duration);
    completeCallPuzzle();
  }

  function completeCallPuzzle() {
    state.callSolved = true;
    if (!hasCustomMessage("hayase", "post-call-1")) {
      state.customMessages.hayase.push({ id: "post-call-1", from: "them", text: "いま、私の声を聞いた？", time: "03:17" });
      state.customMessages.hayase.push({ id: "post-call-2", from: "them", text: "返事をしないで。私は電話していない。", time: "03:17" });
      if (state.activeConversation !== "hayase") state.unread.hayase = (Number(state.unread.hayase) || 0) + 2;
    }
    if (!state.notifications.some((item) => item.id === "after-call")) {
      state.notifications.unshift({
        id: "after-call",
        app: "LINE",
        title: "早瀬 真琴から2件のメッセージ",
        body: "いま、私の声を聞いた？",
        action: "lineWindow",
        time: "03:17"
      });
    }
    clockGlitchUntil = Date.now() + (reducedMotion.matches ? 5000 : 13000);
    persist(true);
    renderConversationList(qs(".line-search input")?.value || "");
    if (state.activeConversation === "hayase") renderMessages();
    updateUnreadBadges();
    renderNotifications();
    toast("LINE：早瀬 真琴から2件の新着メッセージ", 5200);
  }

  function endCall(closeOverlay = true) {
    if (!currentCall) {
      if (callOverlay) callOverlay.hidden = true;
      return;
    }
    const number = currentCall.number;
    const wasConnected = currentCall.phase === "connected";
    const wasEnded = currentCall.phase === "ended";
    const duration = callTimer?.textContent || "00:00";
    clearCallTimers();
    stopArchiveAudio();
    if (!wasEnded) addCallHistory(number, wasConnected ? "通話終了" : "応答なし", duration);
    currentCall = null;
    if (closeOverlay && callOverlay) callOverlay.hidden = true;
    if (closeOverlay) window.setTimeout(() => qs("[data-dial-call]")?.focus(), 30);
  }

  function beginCall() {
    const number = normalizeNumber(dialInput?.value || "");
    if (!number) {
      toast("内線番号を入力してください。");
      return;
    }
    if (currentCall) endCall();
    unlockArchiveAudio();
    currentCall = { number, phase: "ringing", ringCount: 0, timeouts: [], timerInterval: 0, muted: false, startedAt: 0 };
    showCallOverlay(number);

    if (number === "110" || number === "119") {
      stopArchiveAudio();
      currentCall.phase = "blocked";
      if (callName) callName.textContent = "外部回線は無効です";
      if (callStatus) callStatus.textContent = "この仮想端末は実際の緊急通報へ接続できません";
      if (callTimer) callTimer.textContent = "LOCAL ONLY";
      toast("緊急時は、この演出画面ではなく実際の電話を使用してください。", 5200);
      queueCallTimeout(() => endCall(), 4800);
      return;
    }

    if (number === CORRECT_NUMBER) {
      ringSequence(4, connectArchiveCall);
      return;
    }

    stopArchiveAudio();
    ringSequence(1, () => {
      if (!currentCall) return;
      currentCall.phase = "failed";
      if (callStatus) callStatus.textContent = "接続先は、まだ登録されていません。";
      if (callName) callName.textContent = "内線不明";
      callOverlay?.classList.add("ended");
      queueCallTimeout(() => endCall(), 2600);
    });
  }

  qs("[data-dial-call]")?.addEventListener("click", beginCall);
  qs("[data-hangup]")?.addEventListener("click", () => endCall());
  muteButton?.addEventListener("click", () => {
    if (!currentCall || currentCall.phase !== "connected") {
      toast("接続中の通話はありません。");
      return;
    }
    currentCall.muted = !currentCall.muted;
    if (archiveVoice) archiveVoice.muted = currentCall.muted;
    callOverlay?.classList.toggle("muted", currentCall.muted);
    muteButton.setAttribute("aria-pressed", String(currentCall.muted));
    const label = qs("span", muteButton);
    if (label) label.textContent = currentCall.muted ? "ミュート解除" : "ミュート";
  });

  transcriptToggle?.addEventListener("click", () => {
    if (!callTranscript) return;
    callTranscript.hidden = !callTranscript.hidden;
    const isOpen = !callTranscript.hidden;
    transcriptToggle.textContent = isOpen ? "文字起こしを隠す" : "文字起こしを表示";
    transcriptToggle.setAttribute("aria-expanded", String(isOpen));
  });

  archiveVoice?.addEventListener("ended", finishArchiveCall);

  // Keyboard dialing is supported while the readonly display is focused.
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      if (callOverlay && !callOverlay.hidden) endCall();
      else closeFlyouts();
      return;
    }
    if (document.activeElement !== dialInput) return;
    if (/^\d$/.test(event.key)) {
      event.preventDefault();
      const current = normalizeNumber(dialInput.value);
      if (current.length < 12) setDialDigits(current + event.key);
      playKeyTone(event.key);
    } else if (event.key === "Backspace") {
      event.preventDefault();
      const current = normalizeNumber(dialInput.value);
      setDialDigits(current.slice(0, -1));
    } else if (event.key === "Enter") {
      event.preventDefault();
      beginCall();
    }
  });

  // --- Boot and initialization ------------------------------------------
  function boot() {
    document.title = "KFA-ARCHIVE-07 | 仮想デスクトップ";
    renderFiles();
    renderConversationList();
    renderMessages();
    renderCallHistory();
    renderNotifications();
    updateUnreadBadges();
    updateClock();
    window.setInterval(updateClock, 1000);

    if (state.callSolved && !state.notifications.some((item) => item.id === "after-call")) {
      state.notifications.unshift({ id: "after-call", app: "LINE", title: "早瀬 真琴", body: "返事をしないで。私は電話していない。", action: "lineWindow", time: "03:17" });
      renderNotifications();
      persist();
    }

    const bootScreen = qs("#bootScreen");
    const delay = reducedMotion.matches ? 180 : 1450;
    window.setTimeout(() => {
      if (!bootScreen) return;
      bootScreen.classList.add("is-leaving");
      window.setTimeout(() => { bootScreen.hidden = true; }, reducedMotion.matches ? 20 : 420);
    }, delay);
  }

  boot();
})();
