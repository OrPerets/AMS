import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateScheduleDto, UpdateScheduleDto, CreateTaskDto, UpdateTaskDto } from './dto/schedule.dto';
import { WorkSchedule, ScheduledTask, ScheduleStatus, TaskStatus, Role } from '@prisma/client';

@Injectable()
export class ScheduleService {
  constructor(private prisma: PrismaService) {}

  async createSchedule(dto: CreateScheduleDto, creatorId: number): Promise<WorkSchedule> {
    // Create schedule with tasks
    return this.prisma.workSchedule.create({
      data: {
        date: new Date(dto.date),
        buildingId: dto.buildingId,
        title: dto.title,
        description: dto.description,
        createdBy: creatorId,
        tasks: {
          create: dto.tasks.map((task, index) => ({
            assignedTo: task.assignedTo,
            taskType: task.taskType,
            title: task.title,
            description: task.description,
            location: task.location,
            estimatedTime: task.estimatedTime,
            priority: task.priority,
            startTime: task.startTime ? new Date(task.startTime) : null,
            endTime: task.endTime ? new Date(task.endTime) : null,
            ticketId: task.ticketId,
            workOrderId: task.workOrderId,
            order: index,
          })),
        },
      },
      include: {
        tasks: {
          include: {
            assignee: {
              select: {
                id: true,
                email: true,
              },
            },
            ticket: true,
            workOrder: true,
          },
          orderBy: { order: 'asc' },
        },
        creator: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });
  }

  async getSchedule(scheduleId: number) {
    const schedule = await this.prisma.workSchedule.findUnique({
      where: { id: scheduleId },
      include: {
        tasks: {
          include: {
            assignee: {
              select: {
                id: true,
                email: true,
              },
            },
            ticket: true,
            workOrder: true,
          },
          orderBy: { order: 'asc' },
        },
        creator: {
          select: {
            id: true,
            email: true,
          },
        },
        building: true,
      },
    });

    if (!schedule) {
      throw new NotFoundException('Schedule not found');
    }

    return schedule;
  }

  async getSchedulesByDate(date: Date, buildingId?: number) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return this.prisma.workSchedule.findMany({
      where: {
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
        ...(buildingId && { buildingId }),
      },
      include: {
        tasks: {
          include: {
            assignee: {
              select: {
                id: true,
                email: true,
              },
            },
          },
          orderBy: { order: 'asc' },
        },
        creator: {
          select: {
            id: true,
            email: true,
          },
        },
        building: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getSchedulesByDateRange(startDate: Date, endDate: Date, buildingId?: number) {
    return this.prisma.workSchedule.findMany({
      where: {
        date: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
        ...(buildingId && { buildingId }),
      },
      include: {
        tasks: {
          include: {
            assignee: {
              select: {
                id: true,
                email: true,
              },
            },
          },
        },
        building: true,
      },
      orderBy: { date: 'asc' },
    });
  }

  async getMySchedules(userId: number, date?: Date) {
    const dateFilter = date
      ? {
          date: {
            gte: new Date(new Date(date).setHours(0, 0, 0, 0)),
            lte: new Date(new Date(date).setHours(23, 59, 59, 999)),
          },
        }
      : {};

    return this.prisma.workSchedule.findMany({
      where: {
        ...dateFilter,
        tasks: {
          some: {
            assignedTo: userId,
          },
        },
      },
      include: {
        tasks: {
          where: {
            assignedTo: userId,
          },
          include: {
            ticket: true,
            workOrder: true,
          },
          orderBy: { order: 'asc' },
        },
        building: true,
      },
      orderBy: { date: 'asc' },
    });
  }

  async updateSchedule(scheduleId: number, dto: UpdateScheduleDto) {
    const schedule = await this.prisma.workSchedule.findUnique({
      where: { id: scheduleId },
    });

    if (!schedule) {
      throw new NotFoundException('Schedule not found');
    }

    return this.prisma.workSchedule.update({
      where: { id: scheduleId },
      data: {
        date: dto.date ? new Date(dto.date) : undefined,
        title: dto.title,
        description: dto.description,
        status: dto.status,
      },
      include: {
        tasks: {
          include: {
            assignee: {
              select: {
                id: true,
                email: true,
              },
            },
          },
          orderBy: { order: 'asc' },
        },
      },
    });
  }

  async deleteSchedule(scheduleId: number, userId: number) {
    const schedule = await this.prisma.workSchedule.findUnique({
      where: { id: scheduleId },
    });

    if (!schedule) {
      throw new NotFoundException('Schedule not found');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (schedule.createdBy !== userId && user?.role !== Role.ADMIN && user?.role !== Role.PM) {
      throw new ForbiddenException('You do not have permission to delete this schedule');
    }

    return this.prisma.workSchedule.delete({
      where: { id: scheduleId },
    });
  }

  async publishSchedule(scheduleId: number) {
    const schedule = await this.prisma.workSchedule.findUnique({
      where: { id: scheduleId },
    });

    if (!schedule) {
      throw new NotFoundException('Schedule not found');
    }

    return this.prisma.workSchedule.update({
      where: { id: scheduleId },
      data: {
        status: ScheduleStatus.PUBLISHED,
        publishedAt: new Date(),
      },
    });
  }

  // Task Management Methods

  async addTask(scheduleId: number, dto: CreateTaskDto) {
    const schedule = await this.prisma.workSchedule.findUnique({
      where: { id: scheduleId },
      include: { tasks: true },
    });

    if (!schedule) {
      throw new NotFoundException('Schedule not found');
    }

    const maxOrder = schedule.tasks.length > 0
      ? Math.max(...schedule.tasks.map(t => t.order))
      : -1;

    return this.prisma.scheduledTask.create({
      data: {
        scheduleId,
        assignedTo: dto.assignedTo,
        taskType: dto.taskType,
        title: dto.title,
        description: dto.description,
        location: dto.location,
        estimatedTime: dto.estimatedTime,
        priority: dto.priority,
        startTime: dto.startTime ? new Date(dto.startTime) : null,
        endTime: dto.endTime ? new Date(dto.endTime) : null,
        ticketId: dto.ticketId,
        workOrderId: dto.workOrderId,
        order: maxOrder + 1,
      },
      include: {
        assignee: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });
  }

  async updateTask(taskId: number, dto: UpdateTaskDto) {
    const task = await this.prisma.scheduledTask.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    return this.prisma.scheduledTask.update({
      where: { id: taskId },
      data: {
        title: dto.title,
        description: dto.description,
        assignedTo: dto.assignedTo,
        status: dto.status,
        priority: dto.priority,
        startTime: dto.startTime ? new Date(dto.startTime) : undefined,
        endTime: dto.endTime ? new Date(dto.endTime) : undefined,
        notes: dto.notes,
      },
      include: {
        assignee: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });
  }

  async deleteTask(taskId: number) {
    const task = await this.prisma.scheduledTask.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    return this.prisma.scheduledTask.delete({
      where: { id: taskId },
    });
  }

  async startTask(taskId: number, userId: number) {
    const task = await this.prisma.scheduledTask.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    if (task.assignedTo && task.assignedTo !== userId) {
      throw new ForbiddenException('This task is not assigned to you');
    }

    if (task.status === TaskStatus.COMPLETED) {
      throw new BadRequestException('Task is already completed');
    }

    return this.prisma.scheduledTask.update({
      where: { id: taskId },
      data: {
        status: TaskStatus.IN_PROGRESS,
        actualStart: new Date(),
      },
    });
  }

  async completeTask(taskId: number, userId: number, notes?: string) {
    const task = await this.prisma.scheduledTask.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    if (task.assignedTo && task.assignedTo !== userId) {
      throw new ForbiddenException('This task is not assigned to you');
    }

    return this.prisma.scheduledTask.update({
      where: { id: taskId },
      data: {
        status: TaskStatus.COMPLETED,
        actualEnd: new Date(),
        notes: notes || task.notes,
      },
    });
  }

  async getScheduleProgress(scheduleId: number) {
    const schedule = await this.prisma.workSchedule.findUnique({
      where: { id: scheduleId },
      include: {
        tasks: true,
      },
    });

    if (!schedule) {
      throw new NotFoundException('Schedule not found');
    }

    const totalTasks = schedule.tasks.length;
    const completedTasks = schedule.tasks.filter(t => t.status === TaskStatus.COMPLETED).length;
    const inProgressTasks = schedule.tasks.filter(t => t.status === TaskStatus.IN_PROGRESS).length;
    const pendingTasks = schedule.tasks.filter(t => t.status === TaskStatus.PENDING).length;

    return {
      totalTasks,
      completedTasks,
      inProgressTasks,
      pendingTasks,
      completionPercentage: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0,
    };
  }
}

