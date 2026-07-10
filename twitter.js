(() => {
  "use strict";

  const STORAGE_KEY = "kfa-twitter-local-v1";
  const qs = (selector, root = document) => root.querySelector(selector);
  const qsa = (selector, root = document) => [...root.querySelectorAll(selector)];
  const twitterWindow = qs("#twitterWindow");
  if (!twitterWindow) return;

  const defaults = {
    activeView: "home",
    activeTab: "recommended",
    query: "",
    read: false,
    likes: {},
    reposts: {},
    bookmarks: {},
    following: { "@kagefuda_official": true, "@clock_sato": true, "@dock7_worker": true },
    customPosts: []
  };

  const posts = [
    {
      id: "official-night-auction",
      name: "影札オークション",
      handle: "@kagefuda_official",
      initials: "影",
      tone: "official",
      verified: true,
      following: true,
      time: "7月10日",
      body: "本日の夜間競売は22時に始まります。入場記録とロット番号を手元に置いてください。担当者が第七码頭の回収品を会場で再検品します。",
      pinned: true,
      stats: { replies: 18, reposts: 64, likes: 214 }
    },
    {
      id: "dock-light",
      name: "第七码頭 夜勤",
      handle: "@dock7_worker",
      initials: "七",
      tone: "dock",
      following: true,
      time: "03:12",
      body: "第七码頭の照明が一本だけ消えない。制御盤は落とした。守衛に電話したら、そっちから掛かってきていると言われた。",
      attachment: "assets/pier-7-night.png",
      attachmentAlt: "夜の第七码頭。消灯した倉庫の脇で照明が一本だけ点いている",
      attachmentNote: "第七码頭保管区 · 03:12",
      stats: { replies: 7, reposts: 11, likes: 38 }
    },
    {
      id: "hayase-clock",
      name: "早瀬 真琴",
      handle: "@hayase_m",
      initials: "早",
      tone: "hayase",
      following: true,
      time: "03:09",
      body: "倉庫から銀時計を運び出した。針は03:17。電池を抜いた後も、秒針の音が鞄の中から聞こえる。",
      stats: { replies: 4, reposts: 2, likes: 19 }
    },
    {
      id: "clock-shop",
      name: "佐藤時計店",
      handle: "@clock_sato",
      initials: "時",
      tone: "clock",
      verified: true,
      following: true,
      time: "02:41",
      body: "0417の録音機を見た人へ。裏蓋の数字は、うちの店が付けた修理受付番号です。製造年の刻印は内側にあります。",
      attachment: "assets/lot-0417-recorder.png",
      attachmentAlt: "作業台に置かれた水損カセットレコーダー",
      attachmentNote: "受付票の控え · 0417",
      stats: { replies: 3, reposts: 8, likes: 27 }
    },
    {
      id: "station-coffee",
      name: "港南の海底",
      handle: "@umi_no_shita",
      initials: "海",
      tone: "sea",
      following: false,
      time: "01:26",
      body: "港南駅の売店で缶コーヒーを買えた。始発まで持つ。店員さんは『今夜は海を見ない方がいい』と笑ってた。",
      stats: { replies: 1, reposts: 0, likes: 12 }
    },
    {
      id: "lot-0529-time",
      name: "競売帰り",
      handle: "@bidder_0529",
      initials: "落",
      tone: "bidder",
      following: false,
      time: "00:48",
      body: "LOT 0529を落札した人、受け取り時間を確認した方がいい。案内メールは午前1時、台帳は前日の23時になってる。",
      stats: { replies: 6, reposts: 3, likes: 15 }
    },
    {
      id: "warehouse-cat",
      name: "ミナト猫見守り隊",
      handle: "@minato_neko",
      initials: "猫",
      tone: "cat",
      following: false,
      time: "昨日",
      body: "港の猫が今日は倉庫側に寄らない。餌だけ減っている。皿の横に濡れた靴跡があった。",
      stats: { replies: 2, reposts: 5, likes: 31 }
    },
    {
      id: "deleted-call",
      name: "削除されたアカウント",
      handle: "@user_0317",
      initials: "?",
      tone: "deleted",
      following: false,
      time: "1998年11月31日",
      body: "四回目の呼び出しで誰かが出て、私の名前を聞いた。返事をする前に切った。",
      stats: { replies: 0, reposts: 0, likes: 1 }
    }
  ];

  const notifications = [
    { icon: "i-reply", tone: "reply", title: "港南の海底さんが返信しました", body: "早瀬さん、午前2時に同じ時計の写真を投稿してましたよ。", time: "03:18" },
    { icon: "i-heart", tone: "like", title: "送信者不明さんがあなたの投稿をいいねしました", body: "倉庫から銀時計を運び出した。", time: "03:17" },
    { icon: "i-user", tone: "follow", title: "佐藤時計店さんがあなたをフォローしました", body: "@clock_sato", time: "02:43" }
  ];

  const trends = [
    { label: "#影札夜間競売", meta: "1,286件の投稿" },
    { label: "第七码頭", meta: "314件の投稿" },
    { label: "03:17", meta: "42件の投稿" },
    { label: "LOT 0417", meta: "17件の投稿" }
  ];

  const suggestions = [
    { name: "佐藤時計店", handle: "@clock_sato", initials: "時", tone: "clock" },
    { name: "第七码頭 夜勤", handle: "@dock7_worker", initials: "七", tone: "dock" }
  ];

  const cloneDefaults = () => JSON.parse(JSON.stringify(defaults));
  function loadState() {
    const fallback = cloneDefaults();
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      if (!saved || typeof saved !== "object") return fallback;
      return {
        ...fallback,
        ...saved,
        likes: { ...fallback.likes, ...(saved.likes || {}) },
        reposts: { ...fallback.reposts, ...(saved.reposts || {}) },
        bookmarks: { ...fallback.bookmarks, ...(saved.bookmarks || {}) },
        following: { ...fallback.following, ...(saved.following || {}) },
        customPosts: Array.isArray(saved.customPosts) ? saved.customPosts.slice(0, 30) : []
      };
    } catch (_error) {
      return fallback;
    }
  }

  let state = loadState();
  function persist() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (_error) { /* local app remains usable */ }
  }

  function make(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function icon(name) {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    const use = document.createElementNS("http://www.w3.org/2000/svg", "use");
    use.setAttribute("href", `#${name}`);
    svg.append(use);
    return svg;
  }

  function allPosts() {
    return [...state.customPosts, ...posts];
  }

  function updateBadges() {
    qsa("[data-twitter-unread]").forEach((badge) => {
      badge.textContent = "2";
      badge.hidden = Boolean(state.read);
    });
  }

  function avatarFor(post) {
    return make("span", `twitter-avatar avatar-${post.tone || "hayase"}`, post.initials || "早");
  }

  function actionButton(post, action, iconName, baseCount, label) {
    const active = Boolean(state[`${action}s`]?.[post.id]);
    const button = make("button", `tweet-action ${action}${active ? " active" : ""}`);
    button.type = "button";
    button.dataset.twitterAction = action;
    button.dataset.postId = post.id;
    button.setAttribute("aria-label", label);
    button.setAttribute("aria-pressed", String(active));
    button.append(icon(iconName));
    const count = action === "bookmark" ? "" : String((baseCount || 0) + (active ? 1 : 0));
    button.append(make("span", "", count));
    return button;
  }

  function renderPost(post) {
    const article = make("article", "tweet");
    article.dataset.postId = post.id;
    if (post.pinned) {
      const pinned = make("div", "tweet-pinned", "固定された投稿");
      pinned.prepend(icon("i-bookmark"));
      article.append(pinned);
    }
    article.append(avatarFor(post));
    const content = make("div", "tweet-content");
    const head = make("header", "tweet-head");
    const identity = make("span", "tweet-identity");
    identity.append(make("strong", "", post.name));
    if (post.verified) identity.append(make("b", "tweet-verified", "✓"));
    identity.append(make("small", "", post.handle), make("i", "", "·"), make("time", "", post.time));
    head.append(identity, make("button", "tweet-more", "···"));
    content.append(head, make("p", "tweet-text", post.body));
    if (post.attachment) {
      const figure = make("figure", "tweet-media");
      const image = document.createElement("img");
      image.src = post.attachment;
      image.alt = post.attachmentAlt || "投稿画像";
      image.loading = "lazy";
      figure.append(image);
      if (post.attachmentNote) figure.append(make("figcaption", "", post.attachmentNote));
      content.append(figure);
    }
    const actions = make("footer", "tweet-actions");
    const reply = actionButton(post, "reply", "i-reply", post.stats?.replies, "返信");
    reply.setAttribute("aria-pressed", "false");
    actions.append(
      reply,
      actionButton(post, "repost", "i-repost", post.stats?.reposts, "リポスト"),
      actionButton(post, "like", "i-heart", post.stats?.likes, "いいね"),
      actionButton(post, "bookmark", "i-bookmark", 0, "ブックマーク")
    );
    content.append(actions);
    article.append(content);
    return article;
  }

  function emptyState(title, body) {
    const node = make("div", "twitter-empty");
    node.append(make("strong", "", title), make("p", "", body));
    return node;
  }

  function inlineSearch() {
    const label = make("label", "twitter-inline-search");
    label.append(icon("i-search"));
    const input = document.createElement("input");
    input.type = "search";
    input.placeholder = "投稿、アカウント、キーワードを検索";
    input.setAttribute("aria-label", "投稿を検索");
    input.value = state.query;
    input.addEventListener("input", () => {
      state.query = input.value;
      const rightSearch = qs("[data-twitter-search]");
      if (rightSearch) rightSearch.value = state.query;
      persist();
    });
    input.addEventListener("change", renderFeed);
    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        renderFeed();
      }
    });
    label.append(input);
    return label;
  }

  function profileHeader() {
    const profile = make("section", "twitter-profile-head");
    profile.append(make("div", "twitter-profile-cover"));
    const row = make("div", "twitter-profile-row");
    row.append(make("span", "twitter-avatar avatar-hayase large", "早"), make("button", "twitter-profile-edit", "プロフィールを編集"));
    profile.append(row, make("strong", "twitter-profile-name", "早瀬 真琴"), make("small", "twitter-profile-handle", "@hayase_m"), make("p", "twitter-profile-bio", "夜間保管庫で公開前の目録を照合しています。"));
    const meta = make("div", "twitter-profile-meta");
    meta.append(make("span", "", "KFA-ARCHIVE-07"), make("span", "", "2024年4月から利用"));
    profile.append(meta);
    return profile;
  }

  function renderNotificationFeed(feed) {
    notifications.forEach((item) => {
      const node = make("article", "twitter-notification");
      const mark = make("span", `twitter-notification-icon ${item.tone}`);
      mark.append(icon(item.icon));
      const copy = make("div");
      copy.append(make("strong", "", item.title), make("p", "", item.body), make("time", "", item.time));
      node.append(mark, copy);
      feed.append(node);
    });
  }

  function visiblePosts() {
    let items = allPosts();
    if (state.activeView === "bookmarks") items = items.filter((post) => state.bookmarks[post.id]);
    if (state.activeView === "profile") items = items.filter((post) => post.handle === "@hayase_m");
    if (state.activeTab === "following" && state.activeView === "home") items = items.filter((post) => post.following || state.following[post.handle]);
    if (state.activeView === "explore" && state.query.trim()) {
      const needle = state.query.trim().normalize("NFKC").toLowerCase();
      items = items.filter((post) => [post.name, post.handle, post.body].join(" ").normalize("NFKC").toLowerCase().includes(needle));
    }
    return items;
  }

  function renderFeed() {
    const feed = qs("[data-twitter-feed]");
    if (!feed) return;
    feed.replaceChildren();
    if (state.activeView === "explore") feed.append(inlineSearch());
    if (state.activeView === "profile") feed.append(profileHeader());
    if (state.activeView === "notifications") {
      renderNotificationFeed(feed);
      return;
    }
    const items = visiblePosts();
    if (!items.length) {
      const copy = state.activeView === "bookmarks"
        ? ["保存した投稿はありません", "投稿のしおりアイコンを押すと、ここで読み返せます。"]
        : ["該当する投稿はありません", "別の語句で検索してください。"];
      feed.append(emptyState(copy[0], copy[1]));
      return;
    }
    items.forEach((post) => feed.append(renderPost(post)));
  }

  function renderTrends() {
    const container = qs("[data-twitter-trends]");
    if (!container) return;
    container.replaceChildren();
    trends.forEach((trend, index) => {
      const button = make("button", "twitter-trend");
      button.type = "button";
      button.dataset.trend = trend.label;
      button.append(make("small", "", `${index + 1} · KFAトレンド`), make("strong", "", trend.label), make("span", "", trend.meta));
      container.append(button);
    });
  }

  function renderSuggestions() {
    const container = qs("[data-twitter-suggestions]");
    if (!container) return;
    container.replaceChildren();
    suggestions.forEach((item) => {
      const row = make("div", "twitter-suggestion");
      row.append(avatarFor(item));
      const copy = make("span");
      copy.append(make("strong", "", item.name), make("small", "", item.handle));
      const follow = make("button", "", state.following[item.handle] ? "フォロー中" : "フォロー");
      follow.type = "button";
      follow.dataset.twitterFollow = item.handle;
      follow.classList.toggle("following", Boolean(state.following[item.handle]));
      row.append(copy, follow);
      container.append(row);
    });
  }

  function render() {
    const titles = { home: "ホーム", explore: "話題を検索", notifications: "通知", bookmarks: "ブックマーク", profile: "早瀬 真琴" };
    const title = qs("[data-twitter-title]");
    if (title) title.textContent = titles[state.activeView] || "ホーム";
    qsa("[data-twitter-view]").forEach((button) => {
      const active = button.dataset.twitterView === state.activeView;
      button.classList.toggle("active", active);
      button.setAttribute("aria-current", active ? "page" : "false");
    });
    const tabs = qs("[data-twitter-tabs]");
    if (tabs) tabs.hidden = state.activeView !== "home";
    qsa("[data-twitter-tab]").forEach((button) => button.classList.toggle("active", button.dataset.twitterTab === state.activeTab));
    const search = qs("[data-twitter-search]");
    if (search && search.value !== state.query) search.value = state.query;
    updateBadges();
    renderFeed();
    renderSuggestions();
  }

  function switchView(view) {
    state.activeView = view;
    if (view === "notifications") state.read = true;
    persist();
    render();
    qs("[data-twitter-feed]")?.scrollTo?.({ top: 0, behavior: "smooth" });
  }

  function openComposer(prefill = "") {
    const dialog = qs("[data-twitter-compose]");
    const input = qs("[data-twitter-compose-text]");
    if (!dialog || !input) return;
    dialog.hidden = false;
    input.value = prefill;
    updateComposer();
    window.setTimeout(() => input.focus(), 40);
  }

  function closeComposer() {
    const dialog = qs("[data-twitter-compose]");
    if (dialog) dialog.hidden = true;
  }

  function updateComposer() {
    const input = qs("[data-twitter-compose-text]");
    const count = qs("[data-twitter-count]");
    const submit = qs("[data-twitter-post-submit]");
    const length = [...(input?.value || "")].length;
    if (count) count.textContent = `${length} / 280`;
    if (submit) submit.disabled = length === 0 || length > 280;
  }

  function submitPost() {
    const input = qs("[data-twitter-compose-text]");
    const body = input?.value.trim();
    if (!body) return;
    state.customPosts.unshift({
      id: `local-${Date.now()}`,
      name: "早瀬 真琴",
      handle: "@hayase_m",
      initials: "早",
      tone: "hayase",
      following: true,
      time: "今",
      body,
      stats: { replies: 0, reposts: 0, likes: 0 }
    });
    state.activeView = "home";
    state.activeTab = "recommended";
    persist();
    closeComposer();
    render();
  }

  qsa("[data-twitter-view]").forEach((button) => button.addEventListener("click", () => switchView(button.dataset.twitterView)));
  qsa("[data-twitter-tab]").forEach((button) => button.addEventListener("click", () => { state.activeTab = button.dataset.twitterTab; persist(); render(); }));
  qsa("[data-twitter-compose-open]").forEach((button) => button.addEventListener("click", () => openComposer()));
  qs("[data-twitter-compose-close]")?.addEventListener("click", closeComposer);
  qs("[data-twitter-compose-text]")?.addEventListener("input", updateComposer);
  qs("[data-twitter-post-submit]")?.addEventListener("click", submitPost);
  qs("[data-twitter-home]")?.addEventListener("click", () => switchView("home"));
  qs("[data-twitter-refresh]")?.addEventListener("click", () => { render(); qs("[data-twitter-feed]")?.scrollTo?.({ top: 0, behavior: "smooth" }); });
  qs("[data-twitter-search]")?.addEventListener("input", (event) => { state.query = event.target.value; state.activeView = "explore"; persist(); render(); });

  qs("[data-twitter-trends]")?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-trend]");
    if (!button) return;
    state.query = button.dataset.trend || "";
    switchView("explore");
  });

  qs("[data-twitter-suggestions]")?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-twitter-follow]");
    if (!button) return;
    const handle = button.dataset.twitterFollow;
    state.following[handle] = !state.following[handle];
    persist();
    renderSuggestions();
  });

  qs("[data-twitter-feed]")?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-twitter-action]");
    if (!button) return;
    const action = button.dataset.twitterAction;
    const id = button.dataset.postId;
    const post = allPosts().find((item) => item.id === id);
    if (!post) return;
    if (action === "reply") {
      openComposer(`${post.handle} `);
      return;
    }
    const bucket = state[`${action}s`];
    if (!bucket) return;
    bucket[id] = !bucket[id];
    if (!bucket[id]) delete bucket[id];
    persist();
    renderFeed();
  });

  qs("[data-twitter-reset]")?.addEventListener("click", () => {
    if (!window.confirm("Twitterの投稿、いいね、保存状態を初期化しますか？")) return;
    localStorage.removeItem(STORAGE_KEY);
    state = cloneDefaults();
    render();
  });

  qsa('[data-open="twitterWindow"]').forEach((button) => button.addEventListener("click", () => {
    state.read = true;
    persist();
    updateBadges();
    window.setTimeout(() => qs("[data-twitter-feed]")?.focus?.(), 80);
  }));

  renderTrends();
  render();
})();
