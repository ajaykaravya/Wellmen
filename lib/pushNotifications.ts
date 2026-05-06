import { messaging } from "@/lib/firebase-admin";

const MAX_TOKENS_PER_REQUEST = 500;

type PushPayload = {
  title: string;
  body: string;
  data?: Record<string, string>;
};

const isInvalidTokenError = (code?: string) =>
  code === "messaging/invalid-registration-token" ||
  code === "messaging/registration-token-not-registered";

export async function sendPushToTokens(tokens: string[], payload: PushPayload) {
  if (!messaging || tokens.length === 0) {
    return {
      successCount: 0,
      failureCount: 0,
      invalidTokens: [] as string[],
    };
  }

  let successCount = 0;
  let failureCount = 0;
  const invalidTokens = new Set<string>();

  for (let index = 0; index < tokens.length; index += MAX_TOKENS_PER_REQUEST) {
    const chunk = tokens.slice(index, index + MAX_TOKENS_PER_REQUEST);
    const response = await messaging.sendEachForMulticast({
      tokens: chunk,
      notification: {
        title: payload.title,
        body: payload.body,
      },
      android: {
        priority: "high",
      },
      data: payload.data,
    });

    successCount += response.successCount;
    failureCount += response.failureCount;

    response.responses.forEach((item, responseIndex) => {
      if (!item.success && isInvalidTokenError(item.error?.code)) {
        invalidTokens.add(chunk[responseIndex]);
      }
    });
  }

  return {
    successCount,
    failureCount,
    invalidTokens: Array.from(invalidTokens),
  };
}
