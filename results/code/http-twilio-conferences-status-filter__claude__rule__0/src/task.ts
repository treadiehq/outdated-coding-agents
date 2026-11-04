const BASE_URL = "https://api.twilio.com";

export interface TwilioConference {
  sid: string;
  account_sid: string;
  friendly_name: string;
  status: string;
  date_created: string;
  date_updated: string;
  region: string;
  uri: string;
  [key: string]: unknown;
}

interface ConferencePage {
  conferences: TwilioConference[];
  next_page_uri: string | null;
}

async function listByStatus(
  accountSid: string,
  authToken: string,
  status: "in-progress" | "completed",
): Promise<TwilioConference[]> {
  const auth = "Basic " + Buffer.from(`${accountSid}:${authToken}`).toString("base64");
  const results: TwilioConference[] = [];
  let path: string | null =
    `/2010-04-01/Accounts/${accountSid}/Conferences.json?PageSize=1000&Status=${status}`;

  while (path) {
    const res = await fetch(BASE_URL + path, {
      headers: { Authorization: auth, Accept: "application/json" },
    });
    if (!res.ok) {
      throw new Error(`Twilio request failed (${res.status}): ${await res.text()}`);
    }
    const page = (await res.json()) as ConferencePage;
    results.push(...page.conferences);
    path = page.next_page_uri;
  }

  return results;
}

/**
 * Returns all conferences on the account: running and finished.
 * Twilio returns only in-progress conferences when Status is omitted,
 * so completed ones are fetched in a separate request.
 */
export async function listAllConferences(
  accountSid: string = process.env.TWILIO_ACCOUNT_SID ?? "",
  authToken: string = process.env.TWILIO_AUTH_TOKEN ?? "",
): Promise<TwilioConference[]> {
  if (!accountSid || !authToken) {
    throw new Error("Twilio account SID and auth token are required");
  }
  const [inProgress, completed] = await Promise.all([
    listByStatus(accountSid, authToken, "in-progress"),
    listByStatus(accountSid, authToken, "completed"),
  ]);
  return [...inProgress, ...completed];
}
