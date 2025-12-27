# Google OAuth リダイレクト URI エラー修正ガイド

## 🚨 エラー内容

```
エラー 400: redirect_uri_mismatch
アクセスをブロック: このアプリのリクエストは無効です
```

## 🔍 原因

Google OAuth の設定で、**許可されたリダイレクト URI** に Supabase のコールバック URL が登録されていないため、エラーが発生しています。

## 📋 修正手順

### ステップ 1: Supabase のコールバック URL を確認

1. [Supabase Dashboard](https://supabase.com/dashboard) を開く
2. プロジェクト `jxqfqvorvbgijbchtbyp` を選択
3. 左サイドバーの **Authentication** → **Providers** をクリック
4. **Google** プロバイダーを選択
5. **Callback URL (for OAuth)** をコピー
   - 形式: `https://jxqfqvorvbgijbchtbyp.supabase.co/auth/v1/callback`

### ステップ 2: Google Cloud Console で設定

1. [Google Cloud Console](https://console.cloud.google.com/) を開く
2. プロジェクトを選択（OAuth クライアント ID を作成したプロジェクト）
3. 左サイドバーの **APIs & Services** → **認証情報** をクリック
4. OAuth 2.0 クライアント ID のリストから、使用しているクライアント ID をクリック

### ステップ 3: リダイレクト URI を追加

1. **承認済みのリダイレクト URI** セクションまでスクロール
2. **+ URI を追加** をクリック
3. Supabase のコールバック URL を貼り付け
   - 例: `https://jxqfqvorvbgijbchtbyp.supabase.co/auth/v1/callback`
4. **保存** をクリック

### ステップ 4: 開発環境用の URI も追加（オプション）

開発中は localhost も追加することを推奨します：

1. **+ URI を追加** をクリック
2. `http://localhost:3000/auth/callback` を追加
3. **保存** をクリック

### ステップ 5: 設定の反映を待つ

Google の設定変更は数分かかる場合があります。5分ほど待ってから再度試してください。

## ✅ 確認方法

1. ブラウザで `http://localhost:3000/auth/signup` を開く
2. **Google で登録** ボタンをクリック
3. Google のログイン画面が表示されることを確認
4. アカウントを選択してログイン
5. エラーが表示されず、アプリにリダイレクトされることを確認

## 📝 注意事項

- **本番環境**: デプロイ後は本番環境の URL も追加する必要があります
  - 例: `https://your-domain.com/auth/callback`
- **複数の環境**: 開発、ステージング、本番それぞれの URL を追加してください

## 🔗 参考リンク

- [Supabase Auth with Google](https://supabase.com/docs/guides/auth/social-login/auth-google)
- [Google OAuth 2.0 設定](https://developers.google.com/identity/protocols/oauth2)
