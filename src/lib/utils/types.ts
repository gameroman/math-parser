export type Value = {
  n: bigint; // Numerator
  d: bigint; // Denominator
  c?: "pi" | "e"; // Constant
  e?: bigint; // Constant exponent
};
