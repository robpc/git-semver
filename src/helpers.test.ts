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
        ["main", "dev", "bob", "tim"],
        [
          { filter: "(main|master)" },
          { filter: "dev(elop)?" },
          { filter: ".*" },
        ]
      )
    ).toStrictEqual(["main", "dev", "tim", "bob"]);
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
