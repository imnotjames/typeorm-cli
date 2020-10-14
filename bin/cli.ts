#!/usr/bin/env node
'use strict';

import { importLocal } from '../src/local';

const packageExists = (...args: any) => true;
const promptInstallation = (...args: any) => Promise.resolve();

// Prefer the local installation of the TypeORM CLI
if (importLocal("typeorm-cli", "bin/cli")) {
  console.log("LOCAL IMPORT");
} else if (importLocal("typeorm", "cli")) {
  console.log("LOCAL TYPEORM LEGACY");
} else {
  process.title = 'typeorm';

  require("../src/index");
}
