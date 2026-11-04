const TWILIO_API_BASE = "https://api.twilio.com";

// Listed in lifecycle order. A conference that changes status while we are
// paging moves to a status we have yet to read, so it can't be missed.
const CONFERENCE_STATUSES = ["init", "in-progress", "completed"] as const;

export type ConferenceStatus = (typeof CONFERENCE_STATUSES)[number];

export interface Conference {
  account_sid: string;
  sid: string;
  date_created: string;
  date_updated: string;
  api_version: string;
  friendly_name: string;
  region: string;
  status: ConferenceStatus;
  reason_conference_ended: string | null;
  call_sid_ending_conference: string | null;
  uri: string;
  subresource_uris: Record<string, string>;
}

interface ConferencePage {
  conferences: Conference[];
  next_page_uri: string | null;
}

/**
 * Returns every conference on the account, whatever its status.
 *
 * Since September 30, 2026 the list endpoint returns only in-progress
 * conferences when no Status is given, so each status is requested explicitly.
 * Twilio serves conferences through this endpoint for thirteen months after
 * creation; older records are only available through Bulk Export.
 */
export async function listAllConferences(
  accountSid: string,
  authToken: string,
): Promise<Conference[]> {
  const authorization = `Basic ${btoa(`${accountSid}:${authToken}`)}`;
  const conferences = new Map<string, Conference>();

  for (const status of CONFERENCE_STATUSES) {
    const query = new URLSearchParams({ Status: status, PageSize: "1000" });
    let path: string | null =
      `/2010-04-01/Accounts/${accountSid}/Conferences.json?${query}`;

    while (path) {
      const response = await fetch(new URL(path, TWILIO_API_BASE), {
        headers: { Authorization: authorization },
      });
      if (!response.ok) {
        throw new Error(
          `Twilio request failed with ${response.status}: ${await response.text()}`,
        );
      }

      const page = (await response.json()) as ConferencePage;
      for (const conference of page.conferences) {
        // Keyed by SID so a conference seen under two statuses appears once,
        // with its latest state.
        conferences.set(conference.sid, conference);
      }
      path = page.next_page_uri;
    }
  }

  return [...conferences.values()];
}
