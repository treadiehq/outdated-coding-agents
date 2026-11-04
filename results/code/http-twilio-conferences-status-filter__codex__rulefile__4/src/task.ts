export interface TwilioConference {
  sid: string;
  account_sid: string;
  friendly_name: string;
  status: "init" | "in-progress" | "completed";
  date_created: string;
  date_updated: string;
  api_version: string;
  region: string;
  uri: string;
  subresource_uris: Record<string, string>;
}

interface ConferencePage {
  conferences: TwilioConference[];
  next_page_uri: string | null;
}

/**
 * Lists all conference records available on an account using native fetch.
 * Pass the account SID and auth token from server-side configuration only.
 * https://www.twilio.com/docs/voice/api/conference-resource
 *
 * Explicit statuses are required: since September 30, 2026, Twilio defaults
 * unfiltered lists to in-progress. Results are not an atomic snapshot; conference
 * statuses can change while the requests are running.
 */
export async function listAllConferences(
  accountSid: string,
  authToken: string,
): Promise<TwilioConference[]> {
  if (!/^AC[0-9a-fA-F]{32}$/.test(accountSid) || !authToken) {
    throw new Error("A valid Twilio account SID and auth token are required.");
  }

  const origin = "https://api.twilio.com";
  const authorization = `Basic ${btoa(`${accountSid}:${authToken}`)}`;
  const conferences = new Map<string, TwilioConference>();

  // Read active states first so conferences that finish during traversal can
  // also be picked up by the completed query. Deduplicate by conference SID.
  for (const status of ["init", "in-progress", "completed"] as const) {
    let url: URL | null = new URL(
      `/2010-04-01/Accounts/${accountSid}/Conferences.json`,
      origin,
    );
    url.searchParams.set("Status", status);
    url.searchParams.set("PageSize", "1000");

    while (url !== null) {
      if (url.origin !== origin) {
        throw new Error("Twilio returned an unexpected pagination origin.");
      }

      const response = await fetch(url, {
        headers: { Authorization: authorization, Accept: "application/json" },
        redirect: "error",
      });
      if (!response.ok) {
        throw new Error(
          `Twilio conference listing failed (HTTP ${response.status}).`,
        );
      }

      const page = (await response.json()) as ConferencePage;
      if (
        !Array.isArray(page.conferences) ||
        !(page.next_page_uri === null || typeof page.next_page_uri === "string")
      ) {
        throw new Error("Twilio returned an invalid conference list response.");
      }
      for (const conference of page.conferences) {
        conferences.set(conference.sid, conference);
      }
      url = page.next_page_uri ? new URL(page.next_page_uri, origin) : null;
    }
  }

  return [...conferences.values()];
}
