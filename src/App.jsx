import { useState, useEffect, useCallback } from "react";
import { Helmet } from "react-helmet-async";
import { activeProvider, FootballClient } from "./providers/index.js";
import { SEO_MAP, SEO_DEFAULT } from "./hooks/useSEO.js";

// ============================================================
// MOCK DATA — V.League 1 sample, shown when useMock = true
// ============================================================
const MOCK_STANDINGS = [
  { position:1,  team:{name:"Công An Hà Nội",  shortName:"CAHN",   crest:null}, played:20,won:14,draw:4,lost:2, gf:42,ga:14,gd:28, points:46,form:"W,W,W,D,W" },
  { position:2,  team:{name:"Hà Nội FC",        shortName:"HN FC",  crest:null}, played:20,won:13,draw:3,lost:4, gf:38,ga:19,gd:19, points:42,form:"W,D,W,W,L" },
  { position:3,  team:{name:"Hải Phòng FC",     shortName:"HP",     crest:null}, played:20,won:11,draw:4,lost:5, gf:34,ga:22,gd:12, points:37,form:"W,W,D,L,W" },
  { position:4,  team:{name:"Hoàng Anh Gia Lai",shortName:"HAGL",   crest:null}, played:20,won:10,draw:5,lost:5, gf:31,ga:24,gd:7,  points:35,form:"D,W,W,L,D" },
  { position:5,  team:{name:"Viettel FC",        shortName:"VTL",    crest:null}, played:20,won:9, draw:5,lost:6, gf:28,ga:23,gd:5,  points:32,form:"L,W,D,W,W" },
  { position:6,  team:{name:"Sông Lam Nghệ An", shortName:"SLNA",   crest:null}, played:20,won:8, draw:6,lost:6, gf:27,ga:25,gd:2,  points:30,form:"D,D,W,L,W" },
  { position:7,  team:{name:"Bình Định",         shortName:"BĐ",     crest:null}, played:20,won:7, draw:6,lost:7, gf:24,ga:26,gd:-2, points:27,form:"W,L,D,W,L" },
  { position:8,  team:{name:"Nam Định",          shortName:"NĐ",     crest:null}, played:20,won:7, draw:5,lost:8, gf:23,ga:28,gd:-5, points:26,form:"L,W,W,D,L" },
  { position:9,  team:{name:"Becamex Bình Dương",shortName:"BD",     crest:null}, played:20,won:6, draw:6,lost:8, gf:22,ga:27,gd:-5, points:24,form:"D,L,W,D,W" },
  { position:10, team:{name:"Hồ Chí Minh City", shortName:"HCM",    crest:null}, played:20,won:5, draw:7,lost:8, gf:21,ga:29,gd:-8, points:22,form:"D,D,L,W,D" },
  { position:11, team:{name:"Thanh Hóa",         shortName:"TH",     crest:null}, played:20,won:5, draw:4,lost:11,gf:19,ga:33,gd:-14,points:19,form:"L,L,W,L,D" },
  { position:12, team:{name:"Khánh Hòa",         shortName:"KH",     crest:null}, played:20,won:4, draw:4,lost:12,gf:16,ga:35,gd:-19,points:16,form:"L,L,L,W,L" },
  { position:13, team:{name:"Đà Nẵng",           shortName:"ĐN",     crest:null}, played:20,won:3, draw:5,lost:12,gf:15,ga:36,gd:-21,points:14,form:"L,D,L,L,W" },
  { position:14, team:{name:"Quảng Nam",          shortName:"QN",     crest:null}, played:20,won:2, draw:4,lost:14,gf:13,ga:42,gd:-29,points:10,form:"L,L,D,L,L" },
];

