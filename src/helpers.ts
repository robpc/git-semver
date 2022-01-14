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
import semverRcompare from "semver/functions/rcompare.js";
import semverCoerce from "semver/functions/coerce.js";

import { SortOptions } from "./types";

const startsWithVersion = new RegExp(/v?\d.*/);
const gentleCoerce = (v: string): string => {
  return startsWithVersion.test(v) ? semverCoerce(v).version : "0.0.0";
};

const sortByRegexList = (
  names: Array<string>,
  priority: Array<{ filter: string; sort?: SortOptions }>
): Array<string> => {
  return priority.reduce((arr, { filter, sort }) => {
    const r = new RegExp(`^${filter}$`);
    const filtered = names.filter(
      (name) => r.test(name) && !arr.includes(name)
    );

    if (sort != "none") {
      if (sort == "asc") {
        filtered.sort();
      } else if (sort == "desc") {
        filtered.sort().reverse();
      } /*if (sort == "semver")*/ else {
        filtered.sort((v1, v2) =>
          semverRcompare(gentleCoerce(v1), gentleCoerce(v2))
        );
      }
    }

    return [...arr, ...filtered];
  }, []);
};

const sanitizePrerelease = (text: string) =>
  text ? text.replace(/[_\.\/]/g, "-").replace(/[^0-9a-zA-Z-]+/g, "") : text;

export { gentleCoerce, sortByRegexList, sanitizePrerelease };
