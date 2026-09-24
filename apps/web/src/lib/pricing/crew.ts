/** Crew-size multipliers (applied to the pre-crew move subtotal). */
export const CREW_MULTIPLIERS: Record<string, number> = {
  '1': 0,
  '2': 0.20,
  '3': 0.35,
  '4': 0.50,
};

export type CrewSize = '1' | '2' | '3' | '4';

/**
 * Pure finalisation function that reproduces the engine's finalizePricing logic
 * for a single (movePence, crewSize, dateFactor) triple.
 *
 * @param movePence          Pre-crew, pre-VAT subtotal in pence (may include customerAdjustment)
 * @param crewSize           Selected crew size
 * @param dateFactor         getDateFactor(dateKey, todayKey)
 * @param remoteSurchargePence Remote pickup surcharge in pence (0 if not applicable)
 * @param extrasPence        Extras cost ex-VAT in pence (0 until Phase 1)
 */
export function computeTotalPence(
  movePence: number,
  crewSize: CrewSize,
  dateFactor: number,
  remoteSurchargePence: number,
  extrasPence = 0
): number {
  const crew = movePence * (CREW_MULTIPLIERS[crewSize] ?? 0);
  // Date factor applies to move only; crew and extras are fixed
  const preVat = movePence * dateFactor + crew + extrasPence;
  return Math.round(preVat * 1.2) + remoteSurchargePence;
}
