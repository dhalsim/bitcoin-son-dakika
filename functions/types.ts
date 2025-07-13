export interface Context {
  request: Request;
  env: {
    EDITOR_PUBKEYS: {
      get: (key: string) => Promise<string | null>;
      put: (key: string, value: string) => Promise<void>;
    };
    MASTER_ADMIN_PRIVATEKEY: string;
  };
}

export type UserRole = "admin" | "editor";

export interface AuthContext {
  env: {
    EDITOR_PUBKEYS: {
      get: (key: string) => Promise<string | null>;
      put: (key: string, value: string) => Promise<void>;
    };
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
