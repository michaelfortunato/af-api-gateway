/* eslint import/no-unresolved: [2, { ignore: ['*$'] }] */
// eslint-disable-next-line import/extensions
import checkCredentials from "./checkCredentials";
import { s3AccessKeyId, s3SecretAccessKey } from "./secrets";
import signup from "./signup";
import account from "./account";

const express = require("express");
const { S3Client } = require("@aws-sdk/client-s3");
const cookieParser = require("cookie-parser");

const login = require("./login");
const logout = require("./logout");

const refreshSession = require("./refresh_session");

// Our server
const app = express();
const port = process.env.API_GATEWAY_SERVICE_HOST;

// Configure the S3 Client
app.locals.s3_client = new S3Client({
  region: "us-east-1",
  credentials: {
    accessKeyId: s3AccessKeyId,
    secretAccessKey: s3SecretAccessKey
  }
});

app.use(express.json());
app.use(cookieParser());
app.use("/signup", signup);
app.use("/login", login);
app.use("/logout", checkCredentials, logout);
app.use("/account", checkCredentials, account);
app.use("/refresh_session", refreshSession);
app.use("/is-logged-in", checkCredentials, (_, res) => {
  res.status(200).send({ statusMessage: "User is logged in" });
});
app.get("/test", async (req, res) => {
  res.send("fine");
});
app.listen(port, () => {
  console.log(`Server is listening at ${port}`);
});
