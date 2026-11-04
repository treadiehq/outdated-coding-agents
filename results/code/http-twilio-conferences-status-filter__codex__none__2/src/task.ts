export interface TwilioConference {
  sid: string;
  account_sid: string;
  friendly_name: string;
  status: "init" | "in-progress" | "completed";
  date_created: string;
  date_updated: string;
  [key: string]: unknown;
}

interface ConferencePage {
  conferences: TwilioConference[];
  next_page_uri: string | null;
}

/**
 * Returns all conferences available through Twilio's REST API.
 * Use server-side only: credentials must never be exposed to a browser.
 * Pagination is not a snapshot; conferences may change while this runs.
 * https://www.twilio.com/docs/voice/api/conference-resource
 */
export async function getAllConferences(
  accountSid: string,
  authToken: string,
  signal?: AbortSignal,
): Promise<TwilioConference[]> {
  if (!/^AC[0-9a-fA-F]{32}$/.test(accountSid) || !authToken) {
    throw new Error("A valid Twilio Account SID and Auth Token are required.");
  }

  const origin = "https://api.twilio.com";
  const path = `/2010-04-01/Accounts/${accountSid}/Conferences.json`;
  const authorization = `Basic ${btoa(`${accountSid}:${authToken}`)}`;
  const conferences = new Map<string, TwilioConference>();

  // Explicit filters are required: an unfiltered request defaults to in-progress.
  // Read completed last so a conference that ends during the fetch can be updated.
  for (const status of ["init", "in-progress", "completed"] as const) {
    let next: URL | null = new URL(path, origin);
    next.searchParams.set("Status", status);
    next.searchParams.set("PageSize", "1000");

    while (next !== null) {
      // Do not forward credentials outside this account's conference endpoint.
      if (next.origin !== origin || next.pathname !== path) {
        throw new Error("Twilio returned an unexpected pagination URL.");
      }
      const response = await fetch(next, {
        headers: { Authorization: authorization, Accept: "application/json" },
        signal,
        redirect: "error",
      });
      if (!response.ok) {
        throw new Error(`Twilio conference listing failed (HTTP ${response.status}).`);
      }

      const page = (await response.json()) as ConferencePage;
      if (
        !Array.isArray(page.conferences) ||
        !(page.next_page_uri === null || typeof page.next_page_uri === "string")
      ) {
        throw new Error("Twilio returned an invalid conference list response.");
      }
      for (const conference of page.conferences) {
        conferences.set(conference.sid, conference);
      }
      next = page.next_page_uri ? new URL(page.next_page_uri, origin) : null;
    }
  }

  return [...conferences.values()];
}
