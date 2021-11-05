import tagVersion from "./index";

jest.mock("./github");
import github from "./github";

const mockedGithub = jest.mocked(github, true);

jest.setTimeout(15 * 1000);

// "commit-comparison": {
//   url: string;
//   html_url: string;
//   permalink_url: string;
//   diff_url: string;
//   patch_url: string;
//   base_commit: components["schemas"]["commit"];
//   merge_base_commit: components["schemas"]["commit"];
//   status: "diverged" | "ahead" | "behind" | "identical";
//   ahead_by: number;
//   behind_by: number;
//   total_commits: number;
//   commits: components["schemas"]["commit"][];
//   files?: components["schemas"]["diff-entry"][];
// }

const makeCommitComparison = (data) =>
  Promise.resolve(
    Object.assign(
      {
        url: null,
        html_url: null,
        permalink_url: null,
        diff_url: null,
        patch_url: null,
        base_commit: null,
        merge_base_commit: null,
        status: null,
        ahead_by: null,
        behind_by: null,
        total_commits: null,
        commits: [],
        files: [],
      },
      data
    )
  );

test("is just the tag when using tag commit", async () => {
  mockedGithub.branches = jest
    .fn()
    .mockImplementation(() => Promise.resolve(["feature-four", "main"]));
  mockedGithub.tags = jest
    .fn()
    .mockImplementation(() => Promise.resolve(["1.1.0", "1.0.0"]));
  mockedGithub.range = jest.fn().mockImplementation((_a, _b, from, to) => {
    if (to == "feature-four")
      return makeCommitComparison({ status: "ahead", ahead_by: 2 });
    if (from == "1.1.0")
      return makeCommitComparison({ status: "behind", ahead_by: 0 });
    if (from == "1.0.0")
      return makeCommitComparison({ status: "identical", ahead_by: 0 });
    throw new Error(`Unaxpected params, from:${from} to:${to}`);
  });
  await expect(
    tagVersion("robpc", "git-version-tests-alpha", "88f8ebe", {})
  ).resolves.toBe("1.0.0");
});

test("is incremented from tag", async () => {
  mockedGithub.branches = jest
    .fn()
    .mockImplementation(() => Promise.resolve(["feature-four", "main"]));
  mockedGithub.tags = jest
    .fn()
    .mockImplementation(() => Promise.resolve(["1.1.0", "1.0.0"]));
  mockedGithub.range = jest.fn().mockImplementation((_a, _b, from, to) => {
    if (to == "feature-four")
      return makeCommitComparison({ status: "identical", ahead_by: 0 });
    if (to == "main")
      return makeCommitComparison({ status: "ahead", ahead_by: 1 });
    if (from == "1.1.0")
      return makeCommitComparison({ status: "behind", ahead_by: 0 });
    if (from == "1.0.0")
      return makeCommitComparison({ status: "ahead", ahead_by: 2 });
    throw new Error(`Unaxpected params, from:${from} to:${to}`);
  });

  await expect(
    tagVersion("robpc", "git-version-tests-alpha", "ddf0a84", {})
  ).resolves.toBe("1.0.1-feature-four.2");
});

test("uses prerelease", async () => {
  mockedGithub.branches = jest
    .fn()
    .mockImplementation(() => Promise.resolve(["feature-four", "main"]));
  mockedGithub.tags = jest
    .fn()
    .mockImplementation(() => Promise.resolve(["1.1.0", "1.0.0"]));
  mockedGithub.range = jest.fn().mockImplementation((_a, _b, from, to) => {
    if (to == "feature-four")
      return makeCommitComparison({ status: "identical", ahead_by: 0 });
    if (to == "main")
      return makeCommitComparison({ status: "ahead", ahead_by: 1 });
    if (from == "1.1.0")
      return makeCommitComparison({ status: "behind", ahead_by: 0 });
    if (from == "1.0.0")
      return makeCommitComparison({ status: "ahead", ahead_by: 2 });
    throw new Error(`Unaxpected params, from:${from} to:${to}`);
  });

  await expect(
    tagVersion("robpc", "git-version-tests-alpha", "ddf0a84", {
      branches: [{ filter: "feature-.*", prerelease: "beta" }],
    })
  ).resolves.toBe("1.0.1-beta.2");
});
