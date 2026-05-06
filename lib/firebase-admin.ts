import admin from "firebase-admin";

const normalizeEnvValue = (value: any) =>
  String(value || "")
    .trim()
    .replace(/^"(.*)"$/, "$1")
    .replace(/^'(.*)'$/, "$1");

const parseServiceAccount = () => {
  const rawJson =
    process.env.FIREBASE_SERVICE_ACCOUNT_JSON ||
    process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;

  if (rawJson) {
    try {
      const parsed = JSON.parse(normalizeEnvValue(rawJson));
      return {
        projectId: normalizeEnvValue(parsed.project_id || parsed.projectId),
        clientEmail: normalizeEnvValue(
          parsed.client_email || parsed.clientEmail,
        ),
        privateKey: normalizeEnvValue(parsed.private_key || parsed.privateKey)
          .replace(/\\n/g, "\n")
          .replace(/\r/g, ""),
      };
    } catch (error) {
      console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON", error);
    }
  }

  const projectId = normalizeEnvValue(
    process.env.FIREBASE_PROJECT_ID ||
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  );
  const clientEmail = normalizeEnvValue(process.env.FIREBASE_CLIENT_EMAIL);

  const privateKey = normalizeEnvValue(
    process.env.FIREBASE_PRIVATE_KEY ||
    process.env.FIREBASE_PRIVATE_KEY_BASE64 ||
    "",
  )
    .replace(/\\n/g, "\n")
    .replace(/\r/g, "");

  const decodedBase64Key =
    !privateKey.includes("BEGIN PRIVATE KEY") &&
      process.env.FIREBASE_PRIVATE_KEY_BASE64
      ? Buffer.from(
        normalizeEnvValue(process.env.FIREBASE_PRIVATE_KEY_BASE64),
        "base64",
      )
        .toString("utf8")
        .replace(/\\n/g, "\n")
        .replace(/\r/g, "")
      : privateKey;

  return {
    projectId,
    clientEmail,
    privateKey: decodedBase64Key,
  };
};

const serviceAccount = parseServiceAccount();

if (!admin.apps.length) {
  if (
    serviceAccount.projectId &&
    serviceAccount.clientEmail &&
    serviceAccount.privateKey
  ) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: serviceAccount.projectId,
        clientEmail: serviceAccount.clientEmail,
        privateKey: serviceAccount.privateKey,
      }),
    });
  }
}

export const firestore =
  admin.apps.length > 0 ? admin.firestore() : null;
export const messaging = admin.apps.length > 0 ? admin.messaging() : null;
export const adminFieldValue = admin.firestore.FieldValue;
