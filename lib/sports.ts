import "server-only";

import type { SportsFixture } from "@/components/UpcomingSports";

type ExternalSportsEvent = {
  id?: string | number;
  eventId?: string | number;

  sport?: string;
  category?: string;
  league?: string;
  competition?: string;

  homeTeam?: string;
  home?: string;

  awayTeam?: string;
  away?: string;

  startsAt?: string;
  startTime?: string;
  date?: string;

  featured?: boolean;
  soundOn?: boolean;
  bookingUrl?: string;
};

const SPORTS_FEED_URL =
  process.env.SPORTS_FEED_URL?.trim() ?? "";

const SPORTS_FEED_API_KEY =
  process.env.SPORTS_FEED_API_KEY?.trim() ?? "";

function normalizeSportsEvent(
  event: ExternalSportsEvent,
  index: number,
): SportsFixture | null {
  const startsAt =
    event.startsAt ||
    event.startTime ||
    event.date;

  const homeTeam =
    event.homeTeam ||
    event.home;

  if (!startsAt || !homeTeam) {
    return null;
  }

  const parsedStart = new Date(startsAt);

  if (Number.isNaN(parsedStart.getTime())) {
    return null;
  }

  return {
    id: String(
      event.id ??
        event.eventId ??
        `sport-${parsedStart.getTime()}-${index}`,
    ),

    league:
      event.league ||
      event.competition ||
      "Live Sport",

    category:
      event.category ||
      event.sport ||
      "Sport",

    homeTeam,

    awayTeam:
      event.awayTeam ||
      event.away ||
      null,

    startsAt: parsedStart.toISOString(),

    featured: Boolean(event.featured),

    soundOn: Boolean(event.soundOn),

    bookingUrl:
      event.bookingUrl || null,
  };
}

function extractEvents(payload: unknown): ExternalSportsEvent[] {
  if (Array.isArray(payload)) {
    return payload as ExternalSportsEvent[];
  }

  if (
    payload &&
    typeof payload === "object"
  ) {
    const record = payload as Record<string, unknown>;

    if (Array.isArray(record.events)) {
      return record.events as ExternalSportsEvent[];
    }

    if (Array.isArray(record.fixtures)) {
      return record.fixtures as ExternalSportsEvent[];
    }

    if (Array.isArray(record.data)) {
      return record.data as ExternalSportsEvent[];
    }

    if (
      record.data &&
      typeof record.data === "object"
    ) {
      const nestedData =
        record.data as Record<string, unknown>;

      if (Array.isArray(nestedData.events)) {
        return nestedData.events as ExternalSportsEvent[];
      }

      if (Array.isArray(nestedData.fixtures)) {
        return nestedData.fixtures as ExternalSportsEvent[];
      }
    }
  }

  return [];
}

export async function getUpcomingSports(): Promise<
  SportsFixture[]
> {
  if (!SPORTS_FEED_URL) {
    console.warn(
      "SPORTS_FEED_URL has not been configured.",
    );

    return [];
  }

  try {
    const response = await fetch(SPORTS_FEED_URL, {
      headers: {
        Accept: "application/json",

        ...(SPORTS_FEED_API_KEY
          ? {
              Authorization: `Bearer ${SPORTS_FEED_API_KEY}`,
            }
          : {}),
      },

      next: {
        revalidate: 900,
      },
    });

    if (!response.ok) {
      console.error(
        `Sports feed returned ${response.status}: ${response.statusText}`,
      );

      return [];
    }

    const payload: unknown = await response.json();

    const events = extractEvents(payload);

    const now = Date.now();

    return events
      .map(normalizeSportsEvent)
      .filter(
        (
          fixture,
        ): fixture is SportsFixture =>
          fixture !== null,
      )
      .filter((fixture) => {
        const fixtureTime =
          new Date(fixture.startsAt).getTime();

        return (
          fixtureTime + 3 * 60 * 60 * 1000 >= now
        );
      })
      .sort((a, b) => {
        if (a.featured !== b.featured) {
          return a.featured ? -1 : 1;
        }

        return (
          new Date(a.startsAt).getTime() -
          new Date(b.startsAt).getTime()
        );
      })
      .slice(0, 12);
  } catch (error) {
    console.error(
      "Unable to retrieve sports fixtures:",
      error,
    );

    return [];
  }
}