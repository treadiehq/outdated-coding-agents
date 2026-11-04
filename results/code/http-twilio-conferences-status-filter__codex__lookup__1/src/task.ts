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
 * Fetch running and completed conferences using an Account SID and Auth Token.
 * Run on a server so the credentials remain private. Requires built-in fetch.
 * https://www.twilio.com/docs/voice/api/conference-resource
 */
export async function getAllConferences(
  accountSid: string,
  authToken: string,
  signal?: AbortSignal,
): Promise<Conference[]> {
  if (!/^AC[0-9a-fA-F]{32}$/.test(accountSid) || !authToken) {
    throw new Error("A valid Twilio Account SID and Auth Token are required.");
  }

  const origin = "https://api.twilio.com";
  const path = `/2010-04-01/Accounts/${accountSid}/Conferences.json`;
  const authorization = `Basic ${btoa(`${accountSid}:${authToken}`)}`;
  const conferences = new Map<string, Conference>();

  // Since September 30, 2026, omitting Status returns only running conferences.
  // Fetch completed second so a conference that finishes during retrieval wins.
  // This paginated API does not provide a snapshot of a changing account.
  for (const status of ["in-progress", "completed"] as const) {
    let url: URL | null = new URL(path, origin);
    url.searchParams.set("Status", status);
    url.searchParams.set("PageSize", "1000");

    while (url) {
      // Never forward credentials outside the account's conference endpoint.
      if (url.origin !== origin || url.pathname !== path) {
        throw new Error("Twilio returned an unexpected pagination URL.");
      }

      const response = await fetch(url, {
        headers: { Authorization: authorization, Accept: "application/json" },
        signal,
        redirect: "error",
      });
      if (!response.ok) {
        throw new Error(
          `Twilio conference request failed: HTTP ${response.status} ${response.statusText}`,
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
