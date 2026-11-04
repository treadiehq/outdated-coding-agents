const TWILIO_BASE_URL = "https://api.twilio.com";

export type ConferenceStatus = "init" | "in-progress" | "completed";

export interface Conference {
  sid: string;
  account_sid: string;
  status: ConferenceStatus;
  region: string;
  friendly_name: string;
  date_created: string;
  date_updated: string;
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

export interface TwilioCredentials {
  accountSid: string;
  /** Auth token, or an API key secret when `username` is an API key SID. */
  password: string;
  /** Defaults to accountSid. Set to an API key SID (SK...) when using API keys. */
  username?: string;
}

// Twilio defaults to `in-progress` only (since 2026-09-30), so each status is requested explicitly.
const ALL_STATUSES: ConferenceStatus[] = ["init", "in-progress", "completed"];

async function listByStatus(
  status: ConferenceStatus,
  accountSid: string,
  authorization: string,
): Promise<Conference[]> {
  const conferences: Conference[] = [];
  let path: string | null =
    `/2010-04-01/Accounts/${accountSid}/Conferences.json?` +
    new URLSearchParams({ Status: status, PageSize: "1000" });

  while (path) {
    const response = await fetch(TWILIO_BASE_URL + path, {
      headers: { Authorization: authorization, Accept: "application/json" },
    });
    if (!response.ok) {
      throw new Error(
        `Twilio request failed (${response.status} ${response.statusText}): ${await response.text()}`,
      );
    }
    const page = (await response.json()) as ConferencePage;
    conferences.push(...page.conferences);
    path = page.next_page_uri;
  }

  return conferences;
}

/**
 * Returns every conference on the account: queued (`init`), running (`in-progress`)
 * and finished (`completed`). Note Twilio only retains conference records for 13 months.
 */
export async function listAllConferences(
  credentials: TwilioCredentials,
): Promise<Conference[]> {
  const { accountSid, password, username = accountSid } = credentials;
  const authorization = `Basic ${btoa(`${username}:${password}`)}`;

  const results = await Promise.all(
    ALL_STATUSES.map((status) => listByStatus(status, accountSid, authorization)),
  );
  return results.flat();
}
