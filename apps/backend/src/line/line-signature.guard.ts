import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { RawBodyRequest } from "@nestjs/common";
import type { Request } from "express";
import { validateSignature } from "@line/bot-sdk";

@Injectable()
export class LineSignatureGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<RawBodyRequest<Request>>();
    const signature = req.headers["x-line-signature"] as string;

    if (!signature) throw new UnauthorizedException("Missing x-line-signature header");

    const channelSecret = this.config.getOrThrow<string>("LINE_CHANNEL_SECRET");
    const body = req.rawBody ?? Buffer.from(JSON.stringify(req.body));

    if (!validateSignature(body, channelSecret, signature)) {
      throw new UnauthorizedException("Invalid LINE signature");
    }

    return true;
  }
}
