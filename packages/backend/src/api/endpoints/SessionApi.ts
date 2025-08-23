import type { RequestFunction } from "../request";

const rootPath = "/sessions";

type CreateSessionParams = {
  idToken: string;
  csrfToken: string;
};

export class SessionApi {
  constructor(protected request: RequestFunction) {}

  public async createSession(params: CreateSessionParams) {
    return this.request({
      method: "POST",
      path: rootPath,
      bodyParams: params,
    });
  }
}
