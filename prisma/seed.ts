import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const categories = [
  { id: "classics", name: "Pub Classics", sortOrder: 1, active: true },
  { id: "grill", name: "From the Grill", sortOrder: 2, active: true },
  { id: "burgers", name: "Burgers", sortOrder: 3, active: true },
  { id: "sides", name: "Sides & Kids", sortOrder: 4, active: true }
];

const items = [
  ["parmi","classics","Classic Chicken Parmi","House-crumbed chicken, Napoli, ham, mozzarella, chips and salad.",2800,1,[]],
  ["schnitzel","classics","Chicken Schnitzel","Golden crumbed chicken breast with chips, salad and choice of sauce.",2500,2,[]],
  ["fish","classics","Beer Battered Fish & Chips","Crisp battered fish, chips, garden salad, tartare and lemon.",2600,3,[]],
  ["bangers","classics","Bangers & Mash","Beef sausages, creamy mash, peas and onion gravy.",2300,4,[]],
  ["porterhouse","grill","250g Porterhouse","Cooked to your liking with chips, salad and choice of sauce.",3400,1,["GF"]],
  ["rump","grill","400g Rump","A generous pub cut with chips, salad and choice of sauce.",3900,2,["GF"]],
  ["ribs","grill","BBQ Pork Ribs","Sticky house BBQ glaze, chips, slaw and pickles.",3600,3,[]],
  ["brokie-burger","burgers","The Brokie Burger","Beef, bacon, cheese, lettuce, tomato, pickles and house sauce.",2400,1,[]],
  ["chicken-burger","burgers","Crispy Chicken Burger","Buttermilk chicken, slaw, cheese, pickles and spicy mayo.",2300,2,[]],
  ["steak-sandwich","burgers","Steak Sandwich","Steak, bacon, egg, cheese, salad and BBQ sauce.",2600,3,[]],
  ["chips","sides","Seasoned Chips","Crisp chips with chicken salt and aioli.",900,1,["V"]],
  ["rings","sides","Onion Rings","Beer battered onion rings with smoky BBQ sauce.",1100,2,["V"]],
  ["kids-nuggets","sides","Kids Nuggets & Chips","Chicken nuggets, chips and tomato sauce.",1200,3,[]],
  ["kids-fish","sides","Kids Fish & Chips","Battered fish, chips and tomato sauce.",1200,4,[]]
] as const;

async function main() {
  await prisma.settings.upsert({
    where: { id: "main" },
    update: {},
    create: { id: "main", venueName: "Broken Hill Hotel", phone: "(08) 9093 0306", address: "21 Forrest Street, South Boulder WA 6432", isOrderingOpen: true, pickupMinutes: 30 }
  });
  await prisma.counter.upsert({ where: { id: "orders" }, update: {}, create: { id: "orders", value: 100 } });
  for (const category of categories) await prisma.category.upsert({ where: { id: category.id }, update: category, create: category });
  for (const [id,categoryId,name,description,priceCents,sortOrder,dietary] of items) {
    await prisma.menuItem.upsert({
      where: { id },
      update: { categoryId,name,description,priceCents,sortOrder,dietary:[...dietary],active:true,soldOut:false },
      create: { id,categoryId,name,description,priceCents,sortOrder,dietary:[...dietary],active:true,soldOut:false }
    });
  }
  console.log("Neon PostgreSQL seeded successfully.");
}

main().finally(() => prisma.$disconnect());
