import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class PaymentService {
  constructor(private readonly configService: ConfigService) {}

  calculateAccessExpirationDate(periodEnd: number) {
    const periodEndDate = new Date(periodEnd * 1000);
    return new Date(
      periodEndDate.getTime() +
        // this.configService.get("XDS_SUBSCRIPTION_LEEWAY_DAYS") *
        24 * 60 * 60 * 1000,
    );
  }
}
