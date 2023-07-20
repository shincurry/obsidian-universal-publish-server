import { CacheModule, Inject, Injectable, Logger, Module } from '@nestjs/common';
import { AppConfigModule, Config } from './config.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigService } from '@nestjs/config';
import sqliteStore from 'cache-manager-sqlite';
import { HttpModule } from '@nestjs/axios';
import { AuthGuard } from './auth.guard';
import { BaseHttpServerEntrypoint } from 'nestjs-extends';

@Module({
  imports: [
    AppConfigModule,
    // TODO: fix this for supporting multiple cache manager
    CacheModule.registerAsync({
      useFactory: (configService: ConfigService<Config>) => {
        const cacheDbPath = configService.get<string>("FILE_CACHE_DB")
        return {
          isGlobal: true,
          store: sqliteStore as any,
          name: 'filecache',
          path: cacheDbPath,
        }
      },
      inject: [ConfigService],
    }),
    HttpModule,
  ],
  controllers: [AppController],
  providers: [AppService, AuthGuard],
})
export class ServerModule {}

@Injectable()
class Server extends BaseHttpServerEntrypoint {

  constructor(
    @Inject(ConfigService) private readonly configService: ConfigService,
  ) {
    super()
    const host = this.configService.get("HOST")
    const port = this.configService.get("PORT")
    if (host) this.host = host
    if (port) this.port = port
  }

  onApplicationCreated() {
    this.app.enableCors({
      "origin": "*",
      "methods": "GET,HEAD,PUT,PATCH,POST,DELETE",
      "preflightContinue": false,
      "optionsSuccessStatus": 204
    });
    const authGuard = this.app.get(AuthGuard);
    this.app.useGlobalGuards(authGuard);
  }

  async onApplicationListened() {
    const logger = new Logger("Server")
    logger.log(`App listening on ${this.host}:${this.port}`)
  }
}

if (require.main === module) {
  Server.bootstrap(ServerModule, {
    logger: process.env.NODE_ENV === 'production' ? ['error', 'warn', 'log'] : ['error', 'warn', 'log', 'debug', 'verbose']
  });
}
