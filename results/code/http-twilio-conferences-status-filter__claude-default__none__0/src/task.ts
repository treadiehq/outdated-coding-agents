const TWILIO_API_BASE = "https://api.twilio.com";

// Ordered by lifecycle. Twilio has defaulted Status to `in-progress` since
// 2026-09-30, so omitting the filter would leave out finished conferences.
const CONFERENCE_STATUSES = ["init", "in-progress", "completed"] as const;

export type ConferenceStatus = (typeof CONFERENCE_STATUSES)[number];

export interface Conference {
  account_sid: string;
  date_created: string | null;
  date_updated: string | null;
  api_version: string;
  friendly_name: string;
  region: string;
  sid: string;
  status: ConferenceStatus;
  uri: string;
  subresource_uris: Record<string, string>;
  reason_conference_ended: string | null;
  call_sid_ending_conference: string | null;
}

interface ConferencePage {
  conferences: Conference[];
  next_page_uri: string | null;
}

/**
 * Returns every conference on the account in any status. Twilio only serves
 * conferences through this API for 13 months after creation; older records
 * require Bulk Export.
 */
export async function listAllConferences(
  accountSid: string,
  authToken: string,
): Promise<Conference[]> {
  const authorization = `Basic ${btoa(`${accountSid}:${authToken}`)}`;
  const conferences = new Map<string, Conference>();

  // Run sequentially, in lifecycle order: a conference that changes status
  // mid-listing is then seen again rather than missed, and keying by SID keeps
  // only its latest state.
  for (const status of CONFERENCE_STATUSES) {
    let uri: string | null =
      `/2010-04-01/Accounts/${encodeURIComponent(accountSid)}/Conferences.json` +
      `?Status=${status}&PageSize=1000`;

    while (uri) {
      const response: Response = await fetch(`${TWILIO_API_BASE}${uri}`, {
        headers: { Authorization: authorization },
      });
      if (!response.ok) {
        throw new Error(
          `Twilio request failed with ${response.status}: ${await response.text()}`,
        );
      }

      const page: ConferencePage = await response.json();
      for (const conference of page.conferences) {
        conferences.set(conference.sid, conference);
      }
      uri = page.next_page_uri;
    }
  }

  return [...conferences.values()];
}
