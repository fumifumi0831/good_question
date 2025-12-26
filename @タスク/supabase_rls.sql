-- Good Question RLS (Row Level Security) ポリシー
-- Supabase SQL Editor で実行してください

-- RLS を有効化
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_stats ENABLE ROW LEVEL SECURITY;

-- ========================================
-- users テーブルのポリシー
-- ========================================

-- ユーザーは自分のレコードのみ参照可能
CREATE POLICY "Users can view own user data"
  ON public.users
  FOR SELECT
  USING (auth.uid() = id);

-- ユーザーは自分のレコードのみ更新可能
CREATE POLICY "Users can update own user data"
  ON public.users
  FOR UPDATE
  USING (auth.uid() = id);

-- ========================================
-- game_sessions テーブルのポリシー
-- ========================================

-- ユーザーは自分のセッションのみ参照可能
CREATE POLICY "Users can view own sessions"
  ON public.game_sessions
  FOR SELECT
  USING (auth.uid() = user_id);

-- ユーザーは自分のセッションのみ作成可能
CREATE POLICY "Users can create own sessions"
  ON public.game_sessions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ユーザーは自分のセッションのみ更新可能
CREATE POLICY "Users can update own sessions"
  ON public.game_sessions
  FOR UPDATE
  USING (auth.uid() = user_id);

-- ユーザーは自分のセッションのみ削除可能
CREATE POLICY "Users can delete own sessions"
  ON public.game_sessions
  FOR DELETE
  USING (auth.uid() = user_id);

-- ========================================
-- chat_messages テーブルのポリシー
-- ========================================

-- ユーザーは自分のセッションのメッセージのみ参照可能
CREATE POLICY "Users can view own messages"
  ON public.chat_messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.game_sessions
      WHERE game_sessions.id = chat_messages.session_id
        AND game_sessions.user_id = auth.uid()
    )
  );

-- ユーザーは自分のセッションにメッセージを作成可能
CREATE POLICY "Users can create own messages"
  ON public.chat_messages
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.game_sessions
      WHERE game_sessions.id = chat_messages.session_id
        AND game_sessions.user_id = auth.uid()
    )
  );

-- ユーザーは自分のセッションのメッセージを更新可能
CREATE POLICY "Users can update own messages"
  ON public.chat_messages
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.game_sessions
      WHERE game_sessions.id = chat_messages.session_id
        AND game_sessions.user_id = auth.uid()
    )
  );

-- ========================================
-- usage_logs テーブルのポリシー
-- ========================================

-- ユーザーは自分の使用ログのみ参照可能
CREATE POLICY "Users can view own usage logs"
  ON public.usage_logs
  FOR SELECT
  USING (auth.uid() = user_id);

-- ユーザーは自分の使用ログのみ作成可能
CREATE POLICY "Users can create own usage logs"
  ON public.usage_logs
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ========================================
-- user_stats テーブルのポリシー
-- ========================================

-- ユーザーは自分の統計のみ参照可能
CREATE POLICY "Users can view own stats"
  ON public.user_stats
  FOR SELECT
  USING (auth.uid() = user_id);

-- ユーザーは自分の統計のみ作成可能
CREATE POLICY "Users can create own stats"
  ON public.user_stats
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ユーザーは自分の統計のみ更新可能
CREATE POLICY "Users can update own stats"
  ON public.user_stats
  FOR UPDATE
  USING (auth.uid() = user_id);

-- 完了メッセージ
SELECT 'RLS ポリシーの設定が完了しました！' AS message;
