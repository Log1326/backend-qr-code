import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Role, User, Organization, InviteToken } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { hashPassword } from 'src/common/crypto';
import { CreateOrganizationDto } from './dto/create-organization.dto';

@Injectable()
export class OrganizationService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    dto: CreateOrganizationDto,
  ): Promise<{ organization: Organization; user: User }> {
    const { email, organizationName, name, password } = dto;

    return this.prisma.$transaction(async (prisma) => {
      const existingOrg = await prisma.organization.findUnique({
        where: { name: organizationName },
      });
      if (existingOrg)
        throw new ForbiddenException('Organization name already exists');

      const existingUser = await prisma.user.findUnique({
        where: { email: email },
      });
      if (existingUser)
        throw new ForbiddenException('User with this email already exists');

      const organization = await prisma.organization.create({
        data: { name: organizationName },
      });

      const hashedPassword = await hashPassword(password);

      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
          role: Role.SUPERUSER,
          provider: 'EMAIL',
          organizationId: organization.id,
        },
      });

      return { organization, user };
    });
  }

  async getUsersByOrganization(orgId: string): Promise<User[]> {
    return this.prisma.user.findMany({
      where: { organizationId: orgId },
    });
  }

  async createInvite(
    orgId: string,
    email: string,
    role: Role,
    invitedByUserId: string,
    expiresInDays = 3,
  ): Promise<InviteToken> {
    const inviter = await this.prisma.user.findUnique({
      where: { id: invitedByUserId },
    });
    if (!inviter || inviter.organizationId !== orgId) {
      throw new ForbiddenException('Inviter not in this organization');
    }

    const allowedRoles: Role[] = [Role.SUPERUSER, Role.ADMIN];
    if (!allowedRoles.includes(inviter.role)) {
      throw new ForbiddenException('Only SUPERUSER or ADMIN can invite users');
    }

    if (role === Role.SUPERUSER) {
      const existingSuperUser = await this.prisma.user.findFirst({
        where: { organizationId: orgId, role: Role.SUPERUSER },
      });
      if (existingSuperUser) {
        throw new ForbiddenException('Organization already has a SUPERUSER');
      }
    }

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });
    if (existingUser) {
      throw new ForbiddenException('User with this email already exists');
    }

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

  async registerUserByInvite(data: {
    name: string;
    password: string;
    token: string;
  }): Promise<User> {
    const invite = await this.prisma.inviteToken.findUnique({
      where: { token: data.token },
    });

    if (!invite || invite.accepted || invite.expiresAt < new Date()) {
      throw new ForbiddenException('Invalid or expired invite');
    }

    const existingUser = await this.prisma.user.findUnique({
      where: { email: invite.email },
    });
    if (existingUser) {
      throw new ForbiddenException('User with this email already exists');
    }

    const hashedPassword = await hashPassword(data.password);

    const user = await this.prisma.user.create({
      data: {
        email: invite.email,
        name: data.name,
        password: hashedPassword,
        role: invite.role,
        organizationId: invite.organizationId,
        provider: 'EMAIL',
      },
    });

    await this.prisma.inviteToken.update({
      where: { token: data.token },
      data: { accepted: true },
    });

    return user;
  }
  async getInviteInfo(
    token: string,
  ): Promise<Pick<InviteToken, 'email' | 'role'>> {
    const invite = await this.prisma.inviteToken.findUnique({
      where: { token },
      select: {
        email: true,
        role: true,
        accepted: true,
        expiresAt: true,
      },
    });

    if (!invite || invite.accepted || invite.expiresAt < new Date()) {
      throw new ForbiddenException('Invalid or expired invite');
    }

    return { email: invite.email, role: invite.role };
  }
  async changeUserRole(
    targetUserId: string,
    newRole: Role,
    changedByUserId: string,
  ): Promise<User> {
    const targetUser = await this.prisma.user.findUnique({
      where: { id: targetUserId },
    });
    if (!targetUser) throw new NotFoundException('User not found');

    const changedByUser = await this.prisma.user.findUnique({
      where: { id: changedByUserId },
    });
    if (!changedByUser) throw new ForbiddenException('Changer user not found');

    if (targetUser.organizationId !== changedByUser.organizationId) {
      throw new ForbiddenException('Users belong to different organizations');
    }

    if (targetUser.role === Role.SUPERUSER && newRole !== Role.SUPERUSER) {
      throw new ForbiddenException('Cannot change role of SUPERUSER');
    }

    if (newRole === Role.SUPERUSER) {
      const existingSuperUser = await this.prisma.user.findFirst({
        where: {
          organizationId: targetUser.organizationId,
          role: Role.SUPERUSER,
        },
      });
      if (existingSuperUser && existingSuperUser.id !== targetUserId) {
        throw new ForbiddenException('Organization already has a SUPERUSER');
      }
    }

    await this.prisma.userEvent.create({
      data: {
        userId: targetUser.id,
        changedById: changedByUser.id,
        oldRole: targetUser.role,
        newRole,
      },
    });

    return this.prisma.user.update({
      where: { id: targetUserId },
      data: { role: newRole },
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
