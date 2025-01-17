import * as fs from "@std/fs";
import * as path from "@std/path";
import * as url from "node:url";

// get script directory
const dirName = import.meta.dirname!;
const workDir = Deno.cwd();

const isDenoRT = Deno.mainModule.includes("deno-compile");
const searchRoot = isDenoRT ? workDir : dirName;

console.log(`searchRoot: ${searchRoot}`);

// search all ts files in script directory
for (
  const file of fs.expandGlobSync("./script/**/*.ts", {
    root: searchRoot,
  })
) {
  console.log(`===>running ${file.path}`);
  const module = await import(`File:///${file.path}`);
  for (const key in module) {
    console.log(`[${typeof module[key]}] ${key}`);
  }
  console.log(`===>end running ${file.path}`);
}
