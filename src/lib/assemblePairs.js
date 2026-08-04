/** Build display rows from user layout + live raw_prices (WebAPI / DB). */
export function assemblePairs(userPairs, rawPrices = {}) {
  return (userPairs || []).map((pair) => {
    const leftTick = rawPrices[pair.left_symbol];
    const rightTick = rawPrices[pair.right_symbol];
    if (!leftTick || !rightTick) {
      return {
        id: pair.id,
        left: {
          label: pair.left_label || pair.left_symbol,
          symbol: pair.left_symbol,
          bid: null,
          ask: null,
          delta: null,
        },
        right: {
          label: pair.right_label || pair.right_symbol,
          symbol: pair.right_symbol,
          bid: null,
          ask: null,
          delta: null,
        },
        missing: true,
      };
    }

    // Always compute delta from THIS pair's legs (never reuse a shared
    // symbol's server delta — XAUUSD is paired with both GOLfs and GC3Z).
    const leftDelta = Number((leftTick.bid - rightTick.ask).toFixed(5));
    const rightDelta = Number((leftTick.ask - rightTick.bid).toFixed(5));

    return {
      id: pair.id,
      left: {
        label: pair.left_label || pair.left_symbol,
        symbol: pair.left_symbol,
        bid: leftTick.bid,
        ask: leftTick.ask,
        delta: leftDelta,
      },
      right: {
        label: pair.right_label || pair.right_symbol,
        symbol: pair.right_symbol,
        bid: rightTick.bid,
        ask: rightTick.ask,
        delta: rightDelta,
      },
      missing: false,
    };
  });
}
