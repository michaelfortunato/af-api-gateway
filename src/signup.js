/* eslint import/no-unresolved: [2, { ignore: ['*$'] }] */
// eslint-disable-next-line import/extensions
import emailSignUp from "./emailSignUp";
import {
  emailClientId,
  emailPrivateKey,
  AUTH_HOST,
  AUTH_PORT
} from "./secrets";

const express = require("express");
const axios = require("axios");
const nodemailer = require("nodemailer");

const router = express.Router();

let transporter = null;
if (process.env.NODE_ENV !== "development") {
  transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      type: "OAuth2",
      user: "automated-services@art-flex.co",
      privateKey: emailPrivateKey.replace(/\\n/g, "\n"),
      serviceClient: emailClientId
    }
  });
}
const sendVerificationEmail = async (toEmail, verificationToken) => {
  await transporter.verify();
  await transporter.sendMail({
    from: "no-reply@art-flex.co <no-reply@art-flex.co>",
    to: toEmail,
    subject: "[Art Flex] Please verify your account",
    html: emailSignUp(toEmail, verificationToken)
  });
};

router.post("/new", async (req, res) => {
  const payload = {
    name: req.body.name,
    email: req.body.email.toLowerCase(),
    password: req.body.password
  };
  try {
    const authRes = await axios.post(
      `http://${AUTH_HOST}:${AUTH_PORT}/signup/new`,
      payload
    );
    console.log(authRes);
    res.status(200).send({
      name: req.body.name,
      email: req.body.email
    });
    if (process.env.NODE_ENV !== "development") {
      try {
        await sendVerificationEmail(
          req.body.email,
          authRes.data.verificationToken
        );
      } catch (error) {
        console.log("email error!!!!!");
        console.log(error);
      }
    } else {
      // console log the verifcation token for testing
      console.log(authRes.data);
    }
  } catch (error) {
    console.log(error);
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      res.status(error.response.status).send(error.response.data);
    } else if (error.request) {
      // The request was made but no response was received
      // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
      // http.ClientRequest in node.js
      res.status(500).send({ statusMessage: "Internal server error" });
    } else {
      // Something happened in setting up the request that triggered an Error
      res.status(500).send({ statusMessage: "Internal server error" });
    }
  }
});
router.post("/verify", async (req, res) => {
  try {
    const authRes = await axios.post(
      `http://${AUTH_HOST}:${AUTH_PORT}/signup/verify`,
      {
        email: req.body.email.toLowerCase(),
        token: req.body.token
      }
    );
    // Add to the accountDB
    const { refreshToken, name, email, statusMessage } = authRes.data;
    res.cookie("refreshToken", refreshToken, { httpOnly: true });
    res.send({
      name,
      email,
      statusMessage
    });
  } catch (error) {
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      res.status(error.response.status).send(error.response.data);
    } else if (error.request) {
      // The request was made but no response was received
      // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
      // http.ClientRequest in node.js
      res.status(500).send({ statusMessage: "Internal server error" });
    } else {
      // Something happened in setting up the request that triggered an Error
      res.status(500).send({ statusMessage: "Internal server error" });
    }
  }
});

export default router;
