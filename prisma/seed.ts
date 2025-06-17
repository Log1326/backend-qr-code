import type { RecipeStatus } from '@prisma/client';
import { EventType, FieldType, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function getRandomDateInRange(start: Date, end: Date): Date {
  const diff = end.getTime() - start.getTime();
  const newDiff = Math.floor(Math.random() * diff);
  return new Date(start.getTime() + newDiff);
}

function getRandomCoordinates() {
  const lat = 29 + Math.random() * 4; // 29 - 33
  const lng = 34 + Math.random() * 4; // 34 - 38
  return { lat, lng };
}

async function main() {
  const employeeNames = ['Антон Панов', 'Ольга Панова', 'Мия Панова'];

  const employees = await Promise.all(
    employeeNames.map((name) => {
      const lowerName = name.toLowerCase();

      let avatarId = 'default';
      if (lowerName.includes('антон')) avatarId = 'anton';
      else if (lowerName.includes('ольга')) avatarId = 'olga';
      else if (lowerName.includes('мия')) avatarId = 'mia';

      return prisma.employee.create({
        data: {
          name,
          avatarUrl: `https://i.pravatar.cc/150?u=${avatarId}`,
        },
      });
    }),
  );

  const clientNames = Array.from({ length: 5 }, (_, i) => `Клиент ${i}`);
  const getRandomClientName = () =>
    clientNames[Math.floor(Math.random() * clientNames.length)];

  const getRandomPrice = () =>
    Math.floor(Math.random() * (100000 - 1000 + 1)) + 1000;

  const statusValues: RecipeStatus[] = ['NEW', 'IN_PROGRESS', 'COMPLETED'];

  const startDate = new Date(2025, 4, 1); // 1 мая 2025 (месяцы с 0)
  const endDate = new Date(2025, 11, 31); // 31 декабря 2025

  const sampleAddresses = [
    'Tel Aviv, Rothschild Blvd 10',
    'Jerusalem, Jaffa Street 50',
    'Haifa, Hativat Hagalil 15',
    'Beer Sheva, Ben Gurion Blvd 7',
    'Eilat, Coral Beach Road 1',
  ];

  for (const employee of employees) {
    console.log(`\n👤 Создаём заказы для сотрудника: ${employee.name}`);

    for (let i = 0; i < 5; i++) {
      const status =
        statusValues[Math.floor(Math.random() * statusValues.length)];

      const max = await prisma.recipe.aggregate({
        where: {
          status,
        },
        _max: {
          position: true,
        },
      });

      const nextPosition = (max._max?.position ?? -1) + 1;

      const randomCreatedAt = getRandomDateInRange(startDate, endDate);
      const randomAddress =
        sampleAddresses[Math.floor(Math.random() * sampleAddresses.length)];
      const { lat, lng } = getRandomCoordinates();

      const recipe = await prisma.recipe.create({
        data: {
          employeeId: employee.id,
          clientName: getRandomClientName(),
          price: getRandomPrice(),
          status,
          position: nextPosition,
          qrCodeUrl: null,
          createdAt: randomCreatedAt,
          address: randomAddress,
          locationLat: lat,
          locationLng: lng,
          parameters: {
            create: [
              {
                name: 'Описание',
                type: FieldType.TEXT,
                description: `Описание заказа ${i + 1}`,
                order: 1,
              },
              {
                name: 'Комментарий',
                type: FieldType.AREA,
                description: 'Комментарий клиента',
                order: 2,
              },
              ...(Math.random() > 0.5
                ? [
                    {
                      name: 'Файл',
                      type: FieldType.FILE,
                      description: 'https://example.com/image.jpg',
                      order: 3,
                    },
                  ]
                : []),
            ],
          },
          events: {
            create: [
              {
                type: EventType.CREATED,
                createdAt: randomCreatedAt,
              },
            ],
          },
        },
      });

      console.log(
        `📝 Заказ ${recipe.id} (${recipe.clientName}) → статус "${status}", позиция ${nextPosition}, дата ${randomCreatedAt.toISOString()}, адрес "${randomAddress}"`,
      );
    }
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
    console.log('\n✅ Все заказы успешно созданы!');
  })
  .catch(async (e) => {
    console.error('❌ Ошибка:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
