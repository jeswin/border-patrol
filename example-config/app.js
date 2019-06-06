module.exports = {
  domain: "test.example.com",
  sessionKeys: "grant_555_666_777",
  cookies: {
    httpOnly: false,
    maxAge: 3600 * 24 * 30 * 1000
  },
  enablePasswordAuth: false,
  enabledOAuthServices: ["github", "google"]
};
