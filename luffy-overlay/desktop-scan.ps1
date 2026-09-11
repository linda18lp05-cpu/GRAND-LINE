Add-Type -TypeDefinition @"
using System;
using System.Text;
using System.Collections.Generic;
using System.Runtime.InteropServices;

public static class DeskIcons {
  [DllImport("user32.dll", CharSet = CharSet.Unicode)] static extern IntPtr FindWindow(string c, string w);
  [DllImport("user32.dll", CharSet = CharSet.Unicode)] static extern IntPtr FindWindowEx(IntPtr p, IntPtr c, string n, string w);
  [DllImport("user32.dll")] static extern IntPtr SendMessage(IntPtr h, uint m, IntPtr w, IntPtr l);
  [DllImport("user32.dll")] static extern bool GetWindowRect(IntPtr h, out RECT r);
  [DllImport("user32.dll")] static extern uint GetWindowThreadProcessId(IntPtr h, out uint pid);
  [DllImport("kernel32.dll")] static extern IntPtr OpenProcess(uint a, bool i, uint p);
  [DllImport("kernel32.dll")] static extern IntPtr VirtualAllocEx(IntPtr h, IntPtr a, uint s, uint t, uint p);
  [DllImport("kernel32.dll")] static extern bool VirtualFreeEx(IntPtr h, IntPtr a, uint s, uint t);
  [DllImport("kernel32.dll")] static extern bool ReadProcessMemory(IntPtr h, IntPtr a, byte[] b, int s, out int r);
  [DllImport("kernel32.dll")] static extern bool WriteProcessMemory(IntPtr h, IntPtr a, byte[] b, int s, out int w);
  [DllImport("kernel32.dll")] static extern bool CloseHandle(IntPtr h);

  [StructLayout(LayoutKind.Sequential)]
  struct RECT { public int L, T, R, B; }

  [StructLayout(LayoutKind.Sequential)]
  struct POINT { public int X, Y; }

  [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)]
  struct LVITEM {
    public uint mask;
    public int iItem;
    public int iSubItem;
    public uint state;
    public uint stateMask;
    public IntPtr pszText;
    public int cchTextMax;
    public int iImage;
    public IntPtr lParam;
  }

  const uint LVM_FIRST = 0x1000;
  const uint LVM_GETITEMCOUNT = LVM_FIRST + 4;
  const uint LVM_GETITEMPOSITION = LVM_FIRST + 16;
  const uint LVM_GETITEMTEXTW = LVM_FIRST + 115;
  const uint PROCESS_VM = 0x0438;
  const uint MEM_COMMIT = 0x1000;
  const uint PAGE_RW = 0x04;
  const uint MEM_RELEASE = 0x8000;

  static IntPtr ListView() {
    IntPtr progman = FindWindow("Progman", "Program Manager");
    IntPtr def = FindWindowEx(progman, IntPtr.Zero, "SHELLDLL_DefView", null);
    if (def == IntPtr.Zero) {
      IntPtr worker = IntPtr.Zero;
      for (int i = 0; i < 64; i++) {
        worker = FindWindowEx(IntPtr.Zero, worker, "WorkerW", null);
        if (worker == IntPtr.Zero) break;
        def = FindWindowEx(worker, IntPtr.Zero, "SHELLDLL_DefView", null);
        if (def != IntPtr.Zero) break;
      }
    }
    return FindWindowEx(def, IntPtr.Zero, "SysListView32", "FolderView");
  }

  public static string Json() {
    IntPtr lv = ListView();
    if (lv == IntPtr.Zero) return "[]";
    RECT wr;
    GetWindowRect(lv, out wr);
    int count = SendMessage(lv, LVM_GETITEMCOUNT, IntPtr.Zero, IntPtr.Zero).ToInt32();
    uint pid;
    GetWindowThreadProcessId(lv, out pid);
    IntPtr proc = OpenProcess(PROCESS_VM, false, pid);
    if (proc == IntPtr.Zero) return "[]";
    var sb = new StringBuilder();
    sb.Append("[");
    bool first = true;
    IntPtr remotePt = VirtualAllocEx(proc, IntPtr.Zero, 8, MEM_COMMIT, PAGE_RW);
    IntPtr remoteTxt = VirtualAllocEx(proc, IntPtr.Zero, 1024, MEM_COMMIT, PAGE_RW);
    IntPtr remoteLv = VirtualAllocEx(proc, IntPtr.Zero, 256, MEM_COMMIT, PAGE_RW);
    try {
      for (int i = 0; i < count && i < 40; i++) {
        SendMessage(lv, LVM_GETITEMPOSITION, new IntPtr(i), remotePt);
        byte[] pt = new byte[8];
        int read;
        ReadProcessMemory(proc, remotePt, pt, 8, out read);
        int x = BitConverter.ToInt32(pt, 0) + wr.L;
        int y = BitConverter.ToInt32(pt, 4) + wr.T;

        var item = new LVITEM();
        item.mask = 1;
        item.iItem = i;
        item.iSubItem = 0;
        item.pszText = remoteTxt;
        item.cchTextMax = 260;
        int lvSize = Marshal.SizeOf(typeof(LVITEM));
        IntPtr local = Marshal.AllocHGlobal(lvSize);
        Marshal.StructureToPtr(item, local, false);
        byte[] raw = new byte[lvSize];
        Marshal.Copy(local, raw, 0, lvSize);
        Marshal.FreeHGlobal(local);
        int wrote;
        WriteProcessMemory(proc, remoteLv, raw, lvSize, out wrote);
        SendMessage(lv, LVM_GETITEMTEXTW, new IntPtr(i), remoteLv);
        byte[] textBuf = new byte[520];
        ReadProcessMemory(proc, remoteTxt, textBuf, 520, out read);
        string name = Encoding.Unicode.GetString(textBuf).TrimEnd('\0');
        int z = name.IndexOf('\0');
        if (z >= 0) name = name.Substring(0, z);
        name = name.Replace("\\", "\\\\").Replace("\"", "\\\"");
        if (!first) sb.Append(",");
        first = false;
        sb.Append("{\"name\":\"" + name + "\",\"x\":" + x + ",\"y\":" + y + "}");
      }
    } finally {
      VirtualFreeEx(proc, remotePt, 0, MEM_RELEASE);
      VirtualFreeEx(proc, remoteTxt, 0, MEM_RELEASE);
      VirtualFreeEx(proc, remoteLv, 0, MEM_RELEASE);
      CloseHandle(proc);
    }
    sb.Append("]");
    return sb.ToString();
  }
}
"@ -Language CSharp

[DeskIcons]::Json()
