const TWILIO_API_BASE = "https://api.twilio.com";

// Listed in lifecycle order. Conferences only move forward through these, so
// fetching them in this order means one that changes status mid-run is seen
// at least once rather than slipping between two requests.
const CONFERENCE_STATUSES = ["init", "in-progress", "completed"] as const;

export type ConferenceStatus = (typeof CONFERENCE_STATUSES)[number];

export interface TwilioCredentials {
  accountSid: string;
  authToken: string;
}

export interface Conference {
  account_sid: string | null;
  date_created: string | null;
  date_updated: string | null;
  api_version: string | null;
  friendly_name: string | null;
  region: string | null;
  sid: string;
  status: ConferenceStatus;
  uri: string | null;
  subresource_uris: Record<string, string> | null;
  reason_conference_ended: string | null;
  call_sid_ending_conference: string | null;
}

interface ConferencePage {
  conferences: Conference[];
  next_page_uri: string | null;
}

/**
 * Returns every conference on the account available through the REST API,
 * in any status. Twilio only serves conferences from the last thirteen months
 * here; older records require Bulk Export.
 */
export async function listAllConferences({
  accountSid,
  authToken,
}: TwilioCredentials): Promise<Conference[]> {
  const headers = {
    Authorization: `Basic ${btoa(`${accountSid}:${authToken}`)}`,
    Accept: "application/json",
  };

  // Keyed by SID because a conference that changes status mid-run can appear
  // under two statuses. The later, more current record wins.
  const conferences = new Map<string, Conference>();

  // Status must be set explicitly: since September 30, 2026, omitting it
  // returns only in-progress conferences.
  for (const status of CONFERENCE_STATUSES) {
    const query = new URLSearchParams({ Status: status, PageSize: "1000" });
    let path: string | null =
      `/2010-04-01/Accounts/${encodeURIComponent(accountSid)}/Conferences.json?${query}`;

    while (path !== null) {
      const response: Response = await fetch(`${TWILIO_API_BASE}${path}`, { headers });
      if (!response.ok) {
        throw new Error(
          `Twilio request for ${status} conferences failed with ${response.status}: ${await response.text()}`,
        );
      }

      const page = (await response.json()) as ConferencePage;
      for (const conference of page.conferences) {
        conferences.set(conference.sid, conference);
      }
      path = page.next_page_uri;
    }
  }

  return [...conferences.values()];
}
