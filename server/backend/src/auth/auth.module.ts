import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { FirebaseModule } from '../firebase/firebase.module';
import { FirebaseAuthStrategy } from './firebase-auth.strategy';
import { AuthController } from './auth.controller';

@Module({
  imports: [PassportModule, FirebaseModule],
  controllers: [AuthController],
  providers: [FirebaseAuthStrategy],
  exports: [FirebaseAuthStrategy],
})
export class AuthModule {}
