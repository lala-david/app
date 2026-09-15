import { ScrollView, StyleSheet } from 'react-native';

import { config } from '@/entities/content/content';
import { addDays, type DateKey } from '@/entities/course/calendar';
import { strings } from '@/shared/i18n/strings.ko';
import { shortDate } from '@/shared/lib/format';
import { Chip } from '@/shared/ui/Choice';
import { spacing } from '@/shared/theme/tokens';

interface Props {
  today: DateKey;
  value: DateKey;
  onChange: (date: DateKey) => void;
}

export function StartDatePicker({ today, value, onChange }: Props) {
  const options = Array.from({ length: config.startDateMaxOffsetDays + 1 }, (_, i) => addDays(today, i));
  const label = (date: DateKey, index: number) => (index === 0 ? strings.schedule.today : index === 1 ? strings.schedule.tomorrow : shortDate(date));

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {options.map((date, index) => (
        <Chip key={date} label={label(date, index)} selected={value === date} onPress={() => onChange(date)} />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({ row: { gap: spacing.xs, paddingVertical: 4 } });
