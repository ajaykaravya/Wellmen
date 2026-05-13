type WhatsAppMessageResult = {
  ok: boolean;
  skipped?: boolean;
  error?: string;
  recipient?: string;
  responseText?: string | null;
};

type SendWhatsAppTextOptions = {
  to: string;
  message: string;
};

type ReportLike = {
  project?: {
    name?: string | null;
    city?: string | null;
  } | null;
  category?: {
    name?: string | null;
  } | null;
  description?: string | null;
  reportDate?: string | Date | null;
};

const DEFAULT_GRAPH_API_VERSION = "v21.0";
const DEFAULT_COUNTRY_CODE = "91";

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

  let responseData: unknown = null;
  try {
    responseData = await response.json();
  } catch {
    responseData = null;
  }
  if (!response.ok) {
    return {
      ok: false,
      recipient,
      error: `WhatsApp API responded with ${response.status}`,
      responseText:
        responseData !== null ? JSON.stringify(responseData) : null,
    };
  }

  console.log("WhatsApp Response:", {
    recipient,
    status: response.status,
    responseData,
  });

  return {
    ok: true,
    recipient,
    responseText: responseData !== null ? JSON.stringify(responseData) : null,
  };
}

type SendWhatsAppMediaOptions = {
  to: string;
  mediaUrl: string;
  type: "image" | "video";
  caption?: string;
};

export async function sendWhatsAppMedia(
  options: SendWhatsAppMediaOptions,
) {
  const config = getWhatsAppConfig();

  if (!config) {
    return {
      ok: false,
      error: "WhatsApp configuration missing",
    };
  }

  const recipient = normalizeWhatsAppRecipient(options.to);

  if (!recipient) {
    return {
      ok: false,
      error: "Invalid recipient",
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
        type: options.type,
        [options.type]: {
          link: options.mediaUrl,
          caption: options.caption,
        },
      }),
    },
  );

  const data = await response.json();

  return {
    ok: response.ok,
    response: data,
  };
}

export function buildReportWhatsAppMessage(
  report: ReportLike,
  creatorName: string,
) {
  return `
📢 New Report Submitted

Project: ${report.project?.name || "-"}${report.project?.city ? ` - ${report.project.city}` : ""}

Category: ${report.category?.name || "-"}

By: ${creatorName}

Description:
${report.description || "-"}
`.trim();
}

export async function sendWhatsAppTextToMany(
  recipients: string[],
  message: string,
) {

  console.log("Original WhatsApp recipients:", recipients);

  const uniqueRecipients = Array.from(
    new Set(
      recipients
        .map((recipient) => normalizeWhatsAppRecipient(recipient))
        .filter((recipient): recipient is string => Boolean(recipient)),
    ),
  );

  console.log("Unique WhatsApp recipients:", uniqueRecipients);

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
