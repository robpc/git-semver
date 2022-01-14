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
import { Octokit } from "@octokit/rest";

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

const octokit = new Octokit({
  auth: GITHUB_TOKEN,
});

const branches = async (owner: string, repo: string) => {
  const { data: branches } = await octokit.rest.repos.listBranches({
    owner,
    repo,
  });

  return branches.map(({ name }) => name);
};

const tags = async (owner: string, repo: string) =>
  octokit
    .paginate(octokit.rest.repos.listTags, {
      owner,
      repo,
    })
    .then((tags) => tags.map(({ name }) => name));

const sha = async (
  owner: string,
  repo: string,
  ref: string
): Promise<string> => {
  const { data } = await octokit.rest.repos.getCommit({
    owner,
    repo,
    ref,
    mediaType: {
      format: "sha",
    },
  });

  return data as unknown as string;
};

const range = async (
  owner: string,
  repo: string,
  from: string,
  to: string,
  perPage: number = 100
) => {
  const { data } = await octokit.rest.repos.compareCommitsWithBasehead({
    owner,
    repo,
    basehead: `${from}...${to}`,
    per_page: perPage,
  });

  return data;
};

export default {
  octokit,
  branches,
  tags,
  sha,
  range,
};
