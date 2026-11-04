const TWILIO_API_BASE = "https://api.twilio.com";
const PAGE_SIZE = 1000;

// Lifecycle order. Conferences only move forward through these states, so
// scanning in this order means one that changes state mid-scan is seen again
// rather than missed.
const CONFERENCE_STATUSES = ["init", "in-progress", "completed"] as const;

export type ConferenceStatus = (typeof CONFERENCE_STATUSES)[number];

export type ReasonConferenceEnded =
  | "conference-ended-via-api"
  | "participant-with-end-conference-on-exit-left"
  | "participant-with-end-conference-on-exit-kicked"
  | "last-participant-kicked"
  | "last-participant-left";

export interface Conference {
  sid: string;
  account_sid: string | null;
  date_created: string | null;
  date_updated: string | null;
  api_version: string | null;
  friendly_name: string | null;
  region: string | null;
  status: ConferenceStatus;
  uri: string | null;
  subresource_uris: Record<string, string> | null;
  reason_conference_ended: ReasonConferenceEnded | null;
  call_sid_ending_conference: string | null;
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
 * Returns every conference on the account the List API can see, in any status.
 *
 * Each status is requested explicitly because the API returns only in-progress
 * conferences when Status is omitted. Twilio's list endpoint only serves
 * conferences created in the last 13 months; older ones require Bulk Export.
 */
export async function listAllConferences({
  accountSid,
  authToken,
}: TwilioCredentials): Promise<Conference[]> {
  const authorization = `Basic ${btoa(`${accountSid}:${authToken}`)}`;
  const conferencesBySid = new Map<string, Conference>();

  for (const status of CONFERENCE_STATUSES) {
    const query = new URLSearchParams({ Status: status, PageSize: String(PAGE_SIZE) });
    let path: string | null =
      `/2010-04-01/Accounts/${encodeURIComponent(accountSid)}/Conferences.json?${query}`;

    while (path) {
      const response = await fetch(`${TWILIO_API_BASE}${path}`, {
        headers: { Authorization: authorization },
      });
      if (!response.ok) {
        throw new Error(
          `Twilio conference list failed (${response.status}): ${await response.text()}`,
        );
      }

      const page = (await response.json()) as ConferencePage;
      for (const conference of page.conferences) {
        // A later status overwrites an earlier one, keeping the freshest copy.
        conferencesBySid.set(conference.sid, conference);
      }
      path = page.next_page_uri;
    }
  }

  return [...conferencesBySid.values()];
}
