# Kagefuda Archive Terminal

架空の不穏な高級オークションサイトと、そこへ接続するWindows風の仮想端末を一体化したブラウザARGプロトタイプです。

## Preview

- 仮想デスクトップ: https://ailiferyoya-gif.github.io/KagefudaAuction/desktop.html
- ローカル検索: https://ailiferyoya-gif.github.io/KagefudaAuction/search.html
- 影札オークション: https://ailiferyoya-gif.github.io/KagefudaAuction/

仮想端末には、ドラッグ・最大化・最小化できるウィンドウ、Google風のローカル検索、サイト内ブラウザ、LINE風トーク、ローカルMail、架空内線キーパッド、ローカル音声通話、エクスプローラー、メモ帳、ごみ箱を実装しています。さらに音声レコーダー、カレンダー、写真、地図、ダウンロード、監視カメラ、付箋、設定を、それぞれ独立したデスクトップアプリとして直接起動できます。状態は同一ブラウザの `localStorage` にだけ保存されます。

実在の商品、団体、取引、人物、電話番号とは関係ありません。外部へのメッセージ送信、実電話への発信、マイク取得、決済、会員登録は発生しません。

全アプリ一覧は [tools.html](https://ailiferyoya-gif.github.io/KagefudaAuction/tools.html) からも直接開けます。各デスクトップアプリは同じレンダラーを単体埋め込みで再利用するため、事件ごとに `tools.js` の記録データを差し替えるだけで一括更新できます。
