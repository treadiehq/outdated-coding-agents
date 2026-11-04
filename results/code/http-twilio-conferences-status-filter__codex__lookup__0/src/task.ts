export type ConferenceStatus = "init" | "in-progress" | "completed";

/** A conference in Twilio's raw REST response (dates remain strings). */
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
 * Fetch all conferences available through the list endpoint, using native fetch.
 * Run server-side and pass credentials from your secret store/environment.
 * username/password can be an API Key SID/secret or Account SID/Auth Token.
 *
 * Since September 30, 2026, omitting Status returns only in-progress conferences.
 * Each status must therefore be queried and paginated explicitly.
 * Twilio retains only 13 months here; older records require Bulk Export.
 * This is not an atomic snapshot: conferences can change while pages are read.
 * https://www.twilio.com/docs/voice/api/conference-resource
 */
export async function listAllConferences(
  accountSid: string,
  username: string,
  password: string,
  signal?: AbortSignal,
): Promise<Conference[]> {
  if (!/^AC[0-9a-fA-F]{32}$/.test(accountSid)) {
    throw new Error("A valid Twilio Account SID is required.");
  }
  if (!username || !password || username.includes(":")) {
    throw new Error("Valid Twilio Basic authentication credentials are required.");
  }

  const origin = "https://api.twilio.com";
  const path = `/2010-04-01/Accounts/${accountSid}/Conferences.json`;
  const authorization = `Basic ${btoa(`${username}:${password}`)}`;
  const conferences = new Map<string, Conference>();

  // Query completed last so a conference that ends during the fetch is updated.
  for (const status of ["init", "in-progress", "completed"] as const) {
    let url: URL | null = new URL(path, origin);
    url.searchParams.set("Status", status);
    url.searchParams.set("PageSize", "1000");

    while (url) {
      // Never forward credentials outside the intended account endpoint.
      if (url.origin !== origin || url.pathname !== path) {
        throw new Error("Unexpected Twilio pagination URL.");
      }
      url.searchParams.set("Status", status);
      const response = await fetch(url, {
        headers: { Authorization: authorization, Accept: "application/json" },
        redirect: "error",
        signal,
      });
      if (!response.ok) {
        throw new Error(
          `Twilio conference listing failed: HTTP ${response.status} (${status}).`,
        );
      }

      const page = (await response.json()) as ConferencePage;
      for (const conference of page.conferences) {
        conferences.set(conference.sid, conference);
      }
      url = page.next_page_uri ? new URL(page.next_page_uri, origin) : null;
    }
  }

  return [...conferences.values()];
}
