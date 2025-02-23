import { ListLogicalDisks } from "./list_windows_disks.ts";
import { assertEquals } from "@std/assert";
import { memoize } from "@std/cache";
import { Glob } from "bun";

const glob = new Glob("./**/VC/Auxiliary/Build/vcvarsall.bat");
const findVCVars = async function () {
  const disks = await ListLogicalDisks();
  const files = new Array<string>();
  for (const disk of disks) {
    var searchRoot = `${disk}:/Program Files/Microsoft Visual Studio`;
    try {
      for await (const bat of glob.scan({ cwd: searchRoot, absolute: true }))
        files.push(bat);
    }
    catch (e: any) {
      if (e.code == "EPERM")
        console.log(e);
    }
  }
  return files;
}
const findOnce = memoize(findVCVars);
export function FindVCVars() {
  return findOnce();
}

import { test } from "bun:test";

test("FindVCVars", async () => {
  const bats = await FindVCVars();
  for (const bat of bats) {
  {
    console.log(bat);
    assertEquals(await Bun.file(bat).exists(), true);
  }
  }
});