const MOCK_MATCHES = [
  { id:1, matchday:"Vòng 21", status:"FINISHED", minute:null, utcDate:"2025-07-12T14:00:00+07:00", homeTeam:{name:"Công An Hà Nội",crest:null}, awayTeam:{name:"Hà Nội FC",crest:null}, score:{home:2,away:1,half:{home:1,away:0}} },
  { id:2, matchday:"Vòng 21", status:"FINISHED", minute:null, utcDate:"2025-07-12T16:00:00+07:00", homeTeam:{name:"Hải Phòng FC",crest:null}, awayTeam:{name:"Viettel FC",crest:null}, score:{home:1,away:1,half:{home:0,away:1}} },
  { id:3, matchday:"Vòng 21", status:"FINISHED", minute:null, utcDate:"2025-07-13T16:00:00+07:00", homeTeam:{name:"HAGL",crest:null}, awayTeam:{name:"SLNA",crest:null}, score:{home:3,away:0,half:{home:2,away:0}} },
  { id:4, matchday:"Vòng 21", status:"IN_PLAY",  minute:67,   utcDate:"2025-07-13T19:15:00+07:00", homeTeam:{name:"Nam Định",crest:null}, awayTeam:{name:"Bình Định",crest:null}, score:{home:1,away:0,half:{home:0,away:0}} },
  { id:5, matchday:"Vòng 22", status:"SCHEDULED",minute:null, utcDate:"2025-07-19T16:00:00+07:00", homeTeam:{name:"Hà Nội FC",crest:null}, awayTeam:{name:"Hải Phòng FC",crest:null}, score:{home:null,away:null,half:{home:null,away:null}} },
  { id:6, matchday:"Vòng 22", status:"SCHEDULED",minute:null, utcDate:"2025-07-19T19:15:00+07:00", homeTeam:{name:"Công An Hà Nội",crest:null}, awayTeam:{name:"HAGL",crest:null}, score:{home:null,away:null,half:{home:null,away:null}} },
  { id:7, matchday:"Vòng 22", status:"SCHEDULED",minute:null, utcDate:"2025-07-20T16:00:00+07:00", homeTeam:{name:"Viettel FC",crest:null}, awayTeam:{name:"Nam Định",crest:null}, score:{home:null,away:null,half:{home:null,away:null}} },
];

