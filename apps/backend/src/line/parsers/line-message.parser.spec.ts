import { parseLineMessage } from "./line-message.parser";

describe("parseLineMessage", () => {
  describe("expense detection", () => {
    it("parses a simple expense", () => {
      expect(parseLineMessage("กาแฟ 65")).toEqual({
        description: "กาแฟ",
        amount: 65,
        type: "EXPENSE",
      });
    });

    it("parses expense with comma-separated amount", () => {
      expect(parseLineMessage("ค่าเช่า 5,000")).toEqual({
        description: "ค่าเช่า",
        amount: 5000,
        type: "EXPENSE",
      });
    });

    it("parses multi-word expense description", () => {
      expect(parseLineMessage("ค่าอาหาร กลางวัน 150")).toEqual({
        description: "ค่าอาหาร กลางวัน",
        amount: 150,
        type: "EXPENSE",
      });
    });

    it("parses expense with decimal amount", () => {
      expect(parseLineMessage("กาแฟ 65.50")).toEqual({
        description: "กาแฟ",
        amount: 65.5,
        type: "EXPENSE",
      });
    });
  });

  describe("income detection", () => {
    it("parses เงินเดือน as income", () => {
      expect(parseLineMessage("เงินเดือน 45,000")).toEqual({
        description: "เงินเดือน",
        amount: 45000,
        type: "INCOME",
      });
    });

    it("parses โบนัส as income", () => {
      expect(parseLineMessage("โบนัส 10,000")).toEqual({
        description: "โบนัส",
        amount: 10000,
        type: "INCOME",
      });
    });

    it("parses รายได้ as income", () => {
      expect(parseLineMessage("รายได้ 3,000")).toEqual({
        description: "รายได้",
        amount: 3000,
        type: "INCOME",
      });
    });

    it("parses ค่าจ้าง as income", () => {
      expect(parseLineMessage("ค่าจ้าง 800")).toEqual({
        description: "ค่าจ้าง",
        amount: 800,
        type: "INCOME",
      });
    });

    it("parses income keyword with trailing suffix word", () => {
      expect(parseLineMessage("รายได้พิเศษ 5,000")).toEqual({
        description: "รายได้พิเศษ",
        amount: 5000,
        type: "INCOME",
      });
    });

    it("parses large income with multiple comma groups", () => {
      expect(parseLineMessage("โบนัส 1,000,000")).toEqual({
        description: "โบนัส",
        amount: 1000000,
        type: "INCOME",
      });
    });
  });

  describe("invalid input returns null", () => {
    it("returns null for plain number with no description", () => {
      expect(parseLineMessage("150")).toBeNull();
    });

    it("returns null for description with no amount", () => {
      expect(parseLineMessage("กาแฟ")).toBeNull();
    });

    it("returns null for empty string", () => {
      expect(parseLineMessage("")).toBeNull();
    });

    it("returns null for zero amount", () => {
      expect(parseLineMessage("กาแฟ 0")).toBeNull();
    });

    it("returns null when description and amount have no space separator", () => {
      expect(parseLineMessage("กาแฟ65")).toBeNull();
    });

    it("trims surrounding whitespace before parsing", () => {
      expect(parseLineMessage("  กาแฟ 65  ")).toEqual({
        description: "กาแฟ",
        amount: 65,
        type: "EXPENSE",
      });
    });
  });
});
