import util from 'node:util';
import { exec } from 'node:child_process';
import { memoize } from "@std/cache";
import { assertEquals } from "@std/assert";
import { dlopen, FFIType, ptr } from "bun:ffi";

const execAsync = util.promisify(exec);
const listLogicalDisks1 = async function() {
  let str = (await execAsync('wmic logicaldisk get caption')).stdout.toString();
  str = str.replace('Caption', '');
  str = str.replace(/\s/g, '');
  str = str.replace(/\n/g, '');
  str = str.slice(0, -1);
  return str.split(":");
}

const {
  symbols: {
    GetLogicalDriveStringsW,
    uaw_wcslen,
    WideCharToMultiByte,
  },
} = dlopen(
  "Kernel32.dll", // a library name or file path
  {
    GetLogicalDriveStringsW: { args: [FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    uaw_wcslen: { args: [FFIType.ptr], returns: FFIType.u64 },
    WideCharToMultiByte: { args: [ FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.i32, FFIType.ptr, FFIType.i32, FFIType.ptr, FFIType.bool ], returns: FFIType.i32 },
  },
);
const listLogicalDisks2 = async function() {
  const disks = new Array<string>();
  const wide_buf = Buffer.allocUnsafe(256);
  const wide_length = GetLogicalDriveStringsW(256, wide_buf);
  // do split
  let offset = 0;
  while (offset <= wide_length) {
    const wide_ptr = ptr(wide_buf, offset);
    const wcslen = Number(uaw_wcslen(wide_ptr));
    // cast wide chars to utf8
    let u8_buf = null, u8_length = 0;
    {
      u8_length = WideCharToMultiByte(65001, 0, wide_ptr, -1, null, 0, null, false);
      u8_buf = Buffer.allocUnsafe(u8_length);
      WideCharToMultiByte(65001, 0, wide_ptr, -1, u8_buf, u8_length, null, false);
    }
    disks.push(u8_buf.toString().replaceAll(":\\\0", ""));
    offset += wcslen * 2 + 2;
  }
  return disks;
}
const listOnce = memoize(listLogicalDisks2);
export async function ListLogicalDisks() {
    return listOnce(); 
} 

import { test } from "bun:test";

test("ListLogicalDisks", async () => {
  const disks = await ListLogicalDisks();
  assertEquals(disks[0], "C");
  assertEquals(disks[1], "D");
});