#!/usr/bin/env node
import { main } from "../dist/cli.js";

main(process.argv.slice(2)).catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
