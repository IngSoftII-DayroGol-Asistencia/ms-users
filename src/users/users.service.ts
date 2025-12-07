import { HttpException, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, UserProfile } from '@prisma/client';
import { CreateUserDto } from './dto/createUser.dto';


@Injectable()
export class UsersService {

  logger: Logger

  constructor(private readonly dataSource: PrismaService) {
    this.logger = new Logger(UsersService.name)
  }

  private errorHandler(error: any, message: string, code?: number) {
    this.logger.error(error);
    let codes = code || 400
    throw new HttpException(message, codes)
  }

  async user(data: string): Promise<UserProfile | null> {
    try {
      return await this.dataSource.userProfile.findUnique({
        where: {
          userId: data
        }
      })

    } catch (e) {
      this.errorHandler(e, "Error finding user", 400);
      return null
    }
  }

  async createUser(data: CreateUserDto, userId: string, phone?: string): Promise<UserProfile | null> {
    try {
      return await this.dataSource.userProfile.create({
        data: {
          userId: userId,
          firstName: data.firstName,
          lastName: data.lastName,
          ...(data.country !== undefined && { country: data.country }),
          ...(data.dateOfBirth !== undefined && { dateOfBirth: data.dateOfBirth }),
          ...(data.jobTitle !== undefined && { jobTitle: data.jobTitle }),
          ...(data.department !== undefined && { department: data.department }),
          ...(data.bio !== undefined && { bio: data.bio }),
          ...(data.profilePhotoUrl !== undefined && { profilePhotoUrl: data.profilePhotoUrl }),
          ...(data.profilePhotoKey !== undefined && { profilePhotoKey: data.profilePhotoKey }),
          ...(data.emergencyContact !== undefined && { emergencyContact: data.emergencyContact }),
          ...(data.emergencyPhone !== undefined && { emergencyPhone: data.emergencyPhone }),
          ...(data.city !== undefined && { city: data.city }),
          ...(data.address !== undefined && { address: data.address }),
          ...(data.postalCode !== undefined && { postalCode: data.postalCode }),
          ...(phone !== undefined && { phone: phone }),
        },
      });
    } catch (error) {
      this.errorHandler(error, "Error creating user");
      return null;
    }
  }

  async updateUser(params: {
    where: Prisma.UserProfileWhereUniqueInput; data: Prisma.UserProfileUpdateInput;
  }): Promise<UserProfile | null> {
    try {
      const { where, data } = params;
      return this.dataSource.userProfile.update({
        data,
        where,
      });
    } catch (error) {
      this.errorHandler(error, "Cannot update", 400);
      return null;
    }
  }

  async deleteUser(where: Prisma.UserProfileWhereUniqueInput): Promise<UserProfile | null> {
    try {
      return this.dataSource.userProfile.delete({
        where,
      })
    } catch (error) {
      this.errorHandler(error, "Cannot delete", 400);
      return null
    }
  }
}


