const BASE_URL = "https://api.twilio.com";
const STATUSES = ["init", "in-progress", "completed"] as const;

export interface TwilioConference {
  sid: string;
  account_sid: string;
  friendly_name: string;
  status: (typeof STATUSES)[number];
  region: string;
  date_created: string;
  date_updated: string;
  api_version: string;
  uri: string;
  subresource_uris: Record<string, string>;
  reason_conference_ended: string | null;
  call_sid_ending_conference: string | null;
}

interface ConferencePage {
  conferences: TwilioConference[];
  next_page_uri: string | null;
}

/**
 * Returns every conference on the account, running and finished.
 *
 * Twilio's list endpoint returns only one status per request (since
 * 2026-09-30 the default is `in-progress`), so each status is queried and
 * all pages are followed via `next_page_uri`. Twilio retains conference
 * records for thirteen months.
 */
export async function listAllConferences(
  accountSid = process.env.TWILIO_ACCOUNT_SID,
  authToken = process.env.TWILIO_AUTH_TOKEN,
): Promise<TwilioConference[]> {
  if (!accountSid || !authToken) {
    throw new Error("TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN are required");
  }
  const authorization = `Basic ${btoa(`${accountSid}:${authToken}`)}`;
  const all: TwilioConference[] = [];

  for (const status of STATUSES) {
    let path: string | null =
      `/2010-04-01/Accounts/${accountSid}/Conferences.json?` +
      new URLSearchParams({ Status: status, PageSize: "1000" });

    while (path) {
      const res = await fetch(BASE_URL + path, {
        headers: { Authorization: authorization, Accept: "application/json" },
      });
      if (!res.ok) {
        throw new Error(
          `Twilio conferences request failed: ${res.status} ${await res.text()}`,
        );
      }
      const page = (await res.json()) as ConferencePage;
      all.push(...page.conferences);
      path = page.next_page_uri;
    }
  }

  return all;
}
