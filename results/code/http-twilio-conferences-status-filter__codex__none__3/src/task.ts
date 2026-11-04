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
 * Returns every conference available through the account's REST API.
 * Run server-side so the auth token stays private.
 * Listing is not an atomic snapshot; conferences can change during pagination.
 * https://www.twilio.com/docs/voice/api/conference-resource
 */
export async function getAllConferences(
  accountSid: string,
  authToken: string,
): Promise<Conference[]> {
  if (!/^AC[0-9a-fA-F]{32}$/.test(accountSid) || !authToken) {
    throw new Error("A valid Twilio Account SID and auth token are required.");
  }

  const origin = "https://api.twilio.com";
  const endpoint = `/2010-04-01/Accounts/${accountSid}/Conferences.json`;
  const authorization = `Basic ${btoa(`${accountSid}:${authToken}`)}`;
  const conferences = new Map<string, Conference>();

  // Status must be explicit: the default excludes completed conferences.
  // Read completed last to also catch conferences that finish during the scan.
  for (const status of ["init", "in-progress", "completed"] as const) {
    let next: URL | null = new URL(endpoint, origin);
    next.searchParams.set("Status", status);
    next.searchParams.set("PageSize", "1000");

    while (next !== null) {
      // Never send credentials to another origin supplied by a pagination URL.
      if (next.origin !== origin || next.pathname !== endpoint) {
        throw new Error("Twilio returned an unexpected pagination URL.");
      }

      const response = await fetch(next, {
        headers: { Authorization: authorization, Accept: "application/json" },
        redirect: "error",
      });
      if (!response.ok) {
        throw new Error(
          `Twilio conference listing failed: HTTP ${response.status} ${response.statusText}`,
        );
      }

      const page = (await response.json()) as ConferencePage;
      for (const conference of page.conferences) {
        conferences.set(conference.sid, conference);
      }
      next = page.next_page_uri
        ? new URL(page.next_page_uri, origin)
        : null;
    }
  }

  return [...conferences.values()];
}
