const TWILIO_API_BASE = "https://api.twilio.com";

// Since 2026-09-30 the list endpoint returns only in-progress conferences when
// Status is omitted, and Status takes a single value, so each one is requested
// separately. Ordered by lifecycle so that a conference changing status during
// the listing is still seen in its later status.
const CONFERENCE_STATUSES = ["init", "in-progress", "completed"] as const;

export type ConferenceStatus = (typeof CONFERENCE_STATUSES)[number];

export interface TwilioCredentials {
  accountSid: string;
  /** API key SID, or the Account SID when authenticating with an Auth Token. */
  username: string;
  /** API key secret, or the Auth Token. */
  password: string;
}

export interface Conference {
  sid: string;
  account_sid: string | null;
  friendly_name: string | null;
  status: ConferenceStatus;
  region: string | null;
  date_created: string | null;
  date_updated: string | null;
  api_version: string | null;
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
 * Returns every conference on the account that the REST API can still serve,
 * whatever its status. The API only serves conferences created in the last
 * 13 months; older records are available through Bulk Export only.
 */
export async function listAllConferences(
  credentials: TwilioCredentials,
): Promise<Conference[]> {
  const { accountSid, username, password } = credentials;
  const headers = { Authorization: `Basic ${btoa(`${username}:${password}`)}` };
  const listPath = `/2010-04-01/Accounts/${encodeURIComponent(accountSid)}/Conferences.json`;

  // Keyed by SID: a conference that changes status mid-listing can appear under
  // two statuses, and the later entry is the most recent.
  const conferences = new Map<string, Conference>();

  for (const status of CONFERENCE_STATUSES) {
    const query = new URLSearchParams({ Status: status, PageSize: "1000" });
    let uri: string | null = `${listPath}?${query}`;

    while (uri !== null) {
      const response: Response = await fetch(new URL(uri, TWILIO_API_BASE), { headers });
      if (!response.ok) {
        throw new Error(
          `Twilio request for ${status} conferences failed with HTTP ${response.status}: ${await response.text()}`,
        );
      }

      const page = (await response.json()) as ConferencePage;
      for (const conference of page.conferences) {
        conferences.set(conference.sid, conference);
      }
      uri = page.next_page_uri;
    }
  }

  return [...conferences.values()];
}
