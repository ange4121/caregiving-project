// Starting thresholds from CLAUDE.md "Gesture spec". Tune with real users.
// Distances are CSS px on the learner's screen; durations are ms.

/** A press shorter than this is a clean tap. */
export const TAP_MAX_MS = 500;
/** A press at least this long is a hold (the ring is full). 500–600 ms is the ambiguous band. */
export const HOLD_MIN_MS = 600;
/** Movement below this counts as "didn't move". */
export const STILL_MAX_PX = 15;
/** Net movement at least this far counts as a swipe. 15–40 px is a "wobble". */
export const SWIPE_MIN_PX = 40;
/** Minimum hit radius around a target, whatever the target's own size. */
export const MIN_HIT_RADIUS_PX = 60;
