import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  const app = await NestFactory.create(AppModule, {
    logger: ['log', 'error', 'warn', 'debug', 'verbose'],
  });

  const configService = app.get(ConfigService);

  // Enable CORS
  app.enableCors({
    origin: true, // Allow all origins in development
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    exposedHeaders: ['Content-Length', 'X-Request-Id'],
    maxAge: 3600,
  });

  logger.log('✅ CORS enabled for all origins (development mode)');

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Swagger API Documentation
  const config = new DocumentBuilder()
    .setTitle('SmartSense IoT API')
    .setDescription(
      'SmartSense IoT Backend API Documentation\n\n' +
        '## Authentication\n' +
        'All endpoints require Firebase Authentication JWT token.\n\n' +
        '### How to get Firebase ID Token:\n' +
        '1. Use Firebase Authentication to sign in (Google, Email, etc.)\n' +
        '2. Get ID token: `await firebase.auth().currentUser.getIdToken()`\n' +
        '3. Click "Authorize" button below and paste the token\n' +
        '4. Make sure to include "Bearer " prefix is NOT needed - just paste the token\n\n' +
        '## AI Agent Endpoints\n' +
        'The `/api/agent` endpoints are public (no authentication required) for AI-to-AI communication.',
    )
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Firebase ID Token (without "Bearer " prefix)',
        name: 'Authorization',
        in: 'header',
      },
      'firebase-auth',
    )
    .addTag('auth', 'Authentication endpoints')
    .addTag('sensors', 'Sensor nodes and readings management')
    .addTag('ai', 'AI insights and analysis')
    .addTag('devices', 'Device provisioning and management')
    .addTag('agent', 'AI Agent communication endpoints (Public)')
    .build();

  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  // Health check endpoint
  app.getHttpAdapter().get('/health', (req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  });

  const port = configService.get('PORT', 3000);
  await app.listen(port);

  logger.log(`🚀 SmartSense Backend is running on: http://localhost:${port}`);
  logger.log(`📊 Health check: http://localhost:${port}/health`);
  logger.log(`📚 Swagger API docs: http://localhost:${port}/api/docs`);
  logger.log(`🌡️  Sensors API: http://localhost:${port}/api/sensors`);
  logger.log(`🤖 AI API: http://localhost:${port}/api/ai`);
  logger.log(`🔌 Devices API: http://localhost:${port}/api/devices`);
  logger.log(`🤝 Agent API (Public): http://localhost:${port}/api/agent`);
}

bootstrap();
