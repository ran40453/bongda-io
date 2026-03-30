import { useState, useEffect, useCallback } from "react";

// ============================================================
// ADAPTER LAYER — swap this out for V.League / API-Football
// ============================================================

const PROVIDERS = {
  footballData: {
    name: "football-data.org",
    baseUrl: "https://api.football-data.org/v4",
    // Free tier competitions (code → display name)
    competitions: {
      PL:  { name: "Premier League",      flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", country: "England" },
      CL:  { name: "Champions League",    flag: "🇪🇺", country: "Europe" },
      PD:  { name: "La Liga",             flag: "🇪🇸", country: "Spain" },
      BL1: { name: "Bundesliga",          flag: "🇩🇪", country: "Germany" },
      SA:  { name: "Serie A",             flag: "🇮🇹", country: "Italy" },
      FL1: { name: "Ligue 1",             flag: "🇫🇷", country: "France" },
      PPL: { name: "Primeira Liga",       flag: "🇵🇹", country: "Portugal" },
      DED: { name: "Eredivisie",          flag: "🇳🇱", country: "Netherlands" },
      BSA: { name: "Campeonato Brasileiro",flag: "🇧🇷", country: "Brazil" },
      ELC: { name: "Championship",        flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", country: "England" },
      EC:  { name: "European Championship",flag: "🇪🇺", country: "Europe" },
      WC:  { name: "FIFA World Cup",      flag: "🌍", country: "World" },
    },
    // Future: add VL1 (V.League) here when you get the paid key
    // VL1: { name: "V.League 1", flag: "🇻🇳", country: "Vietnam" },

    headers: (token) => ({ "X-Auth-Token": token }),

    // Normalize football-data.org standings → our internal schema
    normalizeStandings: (raw) => raw.standings?.[0]?.table?.map((row) => ({
      position: row.position,
      team: {
        id: row.team.id,
        name: row.team.name,
        shortName: row.team.shortName,
        crest: row.team.crest,
      },
      played: row.playedGames,
      won: row.won,
      draw: row.draw,
      lost: row.lost,
      gf: row.goalsFor,
      ga: row.goalsAgainst,
      gd: row.goalDifference,
      points: row.points,
      form: row.form,
    })) ?? [],

    // Normalize matches → our internal schema
    normalizeMatches: (raw) => raw.matches?.map((m) => ({
      id: m.id,
      matchday: m.matchday,
      status: m.status,
      utcDate: m.utcDate,
      homeTeam: { id: m.homeTeam.id, name: m.homeTeam.name, crest: m.homeTeam.crest },
      awayTeam: { id: m.awayTeam.id, name: m.awayTeam.name, crest: m.awayTeam.crest },
      score: {
        home: m.score?.fullTime?.home ?? null,
        away: m.score?.fullTime?.away ?? null,
        half: {
          home: m.score?.halfTime?.home ?? null,
          away: m.score?.halfTime?.away ?? null,
        },
      },
    })) ?? [],

    // Normalize scorers → our internal schema
    normalizeScorers: (raw) => raw.scorers?.map((s, i) => ({
      rank: i + 1,
      player: { id: s.player.id, name: s.player.name, nationality: s.player.nationality },
      team: { id: s.team.id, name: s.team.name, crest: s.team.crest },
      goals: s.goals,
      assists: s.assists ?? 0,
      penalties: s.penalties ?? 0,
    })) ?? [],
  },

  // ---- PLACEHOLDER: future V.League provider ----
  // vleague: {
  //   name: "V.League API",
  //   baseUrl: "https://api.vleague.vn/v1",  // hypothetical
  //   competitions: { VL1: { name: "V.League 1", flag: "🇻🇳", country: "Vietnam" } },
  //   headers: (token) => ({ "Authorization": `Bearer ${token}` }),
  //   normalizeStandings: (raw) => raw.table.map(row => ({ ... })),
  //   normalizeMatches: (raw) => raw.fixtures.map(m => ({ ... })),
  //   normalizeScorers: (raw) => raw.topScorers.map(s => ({ ... })),
  // },
};

// ---- API client (provider-agnostic) ----
class FootballClient {
  constructor(providerKey, apiToken) {
    this.provider = PROVIDERS[providerKey];
    this.token = apiToken;
  }
  async fetch(path) {
    const res = await fetch(`${this.provider.baseUrl}${path}`, {
      headers: this.provider.headers(this.token),
    });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    return res.json();
  }
  async getStandings(competitionCode) {
    const raw = await this.fetch(`/competitions/${competitionCode}/standings`);
    return this.provider.normalizeStandings(raw);
  }
  async getMatches(competitionCode, { matchday } = {}) {
    const qs = matchday ? `?matchday=${matchday}` : "";
    const raw = await this.fetch(`/competitions/${competitionCode}/matches${qs}`);
    return this.provider.normalizeMatches(raw);
  }
  async getScorers(competitionCode) {
    const raw = await this.fetch(`/competitions/${competitionCode}/scorers?limit=10`);
    return this.provider.normalizeScorers(raw);
  }
}

// ============================================================
// MOCK DATA — used when no API key provided
// ============================================================
const MOCK_STANDINGS = [
  { position:1, team:{name:"Manchester City",shortName:"Man City",crest:null}, played:30,won:22,draw:5,lost:3,gf:68,ga:30,gd:38,points:71,form:"W,W,D,W,W" },
  { position:2, team:{name:"Arsenal",shortName:"Arsenal",crest:null}, played:30,won:21,draw:5,lost:4,gf:72,ga:27,gd:45,points:68,form:"W,W,W,L,W" },
  { position:3, team:{name:"Liverpool",shortName:"Liverpool",crest:null}, played:30,won:20,draw:6,lost:4,gf:71,ga:36,gd:35,points:66,form:"W,D,W,W,W" },
  { position:4, team:{name:"Aston Villa",shortName:"Villa",crest:null}, played:30,won:18,draw:5,lost:7,gf:68,ga:48,gd:20,points:59,form:"W,L,W,W,D" },
  { position:5, team:{name:"Tottenham",shortName:"Spurs",crest:null}, played:30,won:14,draw:6,lost:10,gf:54,ga:51,gd:3,points:48,form:"L,W,D,W,L" },
  { position:6, team:{name:"Chelsea",shortName:"Chelsea",crest:null}, played:30,won:12,draw:9,lost:9,gf:55,ga:51,gd:4,points:45,form:"D,W,L,D,W" },
  { position:7, team:{name:"Newcastle",shortName:"Newcastle",crest:null}, played:30,won:13,draw:5,lost:12,gf:56,ga:48,gd:8,points:44,form:"W,L,W,D,L" },
  { position:8, team:{name:"Man United",shortName:"Man Utd",crest:null}, played:30,won:11,draw:6,lost:13,gf:29,ga:47,gd:-18,points:39,form:"L,L,W,L,D" },
];
const MOCK_MATCHES = [
  { id:1, matchday:30, status:"FINISHED", utcDate:"2026-03-28T20:00:00Z", homeTeam:{name:"Arsenal",crest:null}, awayTeam:{name:"Man City",crest:null}, score:{home:1,away:1,half:{home:0,away:1}} },
  { id:2, matchday:30, status:"FINISHED", utcDate:"2026-03-29T15:00:00Z", homeTeam:{name:"Liverpool",crest:null}, awayTeam:{name:"Chelsea",crest:null}, score:{home:3,away:1,half:{home:1,away:0}} },
  { id:3, matchday:30, status:"FINISHED", utcDate:"2026-03-29T17:30:00Z", homeTeam:{name:"Newcastle",crest:null}, awayTeam:{name:"Aston Villa",crest:null}, score:{home:2,away:2,half:{home:1,away:1}} },
  { id:4, matchday:31, status:"SCHEDULED", utcDate:"2026-04-05T15:00:00Z", homeTeam:{name:"Man City",crest:null}, awayTeam:{name:"Liverpool",crest:null}, score:{home:null,away:null,half:{home:null,away:null}} },
  { id:5, matchday:31, status:"SCHEDULED", utcDate:"2026-04-05T17:30:00Z", homeTeam:{name:"Chelsea",crest:null}, awayTeam:{name:"Tottenham",crest:null}, score:{home:null,away:null,half:{home:null,away:null}} },
];
const MOCK_SCORERS = [
  { rank:1, player:{name:"Erling Haaland",nationality:"Norway"}, team:{name:"Man City",crest:null}, goals:25, assists:6, penalties:4 },
  { rank:2, player:{name:"Alexander Isak",nationality:"Sweden"}, team:{name:"Newcastle",crest:null}, goals:22, assists:3, penalties:2 },
  { rank:3, player:{name:"Mohamed Salah",nationality:"Egypt"}, team:{name:"Liverpool",crest:null}, goals:20, assists:12, penalties:3 },
  { rank:4, player:{name:"Cole Palmer",nationality:"England"}, team:{name:"Chelsea",crest:null}, goals:19, assists:9, penalties:5 },
  { rank:5, player:{name:"Bukayo Saka",nationality:"England"}, team:{name:"Arsenal",crest:null}, goals:17, assists:11, penalties:2 },
  { rank:6, player:{name:"Ollie Watkins",nationality:"England"}, team:{name:"Aston Villa",crest:null}, goals:16, assists:8, penalties:0 },
  { rank:7, player:{name:"Son Heung-min",nationality:"South Korea"}, team:{name:"Tottenham",crest:null}, goals:15, assists:7, penalties:1 },
  { rank:8, player:{name:"Phil Foden",nationality:"England"}, team:{name:"Man City",crest:null}, goals:14, assists:8, penalties:0 },
];

// ============================================================
// HELPERS
// ============================================================
const statusColor = (status) => ({
  FINISHED: "#22c55e", IN_PLAY: "#f59e0b", SCHEDULED: "#64748b",
}[status] || "#64748b");

const statusLabel = (status) => ({
  FINISHED: "Kết thúc", IN_PLAY: "Đang đấu", SCHEDULED: "Sắp diễn ra",
}[status] || status);

const formColor = (c) => ({ W:"#22c55e", D:"#f59e0b", L:"#ef4444" }[c] || "#64748b");

const formatDate = (utc) => {
  const d = new Date(utc);
  return d.toLocaleDateString("vi-VN", { weekday:"short", day:"2-digit", month:"2-digit" })
    + " · " + d.toLocaleTimeString("vi-VN", { hour:"2-digit", minute:"2-digit" });
};

// ============================================================
// COMPONENTS
// ============================================================

function FormBadge({ form }) {
  if (!form) return null;
  return (
    <div style={{ display:"flex", gap:3 }}>
      {form.split(",").slice(0,5).map((c, i) => (
        <span key={i} style={{
          width:16, height:16, borderRadius:3, background:formColor(c),
          display:"grid", placeItems:"center", fontSize:9, fontWeight:700, color:"#fff"
        }}>{c}</span>
      ))}
    </div>
  );
}

function TeamCrest({ crest, name, size = 20 }) {
  if (crest) return <img src={crest} alt={name} style={{ width:size, height:size, objectFit:"contain" }} />;
  return (
    <div style={{
      width:size, height:size, borderRadius:4, background:"#1e3a5f",
      display:"grid", placeItems:"center", fontSize:size * 0.35, fontWeight:700, color:"#60a5fa"
    }}>
      {name?.slice(0,2).toUpperCase()}
    </div>
  );
}

function StandingsTable({ data }) {
  return (
    <div style={{ overflowX:"auto" }}>
      <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
        <thead>
          <tr style={{ color:"#64748b", fontSize:11, textTransform:"uppercase", letterSpacing:"0.05em" }}>
            {["#","Đội","Tr","T","H","B","BT","BB","HS","Điểm","Form"].map((h,i) => (
              <th key={i} style={{ padding:"6px 8px", textAlign: i<=1?"left":"center", fontWeight:600, borderBottom:"1px solid #1e293b" }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => {
            const champZone   = row.position <= 4;
            const euroZone    = row.position <= 6;
            const relegZone   = row.position >= data.length - 2;
            const rowBg       = i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.02)";
            const leftBorder  = champZone ? "#3b82f6" : euroZone ? "#a855f7" : relegZone ? "#ef4444" : "transparent";
            return (
              <tr key={row.position} style={{ background:rowBg, borderLeft:`3px solid ${leftBorder}`, transition:"background 0.15s" }}
                onMouseEnter={e=>e.currentTarget.style.background="#1e293b"}
                onMouseLeave={e=>e.currentTarget.style.background=rowBg}>
                <td style={{ padding:"8px", color:"#94a3b8", fontWeight:600, width:28 }}>{row.position}</td>
                <td style={{ padding:"8px 8px" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <TeamCrest crest={row.team.crest} name={row.team.shortName || row.team.name} size={20} />
                    <span style={{ fontWeight:600, color:"#e2e8f0", whiteSpace:"nowrap" }}>{row.team.shortName || row.team.name}</span>
                  </div>
                </td>
                {[row.played,row.won,row.draw,row.lost,row.gf,row.ga,
                  (row.gd > 0 ? "+" : "") + row.gd].map((v,j) => (
                  <td key={j} style={{ padding:"8px", textAlign:"center", color:"#cbd5e1" }}>{v}</td>
                ))}
                <td style={{ padding:"8px", textAlign:"center", fontWeight:700, color:"#f1f5f9", fontSize:14 }}>{row.points}</td>
                <td style={{ padding:"8px" }}><FormBadge form={row.form} /></td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div style={{ display:"flex", gap:16, marginTop:12, fontSize:11, color:"#64748b" }}>
        {[["#3b82f6","Top 4 · Champions League"],["#a855f7","Top 6 · Europa"],["#ef4444","Xuống hạng"]].map(([c,l]) => (
          <span key={l} style={{ display:"flex", alignItems:"center", gap:4 }}>
            <span style={{ width:8, height:8, borderRadius:2, background:c, display:"inline-block" }} />{l}
          </span>
        ))}
      </div>
    </div>
  );
}

function MatchCard({ match }) {
  const isFinished = match.status === "FINISHED";
  const isLive = match.status === "IN_PLAY";
  return (
    <div style={{
      background:"#0f172a", border:"1px solid #1e293b", borderRadius:10, padding:"12px 16px",
      display:"grid", gridTemplateColumns:"1fr auto 1fr", alignItems:"center", gap:8,
      transition:"border-color 0.2s", cursor:"pointer",
    }}
      onMouseEnter={e=>e.currentTarget.style.borderColor="#3b82f6"}
      onMouseLeave={e=>e.currentTarget.style.borderColor="#1e293b"}>
      {/* Home */}
      <div style={{ display:"flex", alignItems:"center", gap:8, justifyContent:"flex-end" }}>
        <span style={{ fontWeight:600, fontSize:13, color:"#e2e8f0", textAlign:"right" }}>{match.homeTeam.name}</span>
        <TeamCrest crest={match.homeTeam.crest} name={match.homeTeam.name} size={24} />
      </div>
      {/* Score / Time */}
      <div style={{ textAlign:"center", minWidth:80 }}>
        {isFinished || isLive ? (
          <div>
            <div style={{ fontSize:20, fontWeight:800, color:"#f1f5f9", letterSpacing:"0.05em", fontFamily:"monospace" }}>
              {match.score.home} <span style={{ color:"#334155" }}>–</span> {match.score.away}
            </div>
            {isFinished && match.score.half.home !== null && (
              <div style={{ fontSize:10, color:"#475569" }}>HT {match.score.half.home}–{match.score.half.away}</div>
            )}
            {isLive && <div style={{ fontSize:10, color:"#f59e0b", fontWeight:700 }}>● LIVE</div>}
          </div>
        ) : (
          <div style={{ fontSize:13, color:"#94a3b8", fontWeight:600 }}>
            {new Date(match.utcDate).toLocaleTimeString("vi-VN",{hour:"2-digit",minute:"2-digit"})}
          </div>
        )}
        <div style={{ fontSize:10, color:statusColor(match.status), marginTop:2 }}>{statusLabel(match.status)}</div>
      </div>
      {/* Away */}
      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
        <TeamCrest crest={match.awayTeam.crest} name={match.awayTeam.name} size={24} />
        <span style={{ fontWeight:600, fontSize:13, color:"#e2e8f0" }}>{match.awayTeam.name}</span>
      </div>
    </div>
  );
}

function ScorerRow({ scorer }) {
  return (
    <div style={{
      display:"grid", gridTemplateColumns:"28px 1fr auto auto auto", alignItems:"center",
      gap:10, padding:"10px 8px", borderBottom:"1px solid #1e293b", fontSize:13,
    }}>
      <span style={{ fontWeight:700, color: scorer.rank<=3 ? "#f59e0b" : "#475569", textAlign:"center" }}>
        {scorer.rank <= 3 ? ["🥇","🥈","🥉"][scorer.rank-1] : scorer.rank}
      </span>
      <div>
        <div style={{ fontWeight:600, color:"#e2e8f0" }}>{scorer.player.name}</div>
        <div style={{ fontSize:11, color:"#64748b", display:"flex", alignItems:"center", gap:4, marginTop:2 }}>
          <TeamCrest crest={scorer.team.crest} name={scorer.team.name} size={14} />
          {scorer.team.name}
        </div>
      </div>
      <div style={{ textAlign:"center" }}>
        <div style={{ fontWeight:700, color:"#f1f5f9", fontSize:16 }}>{scorer.goals}</div>
        <div style={{ fontSize:10, color:"#475569" }}>Bàn</div>
      </div>
      <div style={{ textAlign:"center" }}>
        <div style={{ fontWeight:600, color:"#94a3b8" }}>{scorer.assists}</div>
        <div style={{ fontSize:10, color:"#475569" }}>Kiến tạo</div>
      </div>
      <div style={{ textAlign:"center" }}>
        <div style={{ fontWeight:600, color:"#94a3b8" }}>{scorer.penalties}</div>
        <div style={{ fontSize:10, color:"#475569" }}>Phạt đền</div>
      </div>
    </div>
  );
}

// ============================================================
// MAIN APP
// ============================================================
const PROVIDER_KEY = "footballData";
const competitions = PROVIDERS[PROVIDER_KEY].competitions;
const TABS = ["standings","matches","scorers"];
const TAB_LABELS = { standings:"Bảng xếp hạng", matches:"Lịch / Kết quả", scorers:"Vua phá lưới" };

export default function App() {
  const [apiToken, setApiToken]       = useState("");
  const [activeComp, setActiveComp]   = useState("PL");
  const [activeTab, setActiveTab]     = useState("standings");
  const [standings, setStandings]     = useState([]);
  const [matches, setMatches]         = useState([]);
  const [scorers, setScorers]         = useState([]);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState(null);
  const [useMock, setUseMock]         = useState(true);

  const client = apiToken ? new FootballClient(PROVIDER_KEY, apiToken) : null;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (useMock || !client) {
        setStandings(MOCK_STANDINGS);
        setMatches(MOCK_MATCHES);
        setScorers(MOCK_SCORERS);
      } else {
        const [s, m, sc] = await Promise.all([
          client.getStandings(activeComp),
          client.getMatches(activeComp),
          client.getScorers(activeComp),
        ]);
        setStandings(s); setMatches(m); setScorers(sc);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [activeComp, useMock, apiToken]);

  useEffect(() => { load(); }, [load]);

  const comp = competitions[activeComp];

  return (
    <div style={{
      minHeight:"100vh", background:"#020817", color:"#e2e8f0",
      fontFamily:"'IBM Plex Sans', system-ui, sans-serif",
    }}>
      {/* ---- HEADER ---- */}
      <div style={{
        background:"linear-gradient(135deg, #0f172a 0%, #0c1a3a 100%)",
        borderBottom:"1px solid #1e293b", padding:"0 20px",
      }}>
        <div style={{ maxWidth:960, margin:"0 auto" }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", paddingTop:16, paddingBottom:12 }}>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <span style={{ fontSize:24 }}>⚽</span>
              <div>
                <div style={{ fontWeight:800, fontSize:18, color:"#f1f5f9", letterSpacing:"-0.02em" }}>BóngĐá.io</div>
                <div style={{ fontSize:11, color:"#3b82f6" }}>Thống kê bóng đá trực tiếp</div>
              </div>
            </div>
            {/* API Key input */}
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <label style={{ display:"flex", alignItems:"center", gap:6, fontSize:12, color:"#64748b", cursor:"pointer" }}>
                <input type="checkbox" checked={useMock} onChange={e=>setUseMock(e.target.checked)}
                  style={{ accentColor:"#3b82f6" }} />
                Dữ liệu mẫu
              </label>
              {!useMock && (
                <input
                  placeholder="API Token (football-data.org)"
                  value={apiToken}
                  onChange={e=>setApiToken(e.target.value)}
                  style={{
                    padding:"6px 10px", borderRadius:6, border:"1px solid #1e293b",
                    background:"#0f172a", color:"#e2e8f0", fontSize:12, width:220,
                  }} />
              )}
            </div>
          </div>

          {/* Competition tabs */}
          <div style={{ display:"flex", gap:4, overflowX:"auto", paddingBottom:1 }}>
            {Object.entries(competitions).map(([code, c]) => (
              <button key={code} onClick={() => setActiveComp(code)}
                style={{
                  padding:"8px 14px", borderRadius:"6px 6px 0 0", border:"none", cursor:"pointer",
                  background: activeComp===code ? "#1e293b" : "transparent",
                  color: activeComp===code ? "#60a5fa" : "#64748b",
                  fontWeight: activeComp===code ? 700 : 400,
                  fontSize:13, whiteSpace:"nowrap", transition:"all 0.15s",
                  borderBottom: activeComp===code ? "2px solid #3b82f6" : "2px solid transparent",
                }}>
                {c.flag} {c.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ---- CONTENT ---- */}
      <div style={{ maxWidth:960, margin:"0 auto", padding:"20px" }}>
        {/* Competition header */}
        <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:20 }}>
          <span style={{ fontSize:32 }}>{comp.flag}</span>
          <div>
            <h1 style={{ margin:0, fontSize:22, fontWeight:800, color:"#f1f5f9" }}>{comp.name}</h1>
            <span style={{ fontSize:13, color:"#475569" }}>{comp.country}</span>
          </div>
          <div style={{ marginLeft:"auto", display:"flex", gap:6 }}>
            {useMock && (
              <span style={{
                padding:"4px 10px", borderRadius:20, background:"rgba(251,191,36,0.1)",
                color:"#fbbf24", fontSize:11, fontWeight:600, border:"1px solid rgba(251,191,36,0.2)"
              }}>● Dữ liệu mẫu</span>
            )}
          </div>
        </div>

        {/* Sub-tabs */}
        <div style={{ display:"flex", gap:2, marginBottom:16, background:"#0f172a", borderRadius:8, padding:4 }}>
          {TABS.map(t => (
            <button key={t} onClick={() => setActiveTab(t)}
              style={{
                flex:1, padding:"8px", borderRadius:6, border:"none", cursor:"pointer",
                background: activeTab===t ? "#1e293b" : "transparent",
                color: activeTab===t ? "#f1f5f9" : "#475569",
                fontWeight: activeTab===t ? 600 : 400,
                fontSize:13, transition:"all 0.15s",
              }}>
              {TAB_LABELS[t]}
            </button>
          ))}
        </div>

        {/* Content area */}
        <div style={{ background:"#0f172a", border:"1px solid #1e293b", borderRadius:10, overflow:"hidden" }}>
          {loading && (
            <div style={{ padding:40, textAlign:"center", color:"#475569" }}>
              <div style={{ fontSize:24, marginBottom:8 }}>⚽</div>Đang tải dữ liệu...
            </div>
          )}
          {error && (
            <div style={{ padding:20, color:"#ef4444", textAlign:"center", fontSize:13 }}>
              ⚠️ Lỗi: {error}
            </div>
          )}
          {!loading && !error && (
            <div style={{ padding:16 }}>
              {activeTab === "standings" && <StandingsTable data={standings} />}
              {activeTab === "matches" && (
                <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                  {matches.length === 0
                    ? <div style={{ color:"#475569", textAlign:"center", padding:24 }}>Không có trận đấu</div>
                    : matches.map(m => <MatchCard key={m.id} match={m} />)
                  }
                </div>
              )}
              {activeTab === "scorers" && (
                <div>
                  {scorers.map(s => <ScorerRow key={s.rank} scorer={s} />)}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer note */}
        <div style={{ marginTop:16, fontSize:11, color:"#334155", textAlign:"center" }}>
          Provider: <strong style={{color:"#475569"}}>{PROVIDERS[PROVIDER_KEY].name}</strong>
          {" · "}Để thêm V.League, chỉ cần thêm provider mới vào PROVIDERS object
        </div>
      </div>
    </div>
  );
}
