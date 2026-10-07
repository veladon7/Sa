# VITURE Luma Ultra Six Degrees of Freedom (6DoF) Proof of Concept: Phase 0 SDK Findings (v4)

Project: Metis: The Games, Test 1 (Tracking Diagnostic Scene)
Date: October 7, 2026 (v4: checked all headers and the Windows DLLs. v3: added the VITURE Glasses SDK 2.4.0 documentation, read directly. v2: added the Unity SDK v0.9.0 package check)
Status: **Phase 0 complete except one missing file (`opencv_world4100.dll`; see Section 0.6). Waiting for David's approval before Phase 1.** No scene code has been written yet.

## Summary

| Question (Spec Section 5) | Finding | Confidence |
|---|---|---|
| Which Software Development Kit (SDK) gives positional (6DoF) pose on Windows with a USB-tethered Luma Ultra? | The **VITURE Glasses SDK (native C)**, through its "Carina" device API (`viture_device_carina.h`). | High |
| Can the VITURE XR SDK for Unity be used on a Windows PC host? | **No. Confirmed by opening the package.** The latest version (0.9.0, August 20, 2026) is Android/Neckband only (see Section 1.2). | Confirmed |
| Required firmware version | **No minimum stated** for the Luma Ultra in SDK 2.4.0. The app will read and log it with `get_glasses_version`. | Medium |
| Required SpaceWalker version | "Latest" SpaceWalker for Windows. It includes the USB driver and turns on 6DoF. No minimum version number is published. | Medium |
| Supported Unity versions | For the native plugin path, any Unity version that can load a Windows x86_64 native DLL through Platform Invoke (P/Invoke). Recommended: **Unity 6 Long-Term Support (LTS) (6000.0.x)**, the same minimum the VITURE Unity XR SDK requires, so a later move to that SDK is easy. | Medium |
| Required Windows redistributables or drivers | **Visual C++ 2015–2022 Redistributable (x64): required** (confirmed from the DLL imports). USB driver: from SpaceWalker. Media Foundation: built into Windows 11 Pro. | High |

**Recommendation (confirmed by the SDK documentation):** Build Test 1 in Unity 6 LTS. Wrap the native C Glasses SDK (Windows x86_64 DLL) in a small C# P/Invoke layer. Poll the Carina 6DoF pose once per frame and drive the Unity camera from it.

## 0. Confirmed from the Glasses SDK 2.4.0 documentation (v3)

David downloaded `viture_glasses_sdk.zip`. It holds the **documentation only** (HTML, SDK version **2.4.0**). It has no library or header files. Everything below is quoted or derived from those pages.

### 0.1 Platform and package
- "Official C SDK… works on Linux, macOS, **Windows (x86_64)**, and Android."
- The Windows build ships as **`libglasses.dll`**. The headers are `viture_glasses_provider.h`, `viture_device.h`, `viture_device_carina.h`, `viture_protocol_public.h`, `viture_result.h`, and `hidapi.h`. Exported functions are marked `__declspec(dllexport)` on Windows, so Unity can call them through Platform Invoke (P/Invoke).
- Supported hardware: **Luma Ultra = "3/6DOF," device family "Carina."** All VITURE glasses use USB Vendor ID (VID) `0x35CA`.
- **The 6DoF engine is a separate file.** Starting in 2.4.0, the Carina Visual-Inertial Odometry (VIO) engine (`libcarina_vio`, which depends on **OpenCV 4.2**) is loaded at runtime. "6DoF simply becomes unavailable" if it is missing. The SDK still loads without it. **So the prerequisite panel must check that 6DoF actually started**, not just that the DLL loaded. This is exactly the "nothing fails silently" rule in Spec Section 6.

