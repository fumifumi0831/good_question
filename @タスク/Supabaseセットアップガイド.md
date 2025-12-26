# Supabase セットアップガイド

このガイドに従って、Supabase プロジェクトをセットアップしてください。

## ステップ 1: Supabase プロジェクト作成

1. [Supabase](https://supabase.com/) にアクセスし、アカウントを作成またはログイン
2. "New Project" をクリック
3. プロジェクト情報を入力：
   - **Name**: `good-question-production`（任意）
   - **Database Password**: 強力なパスワードを設定（メモ）
   - **Region**: `Northeast Asia (Tokyo)` を選択（日本のユーザー向け）
4. "Create new project" をクリック
5. プロジェクトの作成が完了するまで待機（1〜2分）

## ステップ 2: API キーの取得

1. 左サイドバーの **Settings** → **API** をクリック
2. 以下の情報をコピー：
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

## ステップ 3: 環境変数の設定

`app/.env.local` ファイルに以下を追加してください：

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Gemini API（既存）
GOOGLE_AI_API_KEY=your_existing_key
```

## ステップ 4: 認証プロバイダーの設定

1. 左サイドバーの **Authentication** → **Providers** をクリック
2. **Email** プロバイダーを有効化：
   - "Enable Email provider" をオン
   - "Confirm email" をオフ（開発中は簡単にするため、本番ではオン推奨）
3. **Google** プロバイダーを有効化（オプション）：
   - "Enable Google provider" をオン
   - Google Cloud Console で OAuth クライアント ID を作成
   - Client ID と Client Secret を入力
   - Redirect URL をコピー: `https://xxxxx.supabase.co/auth/v1/callback`

## 次のステップ

環境変数の設定が完了したら、AI に「完了しました」と伝えてください。
次はデータベーススキーマの作成に進みます。
