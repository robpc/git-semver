import LoggerFactory from "@robpc/logger";
import semverRcompare from "semver/functions/rcompare.js";
import semverCoerce from "semver/functions/coerce.js";
import semverInc from "semver/functions/inc.js";

import github from "./github";

import {
  BranchOptions,
  IncrementOptions,
  SortOptions,
  TagOptions,
  TagVersionOptions,
} from "./types";

const logger = LoggerFactory.get("git-semver-lib");

const startsWithVersion = new RegExp(/v?\d.*/);
const gentleCoerce = (v: string): string => {
  return startsWithVersion.test(v) ? semverCoerce(v).version : "0.0.0";
};

const sortByRegexList = (
  names: Array<string>,
  priority: Array<{ filter: string; sort?: SortOptions }>
): Array<string> => {
  return priority.reduce((arr, { filter, sort }) => {
    const r = new RegExp(`^${filter}$`);
    const filtered = names.filter(
      (name) => r.test(name) && !arr.includes(name)
    );

    if (sort != "none") {
      if (sort == "asc") {
        filtered.sort();
      } else if (sort == "desc") {
        filtered.sort().reverse();
      } /*if (sort == "semver")*/ else {
        filtered.sort((v1, v2) =>
          semverRcompare(gentleCoerce(v1), gentleCoerce(v2))
        );
      }
    }

    return [...arr, ...filtered];
  }, []);
};

const sanitizePrerelease = (text: string) =>
  text ? text.replace(/_\./, "-").replace(/[^0-9a-zA-Z-]/, "") : text;

const findBranch = async (
  owner: string,
  repo: string,
  ref: string,
  branchPriority: Array<BranchOptions>
) => {
  const branchNames = await github.branches(owner, repo);
  logger.debug("All branches:", branchNames.join(", "));

  const branches = sortByRegexList(branchNames, branchPriority);
  logger.debug("Sorted branches:", branches.join(", "));

  let foundBranch = null;
  for (let i = 0; i < branches.length; i++) {
    const branch = branches[i];

    const compare = await github.range(owner, repo, ref, branch);
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
  owner: string,
  repo: string,
  ref: string,
  tagPriority: Array<TagOptions>
): Promise<[string, number]> => {
  const tagNames = await github.tags(owner, repo);
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

    const compare = await github.range(owner, repo, tag, ref, 0);
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

const robVersion = async (
  owner: string,
  repo: string,
  ref: string,
  options: TagVersionOptions
): Promise<string> => {
  const branchPriority = options.branches || [{ filter: ".*" }];
  const tagPriority = options.tags || [{ filter: ".*" }];

  const branch = await findBranch(owner, repo, ref, branchPriority);
  const [tag, distance] = await findTag(owner, repo, ref, tagPriority);

  return genVersion(tag, branch, distance, "none");
};

const tagVersion = async (
  owner: string,
  repo: string,
  ref: string,
  options: TagVersionOptions
): Promise<string> => {
  const branchPriority = options.branches || [{ filter: ".*" }];
  const tagPriority = options.tags || [{ filter: ".*" }];

  const branch = await findBranch(owner, repo, ref, branchPriority);
  const [tag, distance] = await findTag(owner, repo, ref, tagPriority);

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

const gitDescribe = async (
  owner: string,
  repo: string,
  ref: string,
  options: TagVersionOptions
): Promise<string> => {
  const tagPriority = options.tags || [{ filter: ".*" }];

  const [tag, distance] = await findTag(owner, repo, ref, tagPriority);

  const sha = await github.sha(owner, repo, ref);
  logger.trace("sha", sha);

  const describe = genDescribe(sha, tag, distance);
  logger.info("describe", describe);

  return describe;
};

const genDescribe = (sha: string, tag: string, distance: number): string => {
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

export default tagVersion;
export { robVersion, gitDescribe };
