import type { IFilter } from '../types';

export function getFiltersGainAtFreq(filters: IFilter[], freq: number): number {
  let output = 0;

  for (const filter of filters) {
    output += filter.gain * Math.exp(-Math.pow(freq - filter.centerFreq, 2) / Math.pow(filter.bandwidth / 2, 2));
  }

  return output;
}
