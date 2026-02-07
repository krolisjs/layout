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
      layout,
    });
    node.lay(0, 0, 300, 100);
    expect(node.label).toBe('0');
    expect(node.rect).toEqual({
      x: 0,
      y: 0,
      w: 300,
      h: 100,
      marginTop: 0,
      marginRight: 0,
      marginBottom: 0,
      marginLeft: 0,
      paddingTop: 0,
      paddingRight: 0,
      paddingBottom: 0,
      paddingLeft: 0
    });
  });
});
