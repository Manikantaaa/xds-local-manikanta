export const ROLE_CODE = {
  buyer: "buyer",
  service_provider: "service_provider",
  admin: "admin",
};

export type RoleCode = keyof typeof ROLE_CODE;
