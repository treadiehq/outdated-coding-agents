const API_BASE = "https://api.twilio.com";

export type ConferenceStatus = "init" | "in-progress" | "completed";

export interface Conference {
  sid: string;
  account_sid: string;
  api_version: string;
  date_created: string;
  date_updated: string;
  friendly_name: string;
  region: string;
  status: ConferenceStatus;
  subresource_uris: Record<string, string>;
  uri: string;
  reason_conference_ended: string | null;
  call_sid_ending_conference: string | null;
}

interface ConferencePage {
  conferences: Conference[];
  next_page_uri: string | null;
}

// Twilio only returns in-progress conferences by default (since 2026-09-30),
// so each status is queried explicitly. Conferences are only retrievable via
// the API for 13 months after creation.
const STATUSES: ConferenceStatus[] = ["init", "in-progress", "completed"];

async function listByStatus(
  accountSid: string,
  authToken: string,
  status: ConferenceStatus,
): Promise<Conference[]> {
  const authorization =
    "Basic " + Buffer.from(`${accountSid}:${authToken}`).toString("base64");

  const query = new URLSearchParams({ Status: status, PageSize: "1000" });
  let uri: string | null =
    `/2010-04-01/Accounts/${accountSid}/Conferences.json?${query}`;

  const conferences: Conference[] = [];
  while (uri) {
    const res = await fetch(API_BASE + uri, {
      headers: { Authorization: authorization, Accept: "application/json" },
    });
    if (!res.ok) {
      throw new Error(
        `Twilio request failed (${res.status} ${res.statusText}): ${await res.text()}`,
      );
    }
    const page = (await res.json()) as ConferencePage;
    conferences.push(...page.conferences);
    uri = page.next_page_uri;
  }
  return conferences;
}

/** Returns all conferences on the account: initializing, running, and finished. */
export async function listAllConferences(
  accountSid = process.env.TWILIO_ACCOUNT_SID,
  authToken = process.env.TWILIO_AUTH_TOKEN,
): Promise<Conference[]> {
  if (!accountSid || !authToken) {
    throw new Error(
      "Twilio credentials missing: set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN.",
    );
  }
  const results = await Promise.all(
    STATUSES.map((s) => listByStatus(accountSid, authToken, s)),
  );
  return results.flat();
}
