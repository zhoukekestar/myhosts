#!/usr/bin/env node

import { argv as args } from "node:process";
import myhosts from "../index.mjs";

// console.log(args);
myhosts(...args.slice(2))
