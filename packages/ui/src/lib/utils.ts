import { clsx, type ClassValue } from "clsx";
import { ImperativePanelHandle } from "react-resizable-panels";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getLocalStorage(key: string) {
  if (typeof window !== "undefined") {
    return JSON.parse(localStorage.getItem(key) || "[]");
  }
  return [];
}

export function generateUUID(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function capitalizeFirstLetter(string: string): string {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

export function debounce<F extends (...args: any[]) => any>(
  func: F,
  waitMilliseconds: number
): F & { cancel: () => void } {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  const debounced = function (this: any, ...args: any[]) {
    const context = this;

    const later = () => {
      timeoutId = undefined;
      func.apply(context, args);
    };

    clearTimeout(timeoutId);
    timeoutId = setTimeout(later, waitMilliseconds);
  } as F & { cancel: () => void };

  debounced.cancel = function () {
    clearTimeout(timeoutId);
  };

  return debounced;
}

export function resizeEditor(
  panelRef: React.RefObject<ImperativePanelHandle | null>,
  collapse?: boolean
) {
  if (panelRef.current?.isCollapsed()) {
    panelRef.current?.resize(50);
  } else if (collapse) {
    panelRef.current?.collapse();
  }
}
