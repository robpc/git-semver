# git-semver

_NOTE: Still in prerelease for experimentation_

Determines the [semantic version](semver.org) based on commit distance since the last tag.

    |
    O - v1.2.1 <-------- git-semver (A) = 1.2.1
    | \
    *  |
    |  * <-------------- git-semver (B) = 1.2.1-feature-two.2
    *  |
    |  *
    *  |  feature/two
    | /
    * <----------------- git-semver (B) = 1.2.1-main.1
    |
    O - v1.2.0
    |
    *  main

`git-semver` uses the closest `semver` tag. If the commit is the tag commit it returns that version (see ex. `A` above). If the commit is not the tag commit, `git-semver` returns the next patch version with a `prerelease` version. The prerelease version will contain the branch sanitized for semver followed by the commit distance to the tag version (see ex. `B` above).

Unlike other libraries this this version uses the Octokit.js API and does not require downloading the entire commit history. Downloading the entire commit history can be burdensome for large repos, This library is perfect for use in CB/CI where detached HEADs are downloaded by default.

## Usage

### Command Line

```bash
$ npx @robpc/git-semver {repository} {ref}
```

Requires a GitHub token in the env var `GITHUB_TOKEN`.

Branches are prioritized based on the following list:

- `(main|master)`
- `*v?\\d+(\\.\\d+)?(\\.\\d+)?`
- `release-.*`
- `hotfix-.*`
- `dev(elop)?`
- `.*`

_example_

```bash
$ GITHUB_TOKEN=... npx @robpc/git-semver robpc/config 24cbac1
2.0.5-main.4
```

### Github Actions

The command line can be used in a typical Github Action setup. Notice the example below does not include `fetch-depth: 0` in the checkout action, which are required by some git utilities. Running this as a step in Github actions can take as little as five seconds.

```yaml
name: Build
on:
  push:

jobs:
  build:
    name: Build the app
    steps:
      - name: Check out repository
        uses: actions/checkout@v2

      - name: Set git-semver version
        run: echo "version=$(npx @robpc/git-semver@0.1.6 ${REPO} ${REF})" >> $GITHUB_ENV
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          REPO: ${{ github.repository }}
          REF: ${{ github.sha }}

      # Use later in context `${{ env.version }}` or the shell `${version}` like:
      # - run: docker -t myapp:${version} build .
      # ...
```

### Module

```js
import gitSemver from "@robpc/git-semver";

// ...

const token = process.env.GITHUB_TOKEN;

const branches: BranchOptions[] = [
  { filter: "(main|master)", prerelease: "rc" },
  { filter: "hotfix-.*", sort: "asc" },
  { filter: "dev(elop)?", prerelease: "beta" },
  { filter: ".*" },
];

const version = await gitSemver(token, owner, repo, ref, {
  branches,
});
```
