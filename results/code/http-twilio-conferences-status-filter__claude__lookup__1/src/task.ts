const TWILIO_BASE_URL = "https://api.twilio.com";

export type ConferenceStatus = "init" | "in-progress" | "completed";

export interface Conference {
  sid: string;
  account_sid: string;
  api_version: string;
  friendly_name: string;
  status: ConferenceStatus;
  region: string;
  date_created: string;
  date_updated: string;
  uri: string;
  subresource_uris: Record<string, string>;
  reason_conference_ended: string | null;
  call_sid_ending_conference: string | null;
}

interface ConferencePage {
  conferences: Conference[];
  next_page_uri: string | null;
}

export interface TwilioCredentials {
  accountSid: string;
  /** Auth token, or an API key secret when `apiKeySid` is set. */
  authToken: string;
  /** Optional API key SID; used as the Basic auth username instead of the account SID. */
  apiKeySid?: string;
}

// Since 2026-09-30 the API defaults to Status=in-progress, so each status must be requested explicitly.
const ALL_STATUSES: ConferenceStatus[] = ["init", "in-progress", "completed"];

async function listByStatus(
  creds: TwilioCredentials,
  status: ConferenceStatus,
): Promise<Conference[]> {
  const username = creds.apiKeySid ?? creds.accountSid;
  const headers = {
    Authorization: `Basic ${btoa(`${username}:${creds.authToken}`)}`,
    Accept: "application/json",
  };

  const first = new URL(
    `/2010-04-01/Accounts/${creds.accountSid}/Conferences.json`,
    TWILIO_BASE_URL,
  );
  first.searchParams.set("Status", status);
  first.searchParams.set("PageSize", "1000");

  const conferences: Conference[] = [];
  let url: string | null = first.toString();

  while (url) {
    const res = await fetch(url, { headers });
    if (!res.ok) {
      throw new Error(
        `Twilio list conferences failed (${res.status}): ${await res.text()}`,
      );
    }
    const page = (await res.json()) as ConferencePage;
    conferences.push(...page.conferences);
    url = page.next_page_uri ? new URL(page.next_page_uri, TWILIO_BASE_URL).toString() : null;
  }

  return conferences;
}

/**
 * Returns every conference on the account, both running (init / in-progress) and finished (completed).
 * Twilio only serves conferences for 13 months after creation; older ones need Bulk Export.
 */
export async function getAllConferences(creds: TwilioCredentials): Promise<Conference[]> {
  const perStatus = await Promise.all(ALL_STATUSES.map((s) => listByStatus(creds, s)));
  return perStatus.flat();
}
