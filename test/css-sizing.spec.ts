import { expect } from 'expect';
import { genNode } from './env.ts';

describe('css-sizing', () => {
  it('abspos-auto-sizing-fit-content-percentage-001', () => {
    const node = genNode({
      id: 0,
      style: {},
      children: [],
    });
    expect(node.id).toBe(0);
  });
});
