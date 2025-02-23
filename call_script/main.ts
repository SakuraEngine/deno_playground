import { Glob } from "bun";
import * as url from "node:url";

// get script directory
const dirName = import.meta.dirname!;
const searchRoot = process.cwd();

console.log(`searchRoot: ${searchRoot}`);

// search all ts files in script directory
const glob = new Glob("**/script/**/*.ts");
for await (const file of glob.scan({ cwd: searchRoot, absolute: true})) {
  
  console.log(`===>running ${file}`);
  const module = await import(`${file}`);
  for (const key in module) {
    console.log(`[${typeof module[key]}] ${key}`);
  }
  console.log(`===>end running ${file}`);
}
