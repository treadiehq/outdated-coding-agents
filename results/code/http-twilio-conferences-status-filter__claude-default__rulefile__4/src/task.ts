const TWILIO_API_BASE = "https://api.twilio.com";
const PAGE_SIZE = 1000; // Maximum allowed by the Conferences list endpoint.
const MAX_RATE_LIMIT_RETRIES = 5;

// Since 2026-09-30 the list endpoint returns only in-progress conferences when
// Status is omitted, so every status has to be requested explicitly. The order
// follows the conference lifecycle: a conference that changes status while we
// are reading is seen again later rather than missed.
const CONFERENCE_STATUSES = ["init", "in-progress", "completed"] as const;

export type ConferenceStatus = (typeof CONFERENCE_STATUSES)[number];

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

export interface TwilioCredentials {
  accountSid: string;
  /** API key SID, or the Account SID when authenticating with an Auth Token. */
  username: string;
  /** API key secret, or the Auth Token. */
  password: string;
}

interface ConferencePage {
  conferences: Conference[];
  next_page_uri: string | null;
}

/**
 * Returns every conference on the account that Twilio's REST API still serves,
 * whatever its status. Conferences older than thirteen months are not included:
 * Twilio makes those available only through Bulk Export.
 */
export async function listAllConferences(
  credentials: TwilioCredentials,
): Promise<Conference[]> {
  const conferences = new Map<string, Conference>();

  for (const status of CONFERENCE_STATUSES) {
    const query = new URLSearchParams({
      Status: status,
      PageSize: String(PAGE_SIZE),
    });
    const accountSid = encodeURIComponent(credentials.accountSid);
    let uri: string | null =
      `/2010-04-01/Accounts/${accountSid}/Conferences.json?${query}`;

    while (uri !== null) {
      const page: ConferencePage = await fetchPage(uri, credentials);
      for (const conference of page.conferences) {
        // Later reads overwrite earlier ones, keeping the most recent status.
        conferences.set(conference.sid, conference);
      }
      uri = page.next_page_uri;
    }
  }

  return [...conferences.values()];
}

async function fetchPage(
  uri: string,
  { username, password }: TwilioCredentials,
): Promise<ConferencePage> {
  const url = new URL(uri, TWILIO_API_BASE);
  const headers = { Authorization: `Basic ${btoa(`${username}:${password}`)}` };

  for (let attempt = 0; ; attempt++) {
    const response = await fetch(url, { headers });

    if (response.status === 429 && attempt < MAX_RATE_LIMIT_RETRIES) {
      await response.body?.cancel();
      await new Promise((resolve) => setTimeout(resolve, 2 ** attempt * 1000));
      continue;
    }

    if (!response.ok) {
      throw new Error(
        `Twilio request failed (${response.status}): ${await response.text()}`,
      );
    }

    return (await response.json()) as ConferencePage;
  }
}
