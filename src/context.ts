import type { LineBox, LineBoxItem } from './layout';

export class InlineLayoutContext {
  lineBoxes: LineBox[] = [];
  current: LineBox;

  constructor(lineBox: LineBox) {
    this.current = lineBox;
    this.lineBoxes.push(lineBox);
  }

  addBox(item: LineBoxItem) {
    this.current.list.push(item);
  }

  newLine(lineBox: LineBox) {
    this.current = lineBox;
    this.lineBoxes.push(lineBox);
  }

  verticalAlign() {}
}
