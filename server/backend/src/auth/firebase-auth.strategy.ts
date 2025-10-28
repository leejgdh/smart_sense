import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-custom';
import { FirebaseService } from '../firebase/firebase.service';
import * as admin from 'firebase-admin';
import { Request } from 'express';

@Injectable()
export class FirebaseAuthStrategy extends PassportStrategy(Strategy, 'firebase-auth') {
  private readonly logger = new Logger(FirebaseAuthStrategy.name);

  constructor(private firebaseService: FirebaseService) {
    super();
  }

  async validate(request: Request): Promise<admin.auth.DecodedIdToken> {
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      this.logger.warn('No authorization header provided');
      throw new UnauthorizedException('No authorization header');
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      this.logger.warn('Invalid authorization header format');
      throw new UnauthorizedException('Invalid authorization header format');
    }

    const token = parts[1];

    if (!token) {
      this.logger.warn('No token provided');
      throw new UnauthorizedException('No token provided');
    }

    try {
      this.logger.debug(`Verifying token: ${token.substring(0, 20)}...`);
      const decodedToken = await this.firebaseService.verifyIdToken(token);

      this.logger.log(`Token verified successfully for user: ${decodedToken.uid} (${decodedToken.email})`);

      return decodedToken;
    } catch (error) {
      this.logger.error(`Firebase token verification failed: ${error.message}`, error.stack);
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
