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
 * Lists every conference currently available through Twilio's REST API.
 * Run on the server; the account Auth Token must remain private.
 * https://www.twilio.com/docs/voice/api/conference-resource
 * Listings are not a snapshot: conferences can change status during pagination.
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

  // Since September 30, 2026, omitting Status defaults to in-progress.
  // Include init as well so conferences waiting to start are also returned.
  for (const status of ["init", "in-progress", "completed"] as const) {
    let next: URL | null = new URL(path, origin);
    next.searchParams.set("Status", status);
    next.searchParams.set("PageSize", "1000");

    while (next !== null) {
      // Do not send account credentials to a different pagination origin.
      if (next.origin !== origin || next.pathname !== path) {
        throw new Error("Twilio returned an unexpected conference page URL.");
      }

      const response = await fetch(next, {
        headers: { Authorization: authorization, Accept: "application/json" },
        redirect: "error",
      });
      if (!response.ok) {
        throw new Error(
          `Twilio conference listing failed (${response.status} ${response.statusText}).`,
        );
      }

      const page = (await response.json()) as ConferencePage;
      if (
        !Array.isArray(page.conferences) ||
        (page.next_page_uri !== null && typeof page.next_page_uri !== "string")
      ) {
        throw new Error("Twilio returned an invalid conference list response.");
      }
      for (const conference of page.conferences) {
        // A conference may move between status queries; return each SID once.
        conferences.set(conference.sid, conference);
      }
      next = page.next_page_uri ? new URL(page.next_page_uri, origin) : null;
    }
  }

  return [...conferences.values()];
}
