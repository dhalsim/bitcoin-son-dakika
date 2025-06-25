export interface Context {
  request: Request;
  env: {
    EDITOR_PUBKEYS: { 
      get: (key: string) => Promise<string | null>; 
      put: (key: string, value: string) => Promise<void>;
    };
  };
}