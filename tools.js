(() => {
  "use strict";

  const STORAGE_KEY = "kfa-puzzle-tools-v1";
  const qs = (selector, root = document) => root.querySelector(selector);
  const qsa = (selector, root = document) => [...root.querySelectorAll(selector)];
  const content = qs("#toolContent");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const params = new URLSearchParams(window.location.search);
  const embeddedApp = params.get("embed") === "1" ? params.get("app") : "";
  let toastTimer = 0;
  let recorderTimer = 0;

  const defaults = {
    active: "home",
    opened: {},
    recorder: { position: 18, playing: false },
    calendar: { selected: "1131" },
    photos: { selected: "pier", zoom: 1 },
    map: { selected: "pier" },
    downloads: { selected: "manifest", recovered: {} },
    camera: { frame: 0, repaired: false },
    notes: [
      { id: "n1", title: "夜間引継ぎ", body: "三つの記録を、同じ順で並べる。\n時刻／日付／LOT" },
      { id: "n2", title: "聞こえたこと", body: "四回目より前に切らない。\n声が名前を訊いても答えない。" },
      { id: "n3", title: "写真の違和感", body: "桟橋の時計は、\nどの写真でも同じ位置。" }
    ],
    selectedNote: "n1",
    settings: { archiveLens: false, compact: false, sound: true }
  };

  function clone(value) { return JSON.parse(JSON.stringify(value)); }
  function load() {
    const fallback = clone(defaults);
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      if (!saved || typeof saved !== "object") return fallback;
      return {
        ...fallback,
        ...saved,
        opened: { ...fallback.opened, ...(saved.opened || {}) },
        recorder: { ...fallback.recorder, ...(saved.recorder || {}) },
        calendar: { ...fallback.calendar, ...(saved.calendar || {}) },
        photos: { ...fallback.photos, ...(saved.photos || {}) },
        map: { ...fallback.map, ...(saved.map || {}) },
        downloads: { ...fallback.downloads, ...(saved.downloads || {}), recovered: { ...fallback.downloads.recovered, ...(saved.downloads?.recovered || {}) } },
        notes: Array.isArray(saved.notes) ? saved.notes.slice(0, 30) : fallback.notes,
        settings: { ...fallback.settings, ...(saved.settings || {}) }
      };
    } catch (_error) { return fallback; }
  }

  const state = load();
  function persist() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (_error) { /* local use still works */ }
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
  function button(label, className = "tool-button", iconName) {
    const node = make("button", className);
    node.type = "button";
    if (iconName) node.append(icon(iconName));
    node.append(document.createTextNode(label));
    return node;
  }
  function toast(message) {
    const node = qs("[data-tools-toast]");
    if (!node) return;
    node.textContent = message;
    node.classList.add("show");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => node.classList.remove("show"), 3200);
  }
  function showTool(id) {
    if (!toolRegistry[id]) return;
    if (id !== "recorder") {
      window.clearInterval(recorderTimer);
      state.recorder.playing = false;
    }
    state.active = id;
    state.opened[id] = true;
    persist();
    qsa("[data-tool]").forEach((node) => node.classList.toggle("active", node.dataset.tool === id));
    document.body.classList.toggle("archive-lens", Boolean(state.settings.archiveLens));
    document.body.classList.toggle("compact-tools", Boolean(state.settings.compact));
    content.replaceChildren(toolRegistry[id]());
    qs("#toolMain")?.focus?.();
  }
  function shell(kicker, title, lede) {
    const root = make("div", "tool-shell");
    root.append(make("p", "page-kicker", kicker), make("h1", "page-title", title), make("p", "page-lede", lede));
    return root;
  }
  function cardHead(title, subtitle) {
    const head = make("header", "tool-card-head");
    head.append(make("h2", "", title));
    if (subtitle) head.append(make("small", "", subtitle));
    return head;
  }

  const appCards = [
    ["recorder", "t-wave", "音声レコーダー", "波形をたどり、聞こえない区間を記録する。", "#eaf0ff", "#5577d9"],
    ["calendar", "t-calendar", "カレンダー", "存在しない日付に残った予定を照合する。", "#fff0e9", "#d96941"],
    ["photos", "t-photo", "写真", "撮影条件と画面の端を確認する。", "#eaf8f4", "#3d9c7d"],
    ["map", "t-map", "地図", "保管区の記録地点を重ね合わせる。", "#eaf5fc", "#3a89ba"],
    ["downloads", "t-download", "ダウンロード", "壊れた配布物から断片を復元する。", "#f2eeff", "#7658c8"],
    ["camera", "t-camera", "監視カメラ", "欠けたフレームを時刻で追う。", "#eff2f7", "#586a84"],
    ["notes", "t-note", "付箋", "気づいたことを、端末内に残す。", "#fff8d9", "#b68c24"],
    ["settings", "t-settings", "設定", "このテンプレートの演出密度を切り替える。", "#f0f2f8", "#65748b"]
  ];

  function renderHome() {
    const root = shell("KFA-ARCHIVE-07 / TEMPLATE", "アプリ ライブラリ", "すべてローカルで動く、謎解き用の記録アプリ群です。各アプリはそのまま使っても、データだけ差し替えて別の事件へ転用しても構いません。");
    const hero = make("section", "tool-hero");
    const heroText = make("div");
    heroText.append(make("p", "page-kicker", "INTERACTIVE PUZZLE OS"), make("h2", "page-title", "記録は、答えより先に\n操作される。"), make("p", "page-lede", "音・時刻・画像・位置・欠損ファイルを、それぞれ違う方法で扱えるように設計しています。"));
    hero.append(heroText);
    root.append(hero);
    const grid = make("div", "library-grid");
    appCards.forEach(([id, iconName, title, desc, soft, accent]) => {
      const item = make("button", "library-card");
      item.type = "button";
      item.dataset.openTool = id;
      item.style.setProperty("--card-soft", soft);
      item.style.setProperty("--card-accent", accent);
      const mark = make("span", "library-icon");
      mark.append(icon(iconName));
      item.append(mark, make("strong", "", title), make("p", "", desc), make("small", "library-state", state.opened[id] ? "記録を開きました" : "ローカルアプリ"));
      grid.append(item);
    });
    root.append(grid);
    return root;
  }

  function recorderTranscript(position) {
    const box = make("aside", "tool-card transcript-panel");
    box.append(make("h3", "", "文字起こし / 断片"));
    box.append(make("p", "", "[00:00–00:21]　水音、遠い金属音。"));
    if (position >= 42) box.append(make("p", "revealed", "[01:18]　『記録は、港ではなく保管区から始まった。』"));
    else box.append(make("p", "locked", "未再生の区間があります。"), icon("t-lock"));
    if (position >= 78) box.append(make("p", "revealed", "[02:37]　『時計は止まっていない。こちらが遅れている。』"));
    else box.append(make("p", "locked", "深い無音区間は再生位置で解放されます。"));
    return box;
  }

  function renderRecorder() {
    const root = shell("RECORDER / R-14", "音声レコーダー", "再生位置を移動して、通常の通話では聞こえない断片を確認します。音声はこの端末内の短い信号音だけです。");
    const grid = make("div", "recorder-grid");
    const card = make("section", "tool-card recorder-display");
    card.append(make("div", "tape-meta"));
    const meta = qs(".tape-meta", card);
    ["K-14 / recovered", "02:57", "LOCAL AUDIO"].forEach((text) => meta.append(make("span", "tag", text)));
    meta.append(make("span", "tag alert", "counter fixed 03:17"));
    const frame = make("div", "waveframe");
    frame.style.setProperty("--playhead", `${state.recorder.position}%`);
    Array.from({ length: 66 }, (_, index) => {
      const height = 18 + ((index * 17) % 63) + (index % 8 === 0 ? 28 : 0);
      const bar = make("i", "wavebar");
      bar.style.setProperty("--h", `${Math.min(height, 94)}%`);
      frame.append(bar);
    });
    const transport = make("div", "transport");
    const play = make("button", "round-action");
    play.type = "button";
    play.setAttribute("aria-label", state.recorder.playing ? "一時停止" : "再生");
    play.append(icon(state.recorder.playing ? "t-pause" : "t-play"));
    const range = document.createElement("input");
    range.type = "range"; range.min = "0"; range.max = "100"; range.value = String(state.recorder.position); range.setAttribute("aria-label", "再生位置");
    const elapsed = Math.round((state.recorder.position / 100) * 177);
    const time = make("time", "", `${String(Math.floor(elapsed / 60)).padStart(2, "0")}:${String(elapsed % 60).padStart(2, "0")}`);
    transport.append(play, range, time);
    card.append(frame, transport);
    range.addEventListener("input", () => { state.recorder.position = Number(range.value); state.recorder.playing = false; persist(); showTool("recorder"); });
    play.addEventListener("click", () => toggleRecorder());
    grid.append(card, recorderTranscript(state.recorder.position));
    root.append(grid);
    return root;
  }
  function tone() {
    if (!state.settings.sound) return;
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      const ctx = new Ctx(); const osc = ctx.createOscillator(); const gain = ctx.createGain();
      osc.frequency.value = 440; gain.gain.setValueAtTime(.035, ctx.currentTime); gain.gain.exponentialRampToValueAtTime(.001, ctx.currentTime + .16);
      osc.connect(gain).connect(ctx.destination); osc.start(); osc.stop(ctx.currentTime + .17);
    } catch (_error) { /* audio is optional */ }
  }
  function toggleRecorder() {
    state.recorder.playing = !state.recorder.playing;
    persist(); tone();
    window.clearInterval(recorderTimer);
    if (state.recorder.playing) recorderTimer = window.setInterval(() => {
      state.recorder.position = Math.min(100, state.recorder.position + 1);
      if (state.recorder.position >= 100) state.recorder.playing = false;
      persist(); showTool("recorder");
    }, reducedMotion.matches ? 350 : 170);
    showTool("recorder");
  }

  const calendarEvents = {
    "0710": { date: "2026年7月10日", title: "夜間引継ぎ", body: "第七码頭の回収品は、朝まで保管庫から出さない。記録が重複した場合は、紙の台帳ではなく端末の時刻を優先する。", where: "KFA-ARCHIVE-07 / 管理室", who: "早瀬 真琴" },
    "0713": { date: "2026年7月13日", title: "録音機の再検査", body: "音声検査室を予約。再生カウンターが03:17を超えない場合は、逆方向からの再生を試す。", where: "保管棟 B-2", who: "検査担当" },
    "1131": { date: "1998年11月31日", title: "存在しない予定", body: "カレンダーには存在しない日付なのに、保管区の予約だけが残っている。作成者欄は空白。終了時刻だけが03:17。", where: "第七码頭保管区", who: "参加者未確認" }
  };
  function renderCalendar() {
    const root = shell("CALENDAR / JULY 2026", "カレンダー", "予定の件名よりも、日時・場所・参加者の食い違いに注目してください。存在しない日付は、記録としてだけ残ります。");
    const layout = make("div", "calendar-layout");
    const card = make("section", "tool-card");
    card.append(cardHead("2026年 7月", "保存済み予定 3件"));
    const grid = make("div", "calendar-grid");
    ["日","月","火","水","木","金","土"].forEach((day) => grid.append(make("div", "calendar-weekday", day)));
    const padding = 3;
    for (let index = 0; index < padding; index += 1) grid.append(make("div", "calendar-weekday", ""));
    for (let day = 1; day <= 31; day += 1) {
      const id = `07${String(day).padStart(2, "0")}`;
      const entry = calendarEvents[id];
      const cell = make("button", `calendar-day${entry ? " has-event" : ""}`, String(day));
      cell.type = "button"; cell.dataset.calendarId = id;
      if (entry) cell.setAttribute("aria-label", `${day}日 ${entry.title}`);
      cell.addEventListener("click", () => { state.calendar.selected = id; persist(); showTool("calendar"); });
      grid.append(cell);
    }
    const impossible = make("button", "calendar-day impossible", "31");
    impossible.type = "button"; impossible.dataset.calendarId = "1131"; impossible.setAttribute("aria-label", "11月31日 存在しない予定");
    impossible.addEventListener("click", () => { state.calendar.selected = "1131"; persist(); showTool("calendar"); });
    grid.append(impossible);
    card.append(grid);
    const detail = make("aside", "tool-card calendar-detail");
    const event = calendarEvents[state.calendar.selected] || calendarEvents["1131"];
    detail.append(make("p", "detail-date", event.date), make("h2", "", event.title), make("p", "", event.body));
    const dl = document.createElement("dl");
    [["場所", event.where],["参加者", event.who],["終了記録", event.date.includes("1998") ? "03:17" : "未記入"]].forEach(([term,value]) => { const row=document.createElement("div"); row.append(make("dt","",term),make("dd","",value)); dl.append(row); });
    detail.append(dl); layout.append(card, detail); root.append(layout); return root;
  }

  const photoItems = [
    { id:"pier", title:"第七码頭 / 03:17", date:"1998/11/31 03:17", source:"assets/pier-7-night.png", note:"保管区の外側。時計の位置だけが、別日の記録と一致する。", lens:"C-04 / 24 mm", filter:"" },
    { id:"recorder", title:"回収品 K-14", date:"2026/07/10 02:58", source:"assets/lot-0417-recorder.png", note:"水損した録音機。再生カウンターは固定されている。", lens:"LAB-CAM / macro", filter:"saturate(.72) contrast(1.08)" },
    { id:"reliquary", title:"保管庫 / 未分類", date:"日時情報なし", source:"assets/lot-0000-reliquary.png", note:"撮影者欄が欠損。フレーム端の影は、対象物のものではない。", lens:"ARCHIVE SCAN", filter:"saturate(.55) brightness(.82)" }
  ];
  function renderPhotos() {
    const root = shell("PHOTOS / INSPECT", "写真", "画像は拡大して確認できます。記録時刻・撮影条件・写っていないものも、手がかりにできます。");
    const layout = make("div", "photo-layout");
    const gallery = make("section", "tool-card"); gallery.append(cardHead("ローカル写真", "3件"));
    const grid = make("div", "photo-grid");
    photoItems.forEach((item) => {
      const node = make("button", "photo-thumb"); node.type="button"; node.dataset.photoId=item.id;
      const fig=document.createElement("figure"); const image=document.createElement("img"); image.src=item.source; image.alt=item.title; image.style.setProperty("--photo-filter",item.filter); fig.append(image);
      node.append(fig,make("b","",item.title),make("small","",item.date));
      node.addEventListener("click",()=>{state.photos.selected=item.id;persist();showTool("photos");}); grid.append(node);
    });
    gallery.append(grid);
    const inspector = make("aside", "tool-card photo-inspector");
    const selected = photoItems.find((item)=>item.id===state.photos.selected)||photoItems[0];
    const fig=document.createElement("figure"); const image=document.createElement("img"); image.src=selected.source; image.alt=`拡大: ${selected.title}`; image.style.setProperty("filter",selected.filter); image.style.setProperty("--zoom",String(state.photos.zoom)); fig.append(image);
    const zoom=document.createElement("input"); zoom.className="zoom-range"; zoom.type="range"; zoom.min="1"; zoom.max="2.4"; zoom.step="0.1"; zoom.value=String(state.photos.zoom); zoom.setAttribute("aria-label","画像を拡大"); zoom.addEventListener("input",()=>{state.photos.zoom=Number(zoom.value);persist();showTool("photos");});
    inspector.append(fig,make("h2","",selected.title),make("p","",selected.note),zoom);
    const meta=make("div","meta-list"); [["記録日時",selected.date],["撮影装置",selected.lens],["保存先","KFA-ARCHIVE-07"]].forEach(([a,b])=>{const row=make("div");row.append(make("span","",a),make("b","",b));meta.append(row);}); inspector.append(meta);
    layout.append(gallery,inspector);root.append(layout);return root;
  }

  const mapPoints = {
    pier:{ name:"第七码頭", detail:"水損した録音機が回収された場所。夜間の写真と監視カメラの視点が重なる。", log:["C-04 / 03:17 で記録欠損","回収番号 K-14","波止場側ゲートは閉鎖中"], pos:["66%","55%"] },
    archive:{ name:"保管棟 B-2", detail:"再生検査室。録音機が移動した記録はあるが、搬入者は空欄のまま。", log:["予約: 1998/11/31","担当者: 未確認","最終退室: 03:17"], pos:["28%","37%"] },
    gate:{ name:"管理室ゲート", detail:"入退室ログの出口側。入室記録のない退室だけが残っている。", log:["認証: 03:17","識別子: なし","監視範囲: C-04"], pos:["42%","72%"] }
  };
  function renderMap() {
    const root=shell("MAP / PIER-7", "地図", "地点を選ぶと、同じ出来事を別の記録媒体から追えます。位置の一致は、答えではなく次に見るべきアプリを示します。");
    const layout=make("div","map-layout"); const map=make("section","map-surface");
    Object.entries(mapPoints).forEach(([id,item])=>{const pin=make("button",`map-pin${state.map.selected===id?" active":""}`);pin.type="button";pin.dataset.mapId=id;pin.style.left=item.pos[0];pin.style.top=item.pos[1];pin.setAttribute("aria-label",item.name);pin.append(icon("t-pin"));pin.addEventListener("click",()=>{state.map.selected=id;persist();showTool("map");});map.append(pin);});
    const point=mapPoints[state.map.selected]||mapPoints.pier; const detail=make("aside","tool-card map-detail");detail.append(make("p","page-kicker","LOCATION RECORD"),make("h2","",point.name),make("p","",point.detail)); const list=document.createElement("ul");point.log.forEach((line,index)=>{const li=make("li");li.append(make("b","",["監視","台帳","状態"][index]),document.createTextNode(line));list.append(li);});detail.append(list);layout.append(map,detail);root.append(layout);return root;
  }

  const downloads = {
    manifest:{name:"pier7_manifest.partial",meta:"4 KB · 03:12 · 破損",body:"ARCHIVE DELIVERY / PARTIAL\n\nK-12  CLOCK\nK-13  ACCESS LOG\nK-14  RECORDER\n\nDATE : 1998/11/31\nTIME : 03:17\n\n[tail bytes missing]"},
    frames:{name:"C04_0317_frames.zip",meta:"12 MB · 03:18 · 暗号化",body:"C-04 FRAME SET\n\nframe_0001  available\nframe_0002  available\nframe_0003  unavailable\nframe_0004  recovered after local repair\n\nNo external recovery service is used."},
    memo:{name:"unsent_handoff.txt",meta:"1 KB · 03:16 · 削除済み",body:"夜間担当へ\n\n連絡先を探す前に、\n時刻・日付・LOTを別々に確認すること。\n\n名前を尋ねられても答えない。"}
  };
  function renderDownloads() {
    const root=shell("DOWNLOADS / RECOVERY", "ダウンロード", "ファイルは端末の外へ送信されません。復元操作は、このテンプレート内の表示状態だけを変えます。");const layout=make("div","download-layout");const card=make("section","tool-card");card.append(cardHead("ローカル配布物","3件"));const list=make("div","download-list");
    Object.entries(downloads).forEach(([id,item])=>{const row=make("div","download-row");const mark=make("span","file-mark");mark.append(icon("t-file"));const detail=make("div");detail.append(make("strong","",item.name),make("small","",item.meta));const status=make("span",`status${state.downloads.recovered[id]?" recovered":""}`,state.downloads.recovered[id]?"復元済み":"要確認");const action=button(state.downloads.recovered[id]?"開く":"復元",state.downloads.recovered[id]?"tool-button":"tool-button primary",state.downloads.recovered[id]?"t-file":"t-download");action.dataset.downloadId=id;action.addEventListener("click",()=>{state.downloads.selected=id;if(!state.downloads.recovered[id]){state.downloads.recovered[id]=true;toast("ファイル断片を端末内で復元しました。");}persist();showTool("downloads");});row.append(mark,detail,status,action);list.append(row);});card.append(list);
    const selected=downloads[state.downloads.selected]||downloads.manifest;const preview=make("aside","tool-card download-preview");preview.append(make("h2","",selected.name),make("p","",state.downloads.recovered[state.downloads.selected]?"表示可能な断片です。内容はローカルに留まります。":"復元前のプレビューです。"),make("pre","",selected.body));layout.append(card,preview);root.append(layout);return root;
  }

  const cameraFrames=[
    ["03:16:54 / frame 0001","通常記録。桟橋は空いている。",.72],
    ["03:17:00 / frame 0002","時計だけが光って見える。",.67],
    ["03:17:04 / frame 0003","フレーム欠損。映像は残っていない。",.38],
    ["03:17:08 / frame 0004","修復後の先頭フレーム。波止場側の反射が増えている。",.61]
  ];
  function renderCamera() {
    const root=shell("CAMERA / C-04", "監視カメラ", "フレームを前後に動かし、欠損した時間の前後を比べます。ライブ映像や外部カメラには接続しません。");const layout=make("div","camera-layout");const card=make("section","tool-card");card.append(cardHead("第七码頭 / 固定カメラ","REC · LOCAL ARCHIVE"));const frameData=cameraFrames[state.camera.frame]||cameraFrames[0];const frame=make("div","camera-frame");frame.dataset.frameLabel=frameData[0];frame.style.setProperty("--camera-brightness",String(frameData[2]));const image=document.createElement("img");image.src="assets/pier-7-night.png";image.alt="夜の第七码頭を映す監視カメラ記録";frame.append(image,make("div","camera-scan"));const controls=make("div","camera-controls");const label=make("label","","フレームを移動");const range=document.createElement("input");range.type="range";range.min="0";range.max="3";range.step="1";range.value=String(state.camera.frame);range.setAttribute("aria-label","監視カメラのフレーム");range.addEventListener("input",()=>{state.camera.frame=Number(range.value);persist();showTool("camera");});label.append(range);const repair=button(state.camera.repaired?"修復済み":"欠損を復元","tool-button primary","t-download");repair.addEventListener("click",()=>{state.camera.repaired=true;state.camera.frame=3;persist();showTool("camera");toast("欠損フレームの参照を更新しました。");});controls.append(label,repair);card.append(frame,controls);
    const note=make("aside","tool-card camera-note");note.append(make("p","page-kicker","FRAME NOTE"),make("h2","",frameData[0]),make("p","",frameData[1]));const logs=make("div","frame-log");cameraFrames.forEach(([name,text],i)=>{const row=make("div");row.append(make("span","",name),make("span","",i===2&&!state.camera.repaired?"欠損":"保存"));logs.append(row);});note.append(logs);layout.append(card,note);root.append(layout);return root;
  }

  function renderNotes() {
    const root=shell("NOTES / LOCAL", "付箋", "プレイヤーのメモはこのブラウザ内に保存されます。重要な情報を一箇所に集め、別のアプリで得た断片を並べ替えてください。");const layout=make("div","notes-layout");const board=make("section","tool-card note-board");state.notes.forEach((item,index)=>{const sticky=make("button","sticky");sticky.type="button";sticky.style.setProperty("--tilt",`${(index%3-1)*1.3}deg`);sticky.dataset.noteId=item.id;sticky.append(make("b","",item.title||"無題"),make("p","",item.body));sticky.addEventListener("click",()=>{state.selectedNote=item.id;persist();showTool("notes");});board.append(sticky);});const editor=make("aside","tool-card note-editor");const active=state.notes.find((item)=>item.id===state.selectedNote)||state.notes[0];editor.append(make("h2","",active?"付箋を編集":"新しい付箋"));const title=document.createElement("input");title.value=active?.title||"";title.placeholder="見出し";title.setAttribute("aria-label","付箋の見出し");const body=document.createElement("textarea");body.value=active?.body||"";body.placeholder="気づいたことを書く";body.setAttribute("aria-label","付箋の本文");const foot=document.createElement("footer");const add=button("新規","tool-button");const save=button("保存","tool-button primary","t-check");add.addEventListener("click",()=>{const item={id:`n-${Date.now()}`,title:"新しい付箋",body:""};state.notes.unshift(item);state.selectedNote=item.id;persist();showTool("notes");});save.addEventListener("click",()=>{if(!active)return;active.title=title.value.trim()||"無題";active.body=body.value.trim();persist();showTool("notes");toast("付箋をこの端末に保存しました。");});foot.append(make("small","","最大30枚まで保存できます。"),make("span",""));qs("span",foot).append(add,save);editor.append(title,body,foot);layout.append(board,editor);root.append(layout);return root;
  }

  function renderSettings() {
    const root=shell("SETTINGS / TEMPLATE", "設定", "謎のデータを消さず、見せ方だけを調整できます。テンプレート状態のリセットは、保存した付箋や復元状態も初期化します。");const grid=make("div","settings-grid");const list=make("section","tool-card setting-list");list.append(cardHead("演出と操作","LOCAL PREFERENCES"));const rows=[
      ["archiveLens","アーカイブレンズ","記録アプリのコントラストをわずかに強めます。"],
      ["compact","コンパクト表示","カードの余白を減らして情報量を増やします。"],
      ["sound","信号音","音声レコーダーの短いローカル信号音を有効にします。"]
    ];
    rows.forEach(([key,title,desc])=>{const row=make("div","setting-row");const text=make("span");text.append(make("b","",title),make("small","",desc));const sw=make("button","switch");sw.type="button";sw.dataset.setting=key;sw.setAttribute("aria-pressed",String(Boolean(state.settings[key])));sw.setAttribute("aria-label",`${title}を切り替える`);sw.addEventListener("click",()=>{state.settings[key]=!state.settings[key];persist();showTool("settings");});row.append(text,sw);list.append(row);});const note=make("aside","tool-card template-note");note.append(make("p","page-kicker","REUSABLE TEMPLATE"),make("h2","", "別の事件へ差し替える場所"),make("p","", "各アプリの記録データは tools.js にまとめています。物語ごとに時刻、地点、ファイル名、写真、台詞を差し替えるだけで再利用できます。"));const checklist=document.createElement("ul");checklist.className="template-list";["音・映像・地図で同じ出来事を別方向から示す","解答を単一アプリに置かず、照合で導く","プレイヤー用の付箋を必ず用意する"].forEach((text)=>{const item=make("li");item.append(icon("t-check"),document.createTextNode(text));checklist.append(item);});note.append(checklist);grid.append(list,note);root.append(grid);return root;
  }

  const toolRegistry={home:renderHome,recorder:renderRecorder,calendar:renderCalendar,photos:renderPhotos,map:renderMap,downloads:renderDownloads,camera:renderCamera,notes:renderNotes,settings:renderSettings};
  const toolNames={home:"謎解きツール",recorder:"音声レコーダー",calendar:"カレンダー",photos:"写真",map:"地図",downloads:"ダウンロード",camera:"監視カメラ",notes:"付箋",settings:"設定"};
  const isEmbedded=Boolean(embeddedApp&&toolRegistry[embeddedApp]);
  if(isEmbedded){document.body.classList.add("embedded");document.title=`${toolNames[embeddedApp]} — KFA-ARCHIVE-07`;}
  qsa("[data-tool]").forEach((node)=>node.addEventListener("click",()=>showTool(node.dataset.tool)));
  document.addEventListener("click",(event)=>{const target=event.target.closest("[data-open-tool]");if(target)showTool(target.dataset.openTool);});
  qs(".brand")?.addEventListener("click", (event) => {
    if (window.parent === window) return;
    event.preventDefault();
    window.parent.postMessage({ type: "kfa-desktop", action: "close-browser" }, window.location.origin);
  });
  qs("[data-tools-reset]")?.addEventListener("click",()=>{if(!window.confirm("保存した付箋、復元状態、設定を初期化しますか？"))return;Object.assign(state,clone(defaults));persist();showTool("home");toast("テンプレート状態を初期化しました。");});
  function updateClock(){const now=new Date();const clock=qs("[data-tools-clock]");if(clock)clock.textContent=new Intl.DateTimeFormat("ja-JP",{hour:"2-digit",minute:"2-digit",hour12:false}).format(now);} 
  const initialTool=isEmbedded?embeddedApp:(state.active in toolRegistry?state.active:"home");
  updateClock();window.setInterval(updateClock,1000);showTool(initialTool);
})();
