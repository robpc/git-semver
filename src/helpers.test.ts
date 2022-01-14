import { gentleCoerce, sanitizePrerelease, sortByRegexList } from "./helpers";

describe("gentleCoerce", () => {
  test("does not touch valid semver", () => {
    expect(gentleCoerce("1.0.0")).toBe("1.0.0");
    expect(gentleCoerce("v1.0.0")).toBe("1.0.0");
    expect(gentleCoerce("1")).toBe("1.0.0");
    expect(gentleCoerce("v1")).toBe("1.0.0");
  });
  test("does change trailing version", () => {
    expect(gentleCoerce("v1.0.0-alpha.2")).toBe("1.0.0");
    expect(gentleCoerce("v1.0.0fdsgfdg fdgsfdgGRESTeT WRET GS")).toBe("1.0.0");
  });
  test("makes failback version for non-version", () => {
    expect(gentleCoerce(undefined)).toBe("0.0.0");
    expect(gentleCoerce("version")).toBe("0.0.0");
  });
});

describe("sortByRegexList", () => {
  test("sorts asc", () => {
    expect(
      sortByRegexList(
        ["a", "sw", "cdb", "b1", "1"],
        [{ filter: ".*", sort: "asc" }]
      )
    ).toStrictEqual(["1", "a", "b1", "cdb", "sw"]);
  });
  test("sorts desc", () => {
    expect(
      sortByRegexList(
        ["a", "sw", "cdb", "b1", "1"],
        [{ filter: ".*", sort: "desc" }]
      )
    ).toStrictEqual(["sw", "cdb", "b1", "a", "1"]);
  });
  test("sorts semver", () => {
    expect(
      sortByRegexList(
        ["v1.0.1", "0.9", "0.9.1", "1.1.0", "1"],
        [{ filter: ".*", sort: "semver" }]
      )
    ).toStrictEqual(["1.1.0", "v1.0.1", "1", "0.9.1", "0.9"]);
  });
  test("sorts filter", () => {
    expect(
      sortByRegexList(
        ["main", "dev", "v1.0", "2.6"],
        [
          { filter: "(main|master)" },
          { filter: "dev(elop)?" },
          { filter: ".*" },
        ]
      )
    ).toStrictEqual(["main", "dev", "2.6", "v1.0"]);
  });
});

describe("sanitizePrerelease", () => {
  test("does not touch valid", () => {
    expect(sanitizePrerelease("mAin12-")).toBe("mAin12-");
  });
  test("does change underscores", () => {
    expect(sanitizePrerelease("feature_two")).toBe("feature-two");
  });
  test("does change periods", () => {
    expect(sanitizePrerelease("feature.two")).toBe("feature-two");
  });
  test("does change slashes", () => {
    expect(sanitizePrerelease("feature/two")).toBe("feature-two");
  });
  test("does remove other symbols", () => {
    expect(sanitizePrerelease("m$y#b@r!a%n^c&h*()")).toBe("mybranch");
  });
  test("does multiples of everything", () => {
    expect(sanitizePrerelease("my$#@!%^&*()branch/is-the__best")).toBe(
      "mybranch-is-the--best"
    );
  });
});
