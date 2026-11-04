const BASE_URL = "https://api.twilio.com";

export interface TwilioConference {
  sid: string;
  account_sid: string;
  friendly_name: string;
  status: "init" | "in-progress" | "completed";
  region: string | null;
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

/**
 * Returns every conference on the account, both in-progress and completed.
 * Reads TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN from the environment unless
 * credentials are passed in.
 */
export async function listAllConferences(
  accountSid: string = process.env.TWILIO_ACCOUNT_SID ?? "",
  authToken: string = process.env.TWILIO_AUTH_TOKEN ?? "",
): Promise<TwilioConference[]> {
  if (!accountSid || !authToken) {
    throw new Error("Twilio credentials missing: set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN");
  }

  const authorization =
    "Basic " + Buffer.from(`${accountSid}:${authToken}`).toString("base64");

  // Without a Status filter the API returns conferences of every status
  // (init, in-progress, completed), so no filtering is needed.
  let nextUri: string | null =
    `/2010-04-01/Accounts/${encodeURIComponent(accountSid)}/Conferences.json?PageSize=1000`;

  const conferences: TwilioConference[] = [];

  while (nextUri) {
    const res = await fetch(BASE_URL + nextUri, {
      headers: { Authorization: authorization, Accept: "application/json" },
    });

    if (!res.ok) {
      throw new Error(`Twilio API error ${res.status}: ${await res.text()}`);
    }

    const page = (await res.json()) as ConferencePage;
    conferences.push(...page.conferences);
    nextUri = page.next_page_uri;
  }

  return conferences;
}
