const TWILIO_BASE_URL = "https://api.twilio.com";

export type ConferenceStatus = "init" | "in-progress" | "completed";

export interface Conference {
  sid: string;
  account_sid: string;
  api_version: string;
  friendly_name: string;
  region: string;
  status: ConferenceStatus;
  date_created: string;
  date_updated: string;
  reason_conference_ended: string | null;
  call_sid_ending_conference: string | null;
  uri: string;
  subresource_uris: Record<string, string>;
}

interface ConferencePage {
  conferences: Conference[];
  next_page_uri: string | null;
}

// Since 2026-09-30 the API defaults to Status=in-progress, so each status
// must be requested explicitly to get running and finished conferences.
const STATUSES: ConferenceStatus[] = ["init", "in-progress", "completed"];

export async function listAllConferences(
  accountSid = process.env.TWILIO_ACCOUNT_SID,
  authToken = process.env.TWILIO_AUTH_TOKEN,
): Promise<Conference[]> {
  if (!accountSid || !authToken) {
    throw new Error("TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN are required");
  }

  const headers = {
    Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
    Accept: "application/json",
  };

  const all: Conference[] = [];

  for (const status of STATUSES) {
    const first = new URL(`/2010-04-01/Accounts/${accountSid}/Conferences.json`, TWILIO_BASE_URL);
    first.searchParams.set("Status", status);
    first.searchParams.set("PageSize", "1000");

    let url: string | null = first.toString();
    while (url) {
      const res = await fetch(url, { headers });
      if (!res.ok) {
        throw new Error(`Twilio request failed (${res.status}): ${await res.text()}`);
      }
      const page = (await res.json()) as ConferencePage;
      all.push(...page.conferences);
      url = page.next_page_uri ? new URL(page.next_page_uri, TWILIO_BASE_URL).toString() : null;
    }
  }

  return all;
}
