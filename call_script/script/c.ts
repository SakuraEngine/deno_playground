console.log("Hello from c.ts");

// private value
const _privateValue = "private";

// export interface
export interface PublicInterface {
  name: string;
}

// export value
export const publicValue = "public";

// export function
export function publicFunction() {
  console.log("Hello from c.ts");
}

// export from another module
// export * as test from "@skr/test.ts";
