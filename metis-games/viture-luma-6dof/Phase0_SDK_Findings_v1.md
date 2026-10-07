# VITURE Luma Ultra Six Degrees of Freedom (6DoF) Proof of Concept: Phase 0 SDK Findings (v1)

Project: Metis: The Games, Test 1 (Tracking Diagnostic Scene)
Date: October 7, 2026
Status: **Waiting for David's approval before Phase 1.** No scene code has been written yet.

## Summary

| Question (Spec Section 5) | Finding | Confidence |
|---|---|---|
| Which Software Development Kit (SDK) gives positional (6DoF) pose on Windows with a USB-tethered Luma Ultra? | The **VITURE Glasses SDK (native C)**, through its "Carina" device API (`viture_device_carina.h`). | High |
| Can the VITURE XR SDK for Unity be used on a Windows PC host? | **No, not today.** Version 0.7.0 targets the VITURE Pro Neckband (an Android build target). VITURE says a Windows SDK "may follow later," with no date. | High |
| Required firmware version | **Not published** in any source I could reach. | Unknown |
| Required SpaceWalker version | "Latest" SpaceWalker for Windows. It includes the USB driver and turns on 6DoF. No minimum version number is published. | Medium |
| Supported Unity versions | For the native plugin path, any Unity version that can load a Windows x86_64 native DLL through Platform Invoke (P/Invoke). Recommended: **Unity 6 Long-Term Support (LTS) (6000.0.x)**, the same minimum the VITURE Unity XR SDK requires, so a later move to that SDK is easy. | Medium |
| Required Windows redistributables or drivers | Driver: comes with SpaceWalker for Windows. Microsoft Visual C++ Redistributable: **likely needed, not confirmed** until the SDK package is opened. | Low |

**Recommendation:** Build Test 1 in Unity 6 LTS. Wrap the native C Glasses SDK (Windows x86_64 DLL) in a small C# P/Invoke layer. Poll the Carina 6DoF pose once per frame and drive the Unity camera from it.

## 1. The three SDKs

### 1.1 VITURE Glasses SDK (native C). Recommended for Test 1.
- VITURE calls it "the official C SDK," providing "USB device management, head tracking (IMU / 6DoF VIO), display control, and pass-through camera streaming." Here IMU means Inertial Measurement Unit and VIO means Visual-Inertial Odometry.
- Platforms: **Windows x86_64**, Linux (x86_64, aarch64), macOS (aarch64), Android, and WebAssembly. Luma Ultra is **not** supported in the browser build.
- Its hardware table lists Luma Ultra as supporting "3/6DoF," with pass-through (USB Video Class, UVC) cameras and stereo (VIO) cameras.
- The Luma Ultra uses the **Carina API** (`viture_device_carina.h`). The tracking (VIO) runs on a chip inside the glasses. Your application **polls** the pose each frame. This is different from the older glasses, which push data through callbacks (`register_imu_pose_callback`).
- Lifecycle functions, from `viture_glasses_provider.h`: `xr_device_provider_initialize` → `xr_device_provider_start` → poll `get_gl_pose_carina` in a loop → `xr_device_provider_stop` → `xr_device_provider_shutdown` → `xr_device_provider_destroy`. The Carina API also provides pose reset (useful for the A-button recenter) and switching between 3DoF and 6DoF (useful for the "6DoF available" prerequisite check).

### 1.2 VITURE XR SDK for Unity (v0.7.0). Not usable on Windows today.
- Provides 6DoF head tracking and 26-joint hand tracking through Unity's XR framework and the XR Interaction Toolkit.
- Requires Unity 6000.0 or newer with **Android Build Support**. It is built for the **VITURE Pro Neckband**. VITURE's buyer's guide says "a Windows SDK may follow later, but no exact date yet," and has used the same wording in both its 2025 and 2026 editions.
- Worth revisiting in later phases (for example, for hand tracking) if VITURE ships Windows support.

### 1.3 Linux SDK. Not used for Test 1.
- The public Linux driver (v2.4.0) supports the older glasses through callbacks. Open-source Linux drivers do not support the Luma Ultra yet. They are waiting on the Carina-capable SDK. Noted for the later Jetson Orin Nano and Raspberry Pi phase.

## 2. Risks and open questions

1. **I could not download the SDK.** This cloud session's network blocks `viture.com`, `developer.viture.com`, and the VITURE firmware page. All findings above come from search-index excerpts of VITURE's own pages plus third-party sources. Before Phase 1, someone needs to download the Glasses SDK on David's Windows machine and confirm:
   - the Windows DLL and import library names
   - the exact `get_gl_pose_carina` signature, units (meters or centimeters), and quaternion order and handedness
   - the pose update rate and any timestamp field
   - the Visual C++ runtime version the DLL needs
   - the required firmware version
2. **Device ownership conflict with SpaceWalker.** A third-party wrapper (`viture_kit` on pub.dev) warns that when its SDK opens the glasses, it "will claim ownership of the IMU," and SpaceWalker's head tracking stops. Expect to **keep SpaceWalker installed (for the driver and firmware updates) but closed** while the test runs. I will confirm this on hardware.
3. **Coordinate conversion.** Unity uses a left-handed coordinate system with Y up. The SDK's pose frame is not documented in the excerpts I could reach. A wrong axis or sign would make Sway, Heave, or Surge look broken even when tracking is fine. The Phase 2 readout will make any such mistake obvious right away.
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
| Microsoft Visual C++ Redistributable (x64), only if the SDK DLL requires it | Runtime for the native DLL |

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
