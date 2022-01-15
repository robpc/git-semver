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

Branches are prioritized based on the following list:

- `(main|master)`
- `*v?\\d+(\\.\\d+)?(\\.\\d+)?`
- `release-.*`
- `hotfix-.*`
- `dev(elop)?`
- `.*`

## Usage

### Command Line

```bash
$ npx @robpc/git-semver {repository} {ref}
```

Also requires a GitHub token in the env var `GITHUB_TOKEN`

_example_

```bash
$ GITHUB_TOKEN=... npx @robpc/git-semver robpc/config 24cbac1 > version.txt
# ...
$ cat version.txt
2.0.5-main.4
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

Also requires a GitHub token in the env var `GITHUB_TOKEN`
