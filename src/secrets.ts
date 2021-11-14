import fs from "fs";
import path from "path";

const secretFolderPath = process.env.SECRET_FOLDER_PATH as string;

const s3AccessKeyId = fs.readFileSync(
  path.join(secretFolderPath, "external-af-s3-secrets", "s3_aws_access_key_id"),
  { encoding: "utf-8" }
);
const s3SecretAccessKey = fs.readFileSync(
  path.join(
    secretFolderPath,
    "external-af-s3-secrets",
    "s3_aws_secret_access_key"
  ),
  { encoding: "utf-8" }
);

const emailClientId = fs.readFileSync(
  path.join(secretFolderPath, "automated-email-credentials", "client_id"),
  { encoding: "utf-8" }
);
const emailPrivateKey = fs.readFileSync(
  path.join(secretFolderPath, "automated-email-credentials", "private_key"),
  { encoding: "utf-8" }
);

const accessTokenPublicKeyDirectory = path.join(
  secretFolderPath,
  "access-token-public-keys"
);
const accessTokenPublicKeys: string[] = fs
  .readdirSync(accessTokenPublicKeyDirectory)
  .filter((file: string) => file.split(".").pop() === "pub")
  .map((file: string) =>
    fs.readFileSync(`${accessTokenPublicKeyDirectory}/${file}`, "utf-8")
  );

const AUTH_HOST = process.env.AUTH_APP_SERVICE_SERVICE_HOST as string;
const AUTH_PORT = process.env.AUTH_APP_SERVICE_SERVICE_PORT as string;

const ACCOUNT_HOST = process.env.ACCOUNT_APP_SERVICE_SERVICE_HOST;
const ACCOUNT_PORT = process.env.ACCOUNT_APP_SERVICE_SERVICE_PORT;
export {
  s3AccessKeyId,
  s3SecretAccessKey,
  emailClientId,
  emailPrivateKey,
  accessTokenPublicKeys,
  AUTH_HOST,
  AUTH_PORT,
  ACCOUNT_HOST,
  ACCOUNT_PORT
};
