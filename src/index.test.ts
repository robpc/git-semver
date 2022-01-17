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
import gitSemver from "./index";

const mockGithubBranches = jest.fn();
const mockGithubTags = jest.fn();
const mockGithubRange = jest.fn();

jest.mock("./github", () =>
  jest.fn(() => ({
    branches: mockGithubBranches,
    tags: mockGithubTags,
    range: mockGithubRange,
  }))
);

describe("gitSemver", () => {
  mockGithubBranches.mockReturnValue(Promise.resolve(["feature-four", "main"]));
  mockGithubTags.mockReturnValue(Promise.resolve(["1.1.0", "1.0.0"]));

  beforeEach(() => {
    mockGithubBranches.mockClear();
    mockGithubTags.mockClear();
    mockGithubRange.mockClear();
  });

  test("is just the tag when using tag commit", async () => {
    mockGithubRange.mockImplementation((from: string, to: string) => {
      if (to == "feature-four") return { status: "ahead", ahead_by: 2 };
      if (to == "main") return { status: "ahead", ahead_by: 3 };
      if (from == "1.1.0") return { status: "behind", ahead_by: 0 };
      if (from == "1.0.0") return { status: "identical", ahead_by: 0 };
      throw new Error(`Unaxpected params, from:${from} to:${to}`);
    });

    await expect(
      gitSemver("token", "robpc", "git-version-tests-alpha", "88f8ebe", {})
    ).resolves.toBe("1.0.0");
  });

  test("is incremented from tag", async () => {
    mockGithubRange.mockImplementation((from: string, to: string) => {
      if (to == "feature-four") return { status: "identical", ahead_by: 0 };
      if (to == "main") return { status: "diverged", ahead_by: 2 };
      if (from == "1.1.0") return { status: "behind", ahead_by: 0 };
      if (from == "1.0.0") return { status: "ahead", ahead_by: 2 };
      throw new Error(`Unaxpected params, from:${from} to:${to}`);
    });

    await expect(
      gitSemver("token", "robpc", "git-version-tests-alpha", "ddf0a84", {})
    ).resolves.toBe("1.0.1-feature-four.2");
  });

  test("uses increment", async () => {
    mockGithubRange.mockImplementation((from: string, to: string) => {
      if (to == "feature-four") return { status: "identical", ahead_by: 0 };
      if (to == "main") return { status: "diverged", ahead_by: 2 };
      if (from == "1.1.0") return { status: "behind", ahead_by: 0 };
      if (from == "1.0.0") return { status: "ahead", ahead_by: 2 };
      throw new Error(`Unaxpected params, from:${from} to:${to}`);
    });

    await expect(
      gitSemver("token", "robpc", "git-version-tests-alpha", "ddf0a84", {
        branches: [{ filter: ".*", increment: "none" }],
      })
    ).resolves.toBe("1.0.0-feature-four.2");

    await expect(
      gitSemver("token", "robpc", "git-version-tests-alpha", "ddf0a84", {
        branches: [{ filter: ".*", increment: "patch" }],
      })
    ).resolves.toBe("1.0.1-feature-four.2");

    await expect(
      gitSemver("token", "robpc", "git-version-tests-alpha", "ddf0a84", {
        branches: [{ filter: ".*", increment: "minor" }],
      })
    ).resolves.toBe("1.1.0-feature-four.2");

    await expect(
      gitSemver("token", "robpc", "git-version-tests-alpha", "ddf0a84", {
        branches: [{ filter: ".*", increment: "major" }],
      })
    ).resolves.toBe("2.0.0-feature-four.2");
  });

  test("uses prerelease", async () => {
    mockGithubRange.mockImplementation((from: string, to: string) => {
      if (to == "feature-four") return { status: "identical", ahead_by: 0 };
      if (to == "main") return { status: "diverged", ahead_by: 2 };
      if (from == "1.1.0") return { status: "behind", ahead_by: 0 };
      if (from == "1.0.0") return { status: "ahead", ahead_by: 2 };
      throw new Error(`Unaxpected params, from:${from} to:${to}`);
    });

    await expect(
      gitSemver("token", "robpc", "git-version-tests-alpha", "ddf0a84", {
        branches: [{ filter: "feature-.*", prerelease: "beta" }],
      })
    ).resolves.toBe("1.0.1-beta.2");
  });
});
