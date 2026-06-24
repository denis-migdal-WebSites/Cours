import buildConfigs from "./build/WebpackFramework/index.js";

export default buildConfigs();

import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

console.log(
  "TS utilisé par webpack:",
  require.resolve("typescript"),
  require("typescript").version
);