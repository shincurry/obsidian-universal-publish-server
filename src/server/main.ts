import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { Config } from './App.config';
import { AppModule } from './App.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    "origin": "*",
    "methods": "GET,HEAD,PUT,PATCH,POST,DELETE",
    "preflightContinue": false,
    "optionsSuccessStatus": 204
  });
  const configService = app.get<ConfigService<Config>>(ConfigService)
  const host = configService.get("HOST");
  const port = configService.get("PORT");

  await app.listen(port, host);
}
bootstrap();
