import { expect } from 'expect';
import { genNode } from '../env.ts';
import { Unit } from '../../dist/index.js';
import { Layout } from '../../dist/index.js';

describe('normal-flow', () => {
  let layout: Layout;

  beforeEach(() => {
    layout = new Layout();
  });

  it('blocks-020-ref', () => {
    const node = genNode({
      id: 0,
      style: {
        width: { v: 300, u: Unit.PX },
        height: { v: 100, u: Unit.PX },
      },
    });
    node.lay(0, 0, 300, 100);
    console.log(node);
    expect(node.id).toBe(0);
    expect(node.rect?.x).toBe(0);
    expect(node.rect?.y).toBe(0);
    expect(node.rect?.w).toBe(300);
    expect(node.rect?.h).toBe(100);
  });
});
