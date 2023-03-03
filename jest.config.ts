import type { Config } from "@jest/types";
// Sync object
const config: Config.InitialOptions = {
  verbose: true,
  modulePathIgnorePatterns: ["dist"],
  transform: {
    "^.+\\.tsx?$": `ts-jest`,
  },
};
export default config;
