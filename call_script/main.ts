import * as fs from "@std/fs";
import * as path from "@std/path";

const dirName = import.meta.dirname!;

for (const file of fs.expandGlobSync("./script/**/*.ts", { root: dirName })) {
  const relativePath = `./${path.relative(dirName, file.path)}`;

  console.log(`===>running ${relativePath}`);
  const module = await import(relativePath);
  for (const key in module) {
    console.log(`[${typeof module[key]}] ${key}`);
  }
  console.log(`===>end running ${relativePath}`);
}
