export type ConferenceStatus = "init" | "in-progress" | "completed";

export interface Conference {
  sid: string;
  account_sid: string;
  friendly_name: string;
  status: ConferenceStatus;
  date_created: string;
  date_updated: string;
  [key: string]: unknown;
}

interface ConferencePage {
  conferences: Conference[];
  next_page_uri: string | null;
}

/**
 * Returns every conference still available through Twilio's REST API.
 * Run server-side with an Account SID and Auth Token; never expose these to clients.
 * Requires a runtime with fetch and btoa (for example, Node.js 18+).
 * https://www.twilio.com/docs/voice/api/conference-resource
 */
export async function getAllConferences(
  accountSid: string,
  authToken: string,
): Promise<Conference[]> {
  if (!/^AC[0-9a-fA-F]{32}$/.test(accountSid) || !authToken) {
    throw new Error("A valid Twilio Account SID and Auth Token are required.");
  }

  const origin = "https://api.twilio.com";
  const path = `/2010-04-01/Accounts/${accountSid}/Conferences.json`;
  const authorization = `Basic ${btoa(`${accountSid}:${authToken}`)}`;
  const conferences = new Map<string, Conference>();

  // Since September 30, 2026, omitting Status defaults to in-progress.
  // Query each status explicitly, including conferences awaiting participants.
  // Read completed last so transitions to completed overwrite earlier snapshots.
  for (const status of ["init", "in-progress", "completed"] as const) {
    let next: URL | null = new URL(path, origin);
    next.searchParams.set("Status", status);
    next.searchParams.set("PageSize", "1000");

    while (next) {
      // Pagination must never forward account credentials to another origin.
      if (next.origin !== origin || next.pathname !== path) {
        throw new Error("Twilio returned an unexpected pagination URL.");
      }

      const response = await fetch(next, {
        headers: { Authorization: authorization, Accept: "application/json" },
        redirect: "error",
      });
      if (!response.ok) {
        throw new Error(`Twilio conference request failed (HTTP ${response.status}).`);
      }

      const page = (await response.json()) as ConferencePage;
      for (const conference of page.conferences) {
        conferences.set(conference.sid, conference);
      }
      next = page.next_page_uri ? new URL(page.next_page_uri, origin) : null;
    }
  }

  // Listing is not an atomic snapshot: conferences can change while paging.
  return [...conferences.values()];
}
