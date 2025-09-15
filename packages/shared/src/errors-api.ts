import type { TernSecureAPIError, TernSecureApiErrorJSON} from "@tern-secure/types";

export function isUnauthorizedError(e: any): boolean {
  const status = e?.status;
  const code = e?.errors?.[0]?.code;
  return code === 'authentication_invalid' && status === 401;
}

export function isCaptchaError(e: TernSecureAPIResponseError): boolean {
  return ['captcha_invalid', 'captcha_not_enabled', 'captcha_missing_token'].includes(e.errors[0].code);
}

export function is4xxError(e: any): boolean {
  const status = e?.status;
  return !!status && status >= 400 && status < 500;
}

export function isNetworkError(e: any): boolean {
  // TODO: revise during error handling epic
  const message = (`${e.message}${e.name}` || '').toLowerCase().replace(/\s+/g, '');
  return message.includes('networkerror');
}

export function parseErrors(data: TernSecureApiErrorJSON[] = []): TernSecureAPIError[] {
  return data.length > 0 ? data.map(parseError) : [];
}


export function parseError(error: TernSecureApiErrorJSON): TernSecureAPIError {
  return {
    code: error.code,
    message: error.message,
  };
}

export function errorToJSON(error: TernSecureAPIError | null): TernSecureApiErrorJSON {
  return {
    code: error?.code || '',
    message: error?.message || '',
  };
}

interface TernSecureAPIResponseOptions {
  data: TernSecureApiErrorJSON[];
  status: number;
  retryAfter?: number;
}



export class TernSecureAPIResponseError extends Error {
  ternSecureError: true;

  status: number;
  message: string;
  retryAfter?: number;

  errors: TernSecureAPIError[];

  constructor(message: string, { data, status, retryAfter }: TernSecureAPIResponseOptions) {
    super(message);

    Object.setPrototypeOf(this, TernSecureAPIResponseError.prototype);

    this.status = status;
    this.message = message;
    this.retryAfter = retryAfter;
    this.ternSecureError = true;
    this.errors = parseErrors(data);
  }

  public toString = () => {
    const message = `[${this.name}]\nMessage:${this.message}\nStatus:${this.status}\nSerialized errors: ${this.errors.map(
      e => JSON.stringify(e),
    )}`;

    return message;
  };
}



export class TernSecureRuntimeError extends Error {
  ternSecureRuntimeError: true;

  /**
   * The error message.
   *
   * @type {string}
   */
  message: string;

  /**
   * A unique code identifying the error, can be used for localization.
   *
   * @type {string}
   */
  code: string;

  constructor(message: string, { code }: { code: string }) {
    const prefix = '🔒 TernSecure:';
    const regex = new RegExp(prefix.replace(' ', '\\s*'), 'i');
    const sanitized = message.replace(regex, '');
    const _message = `${prefix} ${sanitized.trim()}\n\n(code="${code}")\n`;
    super(_message);

    Object.setPrototypeOf(this, TernSecureRuntimeError.prototype);

    this.code = code;
    this.message = _message;
    this.ternSecureRuntimeError = true;
    this.name = 'TernSecureRuntimeError';
  }

  /**
   * Returns a string representation of the error.
   *
   * @returns {string} A formatted string with the error name and message.
   */
  public toString = () => {
    return `[${this.name}]\nMessage:${this.message}`;
  };
}