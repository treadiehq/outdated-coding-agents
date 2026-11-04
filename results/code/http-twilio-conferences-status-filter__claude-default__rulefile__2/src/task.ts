const TWILIO_API_BASE = "https://api.twilio.com";

// Since 2026-09-30 the list endpoint returns only in-progress conferences when
// Status is omitted, so every status has to be requested explicitly. Statuses
// are in lifecycle order: a conference that advances between requests is still
// seen at a later status rather than being missed.
const CONFERENCE_STATUSES = ["init", "in-progress", "completed"] as const;

export type ConferenceStatus = (typeof CONFERENCE_STATUSES)[number];

export interface Conference {
  account_sid: string;
  sid: string;
  friendly_name: string;
  api_version: string;
  uri: string;
  date_created: string;
  date_updated: string;
  region: string;
  status: ConferenceStatus;
  reason_conference_ended: string | null;
  call_sid_ending_conference: string | null;
  subresource_uris: Record<string, string>;
}

interface ConferencePage {
  conferences: Conference[];
  next_page_uri: string | null;
}

export interface TwilioCredentials {
  accountSid: string;
  authToken: string;
}

/**
 * Returns every conference on the account the API can list, whatever its status.
 * Twilio only serves conferences created within the last thirteen months here;
 * older records are available through Bulk Export.
 */
export async function listAllConferences({
  accountSid,
  authToken,
}: TwilioCredentials): Promise<Conference[]> {
  const authorization = `Basic ${btoa(`${accountSid}:${authToken}`)}`;
  const conferences = new Map<string, Conference>();

  for (const status of CONFERENCE_STATUSES) {
    const params = new URLSearchParams({ Status: status, PageSize: "1000" });
    let url: string | null =
      `${TWILIO_API_BASE}/2010-04-01/Accounts/${encodeURIComponent(accountSid)}/Conferences.json?${params}`;

    while (url) {
      const response: Response = await fetch(url, {
        headers: { Authorization: authorization },
      });
      if (!response.ok) {
        throw new Error(
          `Twilio request failed with status ${response.status}: ${await response.text()}`,
        );
      }

      const page = (await response.json()) as ConferencePage;
      // Keyed by SID so a conference seen at two statuses keeps its latest state.
      for (const conference of page.conferences) {
        conferences.set(conference.sid, conference);
      }
      url = page.next_page_uri
        ? new URL(page.next_page_uri, TWILIO_API_BASE).href
        : null;
    }
  }

  return [...conferences.values()];
}
