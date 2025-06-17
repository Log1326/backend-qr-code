import { Injectable, Logger } from '@nestjs/common';

type NominatimResponse = Array<{
  lat: string;
  lon: string;
}>;

interface AddressParts {
  city: string;
  street: string;
  houseNumber: string;
}

@Injectable()
export class GeoService {
  private readonly logger = new Logger(GeoService.name);

  async getCoordinatesFromAddressParts(
    parts: AddressParts,
  ): Promise<{ lat: number; lng: number } | null> {
    const { city, street, houseNumber } = parts;
    let address = city;

    if (street) address += `, ${street}`;
    if (houseNumber) address += ` ${houseNumber}`;

    const params = new URLSearchParams({
      q: address,
      format: 'json',
      limit: '1',
    });

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?${params.toString()}`,
        {
          headers: {
            'User-Agent': 'TelegramBot/1.0',
            Accept: 'application/json',
          },
        },
      );

      if (!response.ok) {
        this.logger.warn(
          `GeoService: HTTP error ${response.status} - ${response.statusText}`,
        );
        return null;
      }

      const data = (await response.json()) as NominatimResponse;
      if (!data || data.length === 0) return null;

      const result = data[0];
      return {
        lat: parseFloat(result.lat),
        lng: parseFloat(result.lon),
      };
    } catch (error) {
      this.logger.error('GeoService error:', error);
      return null;
    }
  }
}
