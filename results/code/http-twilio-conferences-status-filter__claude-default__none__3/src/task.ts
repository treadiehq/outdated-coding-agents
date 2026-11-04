const TWILIO_API_BASE = "https://api.twilio.com";

// Since 2026-09-30, omitting Status returns only in-progress conferences, so
// each status has to be requested explicitly. Listed in lifecycle order so a
// conference that changes status mid-listing is picked up by a later request.
const CONFERENCE_STATUSES = ["init", "in-progress", "completed"] as const;

export type ConferenceStatus = (typeof CONFERENCE_STATUSES)[number];

export interface Conference {
  account_sid: string | null;
  sid: string;
  date_created: string | null;
  date_updated: string | null;
  api_version: string | null;
  friendly_name: string | null;
  region: string | null;
  status: ConferenceStatus;
  reason_conference_ended: string | null;
  call_sid_ending_conference: string | null;
  uri: string | null;
  subresource_uris: Record<string, string> | null;
}

interface ConferencePage {
  conferences: Conference[];
  next_page_uri: string | null;
}

/**
 * Returns every conference on the account, whatever its status.
 * Twilio only serves conferences created in the last thirteen months here;
 * older records are available only through Bulk Export.
 */
export async function listAllConferences(
  accountSid: string,
  authToken: string,
): Promise<Conference[]> {
  const headers = {
    Authorization: `Basic ${btoa(`${accountSid}:${authToken}`)}`,
    Accept: "application/json",
  };
  const bySid = new Map<string, Conference>();

  for (const status of CONFERENCE_STATUSES) {
    const query = new URLSearchParams({ Status: status, PageSize: "1000" });
    let nextUri: string | null =
      `/2010-04-01/Accounts/${encodeURIComponent(accountSid)}/Conferences.json?${query}`;

    while (nextUri) {
      const response = await fetch(`${TWILIO_API_BASE}${nextUri}`, { headers });
      if (!response.ok) {
        throw new Error(
          `Twilio request failed (${response.status}) for status "${status}": ${await response.text()}`,
        );
      }

      const page = (await response.json()) as ConferencePage;
      for (const conference of page.conferences) {
        // A conference can appear under two statuses if it changes mid-listing;
        // the later request has the newer state, so it wins.
        bySid.set(conference.sid, conference);
      }
      nextUri = page.next_page_uri;
    }
  }

  return [...bySid.values()];
}
