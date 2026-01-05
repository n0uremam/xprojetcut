import { createRequire } from "module";
const require = createRequire(import.meta.url);
const { handler } = require("./app.cjs");
export { handler };
