export interface TwilioConference {
  sid: string;
  account_sid: string;
  friendly_name: string;
  status: "init" | "in-progress" | "completed";
  date_created: string;
  date_updated: string;
  region: string;
  uri: string;
  api_version: string;
  subresource_uris: Record<string, string>;
  reason_conference_ended: string | null;
  call_sid_ending_conference: string | null;
}

interface ConferencePage {
  conferences: TwilioConference[];
  next_page_uri: string | null;
}

/**
 * Fetch every available conference for one account, including completed ones.
 * Call on the server with credentials from your secret store/environment.
 * username/password may be an API key SID/secret or Account SID/Auth Token.
 * Requires a runtime providing fetch, URL, and btoa (such as Node.js 18+).
 *
 * Docs: https://www.twilio.com/docs/voice/api/conference-resource
 * Since September 30, 2026, omitting Status defaults to in-progress only.
 * The API provides no atomic snapshot; conferences may change during paging.
 */
export async function listAllConferences(
  accountSid: string,
  username: string,
  password: string,
  signal?: AbortSignal,
): Promise<TwilioConference[]> {
  if (!/^AC[0-9a-fA-F]{32}$/.test(accountSid)) {
    throw new Error("A valid Twilio Account SID is required.");
  }
  if (!username || username.includes(":") || !password) {
    throw new Error("Twilio Basic authentication credentials are required.");
  }

  const origin = "https://api.twilio.com";
  const path = `/2010-04-01/Accounts/${accountSid}/Conferences.json`;
  const authorization = `Basic ${btoa(`${username}:${password}`)}`;
  const conferences = new Map<string, TwilioConference>();

  // Read completed last so a conference that ends during traversal is deduplicated.
  for (const status of ["init", "in-progress", "completed"] as const) {
    let next: URL | null = new URL(path, origin);
    next.searchParams.set("Status", status);
    next.searchParams.set("PageSize", "1000");

    while (next !== null) {
      // Never send credentials to a different host or account via a paging link.
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
        (page.next_page_uri !== null && typeof page.next_page_uri !== "string")
      ) {
        throw new Error("Unexpected Twilio conference list response.");
      }
      for (const conference of page.conferences) {
        conferences.set(conference.sid, conference);
      }
      next = page.next_page_uri ? new URL(page.next_page_uri, origin) : null;
    }
  }

  return [...conferences.values()];
}
