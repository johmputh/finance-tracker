import { BadRequestException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import { AuthService } from "./auth.service";

jest.mock("bcrypt");

const USER_ID = "user-1";

function makeUser(overrides: Record<string, unknown> = {}) {
  return {
    id: USER_ID,
    email: "test@example.com",
    name: "Test User",
    password: "hashed",
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    ...overrides,
  };
}

function makePrisma() {
  return {
    client: {
      user: {
        findUnique: jest.fn().mockResolvedValue(null),
        findUniqueOrThrow: jest.fn().mockResolvedValue(makeUser()),
        create: jest.fn().mockResolvedValue(makeUser()),
        update: jest.fn().mockResolvedValue(makeUser()),
      },
    },
  };
}

describe("AuthService", () => {
  describe("updateProfile", () => {
    it("updates the user name and returns the response", async () => {
      const prisma = makePrisma();
      const service = new AuthService(prisma as never, {} as JwtService);
      prisma.client.user.update.mockResolvedValue(makeUser({ name: "ชื่อใหม่" }));

      const result = await service.updateProfile(USER_ID, { name: "ชื่อใหม่" });

      expect(prisma.client.user.update).toHaveBeenCalledWith({
        where: { id: USER_ID },
        data: { name: "ชื่อใหม่" },
      });
      expect(result.name).toBe("ชื่อใหม่");
      expect(result.createdAt).toBe("2026-01-01T00:00:00.000Z");
    });
  });

  describe("changePassword", () => {
    it("hashes and saves the new password when current password is correct", async () => {
      const prisma = makePrisma();
      const service = new AuthService(prisma as never, {} as JwtService);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (bcrypt.hash as jest.Mock).mockResolvedValue("new-hashed");

      await service.changePassword(USER_ID, {
        currentPassword: "oldpass",
        newPassword: "newpass123",
      });

      expect(bcrypt.compare).toHaveBeenCalledWith("oldpass", "hashed");
      expect(bcrypt.hash).toHaveBeenCalledWith("newpass123", 10);
      expect(prisma.client.user.update).toHaveBeenCalledWith({
        where: { id: USER_ID },
        data: { password: "new-hashed" },
      });
    });

    it("throws BadRequestException when current password is wrong", async () => {
      const prisma = makePrisma();
      const service = new AuthService(prisma as never, {} as JwtService);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.changePassword(USER_ID, { currentPassword: "wrong", newPassword: "newpass123" }),
      ).rejects.toThrow(BadRequestException);
      expect(prisma.client.user.update).not.toHaveBeenCalled();
    });
  });
});
