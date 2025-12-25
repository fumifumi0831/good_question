# データベース設計書 (Dexie.js / IndexedDB)

## 1. システム概要
- **目的**: ユーザーの学習体験を損なわない高速なデータ I/O と、成長軌跡の可視化。
- **全体アーキテクチャ**: クライアントサイド・ローカル永続化（Local First）。
- **技術選定理由**: 
    - **Dexie.js**: IndexedDB の複雑な API を Promise ベースで簡略化し、スキーマ管理と変更検知を容易にするため。
    - **プライバシー**: 個人のインタビューログをサーバーに送らず、ローカルで完結させることで心理的安全性を確保。

## 2. 概念データモデル

### エンティティ定義書
| エンティティ名 | 概要・目的 | 主要属性 | ビジネスルール |
| :--- | :--- | :--- | :--- |
| **gameSessions** | 1回のトレーニング単位 | industry, theme, scores, timestamp | 直近50件をアクティブ保持し、以降は統計のみ残す。 |
| **chatMessages** | インタビューの全やり取り | role, content, reachability, helpInfo | 各メッセージにヘルプの参照有無を紐づける。 |
| **userStats** | 全期間の統計と思考の癖 | totalSessions, averageScores, habits | セッション終了のたびに自動更新される。 |

## 3. 論理データモデル (Dexie Schema)

### ストア名: `gameSessions`
| カラム名 (物理名) | データ型 | 索引 (Index) | 備考 |
| :--- | :--- | :--- | :--- |
| `id` | string (UUID) | ++ (Auto-inc) | 主キー |
| `industry` | string | | 例: 製造業, IT, 金融 |
| `theme` | string | | 例: 生産性低下, システム障害 |
| `difficulty` | string | | |
| `scenario` | object | | シナリオのコンテキスト全文 |
| `totalScore` | number | | 総合点 |
| `scores` | object | | 構造化, 共感, 仮説の個別点 |
| `helpCount` | number | | そのセッションでのヘルプ利用総数 |
| `timestamp` | number | ✓ | 並び替え用 (Date.now()) |
| `status` | string | | active / archived |

### ストア名: `chatMessages`
| カラム名 (物理名) | データ型 | 索引 (Index) | 備考 |
| :--- | :--- | :--- | :--- |
| `id` | string | ++ | 主キー |
| `sessionId` | string | ✓ | `gameSessions.id` との紐付け |
| `role` | string | | user / assistant / system |
| `content` | string | | 発言内容 |
| `reachability` | number | | 真因到達度 (%) |
| `helpUsed` | boolean | | ヘルプを使用した発言か |
| `helpContent` | string | | AIから提示されたアドバイス・整理の全文 |
| `timestamp` | number | | |

### ストア名: `userStats`
| カラム名 (物理名) | データ型 | 索引 (Index) | 備考 |
| :--- | :--- | :--- | :--- |
| `key` | string | ++ | "singleton" 等の固定キー |
| `totalSessions` | number | | |
| `avgScores` | object | | カテゴリごとの平均 |
| `knowledgeNotes` | array | | AIが抽出した「思考の癖」のリスト |
| `lastUpdated` | number | | |

## 4. 運用・保守設計

### データ保持・アーカイブ方針
- **フェーズ1 (実装)**: 
    - `gameSessions` は UUID で管理。
    - 50件を超えた場合、古い順に `status` を 'archived' に変更するか、あるいは `userStats` に重要情報をマージして物理削除するロジックを実装。
- **ヘルプ履歴の活用**:
    - 全メッセージに `helpUsed` / `helpContent` を持たせることで、「アドバイスを見たから気づけたのか、自力で気づけたのか」を事後分析で区別可能にする。

### セキュリティ設計
- **アクセス制御**: ブラウザの同一オリジンポリシー (Same-Origin Policy) に依存。
- **暗号化**: 
    - ユーザーのログイン情報やAPIキーは Vercel 環境変数およびセキュア Cookie/メモリ上で管理し、IndexedDB には保存しない。
    - インタビューログ自体は、現時点ではパフォーマンスと開発速度を優先し、平文で保存する。

## 5. テスト設計
- **単体テスト**: Dexie の初期化、テーブル作成の確認。
- **結合テスト**: 大量件数 (100件〜) 時のクエリパフォーマンスと、50件上限のアーカイブ処理の正確性。
