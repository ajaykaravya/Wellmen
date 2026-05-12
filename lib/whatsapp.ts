type WhatsAppMessageResult = {
  ok: boolean;
  skipped?: boolean;
  error?: string;
  recipient?: string;
  responseText?: string;
};

type SendWhatsAppTextOptions = {
  to: string;
  message: string;
};

const DEFAULT_GRAPH_API_VERSION = "v21.0";
const DEFAULT_COUNTRY_CODE = "+91";

const normalizeCountryCode = (value: string) => {
  const digits = String(value || "").replace(/\D/g, "");
  return digits ? digits : "91";
};

export const normalizeWhatsAppRecipient = (value: string) => {
  const raw = String(value || "").trim();
  if (!raw) return null;

  const digits = raw.replace(/\D/g, "");
  if (!digits) return null;

  if (digits.length === 10) {
    return `${normalizeCountryCode(process.env.WHATSAPP_DEFAULT_COUNTRY_CODE || DEFAULT_COUNTRY_CODE)}${digits}`;
  }

  return digits;
};

const getWhatsAppConfig = () => {
  const accessToken = String(process.env.WHATSAPP_ACCESS_TOKEN || "").trim();
  const phoneNumberId = String(process.env.WHATSAPP_PHONE_NUMBER_ID || "").trim();
  const graphApiVersion = String(
    process.env.WHATSAPP_GRAPH_API_VERSION || DEFAULT_GRAPH_API_VERSION,
  ).trim();

  if (!accessToken || !phoneNumberId) {
    return null;
  }

  return {
    accessToken,
    phoneNumberId,
    graphApiVersion,
  };
};

export async function sendWhatsAppText(
  options: SendWhatsAppTextOptions,
): Promise<WhatsAppMessageResult> {
  const config = getWhatsAppConfig();
  if (!config) {
    return {
      ok: false,
      skipped: true,
      error: "WhatsApp configuration is missing.",
    };
  }

  const recipient = normalizeWhatsAppRecipient(options.to);
  if (!recipient) {
    return {
      ok: false,
      skipped: true,
      error: "Invalid WhatsApp recipient.",
    };
  }

  const response = await fetch(
    `https://graph.facebook.com/${config.graphApiVersion}/${config.phoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: recipient,
        type: "text",
        text: {
          preview_url: false,
          body: options.message,
        },
      }),
    },
  );

  const responseText = await response.text();
  if (!response.ok) {
    return {
      ok: false,
      recipient,
      error: `WhatsApp API responded with ${response.status}`,
      responseText,
    };
  }

  return {
    ok: true,
    recipient,
    responseText,
  };
}

export async function sendWhatsAppTextToMany(
  recipients: string[],
  message: string,
) {
  const uniqueRecipients = Array.from(
    new Set(
      recipients
        .map((recipient) => normalizeWhatsAppRecipient(recipient))
        .filter((recipient): recipient is string => Boolean(recipient)),
    ),
  );

  if (uniqueRecipients.length === 0) {
    return {
      ok: true,
      skipped: true,
      sentCount: 0,
      failureCount: 0,
    };
  }

  const results = await Promise.allSettled(
    uniqueRecipients.map((recipient) =>
      sendWhatsAppText({
        to: recipient,
        message,
      }),
    ),
  );

  const settledResults = results.map((result) =>
    result.status === "fulfilled"
      ? result.value
      : {
          ok: false,
          error: result.reason instanceof Error ? result.reason.message : String(result.reason),
        },
  );

  const sentCount = settledResults.filter((result) => result.ok).length;
  const failureCount = settledResults.length - sentCount;

  return {
    ok: failureCount === 0,
    skipped: false,
    sentCount,
    failureCount,
    results: settledResults,
  };
}
