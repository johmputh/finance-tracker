import { Body, Controller, Get, HttpCode, HttpStatus, Patch, Post, UseGuards } from "@nestjs/common";
import { ChangePasswordDto, LoginDto, RegisterDto, UpdateProfileDto, UserResponse } from "@finance-tracker/shared";
import { AuthService } from "./auth.service";
import { CurrentUser } from "./current-user.decorator";
import { JwtAuthGuard } from "./jwt-auth.guard";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("register")
  register(@Body() dto: RegisterDto): Promise<UserResponse> {
    return this.authService.register(dto);
  }

  @Post("login")
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto): Promise<{ accessToken: string }> {
    return this.authService.login(dto);
  }

  @Get("me")
  @UseGuards(JwtAuthGuard)
  getProfile(@CurrentUser() userId: string): Promise<UserResponse> {
    return this.authService.getProfile(userId);
  }

  @Patch("me")
  @UseGuards(JwtAuthGuard)
  updateProfile(@CurrentUser() userId: string, @Body() dto: UpdateProfileDto): Promise<UserResponse> {
    return this.authService.updateProfile(userId, dto);
  }

  @Patch("me/password")
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  changePassword(@CurrentUser() userId: string, @Body() dto: ChangePasswordDto): Promise<void> {
    return this.authService.changePassword(userId, dto);
  }
}
