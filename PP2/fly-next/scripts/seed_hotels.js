import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Ensure a default hotel owner exists.
  let owner = await prisma.user.findUnique({ where: { email: 'owner@example.com' } });
  if (!owner) {
    owner = await prisma.user.create({
      data: {
        firstName: "Hotel",
        lastName: "Owner",
        email: "owner@example.com",
        password: "password",
        phoneNumber: "123-456-7890",
      },
    });
  }

  // Fetch cities from the prepopulated City table.
  const cities = await prisma.city.findMany();
  if (cities.length === 0) {
    console.error("No cities found. Please run fetch_initial_afs_data.js first.");
    return;
  }

  // Create 50 hotels using a random city from the list.
  for (let i = 1; i <= 50; i++) {
    const randomCity = cities[Math.floor(Math.random() * cities.length)];
    const cityName = randomCity.city;

    await prisma.hotel.create({
      data: {
        ownerId: owner.id,
        name: `Hotel ${i} in ${cityName}`,
        logo: "https://via.placeholder.com/150",
        address: `${i} Main Street, ${cityName}`,
        location: cityName,
        rating: Math.floor(Math.random() * 5) + 1,
        images: ["https://via.placeholder.com/300", "https://via.placeholder.com/400"],
        roomType: {
          create: [
            {
              name: "Standard Room",
              amenities: ["Wi-Fi", "TV", "Air Conditioning"],
              pricePerNight: 100 + i,
              images: ["https://via.placeholder.com/200"],
              rooms: 10,
            },
            {
              name: "Deluxe Room",
              amenities: ["Wi-Fi", "TV", "Air Conditioning", "Mini Bar"],
              pricePerNight: 150 + i,
              images: ["https://via.placeholder.com/200"],
              rooms: 5,
            },
          ],
        },
      },
    });
  }

  console.log("Hotel seeding completed!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
