import {
  BudgetStatus,
  CodeType,
  ExpenseCategory,
  MaintenanceCategory,
  MaintenanceType,
  PrismaClient,
  Role,
} from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const BUILDING_ADDRESS = 'חנה רובינא 42, הרצליה';

const rubinaResidents = [
  {
    firstName: 'רוני',
    lastName: 'זגאייר',
    email: 'zagayer@gmail.com',
    phone: '050-7876348',
    monthlyFee: 460,
    unitNumber: '101',
    password: 'rubina101',
    autopayEnabled: true,
  },
  {
    firstName: 'ירון',
    lastName: 'חזן',
    email: 'yaron.hazan@intel.com',
    phone: '054-7885982',
    monthlyFee: 460,
    unitNumber: '102',
    password: 'rubina102',
    autopayEnabled: false,
  },
  {
    firstName: 'כרמל',
    lastName: 'רודה',
    email: 'karmel007@walla.com',
    phone: '053-3680680',
    monthlyFee: 460,
    unitNumber: '103',
    password: 'rubina103',
    autopayEnabled: true,
  },
  {
    firstName: 'אילן',
    lastName: 'מוריאנו',
    email: 'morianolow@gmail.com',
    phone: '050-5116014',
    monthlyFee: 460,
    unitNumber: '104',
    password: 'rubina104',
    autopayEnabled: false,
  },
  {
    firstName: 'יעקב',
    lastName: 'קלינסקי',
    email: 'ykalinsky1@gmail.com',
    phone: '052-3579227',
    monthlyFee: 460,
    unitNumber: '105',
    password: 'rubina105',
    autopayEnabled: true,
  },
  {
    firstName: 'אביב',
    lastName: 'חיים',
    email: 'avivhaim@gmail.com',
    phone: '054-5457087',
    monthlyFee: 460,
    unitNumber: '106',
    password: 'rubina106',
    autopayEnabled: false,
  },
  {
    firstName: 'גלית',
    lastName: 'אוזן',
    email: 'galitrozenberg@gmail.com',
    phone: '052-7487788',
    monthlyFee: 521,
    unitNumber: '107',
    password: 'rubina107',
    autopayEnabled: true,
  },
] as const;

async function ensureUser(email: string, password: string, role: Role, tenantId: number, phone?: string) {
  const passwordHash = await bcrypt.hash(password, 10);
  return prisma.user.upsert({
    where: { email },
    update: {
      passwordHash,
      role,
      tenantId,
      phone: phone ?? undefined,
    },
    create: {
      email,
      passwordHash,
      role,
      tenantId,
      phone,
    },
  });
}

async function ensureBudget(buildingId: number, year: number) {
  const existing = await prisma.budget.findFirst({
    where: { buildingId, year },
  });

  if (existing) {
    return prisma.budget.update({
      where: { id: existing.id },
      data: {
        name: `Operating Budget ${year} - Rubina 42`,
        amount: 42000,
        status: BudgetStatus.ACTIVE,
        notes: 'Budget sized for Rubina 42 E2E verification.',
      },
    });
  }

  return prisma.budget.create({
    data: {
      buildingId,
      name: `Operating Budget ${year} - Rubina 42`,
      year,
      amount: 42000,
      status: BudgetStatus.ACTIVE,
      notes: 'Budget sized for Rubina 42 E2E verification.',
    },
  });
}

