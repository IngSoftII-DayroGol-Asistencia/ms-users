import { Controller, Get, HttpCode, HttpStatus, UseGuards, Param } from '@nestjs/common';
import { ApiBearerAuth, ApiResponse, ApiSecurity } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { AccessTokenGuard } from 'src/auth/guards/access-token.guard';

@UseGuards(AccessTokenGuard)
@ApiBearerAuth('Bearer')
@Controller('users')
export class UsersController {

  constructor(private readonly userService: UsersService) { }

  @Get(':id')
  @ApiResponse({ status: HttpStatus.OK, description: "Get an user by ID" })
  @HttpCode(HttpStatus.OK)
  getUser(@Param('id') id: string) {
    return this.userService.user(id)
  }

}
