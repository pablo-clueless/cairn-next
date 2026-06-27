/** One completed sprint's throughput. */
export interface VelocityPoint {
  sprint_id: string;
  sprint_name: string;
  completed_at: string | null;
  completed: number; // issues that ended done
  total: number; // issues in the sprint
}

/** Remaining (not-done) issue count on a given day of a sprint. */
export interface BurndownPoint {
  date: string; // YYYY-MM-DD
  remaining: number;
  ideal: number;
}

/** Per-category issue counts on a given day (cumulative flow). */
export interface CFDPoint {
  date: string; // YYYY-MM-DD
  todo: number;
  in_progress: number;
  done: number;
}
