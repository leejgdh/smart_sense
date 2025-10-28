import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';

@Injectable()
export class FirebaseService implements OnModuleInit {
  private readonly logger = new Logger(FirebaseService.name);
  private firebaseApp: admin.app.App;

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    const projectId = this.configService.get<string>('FIREBASE_PROJECT_ID');
    const clientEmail = this.configService.get<string>('FIREBASE_CLIENT_EMAIL');
    const privateKey = this.configService.get<string>('FIREBASE_PRIVATE_KEY');

    if (!projectId || !clientEmail || !privateKey) {
      this.logger.error('Firebase credentials are missing in environment variables');
      throw new Error('Firebase credentials are not configured');
    }

    try {
      this.firebaseApp = admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey: privateKey.replace(/\\n/g, '\n'), // Handle escaped newlines
        }),
      });

      this.logger.log('Firebase Admin SDK initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize Firebase Admin SDK', error);
      throw error;
    }
  }

  /**
   * Verify Firebase ID token
   * @param idToken - Firebase ID token from client
   * @returns Decoded token with user information
   */
  async verifyIdToken(idToken: string): Promise<admin.auth.DecodedIdToken> {
    try {
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      return decodedToken;
    } catch (error) {
      this.logger.error('Token verification failed', error);
      throw error;
    }
  }

  /**
   * Get user by UID
   * @param uid - Firebase user UID
   */
  async getUser(uid: string): Promise<admin.auth.UserRecord> {
    try {
      return await admin.auth().getUser(uid);
    } catch (error) {
      this.logger.error(`Failed to get user with UID: ${uid}`, error);
      throw error;
    }
  }

  /**
   * Get Firebase Auth instance
   */
  getAuth(): admin.auth.Auth {
    return admin.auth();
  }
}
