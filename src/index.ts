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
import semverInc from "semver/functions/inc.js";

import Github from "./github";

import {
  BranchOptions,
  IncrementOptions,
  TagOptions,
  TagVersionOptions,
} from "./types";
import { gentleCoerce, sanitizePrerelease, sortByRegexList } from "./helpers";

const logger = LoggerFactory.get("git-semver-lib");

const findBranch = async (
  github: Github,
  ref: string,
  branchPriority: Array<BranchOptions>
) => {
  const branchNames = await github.branches();
  logger.debug("All branches:", branchNames.join(", "));

  const branches = sortByRegexList(branchNames, branchPriority);
  logger.debug("Sorted branches:", branches.join(", "));

  let foundBranch = null;
  for (let i = 0; i < branches.length; i++) {
    const branch = branches[i];

    const compare = await github.range(ref, branch);
    logger.trace("compare branch", branch, {
      status: compare.status,
      ahead_by: compare.ahead_by,
    });

    if (compare.status == "ahead" || compare.status == "identical") {
      foundBranch = branch;
      break;
    }
  }

  logger.debug(`First branch found '${foundBranch}'`);

  return foundBranch;
};

const findTag = async (
  github: Github,
  ref: string,
  tagPriority: Array<TagOptions>
): Promise<[string, number]> => {
  const tagNames = await github.tags();
  logger.debug("All tags:", tagNames.join(", "));

  const tags =
    tagPriority && tagPriority.length > 0
      ? sortByRegexList(tagNames, tagPriority)
      : tagNames;
  logger.debug("Sorted tags:", tags.join(", "));

  let foundTag = null;
  let foundTagDistance = null;
  for (let i = 0; i < tags.length; i++) {
    const tag = tags[i];

    const compare = await github.range(tag, ref, 0);
    logger.trace("compare tags", tag, {
      status: compare.status,
      ahead_by: compare.ahead_by,
    });

    if (compare.status == "ahead" || compare.status == "identical") {
      foundTag = tag;
      foundTagDistance = compare.ahead_by;
      break;
    }
  }

  logger.debug(
    `Found tag '${foundTag}' at`,
    foundTagDistance,
    "commits from reference"
  );

  return [foundTag, foundTagDistance];
};

/**
 * Generates the equivalent to the the `git describe` command
 *
 * @param owner Github owner
 * @param repo  Github repo name
 * @param ref git reference to version
 * @param options
 * @returns version as a string
 */
const gitDescribe = async (
  token: string,
  owner: string,
  repo: string,
  ref: string,
  options: TagVersionOptions
): Promise<string> => {
  const github = new Github(token, owner, repo);

  const tagPriority = options.tags || [{ filter: ".*" }];

  const [tag, distance] = await findTag(github, ref, tagPriority);

  const sha = await github.sha(ref);
  logger.trace("sha", sha);

  const short_hash = sha.substr(0, 10);

  const describe = distance > 0 ? `${tag}-${distance}-g${short_hash}` : tag;

  return describe;
};

const genVersion = (
  base: string,
  prerelease: string,
  distance: number,
  increment: IncrementOptions = "patch"
): string => {
  let baseVersion = gentleCoerce(base);

  if (distance > 0) {
    baseVersion =
      increment == "none" ? baseVersion : semverInc(baseVersion, increment);

    return `${baseVersion}-${prerelease}.${distance}`;
  }

  return baseVersion;
};

/**
 * Generates a deterministic semver of the github reference
 *
 * @param owner Github owner
 * @param repo  Github repo name
 * @param ref git reference to version
 * @param options
 * @returns version as a string
 */
const gitSemver = async (
  token: string,
  owner: string,
  repo: string,
  ref: string,
  options: TagVersionOptions
): Promise<string> => {
  const github = new Github(token, owner, repo);

  const branchPriority = options.branches || [{ filter: ".*" }];
  const tagPriority = options.tags || [{ filter: ".*" }];

  const branch = await findBranch(github, ref, branchPriority);
  const [tag, distance] = await findTag(github, ref, tagPriority);

  const branchOption = branchPriority.find(({ filter }) =>
    new RegExp(`^${filter}$`).test(branch)
  );

  const prerelease =
    branchOption && branchOption.prerelease
      ? branchOption.prerelease
      : sanitizePrerelease(branch);

  const increment =
    branchOption && branchOption.increment ? branchOption.increment : "patch";

  return genVersion(tag, prerelease, distance, increment);
};

export default gitSemver;
export { gitDescribe };
