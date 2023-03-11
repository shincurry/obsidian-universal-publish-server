import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { Config } from './App.config';
import { AppModule } from './App.module';
import { AuthGuard } from './Auth.guard';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    "origin": "*",
    "methods": "GET,HEAD,PUT,PATCH,POST,DELETE",
    "preflightContinue": false,
    "optionsSuccessStatus": 204
  });
  const authGuard = app.get(AuthGuard);
  app.useGlobalGuards(authGuard);

  const configService = app.get<ConfigService<Config>>(ConfigService)
  const host = configService.get("HOST");
  const port = configService.get("PORT");
  await app.listen(port, host);
}
bootstrap();
