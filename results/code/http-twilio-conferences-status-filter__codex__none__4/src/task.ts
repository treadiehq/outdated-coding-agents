export type ConferenceStatus = "init" | "in-progress" | "completed";

/** A conference as returned by Twilio's REST API (snake_case fields). */
export interface TwilioConference {
  sid: string;
  account_sid: string;
  friendly_name: string;
  status: ConferenceStatus;
  date_created: string;
  date_updated: string;
  uri: string;
  [field: string]: unknown;
}

interface ConferencePage {
  conferences: TwilioConference[];
  next_page_uri: string | null;
}

/**
 * Lists every available conference, including running and completed conferences.
 * Run server-side so the account's Auth Token is never exposed to a browser.
 * Requires a runtime with fetch and btoa (for example, Node.js 18+).
 *
 * Twilio defaults to in-progress since September 30, 2026, so each status
 * must be requested explicitly. API reference:
 * https://www.twilio.com/docs/voice/api/conference-resource
 *
 * Listing is not an atomic snapshot: conferences can change during pagination.
 */
export async function listAllConferences(
  accountSid: string,
  authToken: string,
  signal?: AbortSignal,
): Promise<TwilioConference[]> {
  if (!/^AC[0-9a-fA-F]{32}$/.test(accountSid) || !authToken) {
    throw new Error("Provide a valid Twilio Account SID and a nonempty Auth Token.");
  }

  const origin = "https://api.twilio.com";
  const path = `/2010-04-01/Accounts/${accountSid}/Conferences.json`;
  const authorization = `Basic ${btoa(`${accountSid}:${authToken}`)}`;
  const conferences = new Map<string, TwilioConference>();

  // Fetch completed last so its newer record wins if a running conference ends.
  for (const status of ["init", "in-progress", "completed"] as const) {
    let next: URL | null = new URL(path, origin);
    next.searchParams.set("Status", status);
    next.searchParams.set("PageSize", "1000");

    while (next !== null) {
      // Do not send credentials to an unexpected pagination destination.
      if (next.origin !== origin || next.pathname !== path) {
        throw new Error("Twilio returned an unexpected conference pagination URL.");
      }

      const response = await fetch(next, {
        headers: { Authorization: authorization, Accept: "application/json" },
        redirect: "error",
        signal,
      });
      if (!response.ok) {
        throw new Error(
          `Twilio conference listing failed for status ${status}: HTTP ${response.status}`,
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
