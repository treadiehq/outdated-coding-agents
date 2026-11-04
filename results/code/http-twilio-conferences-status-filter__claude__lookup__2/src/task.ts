const API_HOST = "https://api.twilio.com";

export type ConferenceStatus = "init" | "in-progress" | "completed";

export interface Conference {
  account_sid: string;
  sid: string;
  api_version: string;
  uri: string;
  date_created: string;
  date_updated: string;
  friendly_name: string;
  region: string;
  status: ConferenceStatus;
  subresource_uris: Record<string, string>;
  reason_conference_ended: string | null;
  call_sid_ending_conference: string | null;
}

interface ConferencePage {
  conferences: Conference[];
  next_page_uri: string | null;
}

// Since 2026-09-30 the API defaults to Status=in-progress, so every status is
// requested explicitly to get running (and starting) as well as finished ones.
const STATUSES: ConferenceStatus[] = ["init", "in-progress", "completed"];

async function listByStatus(
  accountSid: string,
  headers: Record<string, string>,
  status: ConferenceStatus,
): Promise<Conference[]> {
  const params = new URLSearchParams({ Status: status, PageSize: "1000" });
  let url: string | null = `${API_HOST}/2010-04-01/Accounts/${accountSid}/Conferences.json?${params}`;
  const result: Conference[] = [];

  while (url) {
    const res = await fetch(url, { headers });
    if (!res.ok) {
      throw new Error(`Twilio API error ${res.status} for status=${status}: ${await res.text()}`);
    }
    const page = (await res.json()) as ConferencePage;
    result.push(...page.conferences);
    url = page.next_page_uri ? `${API_HOST}${page.next_page_uri}` : null;
  }
  return result;
}

/**
 * Returns all conferences on the account, running and finished.
 * Credentials default to TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN.
 * Note: the API only exposes conferences created in the last 13 months.
 */
export async function listAllConferences(
  accountSid = process.env.TWILIO_ACCOUNT_SID,
  authToken = process.env.TWILIO_AUTH_TOKEN,
): Promise<Conference[]> {
  if (!accountSid || !authToken) {
    throw new Error("Set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN");
  }
  const headers = {
    Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
    Accept: "application/json",
  };

  const bySid = new Map<string, Conference>();
  for (const status of STATUSES) {
    for (const c of await listByStatus(accountSid, headers, status)) {
      bySid.set(c.sid, c);
    }
  }
  return [...bySid.values()];
}
