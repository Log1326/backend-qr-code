import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { Role, User, Organization, InviteToken } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class OrganizationService {
  constructor(private readonly prisma: PrismaService) {}

  async createOrganization(
    orgName: string,
    superUserEmail: string,
    superUserPassword: string,
    superUserName: string,
  ): Promise<Organization> {
    return this.prisma.$transaction(async (prisma) => {
      const existingOrg = await prisma.organization.findUnique({
        where: { name: orgName },
      });
      if (existingOrg)
        throw new ForbiddenException('Organization name already exists');

      const organization = await prisma.organization.create({
        data: { name: orgName },
      });

      const hashedPassword = await bcrypt.hash(superUserPassword, 10);

      await prisma.user.create({
        data: {
          email: superUserEmail,
          password: hashedPassword,
          name: superUserName,
          role: Role.SUPERUSER,
          provider: 'EMAIL',
          organizationId: organization.id,
        },
      });

      return organization;
    });
  }

  async getUsersByOrganization(orgId: string): Promise<User[]> {
    const users = await this.prisma.user.findMany({
      where: { organizationId: orgId },
    });
    return users;
  }

  async createInvite(
    orgId: string,
    email: string,
    role: Role,
    expiresInDays = 7,
  ): Promise<InviteToken> {
    const token = uuidv4();

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    return this.prisma.inviteToken.create({
      data: {
        email,
        organizationId: orgId,
        role,
        token,
        expiresAt,
      },
    });
  }

  async removeUserFromOrganization(
    userId: string,
    orgId: string,
  ): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.organizationId !== orgId) {
      throw new NotFoundException('User not found in this organization');
    }
    await this.prisma.user.update({
      where: { id: userId },
      data: { organizationId: null },
    });
  }

  async validateInvite(token: string): Promise<InviteToken> {
    const invite = await this.prisma.inviteToken.findUnique({
      where: { token },
    });
    if (!invite || invite.accepted || invite.expiresAt < new Date()) {
      throw new ForbiddenException('Invalid or expired invite');
    }
    return invite;
  }
  async markInviteAccepted(token: string): Promise<void> {
    await this.prisma.inviteToken.update({
      where: { token },
      data: { accepted: true },
    });
  }
}
