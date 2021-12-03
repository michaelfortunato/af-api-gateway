import fs from "fs";
import path from "path";

const secretFolderPath = process.env.MOUNT_PATH
  ? path.join(
      process.env.MOUNT_PATH as string,
      process.env.SECRET_FOLDER_PATH as string
    )
  : (process.env.SECRET_FOLDER_PATH as string);

const s3AccessKeyId = fs.readFileSync(
  path.join(secretFolderPath, "af-s3-secrets", "s3-aws-access-key-id"),
  { encoding: "utf-8" }
);
const s3SecretAccessKey = fs.readFileSync(
  path.join(secretFolderPath, "af-s3-secrets", "s3-aws-secret-access-key"),
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

console.log(process.env.API_GATEWAY_SERVICE_PORT);

const API_GATEWAY_SERVICE_PORT = process.env.LOCAL_PORT
  ? process.env.LOCAL_PORT
  : process.env.API_GATEWAY_SERVICE_PORT;

const AUTH_HOST = process.env.AUTH_APP_SERVICE_SERVICE_HOST;
const AUTH_PORT = process.env.AUTH_APP_SERVICE_SERVICE_PORT;

const ACCOUNT_HOST = process.env.ACCOUNT_APP_SERVICE_SERVICE_HOST;
const ACCOUNT_PORT = process.env.ACCOUNT_APP_SERVICE_SERVICE_PORT;

export {
  s3AccessKeyId,
  s3SecretAccessKey,
  emailClientId,
  emailPrivateKey,
  accessTokenPublicKeys,
  API_GATEWAY_SERVICE_PORT,
  AUTH_HOST,
  AUTH_PORT,
  ACCOUNT_HOST,
  ACCOUNT_PORT
};
