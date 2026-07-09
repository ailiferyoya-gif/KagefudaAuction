# 影札オークション 引継ぎ

- 生成済み画像: `assets/lot-0417-recorder.png`（架空の水損カセットレコーダー）
- 実装: UI/UX Pro MaxのSwiss Modernism 2.0、Editorial Grid、Bento Grid指針で再調整。`private-sale.html`を追加した7ページ構成。
- UI強化: ホーム検索を主CTA化、マーケット指標レール、非対称Private Sale、カタログ表示切替、モバイル4項目ドックとボトムシート、短いページ遷移を追加。
- 共通基盤: `styles.css` と `app.js`。検索モーダル、カタログ絞り込み、ローカル保存ウォッチ、カウントダウン、入札デモ、スクロール表示を実装。
- 画像: 既存3点に加え、`hero-vault.png`、`lot-0711-film.png`、`lot-0731-bell.png`、`lot-0804-box.png` をChatGPTで生成して使用。スプライトシート不使用。
- 謎解きの種: 「四番目のベル」「11月31日」「00:17:26」「03:17:42」。現時点では解答を決めていない。
- 次にやること: 必要ならLOT 0529以降の個別詳細ページと、謎の最終解答フローを追加する。

## 公開先

- GitHub: https://github.com/ailiferyoya-gif/KagefudaAuction
- GitHub Pages: https://ailiferyoya-gif.github.io/KagefudaAuction/
- Pages設定: `main` ブランチ / `/ (root)` / `.nojekyll`

## 観測者プロトコル

- `observer.js` が閲覧ページ、検索語、ウォッチ状態を端末内の `localStorage` にのみ記録。
- `observer.html` で個別ID、行動ログ、証拠関係図、段階解放を表示。
- 条件達成と照合語の復元で `lot-0000.html` が解放される。
- 隠しロット画像は `assets/lot-0000-reliquary.png`。ChatGPT生成、スプライトシート不使用。
