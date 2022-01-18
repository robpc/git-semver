# git-semver

Use `git-semver` to generate a valid [sematic version](https://semver.org/) on any commit based on the distance to the last tagged version.

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

The `git-semver` utility starts with the the closest `semver` tag before the requested commit. If the commit is the same as the tag commit, that version is returned (see ex. `A` above). If the requested commit is not the same as the tag commit, `git-semver` returns the next patch version with a prerelease identifier. The prerelease identifier will be the branch followed by the commit distance to the tag version sanitized for semver (see ex. `B` above).

Unlike other libraries this `git-semver` uses the Github API ([octokit.js](https://github.com/octokit/octokit.js)) and does not require downloading the entire commit history. Downloading the entire commit history can be burdensome for large repos, This library is perfect for use in CB/CI where detached HEADs are downloaded by default.

_NOTE: This provides and MVP version of this utility, but still in initial development for experimentation_

## Command Line

```
$ npx @robpc/git-semver --help
Usage: [options] <repository> <reference>

Arguments:
  repository                        github repository as <owner>/<name>
  reference                         commit reference to version

Options:
  -i, --increment <increment>       version increment size
                                    (choices: "none", "patch", "minor", "major", default: "patch")
  -b, --branch-filters <filter...>  list of branch filters in priority order
  -s, --sort <sort>                 sort method within branch filters
                                    (choices: "asc", "desc", "semver", default: "desc")
  -g, --add-build-sha               add git sha to the build metadata
  -h, --help                        display help for command
```

Requires a GitHub token in the env var `GITHUB_TOKEN`.

_example_

```bash
$ GITHUB_TOKEN=... npx @robpc/git-semver robpc/config 24cbac1
2.0.5-main.4
```

### Increment

When a version is found, the version will be incremented to the next patch version, use the `-i, --increment` option to choose `none`, `patch`, `minor`, or `major` instead.

### Branch Priority

Branches are searched in the order below by default:

- `release-.*`
- `hotfix-.*`
- `(main|master)`
- `dev(elop)?`
- `.*`

Use `-b, --branch-filters` options to supply a custom ordered list of filters. `git-semver` will look for branch that has the reference as a ancestor in the order dictated by the filter list. This is useful in situtation where a commit is the ancestor of multiple branches (ie after a merge). In that case, one can prioritize the `main` branch over a feature branch. When multiple branches match a filter they will be done in reverse alphabetical order.

Use the `-s, --sort` option to provide and alternative method for sorting branches that match a particular filter. The default is `desc` which sorts reverse alphabetically, but the options are `asc`, `desc`, and `semver`.

### Build Metadata

In semver, the [build metadata](https://semver.org/#spec-item-10) is useful for identiftying the commit used in the build but does not affect the version.

Use `-g, --add-build-sha` to add the short hash to the build metadata.

_example_

```bash
$ GITHUB_TOKEN=... npx @robpc/git-semver robpc/config 24cbac1 -g
2.0.5-main.4+24cbac1
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

## Module

_NOTE: More options are available using this as a library, but needs more documentation. See the example below._

```js
import gitSemver from "@robpc/git-semver";

// ...

const token = process.env.GITHUB_TOKEN;

const branches: BranchOptions[] = [
  { filter: "(main|master)", prerelease: "rc", increment: "minor" },
  { filter: "hotfix-.*", sort: "asc", increment: "patch" },
  { filter: "dev(elop)?", prerelease: "beta" },
  { filter: ".*" },
];

const version = await gitSemver(token, owner, repo, ref, {
  branches,
});
```
