export interface Context {
  request: Request;
  env: {
    MASTER_ADMIN_PRIVATEKEY: string;
  };
}

export type UserRole = "admin" | "editor";

export interface AuthContext {
  env: {
    MASTER_ADMIN_PRIVATEKEY: string;
  };
}

export type AuthResult =
  | {
      success: true;
      pubkey: string;
      roles: UserRole[];
    }
  | {
      success: false;
      error: string;
      status: number;
    };
