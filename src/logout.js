/* eslint import/no-unresolved: [2, { ignore: ['*$'] }] */
// eslint-disable-next-line import/extensions
import { AUTH_HOST, AUTH_PORT } from "./secrets";

const axios = require("axios");
const express = require("express");

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { refreshToken } = res.locals;

    console.log(refreshToken);

    res.clearCookie("accessToken", { httpOnly: true });
    res.clearCookie("refreshToken", { httpOnly: true });
    await axios.post(`http://${AUTH_HOST}:${AUTH_PORT}/logout`, {
      refreshToken
    });
    res.status(200).send({ statusMessage: "Sucessfully logged user out" });
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

module.exports = router;