async function ensureExpense(buildingId: number, budgetId: number, description: string, amount: number, incurredAt: Date) {
  const existing = await prisma.expense.findFirst({
    where: { buildingId, budgetId, description },
  });

  if (existing) {
    return prisma.expense.update({
      where: { id: existing.id },
      data: {
        category: description.includes('מעלית') ? ExpenseCategory.MAINTENANCE : ExpenseCategory.UTILITIES,
        amount,
        incurredAt,
      },
    });
  }

  return prisma.expense.create({
    data: {
      buildingId,
      budgetId,
      category: description.includes('מעלית') ? ExpenseCategory.MAINTENANCE : ExpenseCategory.UTILITIES,
      amount,
      description,
      incurredAt,
    },
  });
}

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set.');
  }

  const building = await prisma.building.findFirst({
    where: { address: BUILDING_ADDRESS },
  });

  if (!building) {
    throw new Error(`Building not found: ${BUILDING_ADDRESS}`);
  }

  const tenantId = building.tenantId;
  const now = new Date();
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const maya = await ensureUser('maya@demo.com', 'password123', Role.PM, tenantId);
  const tech2 = await ensureUser('tech2@demo.com', 'password123', Role.TECH, tenantId);

  await prisma.building.update({
    where: { id: building.id },
    data: {
      name: BUILDING_ADDRESS,
      address: BUILDING_ADDRESS,
      yearBuilt: 1996,
      floors: 4,
      totalUnits: rubinaResidents.length,
      area: 1680,
      amenities: ['לובי', 'מעלית', 'חניה'],
      managerName: 'ועד הבית רובינא 42',
      contactEmail: 'board-rubina42@demo.local',
      contactPhone: '09-9554242',
      notes: 'מערך נתונים מרוחק עבור חנה רובינא 42 לצורכי בדיקות מקצה לקצה.',
      isActive: true,
    },
  });

  const budget = await ensureBudget(building.id, now.getFullYear());
  await ensureExpense(building.id, budget.id, 'חשמל וניקיון שטחים משותפים', 2850, new Date(now.getFullYear(), now.getMonth() - 1, 20));
  await ensureExpense(building.id, budget.id, 'תחזוקת מעלית וקריאת שירות', 1650, new Date(now.getFullYear(), now.getMonth() - 1, 12));

  const existingAsset = await prisma.asset.findFirst({
    where: { serialNumber: 'R42-ELEV-001' },
  });

  const asset = existingAsset
    ? await prisma.asset.update({
        where: { id: existingAsset.id },
        data: {
          buildingId: building.id,
          name: 'מעלית חנה רובינא 42',
          category: MaintenanceCategory.SAFETY,
          description: 'מעלית הנוסעים הראשית של חנה רובינא 42.',
          location: 'לובי',
          purchaseDate: new Date(2019, 4, 1),
          warrantyExpiry: new Date(now.getFullYear() + 1, 4, 1),
          status: 'OPERATIONAL',
        },
      })
    : await prisma.asset.create({
        data: {
          buildingId: building.id,
          name: 'מעלית חנה רובינא 42',
          category: MaintenanceCategory.SAFETY,
          description: 'מעלית הנוסעים הראשית של חנה רובינא 42.',
          serialNumber: 'R42-ELEV-001',
          location: 'לובי',
          purchaseDate: new Date(2019, 4, 1),
          warrantyExpiry: new Date(now.getFullYear() + 1, 4, 1),
          status: 'OPERATIONAL',
        },
      });

  const existingSchedule = await prisma.maintenanceSchedule.findFirst({
    where: {
      buildingId: building.id,
      title: 'בדיקת מעלית חודשית',
    },
  });

  const maintenanceSchedule = existingSchedule
    ? await prisma.maintenanceSchedule.update({
        where: { id: existingSchedule.id },
        data: {
          assetId: asset.id,
          description: 'בדיקת תקינות מעלית וארון פיקוד.',
          category: MaintenanceCategory.SAFETY,
          type: MaintenanceType.INSPECTION,
          frequency: 'MONTHLY',
          startDate: now,
          nextOccurrence: new Date(now.getFullYear(), now.getMonth() + 1, 5),
          assignedToId: tech2.id,
        },
      })
    : await prisma.maintenanceSchedule.create({
        data: {
          buildingId: building.id,
          assetId: asset.id,
          title: 'בדיקת מעלית חודשית',
          description: 'בדיקת תקינות מעלית וארון פיקוד.',
          category: MaintenanceCategory.SAFETY,
          type: MaintenanceType.INSPECTION,
          frequency: 'MONTHLY',
          startDate: now,
          nextOccurrence: new Date(now.getFullYear(), now.getMonth() + 1, 5),
          assignedToId: tech2.id,
        },
      });

  const document = await prisma.document.findFirst({
    where: {
      buildingId: building.id,
      name: 'סיכום ועד הבית חנה רובינא 42.pdf',
    },
  });

  if (document) {
    await prisma.document.update({
      where: { id: document.id },
      data: {
        url: 'https://example.com/docs/rubina-42-committee-summary.pdf',
        category: 'committee',
        uploadedById: maya.id,
      },
    });
  } else {
    await prisma.document.create({
      data: {
        buildingId: building.id,
        name: 'סיכום ועד הבית חנה רובינא 42.pdf',
        url: 'https://example.com/docs/rubina-42-committee-summary.pdf',
        category: 'committee',
        uploadedById: maya.id,
      },
    });
  }

  for (const codeRecord of [
    { codeType: CodeType.ENTRANCE, description: 'לוח מקשים בכניסה הראשית', code: '4242' },
    { codeType: CodeType.ELEVATOR, description: 'מצב שירות למעלית', code: '4201' },
    { codeType: CodeType.WIFI, description: 'רשת ה-WiFi בלובי', code: 'Rubina42-Residents' },
  ]) {
    const existing = await prisma.buildingCode.findFirst({
      where: {
        buildingId: building.id,
        codeType: codeRecord.codeType,
        description: codeRecord.description,
      },
    });

    if (existing) {
      await prisma.buildingCode.update({
        where: { id: existing.id },
        data: {
          code: codeRecord.code,
          isActive: true,
          createdBy: maya.id,
        },
      });
    } else {
      await prisma.buildingCode.create({
        data: {
          buildingId: building.id,
          codeType: codeRecord.codeType,
          description: codeRecord.description,
          code: codeRecord.code,
          isActive: true,
          createdBy: maya.id,
        },
      });
    }
  }

  const createdOrUpdated: Array<{ email: string; unit: string; password: string }> = [];

  for (const [index, residentData] of rubinaResidents.entries()) {
    const user = await ensureUser(residentData.email, residentData.password, Role.RESIDENT, tenantId, residentData.phone);

    const existingResident = await prisma.resident.findFirst({
      where: { userId: user.id },
    });

    const resident = existingResident
      ? await prisma.resident.update({
          where: { id: existingResident.id },
          data: {
            autopayEnabled: residentData.autopayEnabled,
            autopayConsentAt: residentData.autopayEnabled ? previousMonthStart : null,
          },
        })
      : await prisma.resident.create({
          data: {
            userId: user.id,
            autopayEnabled: residentData.autopayEnabled,
            autopayConsentAt: residentData.autopayEnabled ? previousMonthStart : null,
          },
        });

    const existingUnit = await prisma.unit.findFirst({
      where: {
        buildingId: building.id,
        number: residentData.unitNumber,
      },
    });

    const unit = existingUnit
      ? await prisma.unit.update({
          where: { id: existingUnit.id },
          data: {
            floor: Math.ceil((index + 1) / 2),
            area: 92 + index * 3,
            bedrooms: index === rubinaResidents.length - 1 ? 4 : 3,
            bathrooms: 2,
            parkingSpaces: 1,
            isActive: true,
            residents: {
              set: [{ id: resident.id }],
            },
          },
        })
      : await prisma.unit.create({
          data: {
            buildingId: building.id,
            number: residentData.unitNumber,
            floor: Math.ceil((index + 1) / 2),
            area: 92 + index * 3,
            bedrooms: index === rubinaResidents.length - 1 ? 4 : 3,
            bathrooms: 2,
            parkingSpaces: 1,
            residents: {
              connect: [{ id: resident.id }],
            },
          },
        });

    const fullLabel = `${residentData.firstName} ${residentData.lastName} - ועד בית ${BUILDING_ADDRESS}`;

    for (const invoiceSeed of [
      {
        marker: 'rubina42-seed-current',
        createdAt: currentMonthStart,
        dueDate: new Date(now.getFullYear(), now.getMonth(), 10),
        status: index % 3 === 0 ? 'PAID' as const : 'UNPAID' as const,
        items: [{ description: fullLabel, quantity: 1, unitPrice: residentData.monthlyFee }],
      },
      {
        marker: 'rubina42-seed-previous',
        createdAt: previousMonthStart,
        dueDate: new Date(now.getFullYear(), now.getMonth() - 1, 10),
        status: index % 3 === 0 ? 'PAID' as const : 'UNPAID' as const,
        items: [{ description: `${fullLabel} - חודש קודם`, quantity: 1, unitPrice: residentData.monthlyFee }],
      },
    ]) {
      const existingInvoice = await prisma.invoice.findFirst({
        where: {
          residentId: resident.id,
          collectionNotes: invoiceSeed.marker,
        },
      });

      if (existingInvoice) {
        await prisma.invoice.update({
          where: { id: existingInvoice.id },
          data: {
            items: invoiceSeed.items as any,
            amount: residentData.monthlyFee,
            dueDate: invoiceSeed.dueDate,
            status: invoiceSeed.status,
            collectionNotes: invoiceSeed.marker,
          },
        });
      } else {
        await prisma.invoice.create({
          data: {
            residentId: resident.id,
            items: invoiceSeed.items as any,
            amount: residentData.monthlyFee,
            dueDate: invoiceSeed.dueDate,
            createdAt: invoiceSeed.createdAt,
            status: invoiceSeed.status,
            collectionNotes: invoiceSeed.marker,
          },
        });
      }
    }

    const recurring = await prisma.recurringInvoice.findFirst({
      where: {
        residentId: resident.id,
        title: 'ועד בית חודשי',
      },
    });

    if (recurring) {
      await prisma.recurringInvoice.update({
        where: { id: recurring.id },
        data: {
          items: [{ description: 'תשלום חודשי ועד בית', quantity: 1, unitPrice: residentData.monthlyFee }] as any,
          amount: residentData.monthlyFee,
          recurrence: 'monthly',
          autopayEnabled: residentData.autopayEnabled,
          dueDaysAfterIssue: 10,
          nextRunAt: new Date(now.getFullYear(), now.getMonth() + 1, 1),
          lastRunAt: currentMonthStart,
          active: true,
        },
      });
    } else {
      await prisma.recurringInvoice.create({
        data: {
          residentId: resident.id,
          title: 'ועד בית חודשי',
          items: [{ description: 'תשלום חודשי ועד בית', quantity: 1, unitPrice: residentData.monthlyFee }] as any,
          amount: residentData.monthlyFee,
          recurrence: 'monthly',
          autopayEnabled: residentData.autopayEnabled,
          dueDaysAfterIssue: 10,
          nextRunAt: new Date(now.getFullYear(), now.getMonth() + 1, 1),
          lastRunAt: currentMonthStart,
          active: true,
        },
      });
    }

    const existingMethod = await prisma.paymentMethod.findFirst({
      where: {
        residentId: resident.id,
        token: `rubina42_pm_${resident.id}`,
      },
    });

    if (existingMethod) {
      await prisma.paymentMethod.update({
        where: { id: existingMethod.id },
        data: {
          provider: 'tranzila',
          brand: index % 2 === 0 ? 'Visa' : 'Mastercard',
          last4: `${4242 + index}`.slice(-4),
          expMonth: 12,
          expYear: now.getFullYear() + 3,
          isDefault: true,
        },
      });
    } else {
      await prisma.paymentMethod.create({
        data: {
          residentId: resident.id,
          provider: 'tranzila',
          token: `rubina42_pm_${resident.id}`,
          brand: index % 2 === 0 ? 'Visa' : 'Mastercard',
          last4: `${4242 + index}`.slice(-4),
          expMonth: 12,
          expYear: now.getFullYear() + 3,
          isDefault: true,
        },
      });
    }

    const notifications = [
      {
        title: 'עדכון ועד בית רובינא 42',
        message: `חשבון ועד הבית ליחידה ${residentData.unitNumber} זמין באזור האישי.`,
        type: 'FINANCE',
      },
      {
        title: 'בדיקת מעלית מתוכננת',
        message: 'תתקיים בדיקת מעלית ביום ראשון הקרוב בין 09:00 ל-11:00.',
        type: 'MAINTENANCE',
      },
    ];

    for (const notification of notifications) {
      const existing = await prisma.notification.findFirst({
        where: {
          userId: user.id,
          buildingId: building.id,
          title: notification.title,
        },
      });

      if (existing) {
        await prisma.notification.update({
          where: { id: existing.id },
          data: {
            tenantId,
            message: notification.message,
            type: notification.type,
          },
        });
      } else {
        await prisma.notification.create({
          data: {
            tenantId,
            buildingId: building.id,
            userId: user.id,
            title: notification.title,
            message: notification.message,
            type: notification.type,
          },
        });
      }
    }

    const existingCommunication = await prisma.communication.findFirst({
      where: {
        buildingId: building.id,
        unitId: unit.id,
        recipientId: user.id,
        subject: `ברוכים הבאים לנתוני הבדיקה של יחידה ${residentData.unitNumber}`,
      },
    });

    if (existingCommunication) {
      await prisma.communication.update({
        where: { id: existingCommunication.id },
        data: {
          senderId: maya.id,
          maintenanceScheduleId: maintenanceSchedule.id,
          message: `נוצרו עבורך נתוני בדיקה מלאים עבור ${residentData.firstName} ${residentData.lastName}, כולל חיובים, מסמכים והתראות.`,
          channel: 'PORTAL',
        },
      });
    } else {
      await prisma.communication.create({
        data: {
          buildingId: building.id,
          unitId: unit.id,
          senderId: maya.id,
          recipientId: user.id,
          maintenanceScheduleId: maintenanceSchedule.id,
          subject: `ברוכים הבאים לנתוני הבדיקה של יחידה ${residentData.unitNumber}`,
          message: `נוצרו עבורך נתוני בדיקה מלאים עבור ${residentData.firstName} ${residentData.lastName}, כולל חיובים, מסמכים והתראות.`,
          channel: 'PORTAL',
        },
      });
    }

    createdOrUpdated.push({
      email: residentData.email,
      unit: residentData.unitNumber,
      password: residentData.password,
    });
  }

  console.log(`Rubina 42 upsert completed for building ${building.id}.`);
  console.table(createdOrUpdated);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
