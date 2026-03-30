// ============================================================
// ADAPTER — football-data.org
// All API calls are proxied through /api/football (Vercel fn)
// so the token never leaves the server.
// ============================================================

export const footballData = {
  name: "football-data.org",
  // Free-tier competitions (code → display meta)
  competitions: {
    PL:  { name: "Premier League",        flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", country: "England" },
    CL:  { name: "Champions League",      flag: "🇪🇺", country: "Europe" },
    PD:  { name: "La Liga",               flag: "🇪🇸", country: "Spain" },
    BL1: { name: "Bundesliga",            flag: "🇩🇪", country: "Germany" },
    SA:  { name: "Serie A",               flag: "🇮🇹", country: "Italy" },
    FL1: { name: "Ligue 1",               flag: "🇫🇷", country: "France" },
    PPL: { name: "Primeira Liga",         flag: "🇵🇹", country: "Portugal" },
    DED: { name: "Eredivisie",            flag: "🇳🇱", country: "Netherlands" },
    BSA: { name: "Campeonato Brasileiro", flag: "🇧🇷", country: "Brazil" },
    ELC: { name: "Championship",          flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", country: "England" },
    EC:  { name: "European Championship", flag: "🇪🇺", country: "Europe" },
    WC:  { name: "FIFA World Cup",        flag: "🌍", country: "World" },
    // Future: VL1 (V.League) → add vleague provider instead
  },

  // ---- Normalizers: raw API response → internal schema ----

  normalizeStandings: (raw) =>
    raw.standings?.[0]?.table?.map((row) => ({
      position: row.position,
      team: {
        id:        row.team.id,
        name:      row.team.name,
        shortName: row.team.shortName,
        crest:     row.team.crest,
      },
      played: row.playedGames,
      won:    row.won,
      draw:   row.draw,
      lost:   row.lost,
      gf:     row.goalsFor,
      ga:     row.goalsAgainst,
      gd:     row.goalDifference,
      points: row.points,
      form:   row.form,
    })) ?? [],

  normalizeMatches: (raw) =>
    raw.matches?.map((m) => ({
      id:       m.id,
      matchday: m.matchday,
      status:   m.status,
      utcDate:  m.utcDate,
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

  normalizeScorers: (raw) =>
    raw.scorers?.map((s, i) => ({
      rank:   i + 1,
      player: { id: s.player.id, name: s.player.name, nationality: s.player.nationality },
      team:   { id: s.team.id, name: s.team.name, crest: s.team.crest },
      goals:     s.goals,
      assists:   s.assists   ?? 0,
      penalties: s.penalties ?? 0,
    })) ?? [],
};

// ---- Provider-agnostic API client (calls /api/football proxy) ----
export class FootballClient {
  constructor(provider) {
    this.provider = provider;
  }

  async fetch(path) {
    const res = await fetch(`/api/football?path=${encodeURIComponent(path)}`);
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
