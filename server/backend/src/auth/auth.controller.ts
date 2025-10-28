import { Controller, Get, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CurrentUser } from './decorators/current-user.decorator';
import { Public } from './decorators/public.decorator';
import * as admin from 'firebase-admin';

@ApiTags('auth')
@Controller('api/auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  @Get('me')
  @ApiBearerAuth('firebase-auth')
  @ApiOperation({
    summary: 'Get current user information',
    description: 'Returns the authenticated user information from Firebase token'
  })
  @ApiResponse({
    status: 200,
    description: 'User information',
    schema: {
      type: 'object',
      properties: {
        uid: { type: 'string', description: 'Firebase user ID' },
        email: { type: 'string', description: 'User email' },
        email_verified: { type: 'boolean', description: 'Email verification status' },
        name: { type: 'string', description: 'User display name' },
        picture: { type: 'string', description: 'User profile picture URL' },
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing token' })
  async getCurrentUser(@CurrentUser() user: admin.auth.DecodedIdToken) {
    this.logger.log(`User ${user.uid} accessed /me endpoint`);

    return {
      uid: user.uid,
      email: user.email,
      email_verified: user.email_verified,
      name: user.name,
      picture: user.picture,
    };
  }

  @Get('health')
  @Public()
  @ApiOperation({
    summary: 'Health check for auth service',
    description: 'Public endpoint to check if auth service is running'
  })
  @ApiResponse({ status: 200, description: 'Auth service is healthy' })
  async healthCheck() {
    return {
      status: 'ok',
      service: 'auth',
      timestamp: new Date().toISOString(),
    };
  }
}
