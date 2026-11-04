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
 * Fetch every available conference for one account using native fetch (Node 18+).
 * Call on the server with your Account SID and Auth Token; never expose the token
 * in browser code. The result retains Twilio's snake_case response properties.
 * Docs: https://www.twilio.com/docs/voice/api/conference-resource
 * Lists are not snapshots: conferences may change status while fetching pages.
 */
export async function listAllConferences(
  accountSid: string,
  authToken: string,
): Promise<TwilioConference[]> {
  if (!/^AC[0-9a-fA-F]{32}$/.test(accountSid) || !authToken) {
    throw new Error("A valid Twilio Account SID and Auth Token are required.");
  }

  const origin = "https://api.twilio.com";
  const path = `/2010-04-01/Accounts/${accountSid}/Conferences.json`;
  const authorization = `Basic ${btoa(`${accountSid}:${authToken}`)}`;
  const conferences = new Map<string, TwilioConference>();

  // Since September 30, 2026, omitting Status defaults to in-progress only.
  for (const status of ["init", "in-progress", "completed"] as const) {
    let next: URL | null = new URL(path, origin);
    next.searchParams.set("Status", status);
    next.searchParams.set("PageSize", "1000");

    while (next !== null) {
      // Keep credentials confined to the expected account's list endpoint.
      if (next.origin !== origin || next.pathname !== path) {
        throw new Error("Twilio returned an unexpected pagination URL.");
      }
      const response = await fetch(next, {
        headers: { Authorization: authorization, Accept: "application/json" },
        redirect: "error",
      });
      if (!response.ok) {
        throw new Error(
          `Twilio conference listing failed (HTTP ${response.status}, Status=${status}).`,
        );
      }

      const page = (await response.json()) as ConferencePage;
      for (const conference of page.conferences) {
        conferences.set(conference.sid, conference);
      }
      next = page.next_page_uri ? new URL(page.next_page_uri, origin) : null;
    }
  }

  return [...conferences.values()];
}
