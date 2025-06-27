import { CacheInterceptor } from '@nestjs/cache-manager';
import { Injectable, ExecutionContext } from '@nestjs/common';
import { User } from '@prisma/client';

interface RequestWithUser extends Request {
  user: User;
}

@Injectable()
export class UserCacheInterceptor extends CacheInterceptor {
  trackBy(context: ExecutionContext): string | undefined {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const userId = request.user?.id;
    return userId ? `user-profile-${userId}` : undefined;
  }
}
