import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_REFRESH_SECRET || 'refresh_secret',
    });
  }

  validate(payload: any) {
    const userId = payload?.userId ?? payload?.id ?? payload?.sub;
    return {
      ...payload,
      sub: userId,
      userId,
      id: userId,
    };
  }
}
