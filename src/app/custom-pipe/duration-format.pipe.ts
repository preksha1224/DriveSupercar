import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'durationFormat',
  standalone: true
})
export class DurationFormatPipe implements PipeTransform {
  private durationMap: any = {
    TEN: 10,
    TWENTY: 20,
    FORTY: 40,
    SIXTY: 60
  };

  transform(durations: string[]): string {
    if (!durations || durations.length === 0) return '';

    const mins = durations.map(d => `${this.durationMap[d]} mins`);

    if (mins.length === 1) return mins[0];
    if (mins.length === 2) return mins.join(' and ');

    return mins.slice(0, -1).join(', ') + ' and ' + mins[mins.length - 1];
  }

}
