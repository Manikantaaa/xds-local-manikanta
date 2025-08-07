export default () => ({
  PORT: process.env.XDS_API_PORT || 4002,
  XDS_JWT_TOKEN_EXPIRED_TIME: process.env.XDS_JWT_TOKEN_EXPIRED_TIME || "1h",
});
