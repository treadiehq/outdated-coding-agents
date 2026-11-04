const TWILIO_API_BASE_URL = "https://api.twilio.com";
const PAGE_SIZE = 1000;

// Since September 30, 2026, omitting Status returns only in-progress conferences,
// so each status needs its own request. This follows the conference lifecycle so
// that one changing status mid-listing is seen at least once rather than missed.
const CONFERENCE_STATUSES = ["init", "in-progress", "completed"] as const;

export type ConferenceStatus = (typeof CONFERENCE_STATUSES)[number];

export type ConferenceEndReason =
  | "conference-ended-via-api"
  | "participant-with-end-conference-on-exit-left"
  | "participant-with-end-conference-on-exit-kicked"
  | "last-participant-kicked"
  | "last-participant-left";

export interface Conference {
  account_sid: string | null;
  date_created: string | null;
  date_updated: string | null;
  api_version: string | null;
  friendly_name: string | null;
  region: string | null;
  sid: string;
  status: ConferenceStatus;
  uri: string | null;
  subresource_uris: Record<string, string> | null;
  reason_conference_ended: ConferenceEndReason | null;
  call_sid_ending_conference: string | null;
}

interface ConferencePage {
  conferences: Conference[];
  next_page_uri: string | null;
}

export interface TwilioCredentials {
  accountSid: string;
  apiKeySid: string;
  apiKeySecret: string;
}

export async function listAllConferences({
  accountSid,
  apiKeySid,
  apiKeySecret,
}: TwilioCredentials): Promise<Conference[]> {
  const authorization = `Basic ${btoa(`${apiKeySid}:${apiKeySecret}`)}`;
  const conferencesBySid = new Map<string, Conference>();

  for (const status of CONFERENCE_STATUSES) {
    const firstPage = new URL(
      `/2010-04-01/Accounts/${encodeURIComponent(accountSid)}/Conferences.json`,
      TWILIO_API_BASE_URL,
    );
    firstPage.searchParams.set("Status", status);
    firstPage.searchParams.set("PageSize", String(PAGE_SIZE));

    let nextUrl: string | null = firstPage.href;
    while (nextUrl !== null) {
      const response: Response = await fetch(nextUrl, {
        headers: { Authorization: authorization },
      });
      if (!response.ok) {
        throw new Error(
          `Twilio API request failed with status ${response.status}: ${await response.text()}`,
        );
      }

      const page = (await response.json()) as ConferencePage;
      for (const conference of page.conferences) {
        conferencesBySid.set(conference.sid, conference);
      }

      nextUrl = page.next_page_uri
        ? new URL(page.next_page_uri, TWILIO_API_BASE_URL).href
        : null;
    }
  }

  return [...conferencesBySid.values()];
}
