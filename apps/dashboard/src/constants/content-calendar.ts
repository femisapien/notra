/** Monday first, like the rest of the dashboard's week pickers. */
export const CONTENT_CALENDAR_WEEK_STARTS_ON = 1;

/** Chips a month cell shows before collapsing the rest into "+N more". */
export const CONTENT_CALENDAR_MONTH_CELL_LIMIT = 3;

/** Default time for a post dropped on a day or scheduled for the first time. */
export const CONTENT_CALENDAR_DEFAULT_HOUR = 9;

/** Cap on projected automation runs per schedule and visible range. */
export const CONTENT_CALENDAR_MAX_PROJECTED_RUNS = 62;

export const CONTENT_CALENDAR_ACTIVE_POLL_MS = 15_000;
export const POST_SCHEDULE_ACTIVE_POLL_MS = 5000;
export const POST_SCHEDULE_IDLE_POLL_MS = 60_000;
/** Poll a post's schedule this close to its slot so the status flips live. */
export const POST_SCHEDULE_IMMINENT_WINDOW_MS = 2 * 60 * 1000;

export const CONTENT_CALENDAR_DRAG_MIME = "application/x-notra-calendar-post";
