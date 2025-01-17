import * as test from "@skr/test.ts";

console.log("Hello from c.ts");

const _privateValue = "private";

export const publicValue = "public";
export function publicFunction() {
  console.log("Hello from c.ts");
}

export const fuck = test.fuck;
