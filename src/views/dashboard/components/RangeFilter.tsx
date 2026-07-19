import { FilterChips } from '@/components/ui';
import type { TimeRange } from '../types';

type RangeFilterProps = {
  ranges: TimeRange[];
  selectedRange: TimeRange;
  onSelectRange: (range: TimeRange) => void;
};

export function RangeFilter({ ranges, selectedRange, onSelectRange }: RangeFilterProps) {
  return (
    <FilterChips
      options={ranges}
      selectedOption={selectedRange}
      onSelectOption={onSelectRange}
    />
  );
}
