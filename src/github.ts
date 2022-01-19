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

class Github {
  private owner: string;
  private repo: string;

  private octokit: Octokit;

  constructor(token: string, owner: string, repo: string) {
    this.octokit = new Octokit({
      auth: token,
    });

    this.owner = owner;
    this.repo = repo;
  }

  branches = async () =>
    this.octokit
      .paginate(this.octokit.rest.repos.listBranches, {
        owner: this.owner,
        repo: this.repo,
      })
      .then((branches) => branches.map(({ name }) => name));

  tags = async () =>
    this.octokit
      .paginate(this.octokit.rest.repos.listTags, {
        owner: this.owner,
        repo: this.repo,
      })
      .then((tags) => tags.map(({ name }) => name));

  sha = async (ref: string): Promise<string> => {
    const { data } = await this.octokit.rest.repos.getCommit({
      owner: this.owner,
      repo: this.repo,
      ref,
      mediaType: {
        format: "sha",
      },
    });

    return data as unknown as string;
  };

  range = async (from: string, to: string, perPage: number = 100) => {
    const { data } = await this.octokit.rest.repos.compareCommitsWithBasehead({
      owner: this.owner,
      repo: this.repo,
      basehead: `${from}...${to}`,
      per_page: perPage,
    });

    return data;
  };
}

export default Github;
