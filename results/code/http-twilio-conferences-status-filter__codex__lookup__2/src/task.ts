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
 * Run server-side with native fetch and btoa (for example, Node.js 18+).
 * Pass an API key SID/secret, or the Account SID/Auth Token as username/password.
 * Returns all conferences currently available through Twilio's REST API.
 * Status queries and pages are not an atomic snapshot of a changing account.
 * Docs: https://www.twilio.com/docs/voice/api/conference-resource
 */
export async function getAllConferences(
  accountSid: string,
  username: string,
  password: string,
  signal?: AbortSignal,
): Promise<TwilioConference[]> {
  if (!accountSid || !username || !password) {
    throw new Error("Account SID and Twilio credentials are required.");
  }

  const origin = "https://api.twilio.com";
  const path = `/2010-04-01/Accounts/${encodeURIComponent(accountSid)}/Conferences.json`;
  const authorization = `Basic ${btoa(`${username}:${password}`)}`;
  const conferences = new Map<string, TwilioConference>();

  // Since September 30, 2026, omitting Status returns only in-progress
  // conferences. Query every status explicitly, including completed ones.
  for (const status of ["init", "in-progress", "completed"] as const) {
    let next: URL | null = new URL(path, origin);
    next.searchParams.set("Status", status);
    next.searchParams.set("PageSize", "1000");

    while (next !== null) {
      if (next.origin !== origin || next.pathname !== path) {
        throw new Error("Unexpected Twilio pagination URL.");
      }

      const response = await fetch(next, {
        headers: { Authorization: authorization, Accept: "application/json" },
        redirect: "error",
        signal,
      });
      if (!response.ok) {
        throw new Error(`Twilio conference request failed (HTTP ${response.status}).`);
      }

      const page = (await response.json()) as ConferencePage;
      if (
        !Array.isArray(page.conferences) ||
        !(page.next_page_uri === null || typeof page.next_page_uri === "string")
      ) {
        throw new Error("Unexpected Twilio conference response.");
      }
      for (const conference of page.conferences) {
        // A conference can move between statuses while the queries run.
        conferences.set(conference.sid, conference);
      }
      next = page.next_page_uri ? new URL(page.next_page_uri, origin) : null;
    }
  }

  return [...conferences.values()];
}
