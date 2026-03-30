// Unified provider export.
// To switch data sources, change `activeProvider` here — nothing else needs updating.

import { apiFootball, FootballClient } from "./apiFootball.js";
import { footballData } from "./footballData.js";

export const activeProvider = apiFootball;
export { FootballClient };

// All registered providers (for future UI switcher or testing)
export const providers = { apiFootball, footballData };
