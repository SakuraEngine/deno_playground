import { ListLogicalDisks } from "./list_windows_disks.ts";
import { memoize } from "jsr:@std/cache";
import * as fs from "@std/fs";

const findVCVars = async function() {
    const disks = await ListLogicalDisks();
    const files = new Array<string>();
    for (const disk of disks)
    {
        const bats = fs.expandGlob(`${disk}:/Program Files/Microsoft Visual Studio/*/*/VC/Auxiliary/Build/vcvarsall.bat`);
        for await (const bat of bats)
        {
            files.push(bat.path);
        }
    }
    return files;
}
const findOnce = memoize(findVCVars);
export function FindVCVars() {
    return findOnce(); 
} 

import { assertEquals } from "@std/assert";
Deno.test(async function TestFindVCVars() {
    const bats = await FindVCVars();
    for (const bat of bats)
    {
        assertEquals(await fs.exists(bat), true);
    }
});