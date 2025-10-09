import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateVoteDto, CastVoteDto, UpdateVoteDto } from './dto/vote.dto';
import { Vote, VoteType, Role } from '@prisma/client';

@Injectable()
export class VoteService {
  constructor(private prisma: PrismaService) {}

  async createVote(dto: CreateVoteDto, creatorId: number): Promise<Vote> {
    // Verify user belongs to building
    const user = await this.prisma.user.findUnique({
      where: { id: creatorId },
      include: { resident: { include: { units: true } } },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if user is admin/pm or belongs to building
    const belongsToBuilding = user.resident?.units.some(
      unit => unit.buildingId === dto.buildingId
    );

    if (!belongsToBuilding && user.role !== Role.ADMIN && user.role !== Role.PM) {
      throw new ForbiddenException('You do not have permission to create votes for this building');
    }

    // Create vote with options if multiple choice
    const voteData: any = {
      buildingId: dto.buildingId,
      title: dto.title,
      description: dto.description,
      question: dto.question,
      voteType: dto.voteType,
      endDate: new Date(dto.endDate),
      requireAllVotes: dto.requireAllVotes || false,
      createdBy: creatorId,
    };

    if (dto.voteType === VoteType.MULTIPLE_CHOICE && dto.options && dto.options.length > 0) {
      voteData.options = {
        create: dto.options.map((text, index) => ({
          optionText: text,
          order: index,
        })),
      };
    }

    return this.prisma.vote.create({
      data: voteData,
      include: {
        options: true,
        creator: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });
  }

  async getVotesByBuilding(buildingId: number, userId: number) {
    const votes = await this.prisma.vote.findMany({
      where: { buildingId },
      include: {
        options: true,
        creator: {
          select: {
            id: true,
            email: true,
          },
        },
        responses: {
          where: { userId },
          select: { id: true, votedAt: true },
        },
        _count: {
          select: { responses: true },
        },
      },
      orderBy: [
        { isActive: 'desc' },
        { endDate: 'asc' },
      ],
    });

    return votes.map(vote => ({
      ...vote,
      userHasVoted: vote.responses.length > 0,
      responseCount: vote._count.responses,
    }));
  }

  async getVoteDetails(voteId: number, userId: number) {
    const vote = await this.prisma.vote.findUnique({
      where: { id: voteId },
      include: {
        options: {
          orderBy: { order: 'asc' },
        },
        creator: {
          select: {
            id: true,
            email: true,
          },
        },
        responses: {
          where: { userId },
          include: {
            option: true,
          },
        },
        _count: {
          select: { responses: true },
        },
      },
    });

    if (!vote) {
      throw new NotFoundException('Vote not found');
    }

    return {
      ...vote,
      userHasVoted: vote.responses.length > 0,
      userResponse: vote.responses[0] || null,
      responseCount: vote._count.responses,
    };
  }

  async castVote(voteId: number, userId: number, dto: CastVoteDto) {
    // Check if vote exists and is active
    const vote = await this.prisma.vote.findUnique({
      where: { id: voteId },
    });

    if (!vote) {
      throw new NotFoundException('Vote not found');
    }

    if (!vote.isActive || vote.isClosed) {
      throw new BadRequestException('This vote is closed');
    }

    if (new Date(vote.endDate) < new Date()) {
      throw new BadRequestException('Voting deadline has passed');
    }

    // Check if user already voted
    const existingResponse = await this.prisma.voteResponse.findUnique({
      where: {
        voteId_userId: {
          voteId,
          userId,
        },
      },
    });

    if (existingResponse) {
      throw new BadRequestException('You have already voted');
    }

    // Validate vote data based on type
    if (vote.voteType === VoteType.YES_NO && dto.response === undefined) {
      throw new BadRequestException('Response is required for yes/no votes');
    }

    if (vote.voteType === VoteType.MULTIPLE_CHOICE && !dto.optionId) {
      throw new BadRequestException('Option selection is required for multiple choice votes');
    }

    if (vote.voteType === VoteType.RATING && (!dto.rating || dto.rating < 1 || dto.rating > 5)) {
      throw new BadRequestException('Rating must be between 1 and 5');
    }

    // Cast vote
    return this.prisma.voteResponse.create({
      data: {
        voteId,
        userId,
        optionId: dto.optionId,
        response: dto.response,
        rating: dto.rating,
        comment: dto.comment,
      },
      include: {
        option: true,
        user: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });
  }

  async closeVote(voteId: number, userId: number) {
    const vote = await this.prisma.vote.findUnique({
      where: { id: voteId },
    });

    if (!vote) {
      throw new NotFoundException('Vote not found');
    }

    // Check permissions (only creator, admin, or PM can close)
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (vote.createdBy !== userId && user?.role !== Role.ADMIN && user?.role !== Role.PM) {
      throw new ForbiddenException('You do not have permission to close this vote');
    }

    // Calculate and cache results
    const results = await this.getVoteResults(voteId);

    return this.prisma.vote.update({
      where: { id: voteId },
      data: {
        isClosed: true,
        isActive: false,
        results: results as any,
      },
    });
  }

  async getVoteResults(voteId: number) {
    const vote = await this.prisma.vote.findUnique({
      where: { id: voteId },
      include: {
        options: true,
        responses: {
          include: {
            option: true,
          },
        },
        building: {
          include: {
            units: {
              include: {
                residents: true,
              },
            },
          },
        },
      },
    });

    if (!vote) {
      throw new NotFoundException('Vote not found');
    }

    const totalEligibleVoters = vote.building.units.reduce(
      (count, unit) => count + unit.residents.length,
      0
    );
    const totalResponses = vote.responses.length;
    const participationRate = totalEligibleVoters > 0
      ? (totalResponses / totalEligibleVoters) * 100
      : 0;

    let breakdown: any = {};

    if (vote.voteType === VoteType.YES_NO) {
      const yesCount = vote.responses.filter(r => r.response === true).length;
      const noCount = vote.responses.filter(r => r.response === false).length;
      breakdown = {
        yes: { count: yesCount, percentage: totalResponses > 0 ? (yesCount / totalResponses) * 100 : 0 },
        no: { count: noCount, percentage: totalResponses > 0 ? (noCount / totalResponses) * 100 : 0 },
      };
    } else if (vote.voteType === VoteType.MULTIPLE_CHOICE) {
      breakdown = vote.options.map(option => {
        const count = vote.responses.filter(r => r.optionId === option.id).length;
        return {
          optionId: option.id,
          optionText: option.optionText,
          count,
          percentage: totalResponses > 0 ? (count / totalResponses) * 100 : 0,
        };
      });
    } else if (vote.voteType === VoteType.RATING) {
      const ratings = vote.responses.filter(r => r.rating !== null).map(r => r.rating!);
      const averageRating = ratings.length > 0
        ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length
        : 0;
      breakdown = {
        averageRating,
        distribution: [1, 2, 3, 4, 5].map(rating => ({
          rating,
          count: ratings.filter(r => r === rating).length,
        })),
      };
    }

    return {
      totalEligibleVoters,
      totalResponses,
      participationRate,
      breakdown,
      comments: vote.responses.filter(r => r.comment).map(r => ({
        userId: r.userId,
        comment: r.comment,
        votedAt: r.votedAt,
      })),
    };
  }

  async checkAndCloseExpiredVotes() {
    const expiredVotes = await this.prisma.vote.findMany({
      where: {
        isActive: true,
        isClosed: false,
        endDate: {
          lt: new Date(),
        },
      },
    });

    for (const vote of expiredVotes) {
      const results = await this.getVoteResults(vote.id);
      await this.prisma.vote.update({
        where: { id: vote.id },
        data: {
          isClosed: true,
          isActive: false,
          results: results as any,
        },
      });
    }

    return expiredVotes.length;
  }

  async deleteVote(voteId: number, userId: number) {
    const vote = await this.prisma.vote.findUnique({
      where: { id: voteId },
    });

    if (!vote) {
      throw new NotFoundException('Vote not found');
    }

    // Check permissions
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (vote.createdBy !== userId && user?.role !== Role.ADMIN && user?.role !== Role.PM) {
      throw new ForbiddenException('You do not have permission to delete this vote');
    }

    return this.prisma.vote.delete({
      where: { id: voteId },
    });
  }
}

