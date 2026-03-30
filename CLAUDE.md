# bongda-io — AI Context

## 專案概述
越南足球數據網站，定位為「越南版 Sofascore」。
目標市場：越南用戶 | 介面語言：越南語

## 技術棧
- **Frontend**: Vite + React（inline styles，無 CSS framework）
- **部署**: Vercel（含 Serverless Functions）
- **資料源**: API-Football v3（api-sports.io）
- **本地開發**: `vercel dev`（必須從本專案目錄執行）

## 資料夾結構
```
bongda-io/
├── api/
│   └── football.js          # Vercel serverless proxy → api-sports.io
├── src/
│   ├── App.jsx              # 主應用，含所有 UI components
│   ├── main.jsx             # React entry point
│   └── providers/
│       ├── index.js         # 統一出口：export activeProvider
│       ├── apiFootball.js   # 主 provider（API-Football schema）
│       └── footballData.js  # 備援 provider（football-data.org schema）
├── .env.local               # API_FOOTBALL_TOKEN（勿 commit）
├── vercel.json
└── vite.config.js
```

## Provider 架構（重要）
所有資料都透過 adapter 層，未來可無痛換資料源。

**切換 provider** → 只需改 `src/providers/index.js` 第一行：
```js
export const activeProvider = apiFootball; // 換成 footballData 即可切換
```

**內部統一 schema**：
- `normalizeStandings(raw)` → `{ position, team{id,name,crest}, played, won, draw, lost, gf, ga, gd, points, form }`
- `normalizeMatches(raw)` → `{ id, matchday, status, minute, utcDate, homeTeam, awayTeam, score{home,away,half} }`
- `normalizeScorers(raw)` → `{ rank, player{name,nationality}, team{name,crest}, goals, assists, penalties }`

**Status 值**：`SCHEDULED` | `IN_PLAY` | `FINISHED`

## API Proxy（api/football.js）
- 路由：`GET /api/football?endpoint=standings&league=341&season=2025`
- Token 在 server 端，從不暴露給瀏覽器
- Cache：live 比賽 60s，其他 3600s（免費限額 100 次/天）
- Endpoint 白名單過濾：只允許 `^[\w\-/]+$`

## API-Football 聯賽 ID
| 代碼 | ID  | 聯賽名稱             |
|------|-----|----------------------|
| VL1  | 341 | V.League 1（越南頂級）|
| VL2  | 342 | V.League 2           |
| AFF  | 142 | AFF Championship     |
| AFC  | 17  | AFC Champions League |
| PL   | 39  | Premier League       |
| CL   | 2   | UEFA Champions League|
| PD   | 140 | La Liga              |
| BL1  | 78  | Bundesliga           |
| SA   | 135 | Serie A              |
| FL1  | 61  | Ligue 1              |

## 環境變數
| 變數名稱              | 用途                    |
|-----------------------|-------------------------|
| `API_FOOTBALL_TOKEN`  | API-Football API 金鑰   |

## 越南語 UI 術語對照
| 中文       | 越南語           |
|------------|-----------------|
| 排行榜     | Bảng xếp hạng   |
| 賽程/結果  | Lịch / Kết quả  |
| 射手榜     | Vua phá lưới    |
| 進行中     | Đang đấu        |
| 已結束     | Kết thúc        |
| 未開始     | Sắp diễn ra     |
| 模擬資料   | Dữ liệu mẫu     |
| 球隊       | Đội             |
| 比賽       | Trận            |

## 本地開發
```bash
cd /Users/cody/APPprojects/CodyWEB/bongda-io
vercel dev          # 完整開發（API proxy 可用）
# 或
npm run dev         # 僅前端（只能用 mock 資料）
```

## 待開發功能（優先順序）
1. Live 比分自動刷新（輪詢 /api/football?endpoint=fixtures&live=all）
2. 手機版 RWD（目前 maxWidth: 960px）
3. 比賽詳情頁（進球、黃牌事件時間線）
4. 球隊頁面（陣容、近期成績）

## 注意事項
- API-Football 免費方案：100 requests/day，需注意 cache 設定
- `.vercel/` 已加入 `.gitignore`，正確位置在 `bongda-io/` 目錄下
- `football-stats.jsx`（根目錄）是最初的原型，已被 `src/App.jsx` 取代，可刪除
- 目前 season 硬編碼為 `2024`，定義在 `src/providers/apiFootball.js` 第 8 行（Free plan 只能用 2022–2024）
