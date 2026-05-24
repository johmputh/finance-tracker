import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { messagingApi, webhook } from "@line/bot-sdk";

@Injectable()
export class LineService {
  private readonly logger = new Logger(LineService.name);
  readonly client: messagingApi.MessagingApiClient;

  constructor(private readonly config: ConfigService) {
    this.client = new messagingApi.MessagingApiClient({
      channelAccessToken: this.config.getOrThrow<string>("LINE_CHANNEL_ACCESS_TOKEN"),
    });
  }

  async handleEvents(events: webhook.Event[]): Promise<void> {
    await Promise.all(events.map((event) => this.handleEvent(event)));
  }

  private async handleEvent(event: webhook.Event): Promise<void> {
    this.logger.log(`LINE event received: ${event.type}`);
  }
}
