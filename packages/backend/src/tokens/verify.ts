import type { DecodedIdToken } from "@tern-secure/types";
import type { JwtReturnType } from "../jwt/types";
import { ternDecodeJwt, verifyJwt} from "../jwt/verifyJwt";
import { TokenVerificationError } from "../utils/errors";

export async function verifyTokenV(
  token: string
): Promise<JwtReturnType<DecodedIdToken, TokenVerificationError>> {
    const { data: decodedResult, errors } = ternDecodeJwt(token);

    if(errors) {
        return {errors}
    }

    const { header } = decodedResult;
    const { kid } = header

    try {
        return await verifyJwt(token);
    } catch (error) {
        return {
            errors: [error as TokenVerificationError]
        };
    }
}
