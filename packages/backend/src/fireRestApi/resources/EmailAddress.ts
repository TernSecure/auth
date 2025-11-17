import type { EmailAddressJson } from "./JSON";

export class ResetPasswordEmail {
    constructor(readonly email: string) { }

    static fromJSON(data: EmailAddressJson): ResetPasswordEmail {
        return new ResetPasswordEmail(data.email);
    }
}