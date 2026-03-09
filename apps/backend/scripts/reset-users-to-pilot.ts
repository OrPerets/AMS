import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const RUBINA_42_ADDRESS = 'חנה רובינא 42, הרצליה';
const RUBINA_UNIT_NUMBER = '101';

type DesiredUser = {
  key: 'master' | 'amit' | 'maya' | 'robert' | 'omer' | 'or';
  currentEmails: string[];
  targetEmail: string;
  role: Role;
  password: string;
  phone?: string | null;
};

const desiredUsers: DesiredUser[] = [
  {
    key: 'master',
    currentEmails: ['master@demo.com'],
    targetEmail: 'master@demo.com',
    role: Role.MASTER,
    password: 'master123',
  },
  {
    key: 'amit',
    currentEmails: ['amit@amit-ex.net', 'amit.magen@demo.com'],
    targetEmail: 'amit@amit-ex.net',
    role: Role.ADMIN,
    password: 'password123',
  },
  {
    key: 'maya',
    currentEmails: ['office@amit-ex.net', 'maya@demo.com'],
    targetEmail: 'office@amit-ex.net',
    role: Role.ADMIN,
    password: 'password123',
  },
  {
    key: 'robert',
    currentEmails: ['office1@amit-ex.net', 'tech2@demo.com'],
    targetEmail: 'office1@amit-ex.net',
    role: Role.TECH,
    password: 'password123',
  },
  {
    key: 'omer',
    currentEmails: ['omerdor0@gmail.com', 'or.peretz@demo.com'],
    targetEmail: 'omerdor0@gmail.com',
    role: Role.PM,
    password: 'password123',
  },
  {
    key: 'or',
    currentEmails: ['orperets11@gmail.com', 'zagayer@gmail.com'],
    targetEmail: 'orperets11@gmail.com',
    role: Role.RESIDENT,
    password: 'password123',
  },
];

async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

