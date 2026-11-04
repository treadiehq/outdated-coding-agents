const TWILIO_API_BASE = "https://api.twilio.com";

// Since September 30, 2026, omitting Status returns only in-progress conferences,
// and each request can name just one status, so every status needs its own listing.
// A conference only ever moves forward through this order, so listing in sequence
// means one that changes status mid-run is still seen, at worst twice.
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
  date_created: string | null;
  date_updated: string | null;
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
        `Twilio returned ${response.status} listing ${status} conferences: ${await response.text()}`,
      );
    }

    const page: ConferencePage = await response.json();
    conferences.push(...page.conferences);
    nextUri = page.next_page_uri;
  }

  return conferences;
}

/**
 * Returns every conference on the account that the Conferences list endpoint can
 * still serve, whether running or finished. Twilio only serves conferences created
 * in the last thirteen months here; older records require Bulk Export.
 */
export async function listAllConferences(
  credentials: TwilioCredentials,
): Promise<Conference[]> {
  const conferencesBySid = new Map<string, Conference>();

  for (const status of CONFERENCE_STATUSES) {
    for (const conference of await listConferencesByStatus(credentials, status)) {
      // A later listing has the newer status for a conference seen twice.
      conferencesBySid.set(conference.sid, conference);
    }
  }

  return [...conferencesBySid.values()];
}
