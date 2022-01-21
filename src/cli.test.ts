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
const mockGitSemver = jest.fn(() => Promise.resolve("1.0.0"));
jest.mock("./index", () => mockGitSemver);

const mockExit = jest.spyOn(process, "exit").mockImplementation((num) => {
  throw new Error(`exit: ${num}`);
});

const mockStderr = jest.spyOn(process.stderr, "write");
const mockStdout = jest.spyOn(process.stdout, "write");

afterAll(() => {
  mockExit.mockRestore();
  mockStdout.mockRestore();
  mockStderr.mockRestore();
  mockGitSemver.mockRestore();
});

afterEach(() => {
  mockExit.mockClear();
  mockStdout.mockClear();
  mockStderr.mockClear();
  mockGitSemver.mockClear();
});

import main from "./cli";
import { BranchOptions, TagOptions } from "./types";

describe("main", () => {
  test("requires token in env", async () => {
    await expect(main([], {})).rejects.toThrow("exit: 1");
    expect(mockStderr).toHaveBeenCalledWith(
      "error: missing 'GITHUB_TOKEN' in environment variables\n"
    );
  });

  test("requires repository in arguments", async () => {
    await expect(main([], { GITHUB_TOKEN: "token" })).rejects.toThrow(
      "exit: 1"
    );
    expect(mockStderr).toHaveBeenCalledWith(
      "error: missing required argument 'repository'\n"
    );
  });

  test("requires reference in arguments", async () => {
    await expect(
      main(["repository"], { GITHUB_TOKEN: "token" })
    ).rejects.toThrow("exit: 1");
    expect(mockStderr).toHaveBeenCalledWith(
      "error: missing required argument 'reference'\n"
    );
  });

  test("requires repository in proper format", async () => {
    const formatError = "error: format for 'repository' is <owner>/<name>\n";
    const env = { GITHUB_TOKEN: "token" };

    await expect(main(["repository", "reference"], env)).rejects.toThrow(
      "exit: 1"
    );
    expect(mockStderr).toHaveBeenCalledWith(formatError);
    mockStderr.mockClear();

    await expect(main(["/repository", "reference"], env)).rejects.toThrow(
      "exit: 1"
    );
    expect(mockStderr).toHaveBeenCalledWith(formatError);
    mockStderr.mockClear();

    await expect(main(["repository/", "reference"], env)).rejects.toThrow(
      "exit: 1"
    );
    expect(mockStderr).toHaveBeenCalledWith(formatError);
    mockStderr.mockClear();
  });

  const branches: BranchOptions[] = [
    { filter: "(main|master)", increment: "patch", sort: "desc" },
    { filter: "release-.*", increment: "patch", sort: "desc" },
    { filter: "hotfix-.*", increment: "patch", sort: "desc" },
    { filter: "dev(elop)?", increment: "patch", sort: "desc" },
    { filter: ".*", increment: "patch", sort: "desc" },
  ];
  const tags: TagOptions[] = [
    { filter: "v?\\d+(\\.\\d+)?(\\.\\d+)?(-.*)?", sort: "semver" },
    { filter: ".*", sort: "semver" },
  ];
  const metadata = { sha: undefined, date: undefined };

  test("calls gitSemver", async () => {
    await expect(main(["owner/name", "reference"], { GITHUB_TOKEN: "token" }))
      .resolves;
    expect(mockStderr).toHaveBeenCalledTimes(0);
    expect(mockExit).toHaveBeenCalledTimes(0);

    expect(mockGitSemver).toHaveBeenCalledTimes(1);

    expect(mockGitSemver).toHaveBeenLastCalledWith(
      "token",
      "owner",
      "name",
      "reference",
      { branches, tags, metadata }
    );

    expect(mockStdout).toHaveBeenCalledTimes(1);
    expect(mockStdout).toHaveBeenCalledWith("1.0.0");
  });

  test("uses branch filter option", async () => {
    await expect(
      main(
        ["owner/name", "reference", "-b", "(main|master)", "-b", "dev(elop)?"],
        { GITHUB_TOKEN: "token" }
      )
    ).resolves;
    expect(mockStderr).toHaveBeenCalledTimes(0);
    expect(mockExit).toHaveBeenCalledTimes(0);

    expect(mockGitSemver).toHaveBeenCalledTimes(1);

    const branches: BranchOptions[] = [
      { filter: "(main|master)", increment: "patch", sort: "desc" },
      { filter: "dev(elop)?", increment: "patch", sort: "desc" },
    ];

    expect(mockGitSemver).toHaveBeenLastCalledWith(
      "token",
      "owner",
      "name",
      "reference",
      { branches, tags, metadata }
    );

    expect(mockStdout).toHaveBeenCalledTimes(1);
    expect(mockStdout).toHaveBeenCalledWith("1.0.0");
  });

  test("uses tag filter option", async () => {
    await expect(
      main(["owner/name", "reference", "-t", "v\\d+\\.\\d+", "-t", "bob"], {
        GITHUB_TOKEN: "token",
      })
    ).resolves;
    expect(mockStderr).toHaveBeenCalledTimes(0);
    expect(mockExit).toHaveBeenCalledTimes(0);

    const tags: TagOptions[] = [
      { filter: "v\\d+\\.\\d+", sort: "semver" },
      { filter: "bob", sort: "semver" },
    ];

    expect(mockGitSemver).toHaveBeenLastCalledWith(
      "token",
      "owner",
      "name",
      "reference",
      { branches, tags, metadata }
    );

    expect(mockStdout).toHaveBeenCalledTimes(1);
    expect(mockStdout).toHaveBeenCalledWith("1.0.0");
  });

  test("uses increment option", async () => {
    await expect(
      main(["owner/name", "reference", "-i", "none"], { GITHUB_TOKEN: "token" })
    ).resolves;
    expect(mockStderr).toHaveBeenCalledTimes(0);
    expect(mockExit).toHaveBeenCalledTimes(0);

    expect(mockGitSemver).toHaveBeenCalledTimes(1);

    const branches: BranchOptions[] = [
      { filter: "(main|master)", increment: "none", sort: "desc" },
      { filter: "release-.*", increment: "none", sort: "desc" },
      { filter: "hotfix-.*", increment: "none", sort: "desc" },
      { filter: "dev(elop)?", increment: "none", sort: "desc" },
      { filter: ".*", increment: "none", sort: "desc" },
    ];

    expect(mockGitSemver).toHaveBeenLastCalledWith(
      "token",
      "owner",
      "name",
      "reference",
      { branches, tags, metadata }
    );

    expect(mockStdout).toHaveBeenCalledTimes(1);
    expect(mockStdout).toHaveBeenCalledWith("1.0.0");
  });

  test("uses branch sort option", async () => {
    await expect(
      main(["owner/name", "reference", "--branch-sort", "semver"], {
        GITHUB_TOKEN: "token",
      })
    ).resolves;
    expect(mockStderr).toHaveBeenCalledTimes(0);
    expect(mockExit).toHaveBeenCalledTimes(0);

    expect(mockGitSemver).toHaveBeenCalledTimes(1);

    const branches: BranchOptions[] = [
      { filter: "(main|master)", increment: "patch", sort: "semver" },
      { filter: "release-.*", increment: "patch", sort: "semver" },
      { filter: "hotfix-.*", increment: "patch", sort: "semver" },
      { filter: "dev(elop)?", increment: "patch", sort: "semver" },
      { filter: ".*", increment: "patch", sort: "semver" },
    ];

    expect(mockGitSemver).toHaveBeenLastCalledWith(
      "token",
      "owner",
      "name",
      "reference",
      { branches, tags, metadata }
    );

    expect(mockStdout).toHaveBeenCalledTimes(1);
    expect(mockStdout).toHaveBeenCalledWith("1.0.0");
  });

  test("uses tag sort option", async () => {
    await expect(
      main(["owner/name", "reference", "--tag-sort", "asc"], {
        GITHUB_TOKEN: "token",
      })
    ).resolves;
    expect(mockStderr).toHaveBeenCalledTimes(0);
    expect(mockExit).toHaveBeenCalledTimes(0);

    expect(mockGitSemver).toHaveBeenCalledTimes(1);

    const tags: TagOptions[] = [
      { filter: "v?\\d+(\\.\\d+)?(\\.\\d+)?(-.*)?", sort: "asc" },
      { filter: ".*", sort: "asc" },
    ];

    expect(mockGitSemver).toHaveBeenLastCalledWith(
      "token",
      "owner",
      "name",
      "reference",
      { branches, tags, metadata }
    );

    expect(mockStdout).toHaveBeenCalledTimes(1);
    expect(mockStdout).toHaveBeenCalledWith("1.0.0");
  });

  test("uses metadata sha option", async () => {
    await expect(
      main(["owner/name", "reference", "-s"], {
        GITHUB_TOKEN: "token",
      })
    ).resolves;
    expect(mockStderr).toHaveBeenCalledTimes(0);
    expect(mockExit).toHaveBeenCalledTimes(0);

    expect(mockGitSemver).toHaveBeenCalledTimes(1);

    expect(mockGitSemver).toHaveBeenLastCalledWith(
      "token",
      "owner",
      "name",
      "reference",
      { branches, tags, metadata: { sha: true } }
    );

    expect(mockStdout).toHaveBeenCalledTimes(1);
    expect(mockStdout).toHaveBeenCalledWith("1.0.0");
  });

  test("uses build date option", async () => {
    await expect(
      main(["owner/name", "reference", "-d"], {
        GITHUB_TOKEN: "token",
      })
    ).resolves;
    expect(mockStderr).toHaveBeenCalledTimes(0);
    expect(mockExit).toHaveBeenCalledTimes(0);

    expect(mockGitSemver).toHaveBeenCalledTimes(1);

    expect(mockGitSemver).toHaveBeenLastCalledWith(
      "token",
      "owner",
      "name",
      "reference",
      { branches, tags, metadata: { date: true } }
    );

    expect(mockStdout).toHaveBeenCalledTimes(1);
    expect(mockStdout).toHaveBeenCalledWith("1.0.0");
  });

  test("uses build date option with format", async () => {
    await expect(
      main(["owner/name", "reference", "-d", "YYMM"], {
        GITHUB_TOKEN: "token",
      })
    ).resolves;
    expect(mockStderr).toHaveBeenCalledTimes(0);
    expect(mockExit).toHaveBeenCalledTimes(0);

    expect(mockGitSemver).toHaveBeenCalledTimes(1);

    expect(mockGitSemver).toHaveBeenLastCalledWith(
      "token",
      "owner",
      "name",
      "reference",
      { branches, tags, metadata: { date: "YYMM" } }
    );

    expect(mockStdout).toHaveBeenCalledTimes(1);
    expect(mockStdout).toHaveBeenCalledWith("1.0.0");
  });
});
