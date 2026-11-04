const TWILIO_API_BASE = "https://api.twilio.com";

export type ConferenceStatus = "init" | "in-progress" | "completed";

export interface TwilioCredentials {
  accountSid: string;
  /** API key SID, or the Account SID when authenticating with the Auth Token. */
  username: string;
  /** API key secret, or the Auth Token. */
  password: string;
}

export interface Conference {
  sid: string;
  account_sid: string;
  friendly_name: string | null;
  status: ConferenceStatus;
  region: string | null;
  date_created: string | null;
  date_updated: string | null;
  api_version: string;
  uri: string;
  subresource_uris: Record<string, string> | null;
  reason_conference_ended: string | null;
  call_sid_ending_conference: string | null;
}

interface ConferencePage {
  conferences: Conference[];
  next_page_uri: string | null;
}

// Since September 30, 2026 the list endpoint returns only in-progress
// conferences when Status is omitted, and each request covers a single status,
// so every status has to be requested explicitly.
//
// The order follows the conference lifecycle: a conference that changes status
// during the listing is seen again under its later status rather than missed.
const STATUSES: ConferenceStatus[] = ["init", "in-progress", "completed"];

async function listConferencesByStatus(
  { accountSid, username, password }: TwilioCredentials,
  status: ConferenceStatus,
): Promise<Conference[]> {
  const authorization = `Basic ${btoa(`${username}:${password}`)}`;
  const query = new URLSearchParams({ Status: status, PageSize: "1000" });

  const conferences: Conference[] = [];
  let uri: string | null =
    `/2010-04-01/Accounts/${encodeURIComponent(accountSid)}/Conferences.json?${query}`;

  while (uri !== null) {
    const response: Response = await fetch(new URL(uri, TWILIO_API_BASE), {
      headers: { Authorization: authorization, Accept: "application/json" },
    });
    if (!response.ok) {
      throw new Error(
        `Twilio request for ${status} conferences failed with ${response.status}: ${await response.text()}`,
      );
    }

    const page: ConferencePage = await response.json();
    conferences.push(...page.conferences);
    uri = page.next_page_uri;
  }

  return conferences;
}

/**
 * Returns every conference on the account that the list endpoint still serves,
 * whatever its status. Twilio keeps conferences available here for thirteen
 * months after creation; older records are only available through Bulk Export.
 */
export async function listAllConferences(
  credentials: TwilioCredentials,
): Promise<Conference[]> {
  const conferencesBySid = new Map<string, Conference>();

  for (const status of STATUSES) {
    for (const conference of await listConferencesByStatus(credentials, status)) {
      conferencesBySid.set(conference.sid, conference);
    }
  }

  return [...conferencesBySid.values()];
}
