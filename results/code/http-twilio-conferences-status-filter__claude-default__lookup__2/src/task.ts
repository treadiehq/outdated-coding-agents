const TWILIO_API_BASE = "https://api.twilio.com";

// Ordered by conference lifecycle, and fetched in this order, so a conference
// that changes status mid-listing is seen at least once instead of being missed.
const CONFERENCE_STATUSES = ["init", "in-progress", "completed"] as const;

export type ConferenceStatus = (typeof CONFERENCE_STATUSES)[number];

export interface Conference {
  sid: string;
  account_sid: string;
  friendly_name: string;
  status: ConferenceStatus;
  region: string;
  reason_conference_ended: string | null;
  call_sid_ending_conference: string | null;
  date_created: string;
  date_updated: string;
  api_version: string;
  uri: string;
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
 * Returns every conference on the account, in any status.
 *
 * Since September 30, 2026 the list endpoint returns only in-progress
 * conferences when Status is omitted, and each call returns a single status,
 * so each status needs its own request.
 */
export async function listAllConferences(
  credentials: TwilioCredentials,
): Promise<Conference[]> {
  const conferencesBySid = new Map<string, Conference>();

  for (const status of CONFERENCE_STATUSES) {
    for (const conference of await listConferencesByStatus(credentials, status)) {
      // A later status overwrites an earlier one, keeping the freshest record.
      conferencesBySid.set(conference.sid, conference);
    }
  }

  return [...conferencesBySid.values()];
}

async function listConferencesByStatus(
  { accountSid, authToken }: TwilioCredentials,
  status: ConferenceStatus,
): Promise<Conference[]> {
  const authorization = `Basic ${btoa(`${accountSid}:${authToken}`)}`;
  const query = new URLSearchParams({ Status: status, PageSize: "1000" });

  const conferences: Conference[] = [];
  let nextUri: string | null =
    `/2010-04-01/Accounts/${encodeURIComponent(accountSid)}/Conferences.json?${query}`;

  while (nextUri !== null) {
    const response: Response = await fetch(new URL(nextUri, TWILIO_API_BASE), {
      headers: { Authorization: authorization, Accept: "application/json" },
    });

    if (!response.ok) {
      throw new Error(
        `Twilio request for ${status} conferences failed with ${response.status}: ${await response.text()}`,
      );
    }

    const page: ConferencePage = await response.json();
    conferences.push(...page.conferences);
    nextUri = page.next_page_uri;
  }

  return conferences;
}
