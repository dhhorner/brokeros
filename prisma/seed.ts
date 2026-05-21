import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  console.log("Seeding dev database...");

  // Dev user + brokerage
  const existing = await db.user.findUnique({ where: { email: "dev@localhost" } });
  if (existing) {
    console.log("Dev user already exists — skipping seed.");
    return;
  }

  const brokerage = await db.brokerage.create({
    data: {
      name: "Acme Realty Group",
      plan: "PRO",
      owner: {
        create: {
          email: "dev@localhost",
          name: "Dev User",
          role: "BROKER",
        },
      },
    },
    include: { owner: true },
  });

  await db.user.update({
    where: { id: brokerage.owner.id },
    data: { brokerageId: brokerage.id },
  });

  // Sample property
  const property = await db.property.create({
    data: {
      brokerageId: brokerage.id,
      address: "123 Maple Street, Austin TX 78701",
      price: 485000,
      beds: 3,
      baths: 2,
      sqft: 1850,
      status: "PENDING",
      listedAt: new Date("2026-04-10"),
    },
  });

  // Sample transaction
  const closeDate = new Date();
  closeDate.setDate(closeDate.getDate() + 18);

  const transaction = await db.transaction.create({
    data: {
      brokerageId: brokerage.id,
      propertyId: property.id,
      status: "UNDER_CONTRACT",
      closeDate,
      purchasePrice: 480000,
      earnestMoney: 9600,
      riskScore: "MEDIUM",
    },
  });

  // Parties
  await db.transactionParty.createMany({
    data: [
      { transactionId: transaction.id, role: "AGENT", name: "Sarah Chen", email: "sarah@realty.com", phone: "555-0101" },
      { transactionId: transaction.id, role: "LENDER", name: "First National Bank", email: "loans@fnb.com", phone: "555-0200" },
      { transactionId: transaction.id, role: "TITLE", name: "Austin Title Co.", email: "escrow@austintitle.com" },
    ],
  });

  // Deadlines
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);

  await db.contingencyDeadline.createMany({
    data: [
      { transactionId: transaction.id, type: "INSPECTION", dueDate: tomorrow, notes: "Home inspection scheduled for 9am" },
      { transactionId: transaction.id, type: "FINANCING", dueDate: nextWeek },
      { transactionId: transaction.id, type: "APPRAISAL", dueDate: nextWeek, completedAt: new Date() },
    ],
  });

  // Tasks
  await db.task.createMany({
    data: [
      { brokerageId: brokerage.id, transactionId: transaction.id, title: "Confirm inspection time with buyer", dueDate: tomorrow },
      { brokerageId: brokerage.id, transactionId: transaction.id, title: "Follow up with lender on pre-approval", dueDate: nextWeek },
      { brokerageId: brokerage.id, transactionId: transaction.id, title: "Send disclosure documents to buyer", dueDate: nextWeek },
      { brokerageId: brokerage.id, title: "Call new referral lead — Marcus Rivera", },
    ],
  });

  // Sample lead
  await db.lead.create({
    data: {
      brokerageId: brokerage.id,
      name: "Marcus Rivera",
      email: "marcus@example.com",
      phone: "555-0301",
      status: "NEW",
      source: "REFERRAL",
      notes: "Looking for 3bed/2bath in East Austin, budget ~$450k",
    },
  });

  await db.lead.create({
    data: {
      brokerageId: brokerage.id,
      name: "Jennifer Walsh",
      email: "jwalsh@example.com",
      status: "QUALIFIED",
      source: "WEBSITE",
      notes: "Pre-approved for $600k, wants South Austin",
    },
  });

  console.log("✓ Seed complete");
  console.log(`  Brokerage: ${brokerage.name} (id: ${brokerage.id})`);
  console.log(`  Dev login: dev@localhost`);
  console.log(`  Property: ${property.address}`);
  console.log(`  Transaction: ${transaction.id}`);
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
