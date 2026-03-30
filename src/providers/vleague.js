// ============================================================
// ADAPTER — V.League (placeholder)
// Uncomment and fill in when you have API access.
// ============================================================

// export const vleague = {
//   name: "V.League API",
//   competitions: {
//     VL1: { name: "V.League 1", flag: "🇻🇳", country: "Vietnam" },
//   },
//
//   normalizeStandings: (raw) =>
//     raw.table.map((row) => ({
//       position: row.position,
//       team: { id: row.team.id, name: row.team.name, shortName: row.team.shortName, crest: row.team.logo },
//       played: row.played,
//       won:    row.won,
//       draw:   row.drawn,
//       lost:   row.lost,
//       gf:     row.goalsFor,
//       ga:     row.goalsAgainst,
//       gd:     row.goalDifference,
//       points: row.points,
//       form:   null,
//     })),
//
//   normalizeMatches: (raw) =>
//     raw.fixtures.map((m) => ({
//       id:       m.id,
//       matchday: m.round,
//       status:   m.status,
//       utcDate:  m.datetime,
//       homeTeam: { id: m.homeTeam.id, name: m.homeTeam.name, crest: m.homeTeam.logo },
//       awayTeam: { id: m.awayTeam.id, name: m.awayTeam.name, crest: m.awayTeam.logo },
//       score: {
//         home: m.score?.home ?? null,
//         away: m.score?.away ?? null,
//         half: { home: m.halfScore?.home ?? null, away: m.halfScore?.away ?? null },
//       },
//     })),
//
//   normalizeScorers: (raw) =>
//     raw.topScorers.map((s, i) => ({
//       rank:   i + 1,
//       player: { id: s.player.id, name: s.player.name, nationality: s.player.nationality },
//       team:   { id: s.team.id, name: s.team.name, crest: s.team.logo },
//       goals:     s.goals,
//       assists:   s.assists   ?? 0,
//       penalties: s.penalties ?? 0,
//     })),
// };
