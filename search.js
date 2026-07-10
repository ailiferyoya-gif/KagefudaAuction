(() => {
  "use strict";

  const STORAGE_KEY = "kagefuda-search-v1";
  const qs = (selector, root = document) => root.querySelector(selector);
  const qsa = (selector, root = document) => [...root.querySelectorAll(selector)];
  const make = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  };

  const indexedPages = [
    {
      id: "home",
      source: "影札オークション",
      mark: "影",
      path: "kagefuda.local › index",
      url: "index.html",
      title: "影札オークション — 記憶には、落札者がいる。",
      snippet: "由来の確かな美術工芸から、記録上は存在しない保管物まで。夜間目録と公開競売を閲覧できます。",
      keywords: "影札 オークション auction 夜間目録 競売 落札 記憶 トップ",
      tag: "公式"
    },
    {
      id: "auctions",
      source: "影札オークション",
      mark: "競",
      path: "kagefuda.local › auctions",
      url: "auctions.html",
      title: "開催中の競売 — 影札 夜間目録",
      snippet: "水損した録音機、03:17で停止した銀時計、椅子だけが残された肖像など、現在公開中のロット一覧。",
      keywords: "開催中 競売 ロット 一覧 銀時計 03:17 肖像 夜間目録",
      tag: "12ロット"
    },
    {
      id: "lot0417",
      source: "影札オークション",
      mark: "音",
      path: "kagefuda.local › lot-0417",
      url: "lot-0417.html",
      title: "LOT 0417｜第七码頭で回収された録音機",
      snippet: "第七码頭、水深12.4メートルから回収。録音開始カウンターは03:17で固定され、テープ先頭以前にも音声があります。",
      keywords: "0417 LOT 録音機 カセット テープ 音声 第七码頭 海 水没 03:17",
      tag: "音声記録"
    },
    {
      id: "archive",
      source: "影札 来歴アーカイブ",
      mark: "来",
      path: "kagefuda.local › archive",
      url: "archive.html",
      title: "来歴アーカイブ — 存在しない日付の記録",
      snippet: "1998年11月31日付の回収票、同じ時刻で停止した三つの記録、返却先のない保管物を照合します。",
      keywords: "来歴 アーカイブ 1998 11月31日 存在しない日付 回収票 記録 返却",
      tag: "資料"
    },
    {
      id: "private",
      source: "影札 Private Desk",
      mark: "私",
      path: "kagefuda.local › private-sale",
      url: "private-sale.html",
      title: "Private Sale — 第零回競売の返却品",
      snippet: "公開競売に適さない来歴、受取人が指定された品、過去に返却された保管物。価格は公開されません。",
      keywords: "private sale 非公開 返却品 第零回 受取人 保管物",
      tag: "招待制"
    },
    {
      id: "observer",
      source: "KFA 観測記録",
      mark: "観",
      path: "kagefuda.local › observer",
      url: "observer.html",
      title: "観測者プロトコル — 閲覧記録の照合",
      snippet: "この端末に残った閲覧ページ、検索語、証拠関係を照合します。復元語はコロンを含めず入力してください。",
      keywords: "観測者 プロトコル 観測記録 照合 復元語 閲覧履歴 証拠 0130",
      tag: "LOCAL"
    },
    {
      id: "about",
      source: "影札オークション",
      mark: "鑑",
      path: "kagefuda.local › about",
      url: "about.html",
      title: "影札について — 鑑定・保管基準",
      snippet: "146項目の状態検査、原本と複製記録の二重保管、異常報告への初動手順について。",
      keywords: "影札について 鑑定 保管 基準 146 二重保管 異常報告",
      tag: "案内"
    },
    {
      id: "account",
      source: "影札 Private Desk",
      mark: "会",
      path: "kagefuda.local › account",
      url: "account.html",
      title: "会員デスク — 入札資格とウォッチリスト",
      snippet: "夜間競売の入札資格、照合状態、端末内に保存されたウォッチリストを確認します。",
      keywords: "会員 ログイン 入札 資格 ウォッチリスト アカウント private desk",
      tag: "会員"
    },
    {
      id: "tools",
      source: "KFA Puzzle Applications",
      mark: "用",
      path: "kagefuda.local › tools",
      url: "tools.html",
      title: "アプリ ライブラリ — 謎解き用の記録ツール",
      snippet: "音声レコーダー、カレンダー、写真、地図、ダウンロード、監視カメラ、付箋、設定を端末内だけで操作できます。",
      keywords: "アプリ ライブラリ ツール 音声 レコーダー カレンダー 写真 地図 ダウンロード 監視カメラ 付箋 設定 謎解き",
      tag: "LOCAL TOOLS"
    },
    {
      id: "missing",
      source: "影札 欠番目録",
      mark: "0",
      path: "kagefuda.local › lot-0000",
      url: "lot-0000.html",
      title: "LOT 0000 — 欠番（閲覧条件あり）",
      snippet: "公開目録から削除されたロットです。観測記録の照合が完了した端末だけが内容を復元できます。",
      keywords: "0000 LOT 欠番 削除 隠しロット 受取済み 観測条件",
      tag: "閲覧制限"
    }
  ];

  const defaults = [
    "影札オークション",
    "第七码頭 録音機",
    "11月31日",
    "03:17 時計",
    "早瀬 真琴",
    "観測者プロトコル",
    "アプリ ライブラリ",
    "LOT 0417",
    "返却品 受取人"
  ];

  const localMessages = {
    gmail: "Gmailには接続していません。この端末から外部メールは送信されません。",
    images: "画像検索はこのローカル端末では利用できません。公開目録の画像は検索結果から閲覧できます。",
    voice: "マイクは使用しません。検索語をキーボードで入力してください。",
    lens: "カメラと画像アップロードは使用しません。",
    profile: "KFA-ARCHIVE-07 / ローカル利用者。Googleアカウントには接続していません。",
    news: "ニュース検索は外部通信を必要とするため無効です。",
    maps: "地図サービスには接続していません。現在地は取得しません。",
    shopping: "外部ショッピングと決済には接続していません。",
    "time-filter": "保存領域の日時情報には、暦上存在しない値が含まれます。",
    verbatim: "この端末では保存済み文書との一致度順に表示します。",
    "about-search": "これは謎解き用の架空端末内検索です。実在のGoogle検索とは接続していません。",
    ads: "広告配信は無効です。閲覧情報は外部へ送信されません。",
    business: "この端末の事業者情報はアーカイブから削除されています。",
    "how-search": "KFA-ARCHIVE-07内の公開ページと復元済み断片だけを索引しています。",
    privacy: "検索履歴はこのブラウザのlocalStorage内だけに保存されます。",
    terms: "架空の謎解き用プロトタイプです。実在の取引・通信は発生しません。",
    settings: "セーフサーチ: 強制 / 外部通信: 無効 / 観測同期: 有効",
    help: "検索候補は上下キーで選び、Enterで検索できます。Escapeで候補を閉じます。",
    feedback: "外部への送信機能はありません。フィードバックは保存されません。"
  };

  let toastTimer = 0;
  const toast = (message) => {
    const node = qs("[data-toast]");
    if (!node) return;
    node.textContent = message;
    node.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => { node.hidden = true; }, 3800);
  };

  function syncBrowserChrome(path, title) {
    if (window.parent === window) return;
    window.parent.postMessage({ type: "kfa-desktop", action: "sync-browser", path, title }, window.location.origin);
  }

  const normalize = (value) => String(value || "")
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[\u3000\s]+/g, " ")
    .trim();

  const compact = (value) => normalize(value).replace(/[\s:/・｜|_-]+/g, "");

  function loadHistory() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      return Array.isArray(saved) ? saved.filter((item) => typeof item === "string").slice(0, 6) : [];
    } catch (_error) {
      return [];
    }
  }

  let recentSearches = loadHistory();
  function remember(query) {
    const clean = String(query || "").trim();
    if (!clean) return;
    recentSearches = [clean, ...recentSearches.filter((item) => compact(item) !== compact(clean))].slice(0, 6);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(recentSearches)); } catch (_error) { /* local-only fallback */ }
  }

  function searchIcon(kind = "search") {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("aria-hidden", "true");
    if (kind === "history") {
      const circle = document.createElementNS(svg.namespaceURI, "path");
      circle.setAttribute("d", "M12 4a8 8 0 1 1-7.3 4.7M4 4v5h5M12 8v5l3 2");
      svg.append(circle);
    } else {
      const circle = document.createElementNS(svg.namespaceURI, "circle");
      circle.setAttribute("cx", "10.5");
      circle.setAttribute("cy", "10.5");
      circle.setAttribute("r", "6");
      const path = document.createElementNS(svg.namespaceURI, "path");
      path.setAttribute("d", "m15 15 4.5 4.5");
      svg.append(circle, path);
    }
    return svg;
  }

  const suggestionStates = new Map();
  function candidateSuggestions(value) {
    const query = compact(value);
    const merged = [];
    const push = (text, recent = false) => {
      if (!text || merged.some((item) => compact(item.text) === compact(text))) return;
      merged.push({ text, recent });
    };
    recentSearches.forEach((text) => push(text, true));
    defaults.forEach((text) => push(text, false));
    indexedPages.forEach((page) => push(page.title.split(" — ")[0].split("｜")[0], false));
    const filtered = query
      ? merged.filter((item) => compact(item.text).includes(query) || query.includes(compact(item.text)))
      : merged;
    if (value.trim() && !filtered.some((item) => compact(item.text) === query)) filtered.unshift({ text: value.trim(), recent: false });
    return filtered.slice(0, 8);
  }

  function hideSuggestions(input) {
    const state = suggestionStates.get(input);
    if (!state) return;
    state.list.hidden = true;
    state.shell.classList.remove("has-suggestions");
    state.index = -1;
    input.setAttribute("aria-expanded", "false");
    input.setAttribute("aria-activedescendant", "");
  }

  function chooseSuggestion(input, text) {
    input.value = text;
    hideSuggestions(input);
    runSearch(text);
  }

  function paintSuggestions(input) {
    const state = suggestionStates.get(input);
    if (!state) return;
    state.items = candidateSuggestions(input.value);
    state.index = -1;
    state.list.replaceChildren();
    state.items.forEach((item, index) => {
      const li = make("li");
      li.id = `${state.list.id}-option-${index}`;
      li.setAttribute("role", "option");
      li.setAttribute("aria-selected", "false");
      const button = make("button", "suggestion-button");
      button.type = "button";
      const icon = make("span", "suggestion-icon");
      icon.append(searchIcon(item.recent ? "history" : "search"));
      const copy = make("span", "suggestion-query", item.text);
      button.append(icon, copy);
      if (item.recent) button.append(make("span", "suggestion-label", "最近"));
      button.addEventListener("pointerdown", (event) => event.preventDefault());
      button.addEventListener("click", () => chooseSuggestion(input, item.text));
      li.append(button);
      state.list.append(li);
    });
    const open = state.items.length > 0;
    state.list.hidden = !open;
    state.shell.classList.toggle("has-suggestions", open);
    input.setAttribute("aria-expanded", String(open));
  }

  function setActiveSuggestion(input, nextIndex) {
    const state = suggestionStates.get(input);
    if (!state || !state.items.length) return;
    state.index = (nextIndex + state.items.length) % state.items.length;
    qsa("li", state.list).forEach((item, index) => {
      const active = index === state.index;
      item.setAttribute("aria-selected", String(active));
      qs("button", item)?.classList.toggle("is-active", active);
      if (active) item.scrollIntoView({ block: "nearest" });
    });
    const option = state.list.children[state.index];
    input.setAttribute("aria-activedescendant", option?.id || "");
  }

  qsa(".search-input").forEach((input) => {
    const shell = input.closest("[data-search-shell]");
    const list = shell?.querySelector(".suggestions");
    if (!shell || !list) return;
    suggestionStates.set(input, { shell, list, items: [], index: -1 });
    input.addEventListener("focus", () => paintSuggestions(input));
    input.addEventListener("input", () => {
      syncInputs(input.value, input);
      paintSuggestions(input);
      updateClearButtons();
    });
    input.addEventListener("keydown", (event) => {
      const state = suggestionStates.get(input);
      if (event.key === "ArrowDown") {
        event.preventDefault();
        if (state.list.hidden) paintSuggestions(input);
        setActiveSuggestion(input, state.index + 1);
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        if (state.list.hidden) paintSuggestions(input);
        setActiveSuggestion(input, state.index - 1);
      } else if (event.key === "Enter" && state.index >= 0) {
        event.preventDefault();
        chooseSuggestion(input, state.items[state.index].text);
      } else if (event.key === "Enter") {
        event.preventDefault();
        runSearch(input.value);
      } else if (event.key === "Escape") {
        hideSuggestions(input);
      }
    });
    input.addEventListener("blur", () => window.setTimeout(() => hideSuggestions(input), 120));
  });

  function syncInputs(value, except) {
    qsa(".search-input").forEach((input) => { if (input !== except) input.value = value; });
  }

  function queryTokens(query) {
    const raw = normalize(query);
    return [...new Set([raw, ...raw.split(" ").filter(Boolean)].map(compact).filter(Boolean))];
  }

  function scoredResults(query) {
    const tokens = queryTokens(query);
    return indexedPages.map((page, order) => {
      const title = compact(page.title);
      const haystack = compact(`${page.title} ${page.snippet} ${page.keywords} ${page.source}`);
      let score = 0;
      tokens.forEach((token) => {
        if (title.includes(token)) score += 9;
        if (haystack.includes(token)) score += 4;
        if (compact(page.id) === token) score += 12;
      });
      return { ...page, score, order };
    }).filter((page) => page.score > 0).sort((a, b) => b.score - a.score || a.order - b.order);
  }

  function eerieResults(query) {
    const value = compact(query);
    const results = [];
    if (/早瀬|真琴|hayase/.test(value)) results.push({
      id: "hayase-cache", source: "KFA Personnel Cache", mark: "早", path: "kagefuda.local › cache › staff › deleted", url: "archive.html",
      title: "早瀬 真琴 — 夜間担当者記録（削除未完了）",
      snippet: "在籍終了日: 1998年11月31日。最終端末利用: 03:17。本人による削除要求は受理されましたが、記録は現在も閲覧中です。",
      tag: "復元された断片", eerie: true, score: 100
    });
    if (/11月31|1131|存在しない日/.test(value)) results.push({
      id: "invalid-date", source: "KFA Calendar Index", mark: "31", path: "kagefuda.local › dates › 1998-11-31", url: "archive.html",
      title: "1998年11月31日の保管記録",
      snippet: "指定された日付は暦上に存在しません。にもかかわらず、回収票・職員記録・通話キャッシュの三箇所で使用されています。",
      tag: "日付エラーではありません", eerie: true, score: 99
    });
    if (/03:?17|0317|止まった/.test(value)) results.push({
      id: "stopped-time", source: "KFA Integrity Monitor", mark: "時", path: "kagefuda.local › integrity › 03-17", url: "archive.html",
      title: "03:17に停止した三つの独立記録",
      snippet: "銀時計、入退室記録、LOT 0417の音声カウンター。同期設定のない三点が同じ時刻を保持しています。",
      tag: "時刻照合", eerie: true, score: 98
    });
    if (/第七|七码頭|0417|録音機/.test(value)) results.push({
      id: "pier-seven", source: "第七码頭 回収台帳", mark: "七", path: "kagefuda.local › recovery › pier-7", url: "lot-0417.html",
      title: "第七码頭回収品 K-14 — 公開目録 LOT 0417",
      snippet: "水深12.4メートルから回収された録音機。原本台帳の登録番号は削除されているため、公開LOT番号を使用してください。",
      tag: "回収品", eerie: true, score: 97
    });
    if (/電話|番号|内線|call/.test(value)) results.push({
      id: "extension-redacted", source: "KFA Telephone Directory", mark: "話", path: "kagefuda.local › extension › restricted", url: "desktop.html",
      title: "保管室アーカイブ内線 — 公開検索の対象外",
      snippet: "これは通常の電話番号ではありません。止まった時刻、存在しない日付、戻った録音機の順に、端末内の引継ぎから復元してください。",
      tag: "番号非公開", eerie: true, score: 96
    });
    if (/あなた|自分|検索した人|利用者/.test(value)) results.push({
      id: "viewer", source: "KFA Search Console", mark: "K", path: "kagefuda.local › viewer › current", url: "observer.html",
      title: "この検索を実行した端末 — KFA-ARCHIVE-07",
      snippet: "利用者名は未登録です。閲覧者番号だけが先に作成されています。現在、この結果を読んでいる人数: 1。",
      tag: "現在閲覧中", eerie: true, score: 95
    });
    return results;
  }

  function createMoreButton(title) {
    const button = make("button", "result-more");
    button.type = "button";
    button.setAttribute("aria-label", `${title}の詳細`);
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("aria-hidden", "true");
    [6, 12, 18].forEach((cy) => {
      const circle = document.createElementNS(svg.namespaceURI, "circle");
      circle.setAttribute("cx", "12"); circle.setAttribute("cy", String(cy)); circle.setAttribute("r", "1.5"); svg.append(circle);
    });
    button.append(svg);
    button.addEventListener("click", () => toast("この結果のキャッシュ情報は管理者により非公開です。"));
    return button;
  }

  function renderResultCard(result) {
    const article = make("article", `result-card${result.eerie ? " result-card--eerie" : ""}`);
    const source = make("div", "result-source");
    source.append(make("span", "source-favicon", result.mark || "影"));
    const copy = make("span", "source-copy");
    copy.append(make("span", "source-name", result.source), make("span", "source-path", result.path));
    source.append(copy, createMoreButton(result.title));
    const title = make("a", "result-title", result.title);
    title.href = result.url;
    const snippet = make("p", "result-snippet");
    if (result.date) snippet.append(make("span", "result-date", `${result.date} — `));
    snippet.append(document.createTextNode(result.snippet));
    article.append(source, title, snippet);
    if (result.tag) article.append(make("span", "result-tag", result.tag));
    return article;
  }

  function renderNoResults(query) {
    const node = make("section", "no-results");
    node.append(make("h2", "", `${query} に一致する情報は見つかりませんでした`));
    node.append(make("p", "", "検索のヒント:"));
    const tips = make("ul");
    ["キーワードに誤字・脱字がないか確認してください。", "別のキーワードを試してください。", "より一般的なキーワードに変えてください。"].forEach((text) => tips.append(make("li", "", text)));
    node.append(tips);
    const recovery = make("div", "recovery-searches");
    ["影札オークション", "LOT 0417", "11月31日"].forEach((text) => {
      const button = make("button", "", text); button.type = "button"; button.addEventListener("click", () => runSearch(text)); recovery.append(button);
    });
    node.append(recovery);
    return node;
  }

  function renderKnowledge(query) {
    const panel = qs("[data-knowledge-panel]");
    if (!panel) return;
    const value = compact(query);
    const relevant = /影札|auction|0417|録音機|第七|七码頭/.test(value);
    panel.hidden = !relevant;
    panel.replaceChildren();
    if (!relevant) return;
    const hero = make("div", "knowledge-hero");
    hero.append(make("span", "knowledge-hero__mark", /0417|録音機|第七|七码頭/.test(value) ? "音" : "影"));
    hero.append(make("h2", "", /0417|録音機|第七|七码頭/.test(value) ? "LOT 0417" : "影札オークション"));
    hero.append(make("p", "", "KFA-ARCHIVE-07 内部エンティティ"));
    const body = make("div", "knowledge-body");
    body.append(make("p", "", /0417|録音機|第七|七码頭/.test(value)
      ? "第七码頭から回収された水損録音機。停止時刻と存在しない回収日が、別の記録と一致しています。"
      : "来歴の確かな美術工芸と、記録上存在しない保管物を扱う架空の夜間オークション。"));
    const dl = make("dl", "knowledge-facts");
    const facts = /0417|録音機|第七|七码頭/.test(value)
      ? [["目録", "LOT 0417"], ["回収地点", "第七码頭"], ["停止時刻", "03:17"]]
      : [["種別", "プライベート競売"], ["稼働時間", "19:00–03:17"], ["状態", "夜間目録 公開中"]];
    facts.forEach(([term, description]) => { const row = make("div"); row.append(make("dt", "", term), make("dd", "", description)); dl.append(row); });
    const link = make("a", "knowledge-link", "詳細を開く");
    link.href = /0417|録音機|第七|七码頭/.test(value) ? "lot-0417.html" : "index.html";
    body.append(dl, link);
    panel.append(hero, body);
  }

  function updateClearButtons() {
    qsa("[data-clear-query]").forEach((button) => {
      const input = qs(".search-input", button.closest("form"));
      button.hidden = !input?.value;
    });
  }

  function showHome({ replace = false } = {}) {
    document.body.dataset.view = "home";
    qs(".results-view").hidden = true;
    qs(".results-footer").hidden = true;
    qs(".home-view").hidden = false;
    qs(".home-footer").hidden = false;
    syncInputs("");
    updateClearButtons();
    document.title = "Google 検索 — KFA ローカル";
    if (replace) history.replaceState({ query: "" }, "", "search.html");
    syncBrowserChrome("search.html", document.title);
  }

  function renderResults(query) {
    const list = qs("[data-result-list]");
    const stats = qs("[data-results-stats]");
    if (!list || !stats) return;
    const eerie = eerieResults(query);
    const regular = scoredResults(query).filter((item) => !eerie.some((special) => special.url === item.url && special.title.includes(item.id)));
    const combined = [...eerie, ...regular].slice(0, 10);
    list.replaceChildren();
    if (combined.length) combined.forEach((result) => list.append(renderResultCard(result)));
    else list.append(renderNoResults(query));
    const indexedCount = combined.length ? 1300 + combined.length * 417 : 0;
    stats.textContent = combined.length ? `約 ${indexedCount.toLocaleString("ja-JP")} 件 （0.${String(13 + combined.length).padStart(2, "0")} 秒）` : "一致する結果はありません";
    renderKnowledge(query);
  }

  function runSearch(rawQuery, options = {}) {
    const query = String(rawQuery || "").trim();
    qsa(".search-input").forEach(hideSuggestions);
    if (!query) {
      showHome();
      history.pushState({ query: "" }, "", "search.html");
      qs("#homeSearch")?.focus();
      return;
    }
    remember(query);
    syncInputs(query);
    updateClearButtons();
    document.body.dataset.view = "results";
    qs(".home-view").hidden = true;
    qs(".home-footer").hidden = true;
    qs(".results-view").hidden = false;
    qs(".results-footer").hidden = false;
    renderResults(query);
    document.title = `${query} - Google 検索`;
    const url = `search.html?q=${encodeURIComponent(query)}`;
    if (options.replace) history.replaceState({ query }, "", url);
    else if (!options.fromPop) history.pushState({ query }, "", url);
    syncBrowserChrome(url, document.title);
    window.scrollTo({ top: 0, behavior: "auto" });
  }

  qsa("[data-search-form]").forEach((form) => {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      runSearch(qs(".search-input", form)?.value || "");
    });
  });

  qs("[data-lucky]")?.addEventListener("click", () => {
    const query = qs("#homeSearch")?.value.trim() || "影札オークション";
    const result = [...eerieResults(query), ...scoredResults(query)][0];
    if (!result) { runSearch(query); return; }
    remember(query);
    window.location.href = result.url;
  });

  qsa("[data-clear-query]").forEach((button) => {
    button.addEventListener("click", () => {
      const input = qs(".search-input", button.closest("form"));
      syncInputs(""); updateClearButtons(); input?.focus(); paintSuggestions(input);
    });
  });

  const appsMenu = qs("#appsMenu");
  const appsButtons = qsa("[data-apps-button]");
  function closeApps() {
    if (appsMenu) appsMenu.hidden = true;
    appsButtons.forEach((button) => button.setAttribute("aria-expanded", "false"));
  }
  appsButtons.forEach((button) => button.addEventListener("click", (event) => {
    event.stopPropagation();
    const open = Boolean(appsMenu?.hidden);
    closeApps();
    if (open && appsMenu) { appsMenu.hidden = false; appsButtons.forEach((item) => item.setAttribute("aria-expanded", "true")); }
  }));
  document.addEventListener("pointerdown", (event) => { if (!event.target.closest("#appsMenu, [data-apps-button]")) closeApps(); });
  document.addEventListener("keydown", (event) => { if (event.key === "Escape") { closeApps(); qsa(".search-input").forEach(hideSuggestions); } });

  qs("[data-open-line]")?.addEventListener("click", () => {
    closeApps();
    if (window.parent !== window) {
      window.parent.postMessage({ type: "kfa-desktop", action: "open-line" }, window.location.origin);
    } else {
      toast("LINEは仮想デスクトップから開いてください。");
    }
  });

  qsa("[data-local-action]").forEach((button) => button.addEventListener("click", () => {
    const message = localMessages[button.dataset.localAction] || "この機能はローカル端末では利用できません。";
    toast(message);
  }));

  const toolsButton = qs("[data-tools]");
  const toolStrip = qs("[data-tool-strip]");
  toolsButton?.setAttribute("aria-expanded", "false");
  toolsButton?.addEventListener("click", () => {
    const open = Boolean(toolStrip?.hidden);
    if (toolStrip) toolStrip.hidden = !open;
    toolsButton.setAttribute("aria-expanded", String(open));
  });

  window.addEventListener("popstate", () => {
    const query = new URLSearchParams(location.search).get("q") || "";
    if (query) runSearch(query, { fromPop: true }); else showHome();
  });

  const initialQuery = new URLSearchParams(location.search).get("q") || "";
  if (initialQuery) runSearch(initialQuery, { replace: true });
  else showHome({ replace: true });
})();
