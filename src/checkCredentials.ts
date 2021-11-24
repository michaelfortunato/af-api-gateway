/* eslint-disable import/no-unresolved */
/* eslint import/no-unresolved: [2, { ignore: ['*$'] }] */
// eslint-disable-next-line import/extensions
import jwt, { Jwt } from "jsonwebtoken";
import { NextFunction, Request, Response } from "express";
import { accessTokenPublicKeys, AUTH_HOST, AUTH_PORT } from "./secrets";

const axios = require("axios");

/**
 * This function simultaneously checks the credentials
 * It behaves in different ways based on three mutually exclusive cases:
 * Case 1) If accessToken is still valid, return it and the refresh token,
 * 		no need to create a new access token
 * 		and have a bunch of them lying around!
 * Case 2) If the accessToken is invalid and the refreshToken is still valid,
 * 		use the refreshToken to get a new accessToken AND refreshToken
 * 		(per Auth0 advice).
 * Case 3) If the accessToken is invalid and the refreshToken is invalid,
 * 		return null (can't help you),
 * 		and let the calling method handle that value.
 * Note: There is the case where the accessToken
 * 		is valid and the refreshToken is invalid. All services will still accept
 * 		this access token while it is still not expired. This is bad, but not
 * 		terrible as the accessToken typically lasts 15 minutes.
 * 								Table (fcn case i refers to the cases enumerated above)
 * 	----------------------------------------------------------------------------
 *													| accessToken valid | accessToken invalid |
 * 	| --------------------- | ----------------- | ------------------- |
 * 	| refreshToken valid		|   (fcn case 1.)		| 	 (fcn case 2.)	  |
 * 	| refreshToken invalid	|	  (fcn case 2.) 	| 	 (fcn case 3.)    |
 * @param accessToken
 * @param refreshToken
 * @returns
 */
const refreshCredentials = async (
  accessToken: string,
  refreshToken: string
): Promise<{ accessToken: string; refreshToken: string }> => {
  try {
    const { header } = jwt.decode(accessToken, {
      complete: true
    }) || { header: null };
    if (header === null) throw new Error("Null access token header");

    const kid = typeof header.kid === "string" ? parseInt(header.kid, 10) : -1;
    const accessTokenPublicKey = accessTokenPublicKeys[kid];
    jwt.verify(accessToken, accessTokenPublicKey);
    return { accessToken, refreshToken };
  } catch (accessTokenError) {
    // If accessToken is invalid,
    // 	try to use refreshToken to get new accessToken AND refreshToken.
    // Throw error otherwise
    const { data } = await axios.post(
      `http://${AUTH_HOST}:${AUTH_PORT}/generate_token_pair`,
      { refreshToken }
    );
    return { accessToken: data.accessToken, refreshToken: data.refreshToken };
  }
};

const checkCredentials = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    res.clearCookie("accessToken", { httpOnly: true });
    res.clearCookie("refreshToken", { httpOnly: true });
    const possibleTokens = await refreshCredentials(
      req.cookies.accessToken,
      req.cookies.refreshToken
    );
    const { accessToken, refreshToken } = possibleTokens;
    res.locals.accessToken = accessToken;
    res.locals.refreshToken = refreshToken;
    res.cookie("accessToken", accessToken, { domain: "art-flex.co", httpOnly: true });
    res.cookie("refreshToken", refreshToken, { domain: "art-flex.co", httpOnly: true });
    next();
  } catch (error: any) {
    if (error.response?.status === 401) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      res.status(401).send({ statusMessage: "User not logged in" });
    } else {
      res.sendStatus(500);
    }
  }
};
export { refreshCredentials };
export default checkCredentials;
// ***********
// Summary: 1) Should I verify refreshTokens at the API gateway?
// 2) Should I generate a new refreshToken for each accessToken verification
// Should I generate a new refreshToken for each accessToken verificaiton?
// This seems to defeat the point of taking load off the auth service.
// It only comes up because I need to verify the integrity of the refreshToken before
// Destroying it as explained in af-auth-app/logout.js
// I do not feel like I should be validating refreshTokens
// (ie have there public keys at the api gateway but maybe i should)
// ***********
