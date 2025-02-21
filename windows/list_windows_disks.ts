import util from 'node:util';
import { exec } from 'node:child_process';
import { memoize } from "@std/cache";

import { dlopen, FFIType, suffix } from "bun:ffi";
import { ptr } from "bun:ffi";

const Global = {
  isDeno: (globalThis as any).Deno?.version?.deno != null,
  isBun: (globalThis as any).Bun?.version != null,
};

if (Global.isBun) {
  console.log("This is a Bun script");
}
else if (Global.isDeno) {
  console.log("This is a Deno script");
}

const execAsync = util.promisify(exec);
const listLogicalDisks1 = async function() {
  let str = (await execAsync('wmic logicaldisk get caption')).stdout.toString();
  str = str.replace('Caption', '');
  str = str.replace(/\s/g, '');
  str = str.replace(/\n/g, '');
  str = str.slice(0, -1);
  return str.split(":");
}

var listLogicalDisks2;
if (Global.isDeno) {
  const dlopen = memoize(Deno.dlopen);
  const dylib = dlopen(
    "Kernel32",
    {
      "GetLogicalDriveStringsW": { parameters: ["u32", "buffer"], result: "u32" },
      "uaw_wcslen": { parameters: ["pointer"], result: "usize" },
      "WideCharToMultiByte": { parameters: ["u32", "u32", "pointer", "i32", "buffer", "i32", "pointer", "bool"], result: "i32" },
    } as const,
  ).symbols;
  listLogicalDisks2 = async function() {
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
        u8_buf = Buffer.allocUnsafe(u8_length);
        dylib.WideCharToMultiByte(65001, 0, wide_ptr, -1, u8_buf, u8_length, null, false);
      }
      disks.push(u8_buf.toString().replaceAll(":\\\0", ""));
      offset += wcslen * 2 + 2;
    }
    return disks;
  }
}
if (Global.isBun) {
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
  listLogicalDisks2 = async function() {
    const disks = new Array<string>();
    const wide_buf = Buffer.allocUnsafe(256);
    const wide_length = GetLogicalDriveStringsW(256, wide_buf);
    // do split
    const start = ptr(wide_buf);
    let offset = 0;
    while (offset <= wide_length) {
      const wide_ptr = start + offset;
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
}

const listOnce = memoize(listLogicalDisks2);
export async function ListLogicalDisks() {
    return listOnce(); 
} 

import { assertEquals } from "@std/assert";
import { Buffer } from "node:buffer";
if (Global.isDeno) {
  Deno.test(async function TestListDisks() {
    const disks = await ListLogicalDisks();
    assertEquals(disks[0], "C");
    assertEquals(disks[1], "D");
  });
}

import { test } from "bun:test";
if (Global.isBun) {
  test("ListLogicalDisks", async () => {
    const disks = await ListLogicalDisks();
    assertEquals(disks[0], "C");
    assertEquals(disks[1], "D");
  });
}