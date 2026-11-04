const TWILIO_BASE = "https://api.twilio.com";

export interface TwilioConference {
  sid: string;
  account_sid: string;
  friendly_name: string;
  status: string;
  region: string;
  date_created: string;
  date_updated: string;
  api_version: string;
  uri: string;
  subresource_uris: Record<string, string>;
  [key: string]: unknown;
}

interface ConferencePage {
  conferences: TwilioConference[];
  next_page_uri: string | null;
}

async function listByStatus(
  accountSid: string,
  authHeader: string,
  status?: "in-progress" | "completed",
): Promise<TwilioConference[]> {
  const params = new URLSearchParams({ PageSize: "1000" });
  if (status) params.set("Status", status);

  let uri: string | null = `/2010-04-01/Accounts/${accountSid}/Conferences.json?${params}`;
  const results: TwilioConference[] = [];

  while (uri) {
    const res = await fetch(`${TWILIO_BASE}${uri}`, {
      headers: { Authorization: authHeader, Accept: "application/json" },
    });
    if (!res.ok) {
      throw new Error(`Twilio request failed (${res.status}): ${await res.text()}`);
    }
    const page = (await res.json()) as ConferencePage;
    results.push(...page.conferences);
    uri = page.next_page_uri;
  }

  return results;
}

/**
 * Returns every conference on the account, both in-progress and completed.
 * Twilio returns only in-progress conferences when Status is omitted, so
 * completed ones are fetched in a separate request (with pagination followed).
 */
export async function listAllConferences(
  accountSid: string = process.env.TWILIO_ACCOUNT_SID ?? "",
  authToken: string = process.env.TWILIO_AUTH_TOKEN ?? "",
): Promise<TwilioConference[]> {
  if (!accountSid || !authToken) {
    throw new Error("Twilio account SID and auth token are required");
  }
  const authHeader = "Basic " + Buffer.from(`${accountSid}:${authToken}`).toString("base64");

  const [running, completed] = await Promise.all([
    listByStatus(accountSid, authHeader),
    listByStatus(accountSid, authHeader, "completed"),
  ]);

  return [...running, ...completed];
}
