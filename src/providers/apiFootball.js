// ============================================================
// ADAPTER — API-Football (api-sports.io)
// Normalizes API-Football v3 responses → internal schema
// ============================================================

// Update each year. For V.League use calendar year; for European
// leagues this is the start year (2025 = 2025/26 season).
const SEASON = 2024; // Free plan: 2022–2024 only

// API-Football fixture status → internal status
const STATUS_MAP = {
  NS:   "SCHEDULED",
  TBD:  "SCHEDULED",
  PST:  "SCHEDULED",
  CANC: "SCHEDULED",
  ABD:  "SCHEDULED",
  "1H": "IN_PLAY",
  HT:   "IN_PLAY",
  "2H": "IN_PLAY",
  ET:   "IN_PLAY",
  BT:   "IN_PLAY",
  P:    "IN_PLAY",
  LIVE: "IN_PLAY",
  FT:   "FINISHED",
  AET:  "FINISHED",
  PEN:  "FINISHED",
  AWD:  "FINISHED",
  WO:   "FINISHED",
};

export const apiFootball = {
  name: "API-Football",
  season: SEASON,

  // Competition order defines tab order — Vietnamese leagues first.
  competitions: {
    VL1: { id: 341,  name: "V.League 1",           flag: "🇻🇳", country: "Việt Nam" },
    VL2: { id: 342,  name: "V.League 2",            flag: "🇻🇳", country: "Việt Nam" },
    AFF: { id: 142,  name: "AFF Championship",      flag: "🌏", country: "Đông Nam Á" },
    AFC: { id: 17,   name: "AFC Champions League",  flag: "🌏", country: "Châu Á" },
    PL:  { id: 39,   name: "Premier League",        flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", country: "Anh" },
    CL:  { id: 2,    name: "Champions League",      flag: "🇪🇺", country: "Châu Âu" },
    PD:  { id: 140,  name: "La Liga",               flag: "🇪🇸", country: "Tây Ban Nha" },
    BL1: { id: 78,   name: "Bundesliga",            flag: "🇩🇪", country: "Đức" },
    SA:  { id: 135,  name: "Serie A",               flag: "🇮🇹", country: "Ý" },
    FL1: { id: 61,   name: "Ligue 1",               flag: "🇫🇷", country: "Pháp" },
  },

  // Standings: response[0].league.standings[0] is the main table array
  normalizeStandings: (raw) => {
    const table = raw.response?.[0]?.league?.standings?.[0];
    if (!table) return [];
    return table.map((row) => ({
      position: row.rank,
      team: {
        id:        row.team.id,
        name:      row.team.name,
        shortName: row.team.name,
        crest:     row.team.logo,
      },
      played: row.all.played,
      won:    row.win,
      draw:   row.draw,
      lost:   row.lose,
      gf:     row.all.goals.for,
      ga:     row.all.goals.against,
      gd:     row.goalsDiff,
      points: row.points,
      // API-Football returns form as "WWDLW"; convert to "W,W,D,L,W" for FormBadge
      form:   row.form ? row.form.split("").join(",") : null,
    }));
  },

  // Fixtures: response is an array of fixture objects
  normalizeMatches: (raw) =>
    raw.response?.map((m) => ({
      id:       m.fixture.id,
      matchday: m.league.round,
      status:   STATUS_MAP[m.fixture.status.short] ?? "SCHEDULED",
      minute:   m.fixture.status.elapsed,
      utcDate:  m.fixture.date,
      homeTeam: { id: m.teams.home.id, name: m.teams.home.name, crest: m.teams.home.logo },
      awayTeam: { id: m.teams.away.id, name: m.teams.away.name, crest: m.teams.away.logo },
      score: {
        home: m.goals.home,
        away: m.goals.away,
        half: {
          home: m.score.halftime.home,
          away: m.score.halftime.away,
        },
      },
    })) ?? [],

  // Top scorers: response is an array of player+statistics objects
  normalizeScorers: (raw) =>
    raw.response?.map((s, i) => ({
      rank:   i + 1,
      player: {
        id:          s.player.id,
        name:        s.player.name,
        nationality: s.player.nationality,
        photo:       s.player.photo,
      },
      team: {
        id:    s.statistics[0].team.id,
        name:  s.statistics[0].team.name,
        crest: s.statistics[0].team.logo,
      },
      goals:     s.statistics[0].goals.total     ?? 0,
      assists:   s.statistics[0].goals.assists   ?? 0,
      penalties: s.statistics[0].penalty.scored  ?? 0,
    })) ?? [],
};

// ---- Provider-agnostic API client (calls /api/football proxy) ----
export class FootballClient {
  constructor(provider) {
    this.provider = provider;
  }

  async _fetch(endpoint, params = {}) {
    const qs = new URLSearchParams(params).toString();
    const url = `/api/football?endpoint=${encodeURIComponent(endpoint)}&${qs}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    return res.json();
  }

  async getStandings(compCode) {
    const comp = this.provider.competitions[compCode];
    const raw = await this._fetch("standings", { league: comp.id, season: this.provider.season });
    return this.provider.normalizeStandings(raw);
  }

  async getMatches(compCode) {
    const comp = this.provider.competitions[compCode];
    const raw = await this._fetch("fixtures", { league: comp.id, season: this.provider.season });
    return this.provider.normalizeMatches(raw);
  }

  async getScorers(compCode) {
    const comp = this.provider.competitions[compCode];
    const raw = await this._fetch("players/topscorers", { league: comp.id, season: this.provider.season });
    return this.provider.normalizeScorers(raw);
  }

  async getLive() {
    const raw = await this._fetch("fixtures", { live: "all" });
    return this.provider.normalizeMatches(raw);
  }
}
