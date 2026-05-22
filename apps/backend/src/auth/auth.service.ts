import { ConflictException, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import type { LoginDto, RegisterDto, UserResponse } from "@finance-tracker/shared";
import { PrismaService } from "../prisma/prisma.service";
import type { JwtPayload } from "./jwt-payload";

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto): Promise<UserResponse> {
    const existing = await this.prisma.client.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException("Email already in use");

    const password = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.client.user.create({
      data: { email: dto.email, password, name: dto.name },
    });

    return this.toResponse(user);
  }

  async login(dto: LoginDto): Promise<{ accessToken: string }> {
    const user = await this.prisma.client.user.findUnique({ where: { email: dto.email } });
    if (!user) throw new UnauthorizedException("Invalid credentials");

    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) throw new UnauthorizedException("Invalid credentials");

    const payload: JwtPayload = { sub: user.id };
    const accessToken = await this.jwtService.signAsync(payload);
    return { accessToken };
  }

  async getProfile(userId: string): Promise<UserResponse> {
    const user = await this.prisma.client.user.findUniqueOrThrow({ where: { id: userId } });
    return this.toResponse(user);
  }

  private toResponse(user: { id: string; email: string; name: string; createdAt: Date; updatedAt: Date }): UserResponse {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  }
}
