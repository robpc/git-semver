export type SortOptions = "none" | "asc" | "desc" | "semver";
export type IncrementOptions = "none" | "patch" | "minor" | "major";

export interface BranchOptions {
  filter: string;
  prerelease?: string;
  sort?: SortOptions;
  increment?: IncrementOptions;
}

export interface TagOptions {
  filter: string;
  sort?: SortOptions;
}

export interface TagVersionOptions {
  branches?: Array<BranchOptions>;
  tags?: Array<TagOptions>;
}
