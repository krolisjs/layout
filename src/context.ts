import type { LineBox, LineBoxItem } from './layout';

export class InlineLayoutContext {
  lineBoxes: LineBox[] = [];
  current: LineBox | null = null;

  addBox(item: LineBoxItem) {
    if (this.current) {
      this.current.list.push(item);
    }
  }

  newLine(lineBox: LineBox) {
    this.current = lineBox;
    this.lineBoxes.push(lineBox);
  }

  verticalAlign() {}
}
