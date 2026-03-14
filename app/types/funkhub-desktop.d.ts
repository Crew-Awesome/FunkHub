import type { DesktopBridge } from "../services/funkhub";

declare global {
  interface Window {
    funkhubDesktop?: DesktopBridge;
  }
}

export {};
