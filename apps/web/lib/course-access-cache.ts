/**
 * Cache for course access validation with localStorage persistence
 */
export class CourseAccessCache {
  private static CACHE_KEY = "course_access_cache";
  private static CACHE_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 days

  private static getCache(): Record<
    string,
    { hasAccess: boolean; timestamp: number }
  > {
    if (typeof window === "undefined") return {};

    try {
      const cached = localStorage.getItem(this.CACHE_KEY);
      return cached ? JSON.parse(cached) : {};
    } catch {
      return {};
    }
  }

  private static setCache(
    cache: Record<string, { hasAccess: boolean; timestamp: number }>
  ): void {
    if (typeof window === "undefined") return;

    try {
      localStorage.setItem(this.CACHE_KEY, JSON.stringify(cache));
    } catch {
      // Handle localStorage errors silently
    }
  }

  static get(courseId: string): boolean | null {
    const cache = this.getCache();
    const entry = cache[courseId];

    if (!entry) return null;

    // Check if cache entry is expired
    if (Date.now() - entry.timestamp > this.CACHE_EXPIRY) {
      this.remove(courseId);
      return null;
    }

    return entry.hasAccess;
  }

  static set(courseId: string, hasAccess: boolean): void {
    const cache = this.getCache();
    cache[courseId] = {
      hasAccess,
      timestamp: Date.now(),
    };
    this.setCache(cache);
  }

  static remove(courseId: string): void {
    const cache = this.getCache();
    delete cache[courseId];
    this.setCache(cache);
  }

  // static clear(): void {
  //   if (typeof window !== "undefined") {
  //     try {
  //       localStorage.removeItem(this.CACHE_KEY);
  //     } catch {
  //       // Handle localStorage errors silently
  //     }
  //   }
  // }
}