### 0.2 Head-pose API for the Luma Ultra (Carina)
| Item | Detail |
|---|---|
| Lifecycle | `xr_device_provider_create(pid)` → `set_dof_type_carina(h, 1)` (**after** create, **before** initialize; default is already 6DoF) → `initialize(h, NULL, NULL)` → `start(h)` → poll → `stop` → `shutdown` → `destroy` (always in this order, even on error) |
| Read pose | `xr_device_provider_get_gl_pose_carina(h, float pose[7], double predict_time, int* pose_status)` |
| Pose layout | `[px, py, pz, qw, qx, qy, qz]`. **Position is in meters.** The quaternion is scalar-first. |
| Coordinate frame | OpenGL, **right-handed**: X right, Y up, **Z backward** |
| Threading | "Must be polled on a **dedicated background thread**; do not call on the main thread." |
| Poll rate | Your choice. The docs show 8 ms (125 hertz, Hz). Polling every 1 ms reaches 1000 Hz. |
| `predict_time` | **Seconds** (2.4.0 release note: the older docs wrongly said nanoseconds, and the "16e6" example on the Head Tracking page is still wrong). Use about `0.016` for 16 ms of lookahead, or `0.0` for none. |
| `pose_status` | 0 = stable, 1 = unstable (briefly after startup or a sudden movement) |
| Recenter (A button) | `xr_device_provider_reset_origin_carina(h, currentPose)`: lightweight. It resets **position and yaw only**. "**Pitch and roll remain gravity-anchored**." |
| Hard reset (tracking lost) | `xr_device_provider_reset_pose_carina(h)`: full VIO restart that briefly interrupts tracking |
| 3DoF/6DoF switch | No switch during a session. Requires a full stop → destroy → create cycle. |
| Optional | Raw IMU, display VSync, and stereo-camera callbacks through `register_callbacks_carina`. A 25 Hz pose callback exists, but it is "usually unneeded." |
| Diagnostics | `get_glasses_version` (firmware string), `get_market_name` ("Luma Ultra"), `set_log_hook` and `set_log_level`, and error codes 0 to −10 and −99 (for example −2 USB unavailable, −4 not supported, −10 invalid state) |

### 0.3 Finding the glasses on Windows
- The Luma Ultra control interface uses **USB bulk transfer, not HID**. "hidapi may not enumerate it." On Windows the docs say to use **SetupAPI** (`SetupDiGetClassDevs` + `SPDRP_HARDWAREID`) and filter for VID `0x35CA`. Then confirm each Product ID (PID) with `xr_device_provider_is_product_id_valid` before `create`.
- The Luma Ultra's pass-through camera is a separate USB Video Class (UVC) device (`0x0C45:0x636B`). It is not needed for Test 1.

