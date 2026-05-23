# Invest App: Comprehensive State Review

**Date**: May 22, 2026 | **Version**: 0.10.0

---

## TODOS

- Animated page transitions (slide-in, heading animations)
- Fix metrics separators not being animated
- Edit portfolio name/broker
- Delete portfolio (with confirmation)
- Portfolio performance metrics
- Predefined filters ("Accumulating only", "Fees < 0.5%", etc.)
- "Refresh all prices" button
- Correlation matrix, shows which assets move together via performance correlation over time
- Handle undo/redo on deletes/edits
- Auto import from broker APIs (Fortuneo, IB, etc.)
- Add unit/prefix to input fields (€, %, units)
- If ISIN renamed, dismissed similarities don't cascade

## Testing Gaps

### Coverage Holes

| Area                         | Coverage | Gap                                                              |
| ---------------------------- | -------- | ---------------------------------------------------------------- |
| **Asset import validation**  | ~70%     | Edge cases: malformed geoAllocation, missing fields              |
| **Portfolio calculations**   | ~80%     | Edge case: division by zero when totalValue = 0                  |
| **Similarity detection**     | ~60%     | No tests for threshold boundary conditions                       |
| **Data score computation**   | ~75%     | Missing tests for freshness age decay                            |
| **Export/import round-trip** | ~50%     | No regression test: export → import → export should be identical |

### Recommended Tests to Add

1. **Round-trip export/import** (2 hours)
   - Export data → import → verify identical structure
   - Catches schema drift bugs

2. **Allocation edge cases** (2 hours)
   - Portfolio with 0 assets
   - Portfolio with 1 asset (should be 100%)
   - Allocation sums > 100% (should cap "Other" at 0)

3. **Similarity threshold boundary** (1 hour)
   - Assets at exactly 85% similarity
   - Assets at 84.99% (should not trigger)

4. **Performance calculation edge cases** (1 hour)
   - Assets with no 1y data (should contribute 0 to blended score)
   - Assets with only 5y data (should be weighted correctly)
