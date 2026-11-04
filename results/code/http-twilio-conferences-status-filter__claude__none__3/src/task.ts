export interface TwilioConference {
  sid: string;
  account_sid: string;
  friendly_name: string;
  status: "init" | "in-progress" | "completed" | string;
  region: string | null;
  date_created: string;
  date_updated: string;
  api_version: string;
  call_sid_ending_conference: string | null;
  reason_conference_ended: string | null;
  uri: string;
  subresource_uris: Record<string, string>;
}

interface ConferencePage {
  conferences: TwilioConference[];
  next_page_uri: string | null;
}

const TWILIO_BASE_URL = "https://api.twilio.com";

/**
 * Returns every conference on the account, both in progress and completed,
 * following pagination until exhausted.
 *
 * Reads TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN from the environment unless
 * credentials are passed explicitly.
 */
export async function listAllConferences(
  accountSid: string | undefined = process.env.TWILIO_ACCOUNT_SID,
  authToken: string | undefined = process.env.TWILIO_AUTH_TOKEN,
): Promise<TwilioConference[]> {
  if (!accountSid || !authToken) {
    throw new Error("Missing Twilio credentials: set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN");
  }

  const headers = {
    Authorization: "Basic " + Buffer.from(`${accountSid}:${authToken}`).toString("base64"),
    Accept: "application/json",
  };

  // No Status filter: Twilio then returns conferences in every state.
  let nextUri: string | null =
    `/2010-04-01/Accounts/${encodeURIComponent(accountSid)}/Conferences.json?PageSize=1000`;
  const conferences: TwilioConference[] = [];

  while (nextUri) {
    const res: Response = await fetch(TWILIO_BASE_URL + nextUri, { headers });
    if (!res.ok) {
      throw new Error(`Twilio API error ${res.status}: ${await res.text()}`);
    }
    const page = (await res.json()) as ConferencePage;
    conferences.push(...page.conferences);
    nextUri = page.next_page_uri;
  }

  return conferences;
}
