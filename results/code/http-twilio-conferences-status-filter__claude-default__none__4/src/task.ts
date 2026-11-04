const TWILIO_API_BASE = "https://api.twilio.com";

// Omitting the Status filter only returns in-progress conferences (since
// September 30, 2026), and it accepts one value per request, so each status has
// to be listed separately. Keep the lifecycle order and run them sequentially:
// a conference that moves on between requests then shows up twice (and is
// deduplicated) rather than being missed.
const CONFERENCE_STATUSES = ["init", "in-progress", "completed"] as const;

export type ConferenceStatus = (typeof CONFERENCE_STATUSES)[number];

export interface TwilioCredentials {
  accountSid: string;
  authToken: string;
}

export interface Conference {
  sid: string;
  account_sid: string;
  friendly_name: string;
  status: ConferenceStatus;
  region: string;
  date_created: string;
  date_updated: string;
  api_version: string;
  uri: string;
  reason_conference_ended: string | null;
  call_sid_ending_conference: string | null;
  subresource_uris: Record<string, string>;
}

interface ConferencePage {
  conferences: Conference[];
  next_page_uri: string | null;
}

async function fetchConferencePage(url: string, authorization: string): Promise<ConferencePage> {
  const response = await fetch(url, { headers: { Authorization: authorization } });
  if (!response.ok) {
    throw new Error(`Twilio request failed with status ${response.status}: ${await response.text()}`);
  }
  return (await response.json()) as ConferencePage;
}

/**
 * Returns every conference on the account, whatever its status. Twilio only
 * serves conferences created within the last thirteen months through this API.
 */
export async function listAllConferences({ accountSid, authToken }: TwilioCredentials): Promise<Conference[]> {
  const authorization = `Basic ${btoa(`${accountSid}:${authToken}`)}`;
  const conferences = new Map<string, Conference>();

  for (const status of CONFERENCE_STATUSES) {
    const params = new URLSearchParams({ Status: status, PageSize: "1000" });
    let url: string | null =
      `${TWILIO_API_BASE}/2010-04-01/Accounts/${encodeURIComponent(accountSid)}/Conferences.json?${params}`;

    while (url) {
      const page: ConferencePage = await fetchConferencePage(url, authorization);
      for (const conference of page.conferences) {
        conferences.set(conference.sid, conference);
      }
      url = page.next_page_uri ? `${TWILIO_API_BASE}${page.next_page_uri}` : null;
    }
  }

  return [...conferences.values()];
}
