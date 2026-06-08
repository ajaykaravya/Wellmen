import { createCrudApi } from "./resource";

export type UserItem = {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string | null;
  mobileNumber: string | null;
  role: string | null;
  createdAt: string;
};

export type UserPayload = {
  firstName: string;
  lastName: string;
  email: string;
  mobileNumber: string;
  password: string;
  roleName: string;
  roleId?: string;
};

export const usersApi = createCrudApi<
  UserItem,
  UserItem,
  UserPayload,
  UserPayload
>("/api/users");
