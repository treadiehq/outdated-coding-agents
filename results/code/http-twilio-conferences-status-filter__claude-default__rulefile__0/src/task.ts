const API_BASE = "https://api.twilio.com";

// Ordered by lifecycle, so a conference that changes status between requests
// is seen again later rather than missed.
const CONFERENCE_STATUSES = ["init", "in-progress", "completed"] as const;

export type ConferenceStatus = (typeof CONFERENCE_STATUSES)[number];

export interface Conference {
  sid: string;
  account_sid: string;
  friendly_name: string;
  status: ConferenceStatus;
  region: string;
  date_created: string | null;
  date_updated: string | null;
  reason_conference_ended: string | null;
  call_sid_ending_conference: string | null;
  api_version: string;
  uri: string;
  subresource_uris: Record<string, string>;
}

interface ConferencePage {
  conferences: Conference[];
  next_page_uri: string | null;
}

/**
 * Returns every conference on the account available through the REST API,
 * regardless of status. Twilio only serves records up to thirteen months old
 * here; older ones require Bulk Export.
 */
export async function listAllConferences(
  accountSid: string,
  authToken: string,
): Promise<Conference[]> {
  const headers = {
    Authorization: `Basic ${btoa(`${accountSid}:${authToken}`)}`,
    Accept: "application/json",
  };
  const conferences = new Map<string, Conference>();

  // Since 2026-09-30 omitting Status returns only in-progress conferences, and
  // the filter takes a single value, so each status needs its own listing.
  for (const status of CONFERENCE_STATUSES) {
    const params = new URLSearchParams({ Status: status, PageSize: "1000" });
    let path: string | null =
      `/2010-04-01/Accounts/${encodeURIComponent(accountSid)}/Conferences.json?${params}`;

    while (path !== null) {
      const response: Response = await fetch(`${API_BASE}${path}`, { headers });
      if (!response.ok) {
        throw new Error(
          `Twilio request failed (${response.status}) for status "${status}": ${await response.text()}`,
        );
      }

      const page: ConferencePage = await response.json();
      for (const conference of page.conferences) {
        conferences.set(conference.sid, conference);
      }
      path = page.next_page_uri;
    }
  }

  return [...conferences.values()];
}
