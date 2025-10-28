import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import * as admin from 'firebase-admin';

/**
 * Decorator to extract the current authenticated user from the request
 * Usage: @CurrentUser() user: DecodedIdToken
 */
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): admin.auth.DecodedIdToken => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
