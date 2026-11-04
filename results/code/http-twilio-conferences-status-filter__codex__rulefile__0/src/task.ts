export type ConferenceStatus = "init" | "in-progress" | "completed";

/** Twilio REST response fields use snake_case; dates remain strings. */
export interface Conference {
  sid: string;
  account_sid: string;
  friendly_name: string;
  status: ConferenceStatus;
  date_created: string;
  date_updated: string;
  region: string;
  uri: string;
  [key: string]: unknown;
}

interface ConferencePage {
  conferences: Conference[];
  next_page_uri: string | null;
}

/**
 * Returns all available conferences for an account using native fetch.
 * Pass your Account SID and Auth Token from a server-side environment only.
 * Like any paginated API read, this is not an atomic snapshot of changing data.
 *
 * @see https://www.twilio.com/docs/voice/api/conference-resource
 */
export async function listAllConferences(
  accountSid: string,
  authToken: string,
): Promise<Conference[]> {
  if (!/^AC[0-9a-fA-F]{32}$/.test(accountSid) || !authToken) {
    throw new Error("A valid Twilio Account SID and Auth Token are required.");
  }

  const origin = "https://api.twilio.com";
  const authorization = `Basic ${btoa(`${accountSid}:${authToken}`)}`;
  const conferences = new Map<string, Conference>();

  // Since September 30, 2026, omitting Status defaults to in-progress.
  // Read completed last so it supersedes earlier observations of the same SID.
  for (const status of ["init", "in-progress", "completed"] as const) {
    let next: URL | null = new URL(
      `/2010-04-01/Accounts/${accountSid}/Conferences.json`,
      origin,
    );
    next.searchParams.set("Status", status);
    next.searchParams.set("PageSize", "1000");

    while (next) {
      // Pagination links can be relative; never send credentials off-origin.
      if (next.origin !== origin) {
        throw new Error("Twilio returned an unexpected pagination origin.");
      }
      const response = await fetch(next, {
        headers: { Authorization: authorization, Accept: "application/json" },
        redirect: "error",
      });
      if (!response.ok) {
        throw new Error(
          `Twilio conference listing failed for Status=${status}: HTTP ${response.status} ${response.statusText}`,
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
