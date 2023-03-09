import { CacheModule, Module } from '@nestjs/common';
import { AppConfigModule, Config } from './App.config';
import { AppController } from './App.controller';
import { AppService } from './App.service';
import { ConfigService } from '@nestjs/config';
import sqliteStore from 'cache-manager-sqlite';
import { HttpModule } from '@nestjs/axios';

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
  providers: [AppService],
})
export class AppModule {}
