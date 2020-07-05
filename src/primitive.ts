
/** 32-bit integer (signed). */
type int = number;

/**
 * 64-bit integer (signed).
 * NOTE: Precision loss for numbers over Number.MAX_SAFE_INTEGER (~9 quadrilion).
 */
type long = number;

/** 32-bit single-precision float. */
type float = number;

/** 64-bit double-precision float. */
type double = number;

// TODO
// /** Type representing JSON primitives. */
// type Json = string | number | boolean | Array<Json> | { [key: string]: Json };