const MOCK_SCORERS = [
  { rank:1, player:{name:"Pedro Henrique",  nationality:"Brazil"},  team:{name:"Công An Hà Nội",crest:null}, goals:18, assists:5, penalties:3 },
  { rank:2, player:{name:"Nguyễn Tiến Linh",nationality:"Vietnam"}, team:{name:"Bình Dương",   crest:null}, goals:14, assists:3, penalties:2 },
  { rank:3, player:{name:"Rafaelson",       nationality:"Brazil"},  team:{name:"SLNA",          crest:null}, goals:13, assists:7, penalties:1 },
  { rank:4, player:{name:"Nguyễn Văn Toàn", nationality:"Vietnam"}, team:{name:"HAGL",          crest:null}, goals:12, assists:9, penalties:0 },
  { rank:5, player:{name:"Hà Đức Chinh",   nationality:"Vietnam"}, team:{name:"Nam Định",      crest:null}, goals:11, assists:4, penalties:2 },
  { rank:6, player:{name:"Claudecir",       nationality:"Brazil"},  team:{name:"Hà Nội FC",     crest:null}, goals:10, assists:6, penalties:1 },
  { rank:7, player:{name:"Đinh Thanh Trung",nationality:"Vietnam"}, team:{name:"Hải Phòng FC",  crest:null}, goals:9,  assists:5, penalties:0 },
  { rank:8, player:{name:"Bruno Cunha",     nationality:"Brazil"},  team:{name:"Viettel FC",    crest:null}, goals:8,  assists:3, penalties:2 },
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
              <th key={i} style={{ padding:"6px 8px", textAlign:i<=1?"left":"center", fontWeight:600, borderBottom:"1px solid #1e293b" }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => {
            const top1      = row.position === 1;
            const top4      = row.position <= 4;
            const relegZone = row.position >= data.length - 1;
            const rowBg     = i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.02)";
            const leftBorder = top1 ? "#f59e0b" : top4 ? "#3b82f6" : relegZone ? "#ef4444" : "transparent";
            return (
              <tr key={row.position} style={{ background:rowBg, borderLeft:`3px solid ${leftBorder}`, transition:"background 0.15s" }}
                onMouseEnter={e=>e.currentTarget.style.background="#1e293b"}
                onMouseLeave={e=>e.currentTarget.style.background=rowBg}>
                <td style={{ padding:"8px", color:"#94a3b8", fontWeight:600, width:28 }}>{row.position}</td>
                <td style={{ padding:"8px" }}>
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
        {[["#f59e0b","Vô địch · AFC CL"],["#3b82f6","Top 4 · AFC"],["#ef4444","Xuống hạng"]].map(([c,l]) => (
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
  const isLive     = match.status === "IN_PLAY";
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
      <div style={{ textAlign:"center", minWidth:88 }}>
        {isFinished || isLive ? (
          <div>
            <div style={{ fontSize:20, fontWeight:800, color:"#f1f5f9", letterSpacing:"0.05em", fontFamily:"monospace" }}>
              {match.score.home ?? "–"} <span style={{ color:"#334155" }}>–</span> {match.score.away ?? "–"}
            </div>
            {isFinished && match.score.half.home !== null && (
              <div style={{ fontSize:10, color:"#475569" }}>HT {match.score.half.home}–{match.score.half.away}</div>
            )}
            {isLive && (
              <div style={{ fontSize:11, color:"#f59e0b", fontWeight:700 }}>
                ● {match.minute ? `${match.minute}'` : "LIVE"}
              </div>
            )}
          </div>
        ) : (
          <div style={{ fontSize:13, color:"#94a3b8", fontWeight:600 }}>
            {new Date(match.utcDate).toLocaleTimeString("vi-VN", { hour:"2-digit", minute:"2-digit" })}
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

function MatchList({ matches }) {
  if (matches.length === 0) {
    return <div style={{ color:"#475569", textAlign:"center", padding:24 }}>Không có trận đấu</div>;
  }
  // Group by matchday/round
  const groups = {};
  for (const m of matches) {
    const key = m.matchday ?? "Không rõ";
    if (!groups[key]) groups[key] = [];
    groups[key].push(m);
  }
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
      {Object.entries(groups).map(([round, ms]) => (
        <div key={round}>
          <div style={{ fontSize:11, fontWeight:700, color:"#475569", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:6, paddingLeft:4 }}>
            {round}
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
            {ms.map(m => <MatchCard key={m.id} match={m} />)}
          </div>
        </div>
      ))}
    </div>
  );
}

function ScorerRow({ scorer }) {
  return (
    <div style={{
      display:"grid", gridTemplateColumns:"28px 1fr auto auto auto", alignItems:"center",
      gap:10, padding:"10px 8px", borderBottom:"1px solid #1e293b", fontSize:13,
    }}>
      <span style={{ fontWeight:700, color:scorer.rank<=3 ? "#f59e0b" : "#475569", textAlign:"center" }}>
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
// PRIVACY POLICY PAGE
// ============================================================
function PrivacyPage({ onBack }) {
  return (
    <div style={{ minHeight:"100vh", background:"#020817", color:"#e2e8f0", fontFamily:"'IBM Plex Sans', system-ui, sans-serif" }}>
      <Helmet>
        <title>Chính sách bảo mật | BóngĐá.io</title>
        <meta name="description" content="Chính sách bảo mật của BóngĐá.io — cách chúng tôi thu thập và sử dụng dữ liệu." />
      </Helmet>
      {/* Header */}
      <div style={{ background:"linear-gradient(135deg, #0f172a 0%, #0c1a3a 100%)", borderBottom:"1px solid #1e293b", padding:"16px 20px" }}>
        <div style={{ maxWidth:960, margin:"0 auto", display:"flex", alignItems:"center", gap:12 }}>
          <button onClick={onBack} style={{ background:"none", border:"none", color:"#3b82f6", cursor:"pointer", fontSize:20, lineHeight:1, padding:0 }}>←</button>
          <span style={{ fontSize:20 }}>⚽</span>
          <span style={{ fontWeight:800, fontSize:18, color:"#f1f5f9" }}>BóngĐá.io</span>
        </div>
      </div>
      {/* Content */}
      <div style={{ maxWidth:720, margin:"0 auto", padding:"32px 20px 60px" }}>
        <h1 style={{ fontSize:26, fontWeight:800, color:"#f1f5f9", marginBottom:8 }}>Chính sách bảo mật</h1>
        <p style={{ fontSize:12, color:"#475569", marginBottom:32 }}>Cập nhật lần cuối: tháng 3 năm 2025</p>

        {[
          {
            title: "1. Giới thiệu",
            body: "BóngĐá.io (\"chúng tôi\") cung cấp thông tin thống kê bóng đá trực tiếp. Chính sách bảo mật này giải thích cách chúng tôi thu thập, sử dụng và bảo vệ thông tin của bạn khi truy cập trang web."
          },
          {
            title: "2. Thông tin chúng tôi thu thập",
            body: "Chúng tôi không yêu cầu đăng ký tài khoản. Chúng tôi có thể thu thập dữ liệu ẩn danh về lượt truy cập thông qua công cụ phân tích (ví dụ: số trang xem, thiết bị, quốc gia truy cập) nhằm cải thiện trải nghiệm người dùng."
          },
          {
            title: "3. Cookie và công nghệ theo dõi",
            body: "Trang web có thể sử dụng cookie để vận hành quảng cáo và đo lường hiệu quả. Bên thứ ba bao gồm Google (AdSense, Analytics) có thể đặt cookie trên thiết bị của bạn theo chính sách riêng của họ. Bạn có thể vô hiệu hóa cookie trong trình duyệt, nhưng một số tính năng có thể bị ảnh hưởng."
          },
          {
            title: "4. Quảng cáo (Google AdSense)",
            body: "Chúng tôi sử dụng Google AdSense để hiển thị quảng cáo. Google có thể sử dụng cookie và dữ liệu ẩn danh để hiển thị quảng cáo phù hợp với sở thích của bạn. Để tìm hiểu thêm hoặc từ chối quảng cáo cá nhân hóa, vui lòng truy cập: https://adssettings.google.com"
          },
          {
            title: "5. Dữ liệu bên thứ ba",
            body: "Dữ liệu thống kê bóng đá được cung cấp bởi API-Football (api-sports.io). Chúng tôi không chia sẻ thông tin cá nhân của người dùng với nhà cung cấp dữ liệu này."
          },
          {
            title: "6. Liên kết bên ngoài",
            body: "Trang web có thể chứa liên kết đến các trang bên ngoài. Chúng tôi không chịu trách nhiệm về nội dung hay chính sách bảo mật của các trang đó."
          },
          {
            title: "7. Quyền của bạn",
            body: "Vì chúng tôi không lưu trữ dữ liệu cá nhân, không cần đăng nhập hay đăng ký, bạn không cần yêu cầu xóa dữ liệu. Nếu bạn có thắc mắc về cookie của bên thứ ba, vui lòng liên hệ trực tiếp với các nhà cung cấp đó."
          },
          {
            title: "8. Thay đổi chính sách",
            body: "Chúng tôi có thể cập nhật chính sách bảo mật này theo thời gian. Mọi thay đổi sẽ được đăng trên trang này kèm ngày cập nhật mới."
          },
          {
            title: "9. Liên hệ",
            body: "Nếu bạn có câu hỏi về chính sách bảo mật này, vui lòng liên hệ qua địa chỉ: contact@bongda.io"
          },
        ].map(({ title, body }) => (
          <div key={title} style={{ marginBottom:28 }}>
            <h2 style={{ fontSize:15, fontWeight:700, color:"#93c5fd", marginBottom:8 }}>{title}</h2>
            <p style={{ fontSize:14, color:"#94a3b8", lineHeight:1.7, margin:0 }}>{body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// MAIN APP
// ============================================================
const { competitions } = activeProvider;
const client = new FootballClient(activeProvider);
const TABS = ["standings", "matches", "scorers"];
const TAB_LABELS = { standings:"Bảng xếp hạng", matches:"Lịch / Kết quả", scorers:"Vua phá lưới" };

export default function App() {
  const [page,        setPage]       = useState("main"); // "main" | "privacy"
  const [activeComp, setActiveComp] = useState("VL1");
  const [activeTab,  setActiveTab]  = useState("standings");
  const [standings,  setStandings]  = useState([]);
  const [matches,    setMatches]    = useState([]);
  const [scorers,    setScorers]    = useState([]);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState(null);
  const [useMock,    setUseMock]    = useState(true);

  if (page === "privacy") return <PrivacyPage onBack={() => setPage("main")} />;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (useMock) {
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
  }, [activeComp, useMock]);

  useEffect(() => { load(); }, [load]);

  const comp = competitions[activeComp];
  const seo = SEO_MAP[activeComp] ?? SEO_DEFAULT;

  return (
    <>
    <Helmet>
      <title>{seo.title}</title>
      <meta name="description" content={seo.description} />
      <meta property="og:title" content={seo.title} />
      <meta property="og:description" content={seo.description} />
    </Helmet>
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
            <label style={{ display:"flex", alignItems:"center", gap:6, fontSize:12, color:"#64748b", cursor:"pointer" }}>
              <input type="checkbox" checked={useMock} onChange={e=>setUseMock(e.target.checked)}
                style={{ accentColor:"#3b82f6" }} />
              Dữ liệu mẫu
            </label>
          </div>

          {/* League tabs */}
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
        {/* League header */}
        <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:20 }}>
          <span style={{ fontSize:32 }}>{comp.flag}</span>
          <div>
            <h1 style={{ margin:0, fontSize:22, fontWeight:800, color:"#f1f5f9" }}>{comp.name}</h1>
            <span style={{ fontSize:13, color:"#475569" }}>{comp.country}</span>
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
              {activeTab === "matches"   && <MatchList matches={matches} />}
              {activeTab === "scorers"   && <div>{scorers.map(s => <ScorerRow key={s.rank} scorer={s} />)}</div>}
            </div>
          )}
        </div>

        <div style={{ marginTop:16, fontSize:11, color:"#334155", textAlign:"center" }}>
          Provider: <strong style={{color:"#475569"}}>{activeProvider.name}</strong>
          {" · "}Mùa giải {activeProvider.season}
          {" · "}
          <button onClick={() => setPage("privacy")}
            style={{ background:"none", border:"none", color:"#334155", cursor:"pointer", fontSize:11, padding:0, textDecoration:"underline" }}>
            Chính sách bảo mật
          </button>
        </div>
      </div>
    </div>
    </>
  );
}
