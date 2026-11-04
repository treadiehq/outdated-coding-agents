const TWILIO_API_BASE = "https://api.twilio.com";

export type ConferenceStatus = "init" | "in-progress" | "completed";

export interface Conference {
  account_sid: string;
  sid: string;
  friendly_name: string;
  status: ConferenceStatus;
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
  conferences: Conference[];
  next_page_uri: string | null;
}

// Since September 30, 2026, omitting Status returns only in-progress
// conferences, so each status has to be requested explicitly. The order follows
// the conference lifecycle: one that changes status between requests is seen
// again later rather than missed, and its newest state wins.
const STATUSES: ConferenceStatus[] = ["init", "in-progress", "completed"];

/**
 * Returns every conference on the account, whatever its status.
 *
 * Twilio only serves conferences through this endpoint for thirteen months after
 * they are created. Older records are available only through Bulk Export.
 */
export async function listAllConferences(
  accountSid: string,
  authToken: string,
): Promise<Conference[]> {
  const headers = {
    Authorization: `Basic ${btoa(`${accountSid}:${authToken}`)}`,
  };
  const conferencesBySid = new Map<string, Conference>();

  for (const status of STATUSES) {
    const params = new URLSearchParams({ Status: status, PageSize: "1000" });
    let path: string | null =
      `/2010-04-01/Accounts/${encodeURIComponent(accountSid)}/Conferences.json?${params}`;

    while (path !== null) {
      const response = await fetch(new URL(path, TWILIO_API_BASE), { headers });
      if (!response.ok) {
        throw new Error(
          `Twilio request failed with ${response.status}: ${await response.text()}`,
        );
      }

      const page = (await response.json()) as ConferencePage;
      for (const conference of page.conferences) {
        conferencesBySid.set(conference.sid, conference);
      }
      path = page.next_page_uri;
    }
  }

  return [...conferencesBySid.values()];
}
