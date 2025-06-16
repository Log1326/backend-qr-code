type NominatimResponse = Array<{
  lat: string;
  lon: string;
}>;

interface AddressParts {
  city: string;
  street: string;
  houseNumber: string;
}

export async function getCoordinatesFromAddressParts(
  parts: AddressParts,
): Promise<{ lat: number; lng: number } | null> {
  try {
    const { city, street, houseNumber } = parts;
    let address = city;

    if (street) address += `, ${street}`;
    if (houseNumber) address += ` ${houseNumber}`;

    const params = new URLSearchParams({
      q: address,
      format: 'json',
      limit: '1',
    });

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
      console.error('Ошибка HTTP:', response.status, response.statusText);
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
    console.error('Ошибка при геокодинге адреса:', error);
    return null;
  }
}