### 0.4 Converting to Unity coordinates
Unity is **left-handed** (X right, Y up, **Z forward**). Mirroring the Z axis gives:
- position: `(px, py, -pz)`
- rotation: `Quaternion(-qx, -qy, qz, qw)` (Unity's constructor order is x, y, z, w)

With this conversion, a "lean in" (Surge) toward the screen reads as a **positive** Z change in Unity. I will confirm the signs on hardware in the first Phase 2 run.

### 0.5 Effect on the Test 1 design
- **Recenter behavior needs David's decision.** The SDK's recenter zeroes yaw, Sway, Heave, and Surge, but it leaves pitch and roll measured against gravity. This is correct physically: the horizon stays level. Spec Section 7 says "zero all six values." Recommended: use the SDK recenter, and show pitch and roll relative to gravity (level head = 0°). Alternative: also subtract pitch and roll in the readout only.
- The tracking state shown in the readout (6DoF, 3DoF, or lost) will come from three signals: the return code, `pose_status`, and whether the pose has stopped changing (stall timer).

### 0.6 Windows binaries (checked by reading the DLL import and export tables, without running them)
| File | What it is | Depends on |
|---|---|---|
| `glasses.dll` (2.1 MB) | Main SDK. **Exports all 67 functions in the headers**, including every `*_carina` call. Note: the docs call it `libglasses.dll`, but the real file name is `glasses.dll`. | Microsoft Visual C++ runtime (MSVCP140, VCRUNTIME140, VCRUNTIME140_1), Windows Media Foundation (built into Windows 11 Pro), loads `carina_vio.dll` at runtime |
| `carina_vio.dll` (16.7 MB) | Luma Ultra 6DoF tracking engine | **`opencv_world4100.dll`** (OpenCV **4.10**, not 4.2 as the docs say), `glew32.dll`, `libusb-1.0.dll`, Visual C++ runtime, OpenGL |
| `glew32.dll` | OpenGL helper | OpenGL (built into Windows) |
| `libusb-1.0.dll` | USB access library | Visual C++ runtime |
| `glasses.lib` | C/C++ link library | Not needed for Unity (Unity calls `glasses.dll` directly) |

**Missing: `opencv_world4100.dll`.** `carina_vio.dll` cannot load without it. When that happens, `glasses.dll` logs "libcarina_vio not available, P6S is unsupported on this device" and **falls back to rotation only (3DoF)**. This file is probably in David's `x86_64` folder but was too large to upload (often 60 MB or more). It must be copied next to the others. The startup check will catch it if it is missing.

**Required runtime:** Microsoft Visual C++ 2015–2022 Redistributable (x64). Many PCs already have it, because games and apps install it.

**Calibration cache:** `glasses.dll` can keep a calibration cache (`VITURE_CALIBRATION_CACHE_v1_`) if `initialize` is given a `cache_file_dir`. The Unity app will pass its own data folder, so startup is faster after the first run.

**Unity calls:** every function is plain C with one calling convention on x64, so C# `[DllImport("glasses")]` works without a C++ wrapper DLL.

## 1. The three SDKs

### 1.1 VITURE Glasses SDK (native C). Recommended for Test 1.
- VITURE calls it "the official C SDK," providing "USB device management, head tracking (IMU / 6DoF VIO), display control, and pass-through camera streaming." Here IMU means Inertial Measurement Unit and VIO means Visual-Inertial Odometry.
- Platforms: **Windows x86_64**, Linux (x86_64, aarch64), macOS (aarch64), Android, and WebAssembly. Luma Ultra is **not** supported in the browser build.
- Its hardware table lists Luma Ultra as supporting "3/6DoF," with pass-through (USB Video Class, UVC) cameras and stereo (VIO) cameras.
- The Luma Ultra uses the **Carina API** (`viture_device_carina.h`). The tracking (VIO) runs on a chip inside the glasses. Your application **polls** the pose each frame. This is different from the older glasses, which push data through callbacks (`register_imu_pose_callback`).
- Lifecycle functions, from `viture_glasses_provider.h`: `xr_device_provider_initialize` → `xr_device_provider_start` → poll `get_gl_pose_carina` in a loop → `xr_device_provider_stop` → `xr_device_provider_shutdown` → `xr_device_provider_destroy`. The Carina API also provides pose reset (useful for the A-button recenter) and switching between 3DoF and 6DoF (useful for the "6DoF available" prerequisite check).

### 1.2 VITURE XR SDK for Unity (v0.9.0). Confirmed not usable on Windows.
David downloaded `VITURE_XR_SDK_for_Unity.zip` (package `com.viture.xr`, version **0.9.0**, released August 20, 2026). I opened it and checked:
- **README requirements:** "Unity 6000.0 or later," "Unity Android Build Support module installed," and hardware "VITURE Pro Neckband with compatible XR glasses." Luma Ultra is listed as "6DoF tracking," but only through the Neckband.
- **Code is limited to Android.** The runtime assembly (`Viture.XR.asmdef`) only builds for `Android` and `Editor`. Every head-tracking call is wrapped in `#if UNITY_ANDROID && !UNITY_EDITOR`. On any other platform it logs "only available on VITURE Neckband."
- **No Windows native library.** The only native files are `VitureUnityXR.aar` and `xr-lib.aar`, which are Android libraries. There is no `.dll`.
- **Editor tooling is fixed to Android.** `VitureEditorUtils.cs` hard-codes `BuildTarget.Android`, and the build processor checks for Android.
- **Changelog (0.5.0 to 0.9.0):** none of these releases mention Windows or PC-tethered support.
- **Useful for later:** the API includes `HeadTracking.SetWorldOrigin()` for an instant recenter, plus `trackingStatus` with a `trackingStatusChanged` event (normal or degraded). The Test 1 scene should copy these ideas for its recenter and "lost" state, even though it can't call them on Windows.
- Its Unity requirement (6000.0, built against 6000.0.27f1) matches the Unity 6 LTS recommendation below.

### 1.3 Linux SDK. Not used for Test 1.
- The public Linux driver (v2.4.0) supports the older glasses through callbacks. Open-source Linux drivers do not support the Luma Ultra yet. They are waiting on the Carina-capable SDK. Noted for the later Jetson Orin Nano and Raspberry Pi phase.

## 2. Risks and open questions

1. **One file still to confirm:** `opencv_world4100.dll` (see Section 0.6). Everything else in the SDK has been received and checked: all headers, `glasses.dll`, `carina_vio.dll`, `glew32.dll`, `libusb-1.0.dll`. **Firmware:** SDK 2.4.0 states no minimum for the Luma Ultra. The app will read and log it at startup.
2. **Device ownership conflict with SpaceWalker.** A third-party wrapper (`viture_kit` on pub.dev) warns that when its SDK opens the glasses, it "will claim ownership of the IMU," and SpaceWalker's head tracking stops. Expect to **keep SpaceWalker installed (for the driver and firmware updates) but closed** while the test runs. I will confirm this on hardware.
3. **Coordinate conversion.** Now documented: OpenGL, right-handed, Z backward, meters (see Section 0.4). I will check the signs on hardware during the first Phase 2 run.
4. **This cloud environment cannot build or run the Windows test.** It runs Linux, has no Unity Editor, and has no glasses attached. I can write the Unity project, the C# scripts, and the documents here. The Windows executable build (`.exe`) and the hands-on test have to happen on David's Windows 11 Pro workstation.

## 3. Proposed Phase 1 plan (pending approval)

- Unity 6 LTS project `VitureLuma_6DoF_Test_v1`, using the Built-in or Universal Render Pipeline (URP), with Windows x86_64 as the only build target.
- `VitureNative.cs`: P/Invoke bindings to the Glasses SDK DLL, placed in `Assets/Plugins/x86_64/`.
- `VitureTracker.cs`: handles initialization, start, per-frame polling, and shutdown. Converts the pose into Unity coordinates. Exposes the tracking state (6DoF, 3DoF, or lost), the update rate in hertz (Hz), and the time since the last pose.
- `PrereqCheck.cs`: the status panel for the five checks in Spec Section 6. It never fails silently.
- Controller input through Unity's Input System package, using an Xbox gamepad (A, B, Y, Menu, and the left stick).

### Software that Phase 1 needs on the Windows machine (needs David's OK before installing)

| Item | Why |
|---|---|
| Unity Hub and Unity 6 LTS (6000.0.x), with the Windows Build Support module | Engine and build target |
| VITURE Glasses SDK (Windows x86_64) | 6DoF pose source (project-local, not installed system-wide) |
| VITURE SpaceWalker for Windows (latest) | USB driver, firmware updates, turning on 6DoF |
| Luma Ultra firmware update, through SpaceWalker or VITURE's firmware page | Required for 6DoF; exact version to be confirmed |
| Microsoft Visual C++ 2015–2022 Redistributable (x64): **required** (confirmed from the DLL imports); skip if already installed | Runtime for `glasses.dll` and `carina_vio.dll` |

## Sources
- VITURE XR Glasses SDK: https://www.viture.com/developer/glasses-sdk/glasses
- VITURE XR SDK for Unity: https://www.viture.com/developer/unity-sdk/unity
- VITURE Unity XR SDK documentation (v0.7.0): https://developer.viture.com/unity/viture_unity_xr_sdk_doc
- VITURE Unity Getting Started: https://developer.viture.com/unity/getting_started
- VITURE buyer's guide (Windows SDK timing): https://www.viture.com/academy/blog/the-ultimate-guide-to-choosing-your-new-viture-glasses-luma-pro-luma-ultra-luma-and-the-beast
- VITURE Luma Ultra product page: https://www.viture.com/product/viture-luma-ultra-xr-glasses
- VITURE firmware update: https://www.viture.com/firmware/update
- viture_kit (Dart wrapper; SpaceWalker IMU ownership note): https://pub.dev/documentation/viture_kit/0.2.1/
- omarchy-xr issue on the Carina SDK path: https://github.com/afruth/omarchy-xr/issues/21
- XRLinuxDriver issue on Luma Ultra Linux support: https://github.com/wheaney/XRLinuxDriver/issues/105
