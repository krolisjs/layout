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
      label: '0',
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
      paddingLeft: 0,
      borderTopWidth: 0,
      borderRightWidth: 0,
      borderBottomWidth: 0,
      borderLeftWidth: 0,
    });
  });

  it('blocks-026-ref', () => {
    const node = genNode({
      label: '0',
      style: {
        width: { v: 300, u: Unit.PX },
        height: { v: 300, u: Unit.PX },
      },
      layout,
      children: [{
        label: '1',
        style: {
          width: { v: 50, u: Unit.PERCENT },
          height: { v: 100, u: Unit.PX },
          borderTopWidth: { v: 100, u: Unit.PX },
          borderRightWidth: { v: 100, u: Unit.PX },
          borderBottomWidth: { v: 100, u: Unit.PX },
          borderLeftWidth: { v: 100, u: Unit.PX },
        },
      }],
    });
    node.lay(0, 0, 300, 100);
    const child = node.children[0];
    expect(child.label).toBe('1');
    expect(child.rect).toEqual({
      x: 0,
      y: 0,
      w: 150,
      h: 100,
      marginTop: 0,
      marginRight: 0,
      marginBottom: 0,
      marginLeft: 0,
      paddingTop: 0,
      paddingRight: 0,
      paddingBottom: 0,
      paddingLeft: 0,
      borderTopWidth: 100,
      borderRightWidth: 100,
      borderBottomWidth: 100,
      borderLeftWidth: 100,
    });
  });
});
