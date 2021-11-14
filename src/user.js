/* eslint-disable import/no-unresolved */
/* eslint import/no-unresolved: [2, { ignore: ['*$'] }] */
// eslint-disable-next-line import/extensions

import axios from "axios";
import { AUTH_HOST, AUTH_PORT } from "./secrets";

class User {
  constructor(name, email) {
    this.name = name;
    this.email = email;
  }

  async signup(password) {
    try {
      const payload = {
        name: this.name,
        email: this.email,
        password
      };
      const authRes = await axios.post(
        `http://${AUTH_HOST}:${AUTH_PORT}/signup`,
        payload
      );
      const statusMessage = authRes.data;
      return { status: true, statusMessage };
    } catch (error) {
      const statusMessage =
        error.response.data.statusMessage || "Internal server error";
      return { status: false, statusMessage };
    }
  }

  static async signin(email, password) {
    try {
      const payload = {
        email,
        password
      };
      const authRes = await axios.post(
        `http://${AUTH_HOST}:${AUTH_PORT}/login`,
        payload
      );
      const { statusMessage, accessToken, refreshToken } = authRes.data;
      // On signin, we could probably get the user by passing the accessToken
      // and calling the account service that I plan to set up.
      // The account service would detect the type via the access token and return
      // either an artist or buyer
      // const user = getUser(accessToken).
      // For now const user = {email: email}
      console.log(authRes.status);
      const user = { email };
      return {
        status: authRes.status,
        statusMessage,
        user,
        accessToken,
        refreshToken
      };
    } catch (error) {
      console.log(error);
      return {
        status: error.response.status || 500,
        statusMessage: error.response.data.statusMessage
      };
    }
  }
}

export default User;
