import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const addresses: string[] = [
  'אפרים קישון 5, הרצליה',
  'אמה טאובר 9, הרצליה',
  'אפריים קישון 24, הרצליה',
  'אפריים קישון 26, הרצליה',
  'אפריים קישון 28, הרצליה',
  'אריאל 5, הרצליה',
  'בר אילן 20, הרצליה',
  'רבקה גרובר 3, הרצליה',
  'דוד שמעוני 12, הרצליה',
  'דוד שמעוני 16, הרצליה',
  'דוד שמעוני 26, הרצליה',
  'דוד שמעוני 28, הרצליה',
  'דורי 17, הרצליה',
  'דורי 19, הרצליה',
  'י.ל.ברוך 22, הרצליה',
  'דליה רביקוביץ 5, רעננה',
  'דליה רביקוביץ 7, רעננה',
  'דליה רביקוביץ 8, הרצליה',
  'דליה רביקוביץ 10, הרצליה',
  'דליה רביקוביץ 12, הרצליה',
  'דליה רביקוביץ 14, הרצליה',
  'האוניברסיטה 1, הרצליה',
  'האוניברסיטה 3, הרצליה',
  'האוניברסיטה 5, הרצליה',
  'האסיף 6, הרצליה',
  'הדר 40, הרצליה',
  'הדר 42, הרצליה',
  'הקרן 6, הרצליה',
  'הקרן 8, הרצליה',
  'זלמן שניאור 21, הרצליה',
  'זלמן שניאור 23, הרצליה',
  'זלמן שניאור 25, הרצליה',
  'חובת הלבבות 2ב, הרצליה',
  'חובת הלבבות 3, הרצליה',
  'חובת הלבבות 9, הרצליה',
  'חנה רובינא 3, הרצליה',
  'חנה רובינא 5, הרצליה',
  'חנה רובינא 7, הרצליה',
  'חנה רובינא 9, הרצליה',
  'חנה רובינא 13, הרצליה',
  'חנה רובינא 15, הרצליה',
  'חנה רובינא 19, הרצליה',
  'חנה רובינא 40, הרצליה',
  'חנה רובינא 42, הרצליה',
  'חנה רובינא 44, הרצליה',
  'חנה רובינא 46, הרצליה',
  'טשרניחובסקי 10, הרצליה',
  'יגאל אלון 4, הרצליה',
  'יגאל אלון 40, הרצליה',
  'יהודה עמיחי 6, רעננה',
  'יהודה עמיחי 16, רעננה',
  'יהודה הלוי 8, הרצליה',
  'כיבוש העבודה 27, הרצליה',
  'לאה גולדברג 6, הרצליה',
  'לוין 22, הרצליה',
  'מכבי 6א, רעננה',
  'מכבי 6ב, רעננה',
  'מכבי 8ב, רעננה',
  'יערה 14, רעננה',
  'יערה 16, רעננה',
  'יהודה עמיחי 4, רעננה',
  'נורדאו 2, הרצליה',
  'נעמי שמר 17, רעננה',
  'נעמי שמר 19, רעננה',
  'נתן אלתרמן 12, הרצליה',
  'נתן אלתרמן 14, הרצליה',
  'נתן אלתרמן 42, הרצליה',
  'נתן אלתרמן 44, הרצליה',
  'עינב 20, הרצליה',
  'עזרא הסופר 9, הרצליה',
  'עזרא הסופר 11, הרצליה',
  'עינב 22, הרצליה',
  'צמרות 4-6-8, הרצליה',
  'רחבעם זאבי 1, הרצליה',
  'העלומים 3, הרצליה',
  'בני בנימין 22, הרצליה',
  'בני בנימין 22א, הרצליה',
  'האסיף 2, הרצליה',
  'שדרות חן 2, הרצליה',
];

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error(
      'DATABASE_URL is not set. Point it to your production database to proceed.'
    );
  }

  const tenantId = Number.parseInt(process.env.TENANT_ID ?? '1', 10);
  if (!Number.isFinite(tenantId) || tenantId <= 0) {
    throw new Error('TENANT_ID must be a positive integer');
  }

  const created: { id: number; address: string }[] = [];
  const skipped: { id: number; address: string }[] = [];

  for (const address of addresses) {
    const existing = await prisma.building.findFirst({
      where: { address, tenantId },
      select: { id: true },
    });

    if (existing) {
      skipped.push({ id: existing.id, address });
      continue;
    }

    const building = await prisma.building.create({
      data: {
        name: address,
        address,
        tenantId,
      },
      select: { id: true },
    });
    created.push({ id: building.id, address });
  }

  console.log('Buildings upsert finished.');
  console.log(`Tenant ID: ${tenantId}`);
  console.log(`Created: ${created.length}, Skipped (already existed): ${skipped.length}`);
  if (created.length > 0) {
    console.table(created);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


