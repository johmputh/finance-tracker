/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  rootDir: ".",
  roots: ["<rootDir>/src"],
  moduleFileExtensions: ["js", "json", "ts"],
  testRegex: ".*\\.spec\\.ts$",
  transform: {
    "^.+\\.ts$": ["ts-jest", { tsconfig: "<rootDir>/tsconfig.json" }],
  },
  moduleNameMapper: {
    "^@finance-tracker/shared$": "<rootDir>/../../packages/shared/src/index.ts",
    "^@finance-tracker/database$": "<rootDir>/../../packages/database/src/index.ts",
  },
  setupFiles: ["reflect-metadata"],
  testEnvironment: "node",
};
