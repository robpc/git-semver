#!/usr/bin/env node
import LoggerFactory from "@robpc/logger";

import getTagVersion from "./index";
import { BranchOptions } from "./types";

LoggerFactory.setLogLevel("DEBUG");

const logger = LoggerFactory.get("git-semver-cli");

const main = async () => {
  const [owner, repo, ref] = process.argv.slice(2);

  logger.info(`Owner: ${owner}`);
  logger.info(`Repo: ${repo}`);
  logger.info(`Ref: ${ref}`);

  const branches: BranchOptions[] = [
    { filter: "(main|master)" },
    { filter: "v?\\d+(\\.\\d+)?(\\.\\d+)?" },
    { filter: "release-.*" },
    { filter: "hotfix-.*" },
    { filter: "dev(elop)?" },
    { filter: ".*" },
  ];

  const version = await getTagVersion(owner, repo, ref, {
    branches,
  });

  logger.info("version: ", version);
};

main();
