#!/usr/bin/env node
/**
 * @license
 * Copyright 2022 Rob Cannon
 *
 * Permission to use, copy, modify, and/or distribute this software for any purpose with or
 * without fee is hereby granted, provided that the above copyright notice and this
 * permission notice appear in all copies.
 *
 * THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH REGARD TO
 * THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS. IN NO EVENT
 * SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR
 * ANY DAMAGES WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF
 * CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE
 * OR PERFORMANCE OF THIS SOFTWARE.
 */
import LoggerFactory from "@robpc/logger";

import gitSemver from "./index";
import { BranchOptions } from "./types";

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

LoggerFactory.setStderrOutput(true);

if (process.env.GIT_SEMVER_DEBUG) {
  LoggerFactory.setLogLevel("DEBUG");
}

const logger = LoggerFactory.get("git-semver-cli");

const main = async () => {
  if (!GITHUB_TOKEN) {
    logger.error("Missing required 'GITHUB_TOKEN' in environment variables");
    process.exit(1);
  }

  if (process.argv.length < 4) {
    logger.error(
      "Missing required arguments, expected two arguments for 'repository' and 'reference'"
    );
    process.exit(1);
  }

  const [repository, reference] = process.argv.slice(2);

  const [owner, name] = repository.split("/");

  if (!owner) {
    logger.error(
      `Invalid github repository owner '${owner}' from repository argument '${repository}'`
    );
    process.exit(1);
  }

  if (!name) {
    logger.error(
      `Invalid github repository name '${name}' from repository argument '${repository}'`
    );
    process.exit(1);
  }

  if (!reference) {
    logger.error(`Invalid github reference '${reference}'`);
    process.exit(1);
  }

  logger.info(`Owner: ${owner}`);
  logger.info(`Name: ${name}`);
  logger.info(`Reference: ${reference}`);

  const branches: BranchOptions[] = [
    { filter: "(main|master)" },
    { filter: "v?\\d+(\\.\\d+)?(\\.\\d+)?" },
    { filter: "release-.*" },
    { filter: "hotfix-.*" },
    { filter: "dev(elop)?" },
    { filter: ".*" },
  ];

  const version = await gitSemver(GITHUB_TOKEN, owner, name, reference, {
    branches,
  });

  console.log(version);
};

main();
