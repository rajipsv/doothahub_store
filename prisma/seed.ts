import { PrismaClient, ProductStatus, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

async function main() {
  // Idempotent: skip if a non-trivial amount of data already exists. Makes
  // it safe to run on every Vercel deploy without re-seeding production.
  const existingProducts = await db.product.count();
  if (existingProducts > 0) {
    console.log(`Seed skipped — ${existingProducts} products already in DB.`);
    return;
  }
  console.log("Seeding...");

  const adminPassword = await bcrypt.hash("Admin123!", 10);
  const customerPassword = await bcrypt.hash("Customer123!", 10);

  const admin = await db.user.upsert({
    where: { email: "admin@doothahub.test" },
    update: {},
    create: {
      email: "admin@doothahub.test",
      name: "Admin User",
      passwordHash: adminPassword,
      role: Role.ADMIN,
    },
  });

  const customer = await db.user.upsert({
    where: { email: "customer@doothahub.test" },
    update: {},
    create: {
      email: "customer@doothahub.test",
      name: "Demo Customer",
      passwordHash: customerPassword,
      role: Role.CUSTOMER,
    },
  });

  const brands = await Promise.all(
    ["Acme", "Globex", "Initech", "Umbrella"].map((name) =>
      db.brand.upsert({
        where: { slug: name.toLowerCase() },
        update: {},
        create: { name, slug: name.toLowerCase() },
      }),
    ),
  );

  const categoryData = [
    { name: "Apparel", slug: "apparel" },
    { name: "Footwear", slug: "footwear" },
    { name: "Accessories", slug: "accessories" },
    { name: "Home", slug: "home" },
  ];
  const categories = await Promise.all(
    categoryData.map((c) =>
      db.category.upsert({
        where: { slug: c.slug },
        update: {},
        create: c,
      }),
    ),
  );

  const sampleProducts = Array.from({ length: 20 }).map((_, i) => {
    const cat = categories[i % categories.length]!;
    const brand = brands[i % brands.length]!;
    return {
      slug: `demo-product-${i + 1}`,
      title: `Demo Product ${i + 1}`,
      shortDescription: `High-quality ${cat.name.toLowerCase()} item ${i + 1}.`,
      description: `This is the long description for demo product ${i + 1}. Made by ${brand.name}. Perfect for everyday use, built to last, and crafted with sustainable materials.`,
      categoryId: cat.id,
      brandId: brand.id,
      status: ProductStatus.ACTIVE,
      seoTitle: `Demo Product ${i + 1} \u2014 ${brand.name}`,
      seoDescription: `Shop Demo Product ${i + 1} by ${brand.name}.`,
    };
  });

  for (const p of sampleProducts) {
    const product = await db.product.upsert({
      where: { slug: p.slug },
      update: {},
      create: p,
    });

    await db.productImage.deleteMany({ where: { productId: product.id } });
    await db.productImage.create({
      data: {
        productId: product.id,
        url: `https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80&seed=${product.id}`,
        alt: product.title,
        position: 0,
      },
    });

    const sizes = ["S", "M", "L"] as const;
    for (const size of sizes) {
      const sku = `${product.slug.toUpperCase()}-${size}`;
      await db.productVariant.upsert({
        where: { sku },
        update: {},
        create: {
          productId: product.id,
          sku,
          // Prices stored in the smallest currency unit (paise for INR).
          priceCents: 99900 + sizes.indexOf(size) * 30000,
          comparePriceCents: 149900 + sizes.indexOf(size) * 30000,
          currency: "INR",
          inventoryQty: 50,
          attributes: { size },
        },
      });
    }
  }

  await db.coupon.upsert({
    where: { code: "WELCOME10" },
    update: {},
    create: {
      code: "WELCOME10",
      type: "PERCENT",
      value: 10,
      perUserLimit: 1,
      active: true,
    },
  });

  console.log(`Seeded: admin=${admin.email} customer=${customer.email}`);
  console.log("Default passwords: Admin123! / Customer123!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
