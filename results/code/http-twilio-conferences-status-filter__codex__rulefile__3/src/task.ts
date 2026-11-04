export interface Conference {
  sid: string;
  account_sid: string;
  friendly_name: string;
  status: "init" | "in-progress" | "completed";
  date_created: string;
  date_updated: string;
  [key: string]: unknown;
}

interface ConferencePage {
  conferences: Conference[];
  next_page_uri: string | null;
}

/**
 * Returns every conference available through Twilio's REST API for this account.
 * Pass your Account SID and Auth Token; requires a runtime with fetch and btoa.
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
  const authorization = `Basic ${btoa(`${accountSid}:${authToken}`)}`;
  const conferences = new Map<string, Conference>();

  // Since September 30, 2026, omitting Status defaults to in-progress.
  // Include init as well so conferences waiting to start are also returned.
  for (const status of ["init", "in-progress", "completed"] as const) {
    let next: URL | null = new URL(
      `/2010-04-01/Accounts/${accountSid}/Conferences.json`,
      origin,
    );
    next.searchParams.set("Status", status);
    next.searchParams.set("PageSize", "1000");

    while (next !== null) {
      // Keep credentials on Twilio's origin when following pagination links.
      if (next.origin !== origin) {
        throw new Error("Twilio returned an unexpected pagination origin.");
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
        // A conference may change status between requests; return each SID once.
        conferences.set(conference.sid, conference);
      }
      next = page.next_page_uri ? new URL(page.next_page_uri, origin) : null;
    }
  }

  return [...conferences.values()];
}
