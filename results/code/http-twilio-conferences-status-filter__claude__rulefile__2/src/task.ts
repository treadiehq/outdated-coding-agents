const TWILIO_BASE_URL = "https://api.twilio.com";

export type ConferenceStatus = "init" | "in-progress" | "completed";

export interface TwilioConference {
  sid: string;
  account_sid: string;
  friendly_name: string;
  status: ConferenceStatus;
  date_created: string;
  date_updated: string;
  region: string;
  api_version: string;
  uri: string;
  subresource_uris: Record<string, string>;
  [key: string]: unknown;
}

interface ConferencePage {
  conferences: TwilioConference[];
  next_page_uri: string | null;
}

export interface TwilioCredentials {
  accountSid: string;
  authToken: string;
}

// Twilio defaults the Status filter to `in-progress` (from 2026-09-30), so every
// status is requested explicitly to get both running and finished conferences.
const ALL_STATUSES: ConferenceStatus[] = ["init", "in-progress", "completed"];

async function fetchAllWithStatus(
  { accountSid, authToken }: TwilioCredentials,
  status: ConferenceStatus,
): Promise<TwilioConference[]> {
  const authorization = `Basic ${btoa(`${accountSid}:${authToken}`)}`;
  const conferences: TwilioConference[] = [];

  let nextUri: string | null =
    `/2010-04-01/Accounts/${encodeURIComponent(accountSid)}/Conferences.json?` +
    new URLSearchParams({ Status: status, PageSize: "1000" });

  while (nextUri) {
    const response = await fetch(`${TWILIO_BASE_URL}${nextUri}`, {
      headers: { Authorization: authorization, Accept: "application/json" },
    });
    if (!response.ok) {
      throw new Error(
        `Twilio list conferences failed (${response.status} ${response.statusText}): ${await response.text()}`,
      );
    }
    const page = (await response.json()) as ConferencePage;
    conferences.push(...page.conferences);
    nextUri = page.next_page_uri;
  }

  return conferences;
}

/** Returns every conference on the account: running (and initializing) as well as completed. */
export async function listAllConferences(
  credentials: TwilioCredentials,
): Promise<TwilioConference[]> {
  const results = await Promise.all(
    ALL_STATUSES.map((status) => fetchAllWithStatus(credentials, status)),
  );

  // A conference could change status between requests; dedupe by SID.
  const bySid = new Map<string, TwilioConference>();
  for (const conference of results.flat()) bySid.set(conference.sid, conference);
  return [...bySid.values()];
}
