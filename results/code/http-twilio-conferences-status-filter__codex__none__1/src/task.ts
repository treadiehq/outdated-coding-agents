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
 * Returns all available conferences, including initialized, running, and finished.
 * Use server-side only: accountSid and authToken are Twilio account credentials.
 * Requires a runtime with native fetch and btoa (for example, Node.js 18+).
 * API reference: https://www.twilio.com/docs/voice/api/conference-resource
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

  // Explicit statuses are necessary: the default list excludes completed calls.
  // Fetch completed last so it wins if a conference ends during this operation.
  for (const status of ["init", "in-progress", "completed"] as const) {
    let url: URL | null = new URL(path, origin);
    url.searchParams.set("Status", status);
    url.searchParams.set("PageSize", "1000");

    while (url !== null) {
      // Never forward credentials to an unexpected pagination destination.
      if (url.origin !== origin || url.pathname !== path) {
        throw new Error("Twilio returned an unexpected conference pagination URL.");
      }

      const response = await fetch(url, {
        headers: { Authorization: authorization, Accept: "application/json" },
        redirect: "error",
      });
      if (!response.ok) {
        throw new Error(
          `Twilio conference list failed (${status}): HTTP ${response.status}`,
        );
      }

      const page = (await response.json()) as ConferencePage;
      for (const conference of page.conferences) {
        conferences.set(conference.sid, conference);
      }
      url = page.next_page_uri ? new URL(page.next_page_uri, origin) : null;
    }
  }

  // Listing a changing account is not an atomic snapshot; deduplicate by SID.
  return [...conferences.values()];
}
