import { Injectable, CanActivate, ExecutionContext, Inject, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Config } from './config.module';

@Injectable()
export class AuthGuard implements CanActivate {

  @Inject(ConfigService) private readonly configService!: ConfigService<Config>;

  canActivate(context: ExecutionContext): boolean | Promise<boolean> {
    const serverPassword = this.configService.get("PASSWORD");
    if (!serverPassword) return true;
    const request = context.switchToHttp().getRequest();
    const password = request.headers['x-password'];
    if (!password) throw new UnauthorizedException("header x-password not set.");
    if (password !== serverPassword) throw new UnauthorizedException("header x-password mismatch.");
    return true;
  }
}