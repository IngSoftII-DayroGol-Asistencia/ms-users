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
          country: data.country,
          userId: userId,
          firstName: data.firstName,
          lastName: data.lastName,
          dateOfBirth: data.dateOfBirth,
          jobTitle: data.jobTitle,
          department: data.department,
          bio: data.bio,
          profilePhotoUrl: data.profilePhotoUrl,
          profilePhotoKey: data.profilePhotoKey,
          emergencyContact: data.emergencyContact,
          emergencyPhone: data.emergencyPhone,
          city: data.city,
          address: data.address,
          postalCode: data.postalCode,
          phone: phone
        },
      })
    } catch (error) {
      this.errorHandler(error, "Error creating user");
      return null
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