async function main() {
  const users = await prisma.user.findMany({
    include: {
      resident: true,
    },
  });

  const claimedIds = new Set<number>();
  const selected = new Map<DesiredUser['key'], (typeof users)[number]>();

  for (const desired of desiredUsers) {
    const match = users.find(
      (user) => !claimedIds.has(user.id) && desired.currentEmails.includes(user.email),
    );

    if (!match) {
      throw new Error(`Could not find an existing source user for ${desired.key}. Expected one of: ${desired.currentEmails.join(', ')}`);
    }

    claimedIds.add(match.id);
    selected.set(desired.key, match);
  }

  const master = selected.get('master');
  const amit = selected.get('amit');
  const maya = selected.get('maya');
  const robert = selected.get('robert');
  const omer = selected.get('omer');
  const orUser = selected.get('or');

  if (!master || !amit || !maya || !robert || !omer || !orUser) {
    throw new Error('Failed to resolve all required users.');
  }

  const keepUserIds = [master.id, amit.id, maya.id, robert.id, omer.id, orUser.id];
  const deleteUsers = users.filter((user) => !keepUserIds.includes(user.id));
  const deleteUserIds = deleteUsers.map((user) => user.id);

  const deleteResidents = await prisma.resident.findMany({
    where: {
      userId: {
        in: deleteUserIds,
      },
    },
    select: {
      id: true,
      userId: true,
    },
  });
  const deleteResidentIds = deleteResidents.map((resident) => resident.id);

  const rubinaBuilding = await prisma.building.findFirst({
    where: { address: RUBINA_42_ADDRESS },
    select: { id: true },
  });

  if (!rubinaBuilding) {
    throw new Error(`Could not find building ${RUBINA_42_ADDRESS}.`);
  }

  const rubinaUnit = await prisma.unit.findFirst({
    where: {
      buildingId: rubinaBuilding.id,
      number: RUBINA_UNIT_NUMBER,
    },
    select: { id: true },
  });

  if (!rubinaUnit) {
    throw new Error(`Could not find unit ${RUBINA_UNIT_NUMBER} in ${RUBINA_42_ADDRESS}.`);
  }

  const desiredById = new Map<number, DesiredUser>(
    desiredUsers.map((desired) => {
      const resolved = selected.get(desired.key);
      if (!resolved) {
        throw new Error(`Missing selected user for ${desired.key}.`);
      }
      return [resolved.id, desired];
    }),
  );

  const passwordHashes = new Map<string, string>();
  for (const desired of desiredUsers) {
    passwordHashes.set(desired.key, await hashPassword(desired.password));
  }

  await prisma.$transaction(async (tx) => {
    for (const [userId, desired] of desiredById.entries()) {
      await tx.user.update({
        where: { id: userId },
        data: {
          email: desired.targetEmail,
          role: desired.role,
          passwordHash: passwordHashes.get(desired.key)!,
          phone: desired.phone ?? undefined,
          refreshTokenHash: null,
        },
      });
    }

    await tx.voteResponse.deleteMany();
    await tx.voteOption.deleteMany();
    await tx.vote.deleteMany();
    await tx.scheduledTask.deleteMany();
    await tx.workSchedule.deleteMany();
    await tx.ticketComment.deleteMany();
    await tx.communication.deleteMany();
    await tx.notification.deleteMany();
    await tx.maintenanceTeamMember.deleteMany();
    await tx.maintenanceHistory.deleteMany();
    await tx.approvalTask.deleteMany();
    await tx.activityLog.deleteMany();
    await tx.impersonationEvent.deleteMany();
    await tx.documentShare.deleteMany();
    await tx.webhookEvent.deleteMany();

    if (deleteResidentIds.length > 0) {
      await tx.refund.deleteMany({
        where: {
          paymentIntent: {
            invoice: {
              residentId: {
                in: deleteResidentIds,
              },
            },
          },
        },
      });
      await tx.providerTransaction.deleteMany({
        where: {
          paymentIntent: {
            invoice: {
              residentId: {
                in: deleteResidentIds,
              },
            },
          },
        },
      });
      await tx.ledgerEntry.deleteMany({
        where: {
          OR: [
            {
              invoice: {
                residentId: {
                  in: deleteResidentIds,
                },
              },
            },
            {
              paymentIntent: {
                invoice: {
                  residentId: {
                    in: deleteResidentIds,
                  },
                },
              },
            },
          ],
        },
      });
      await tx.paymentIntent.deleteMany({
        where: {
          invoice: {
            residentId: {
              in: deleteResidentIds,
            },
          },
        },
      });
      await tx.paymentMethod.deleteMany({
        where: {
          residentId: {
            in: deleteResidentIds,
          },
        },
      });
      await tx.recurringInvoice.deleteMany({
        where: {
          residentId: {
            in: deleteResidentIds,
          },
        },
      });
      await tx.invoice.deleteMany({
        where: {
          residentId: {
            in: deleteResidentIds,
          },
        },
      });
    }

    if (deleteUserIds.length > 0) {
      await tx.ticket.updateMany({
        where: {
          assignedToId: {
            in: deleteUserIds,
          },
        },
        data: {
          assignedToId: null,
        },
      });
      await tx.maintenanceSchedule.updateMany({
        where: {
          OR: [
            {
              assignedToId: {
                in: deleteUserIds,
              },
            },
            {
              verifiedById: {
                in: deleteUserIds,
              },
            },
          ],
        },
        data: {
          assignedToId: null,
          verifiedById: null,
          verifiedAt: null,
          completionVerified: false,
        },
      });
      await tx.document.updateMany({
        where: {
          uploadedById: {
            in: deleteUserIds,
          },
        },
        data: {
          uploadedById: maya.id,
        },
      });
      await tx.buildingCode.updateMany({
        where: {
          createdBy: {
            in: deleteUserIds,
          },
        },
        data: {
          createdBy: maya.id,
        },
      });
      await tx.contract.updateMany({
        where: {
          ownerUserId: {
            in: deleteUserIds,
          },
        },
        data: {
          ownerUserId: omer.id,
        },
      });
      await tx.expense.updateMany({
        where: {
          approvedById: {
            in: deleteUserIds,
          },
        },
        data: {
          approvedById: null,
          approvedAt: null,
          status: 'PENDING',
        },
      });
      await tx.workOrder.updateMany({
        where: {
          approvedById: {
            in: deleteUserIds,
          },
        },
        data: {
          approvedById: null,
          approvedAt: null,
          status: 'PENDING',
        },
      });
      await tx.supplier.updateMany({
        where: {
          userId: {
            in: deleteUserIds,
          },
        },
        data: {
          userId: null,
        },
      });
    }

    if (deleteResidentIds.length > 0) {
      await tx.resident.deleteMany({
        where: {
          id: {
            in: deleteResidentIds,
          },
        },
      });
    }

    if (deleteUserIds.length > 0) {
      await tx.user.deleteMany({
        where: {
          id: {
            in: deleteUserIds,
          },
        },
      });
    }

    const orResident = await tx.resident.upsert({
      where: { userId: orUser.id },
      update: {
        autopayEnabled: true,
        autopayConsentAt: new Date(),
      },
      create: {
        userId: orUser.id,
        autopayEnabled: true,
        autopayConsentAt: new Date(),
      },
    });

    await tx.unit.update({
      where: { id: rubinaUnit.id },
      data: {
        residents: {
          set: [{ id: orResident.id }],
        },
      },
    });

    await tx.maintenanceSchedule.updateMany({
      data: {
        assignedToId: robert.id,
      },
    });

    await tx.document.updateMany({
      data: {
        uploadedById: maya.id,
      },
    });

    await tx.buildingCode.updateMany({
      data: {
        createdBy: maya.id,
      },
    });

    await tx.notification.create({
      data: {
        tenantId: 1,
        buildingId: rubinaBuilding.id,
        userId: orUser.id,
        title: 'חשבון משתמש עודכן',
        message: 'משתמש הבדיקה של Or מוכן עבור חנה רובינא 42.',
        type: 'SYSTEM',
      },
    });

    await tx.communication.create({
      data: {
        buildingId: rubinaBuilding.id,
        unitId: rubinaUnit.id,
        senderId: maya.id,
        recipientId: orUser.id,
        subject: 'ברוך הבא לסביבת הבדיקה',
        message: 'המערכת עודכנה כך שתכלול רק את משתמשי הפיילוט הנדרשים.',
        channel: 'PORTAL',
      },
    });
  }, {
    maxWait: 30_000,
    timeout: 60_000,
  });

  const finalUsers = await prisma.user.findMany({
    orderBy: { id: 'asc' },
    select: {
      id: true,
      email: true,
      role: true,
    },
  });

  console.log('Pilot user reset complete.');
  console.table(finalUsers);
  console.log('Passwords: master@demo.com -> master123; all other users -> password123');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
