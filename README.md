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

_example_

```bash
$ GITHUB_TOKEN=... npx @robpc/git-semver robpc/config 24cbac1
2.0.5-main.4
```

Requires a GitHub token in the env var `GITHUB_TOKEN`.

```
$ npx @robpc/git-semver --help
Usage: [options] <repository> <reference>

Arguments:
  repository                          github repository as <owner>/<name>
  reference                           commit reference to version

Options:
  -i, --increment <increment>         version increment size
                                      (choices: "none", "patch", "minor", "major", default: "patch")
  -b, --branch-filters <filter...>    list of branch filters in priority order
  -t, --tag-filters <filter...>       list of tag filters in priority order
  -s, --add-build-sha                 add git sha to the build metadata
  -d, --add-build-date [date-format]  add date to the build metadata, defaults to 'YYYYMMDD-HHmmss' if
                                      no format is supplied
  --branch-sort <sort>                sort method within branch filters
                                      (choices: "asc", "desc", "semver", default: "desc")
  --tag-sort <sort>                   sort method within tag filters
                                      (choices: "asc", "desc", "semver", default: "semver")
  -h, --help                          display help for command
```

### Options

#### Increment

When a version is found, the version will be incremented to the next patch version, use the `-i, --increment` option to choose `none`, `patch`, `minor`, or `major` instead.

_example_

```bash
$ GITHUB_TOKEN=... npx @robpc/git-semver robpc/config 24cbac1 -i major
3.0.0-main.4
```

#### Build Metadata

In semver, the [build metadata](https://semver.org/#spec-item-10) is useful for adding info about the build but does not affect the version.

Use `-s, --add-build-sha` to add the short hash to the build metadata.

_example_

```bash
$ GITHUB_TOKEN=... npx @robpc/git-semver robpc/config 24cbac1 -g
2.0.5-main.4+24cbac1
```

Use `-d, --add-build-date [format]` option to add a date string to the build metadata. If the option is used, but no format is supplied, the default format of `YYYYMMDD-HHmmss` will be used. The format string can be anything valid for the [dayjs library `format` function](https://day.js.org/docs/en/display/format) used to format the date. _Note: To maintain semver compatibility, only use `[0-9a-zA-Z-]` characters per the [semver documentation](https://semver.org/#spec-item-10)._

_examples_

```bash
$ GITHUB_TOKEN=... npx @robpc/git-semver robpc/config 24cbac1 -d
2.0.5-main.4+20220118-210623

$ GITHUB_TOKEN=... npx @robpc/git-semver robpc/config 24cbac1 -d 'YYYY-MM-DD.HHmma'
2.0.5-main.4+2022-01-18.2106pm
```

#### Branch Priority

Branches are searched in the order below by default:

- `(main|master)`
- `release-.*`
- `hotfix-.*`
- `dev(elop)?`
- `.*`

Use `-b, --branch-filters` options to supply a custom ordered list of filters. `git-semver` will look for branch that has the reference as a ancestor in the order dictated by the filter list. This is useful in situtation where a commit is the ancestor of multiple branches (ie after a merge). In that case, one can prioritize the `main` branch over a feature branch. When multiple branches match a filter they will be done in reverse alphabetical order.

Use the `--branch-sort` option to provide and alternative method for sorting branches that match a particular filter. The default is `desc` which sorts reverse alphabetically, but the options are `asc`, `desc`, and `semver`.

#### Tag Priority

Tags are searched in the order below by default:

- `v?\\d+(\\.\\d+)?(\\.\\d+)?(-.*)?`
- `.*`

Use `-t, --tag-filters` options to supply a custom ordered list of filters. `git-semver` will look for a tag that is the ancestor of the reference in the order dictated by the filter list. When multiple tags match a filter they will be done in semver order.

Use the `--tag-sort` option to provide and alternative method for sorting tags that match a particular filter. The default is `semver` which sorts according to sever rules, but the options are `asc`, `desc`, and `semver`.

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
