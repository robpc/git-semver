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
import { Command, Option } from "commander";
import LoggerFactory from "@robpc/logger";

import gitSemver from "./index";
import { BranchOptions, TagOptions } from "./types";

LoggerFactory.setStderrOutput(true);

if (process.env.GIT_SEMVER_DEBUG) {
  LoggerFactory.setLogLevel("DEBUG");
}

const logger = LoggerFactory.get("git-semver-cli");

const main = async (argv, env) => {
  const { GITHUB_TOKEN } = env;

  if (!GITHUB_TOKEN) {
    process.stderr.write(
      "error: missing 'GITHUB_TOKEN' in environment variables\n"
    );
    process.exit(1);
  }

  const program = new Command();
  program
    .argument("<repository>", "github repository as <owner>/<name>")
    .argument("<reference>", "commit reference to version")
    .addOption(
      new Option("-i, --increment <increment>", "version increment size")
        .choices(["none", "patch", "minor", "major"])
        .default("patch")
    )
    .option(
      "-b, --branch-filters <filter...>",
      "list of branch filters in priority order"
    )
    .option(
      "-t, --tag-filters <filter...>",
      "list of tag filters in priority order"
    )
    .option("-s, --add-build-sha", "add git sha to the build metadata")
    .option(
      "-d, --add-build-date [date-format]",
      "add date to the build metadata, defaults to 'YYYYMMDD-HHmmss' if no format is supplied"
    )
    .addOption(
      new Option("--branch-sort <sort>", "sort method within branch filters")
        .choices(["asc", "desc", "semver"])
        .default("desc")
    )
    .addOption(
      new Option("--tag-sort <sort>", "sort method within tag filters")
        .choices(["asc", "desc", "semver"])
        .default("semver")
    )
    .parse(argv, { from: "user" });

  if (!argv.length) {
    program.help({ error: true });
  }

  const [repository, reference] = program.args;

  const [owner, name] = repository.split("/");

  if (!owner || !name) {
    process.stderr.write("error: format for 'repository' is <owner>/<name>\n");
    process.exit(1);
  }

  logger.info(`Owner: ${owner}`);
  logger.info(`Name: ${name}`);
  logger.info(`Reference: ${reference}`);

  const options = program.opts();
  const { increment, branchSort, tagSort, addBuildSha, addBuildDate } = options;
  logger.debug(options);

  const defaultBranchFilters: string[] = [
    "(main|master)",
    "release-.*",
    "hotfix-.*",
    "dev(elop)?",
    ".*",
  ];

  const branchFilters: string[] =
    options.branchFilters && options.branchFilters.length > 0
      ? options.branchFilters
      : defaultBranchFilters;

  const branches: BranchOptions[] = branchFilters.map((filter) => ({
    filter,
    increment,
    sort: branchSort,
  }));

  const defaultTagFilters: string[] = [
    "v?\\d+(\\.\\d+)?(\\.\\d+)?(-.*)?",
    ".*",
  ];

  const tagFilters: string[] =
    options.tagFilters && options.tagFilters.length > 0
      ? options.tagFilters
      : defaultTagFilters;

  const tags: TagOptions[] = tagFilters.map((filter) => ({
    filter,
    sort: tagSort,
  }));

  const version = await gitSemver(GITHUB_TOKEN, owner, name, reference, {
    branches,
    tags,
    metadata: {
      sha: addBuildSha,
      date: addBuildDate,
    },
  });

  process.stdout.write(version);
};

if (!module.parent) {
  main(process.argv.slice(2), process.env);
}

export default main;
