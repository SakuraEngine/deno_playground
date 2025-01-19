import util from 'node:util';
import { exec } from 'node:child_process';
import { memoize } from "jsr:@std/cache";

const execAsync = util.promisify(exec);
const listLogicalDisks1 = async function() {
  let str = (await execAsync('wmic logicaldisk get caption')).stdout.toString();
  str = str.replace('Caption', '');
  str = str.replace(/\s/g, '');
  str = str.replace(/\n/g, '');
  str = str.slice(0, -1);
  return str.split(":");
}

const dlopen = memoize(Deno.dlopen);
const dylib = dlopen(
  "Kernel32",
  {
    "GetLogicalDriveStringsW": { parameters: ["u32", "buffer"], result: "u32" },
    "uaw_wcslen": { parameters: ["pointer"], result: "usize" },
    "WideCharToMultiByte": { parameters: ["u32", "u32", "pointer", "i32", "buffer", "i32", "pointer", "bool"], result: "i32" },
  } as const,
).symbols;
const listLogicalDisks2 = function() {
  const disks = new Array<string>();
  const wide_buf = Buffer.alloc(256);
  const wide_length = dylib.GetLogicalDriveStringsW(256, wide_buf);
  // do split
  const start = Deno.UnsafePointer.of(wide_buf) as Deno.PointerObject;
  let offset = 0;
  while (offset <= wide_length) {
    const wide_ptr = Deno.UnsafePointer.offset(start, offset) as Deno.PointerObject;
    const wcslen = Number(dylib.uaw_wcslen(wide_ptr));
    // cast wide chars to utf8
    let u8_buf = null, u8_length = 0;
    {
      u8_length = dylib.WideCharToMultiByte(65001, 0, wide_ptr, -1, null, 0, null, false);
      u8_buf = Buffer.alloc(u8_length);
      dylib.WideCharToMultiByte(65001, 0, wide_ptr, -1, u8_buf, u8_length, null, false);
    }
    disks.push(u8_buf.toString().replaceAll(":\\\0", ""));
    offset += wcslen * 2 + 2;
  }
  return disks;
}

const listOnce = memoize(listLogicalDisks2);
export function ListLogicalDisks() {
    return listOnce(); 
} 

import { assertEquals } from "@std/assert";
import { Buffer } from "node:buffer";
Deno.test(async function TestListDisks() {
    const disks = await ListLogicalDisks();
    assertEquals(disks[0], "C");
    assertEquals(disks[1], "D");
});