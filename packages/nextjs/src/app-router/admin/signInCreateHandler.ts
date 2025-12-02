import type { RequestProcessorContext } from '@tern-secure/backend';
import type { SignInCreateParams } from '@tern-secure/types';

import { RetrieveUser } from './actions';
import {
  createApiErrorResponse,
  createApiSuccessResponse,
} from './responses';


export const processSignInCreate = async (
  context: RequestProcessorContext
): Promise<Response> => {
  try {
    const body = await context.request.json();
    const { strategy, identifier } = body as SignInCreateParams & { identifier?: string; password?: string };

    if (!strategy) {
      return createApiErrorResponse(
        'STRATEGY_REQUIRED',
        'Authentication strategy is required',
        400
      );
    }

    if (!identifier) {
      return createApiSuccessResponse({
        status: 'needs_identifier',
        strategy,
        message: 'Identifier is required to continue',
      });
    }

    if (strategy === 'email_code') {
      return await processEmailCodeStrategy(identifier);
    }

    if (strategy === 'password') {
      return await processPasswordStrategy(identifier);
    }

    if (strategy === 'phone_code') {
      return processPhoneCodeStrategy(identifier);
    }

    if (strategy === 'reset_password_email_code' || strategy === 'reset_password_phone_code') {
      return await processResetPasswordStrategy(strategy, identifier);
    }

    return createApiErrorResponse(
      'INVALID_STRATEGY',
      `Unsupported authentication strategy: ${strategy}`,
      400
    );
  } catch (error) {
    return createApiErrorResponse(
      'SIGN_IN_CREATE_ERROR',
      error instanceof Error
        ? error.message
        : 'An error occurred while creating sign-in',
      500
    );
  }
};

/**
 * Processes email_code strategy
 * Verifies if user exists by email and returns needs_first_factor status
 */
export const processEmailCodeStrategy = async (email: string): Promise<Response> => {
  try {
    const retrieveUser = RetrieveUser();
    const { data: user, error } = await retrieveUser.getUserByEmail(email);

    if (error) {
      return createApiErrorResponse(
        error.code,
        error.message,
        400
      );
    }

    if (!user.emailVerified) {
      return createApiSuccessResponse({
        status: 'needs_email_verification',
        identifier: email,
        supportedFirstFactors: [{ strategy: 'email_code' }],
        userId: user.uid,
        message: 'Email verification required',
      });
    }

    return createApiSuccessResponse({
      status: 'needs_first_factor',
      identifier: email,
      supportedFirstFactors: [{ strategy: 'email_code' }],
      userId: user.uid,
      message: 'User verified. Proceed with first factor authentication',
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('no user record')) {
      return createApiErrorResponse(
        'USER_NOT_FOUND',
        'No user found with this email address',
        404
      );
    }

    return createApiErrorResponse(
      'EMAIL_VERIFICATION_ERROR',
      error instanceof Error ? error.message : 'Failed to verify email',
      500
    );
  }
};


export const processPasswordStrategy = async (identifier: string): Promise<Response> => {
  try {
    const retrieveUser = RetrieveUser();
    const { data: user, error } = await retrieveUser.getUserByEmail(identifier);

    if (error) {
      return createApiErrorResponse(
        error.code,
        error.message,
        400
      );
    }

    return createApiSuccessResponse({
      status: 'needs_first_factor',
      identifier,
      supportedFirstFactors: [{ strategy: 'password' }],
      userId: user.uid,
      message: 'User verified. Proceed with password authentication',
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('no user record')) {
      return createApiErrorResponse(
        'USER_NOT_FOUND',
        'No user found with this identifier',
        404
      );
    }

    return createApiErrorResponse(
      'USER_VERIFICATION_ERROR',
      error instanceof Error ? error.message : 'Failed to verify user',
      500
    );
  }
};


export const processPhoneCodeStrategy = async (phoneNumber: string): Promise<Response> => {
  try {
    //const retrieveUser = RetrieveUser();
    //const { data: user, error } = await retrieveUser.getUserByPhoneNumber(phoneNumber);

    //if (error) {
   //   return createApiErrorResponse(
   //     error.code,
    //    error.message,
   //     400
   //   );
   // }

    return createApiSuccessResponse({
      status: 'needs_first_factor',
      identifier: phoneNumber,
      supportedFirstFactors: [{ strategy: 'phone_code' }],
      //userId: user.uid,
      message: 'User verified. Proceed with phone authentication',
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('no user record')) {
      return createApiErrorResponse(
        'USER_NOT_FOUND',
        'No user found with this phone number',
        404
      );
    }

    return createApiErrorResponse(
      'PHONE_VERIFICATION_ERROR',
      error instanceof Error ? error.message : 'Failed to verify phone number',
      500
    );
  }
};


export const processResetPasswordStrategy = async (
  strategy: 'reset_password_email_code' | 'reset_password_phone_code',
  identifier: string
): Promise<Response> => {
  try {
    if (strategy === 'reset_password_email_code') {
      const retrieveUser = RetrieveUser();
      const { data: user, error } = await retrieveUser.getUserByEmail(identifier);

      if (error) {
        return createApiErrorResponse(
          error.code,
          error.message,
          400
        );
      }

      return createApiSuccessResponse({
        status: 'needs_first_factor',
        identifier,
        strategy,
        userId: user.uid,
        message: 'User verified. Proceed with password reset',
      });
    }

    return createApiErrorResponse(
      'NOT_IMPLEMENTED',
      'Phone reset password strategy not yet implemented',
      501
    );
  } catch (error) {
    return createApiErrorResponse(
      'RESET_PASSWORD_ERROR',
      error instanceof Error ? error.message : 'Failed to process password reset',
      500
    );
  }
};
