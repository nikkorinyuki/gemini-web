# Gemini Web Chat

音声入力機能付きのGeminiチャットアプリケーションです。

## 特徴

- 🎤 **音声入力対応**: Web Speech APIを使用したリアルタイム音声認識
- 💬 **ストリーミング応答**: Gemini APIからのストリーミングレスポンスに対応
- 🚀 **スタック**: Hono + HonoX + Vite + Tailwind CSS

## プレビュー

![スクリーンショット](https://i.gyazo.com/c04856fde9c6bd68606f95832ef9f877.png)

## 技術スタック

- **フレームワーク**: [Hono](https://hono.dev/) + [HonoX](https://github.com/honojs/honox)
- **ビルドツール**: [Vite](https://vitejs.dev/)
- **スタイリング**: [Tailwind CSS](https://tailwindcss.com/)
- **AI SDK**: [Google GenAI SDK](https://www.npmjs.com/package/@google/genai)

## セットアップ

### 前提条件

- Node.js 18以上
- pnpm
- Gemini API Key

### インストール手順

1. リポジトリをクローン

```bash
git clone https://github.com/nikkorinyuki/gemini-web.git
cd gemini-web
```

2. 依存関係をインストール

```bash
pnpm install
```

3. 環境変数を設定

`.env`ファイルをプロジェクトルートに作成し、Gemini APIキーを設定:

```env
GEMINI_API_KEY=your_api_key_here
GEMINI_MODEL=gemini-2.5-flash-lite
```

4. 開発サーバーを起動

```bash
pnpm dev
```

5. ブラウザでアクセス

```
http://localhost:5173
```

## 使い方

1. **テキスト入力**: 画面下部の入力欄にメッセージを入力して「送信」ボタンをクリック
2. **音声入力**: 
   - 「音声開始」ボタンをクリックして音声認識を開始
   - マイクに向かって話すと、自動的にテキスト化されます
   - 「音声停止」ボタンで音声認識を終了
   - 認識されたテキストは入力欄に追加されます
3. **会話履歴の削除**: 画面上部の「会話履歴を削除」ボタンで全ての会話をクリア

## API エンドポイント

### POST `/api/chat`

Gemini APIとのストリーミングチャット

**リクエスト:**
```json
{
  "prompt": "こんにちは"
}
```

**レスポンス:**
テキストストリーム形式でGeminiの応答を返します

## ブラウザ対応

音声認識機能は以下のブラウザでサポートされています:
- Chrome / Edge (推奨)
- Safari (一部機能制限あり)

## ライセンス

MIT

## 貢献

プルリクエストを歓迎します！

## 感謝

ChatGPT