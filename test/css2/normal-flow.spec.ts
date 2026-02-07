import { expect } from 'expect';
import { genNode } from '../env.ts';
import { Unit } from '../../dist/index.js';
import { Layout } from '../../dist/index.js';

describe('normal-flow', () => {
  let layout: Layout;

  beforeEach(() => {
    layout = new Layout();
  });

  it('blocks-011', () => {
    const node = genNode({
      label: '0',
      style: {
        width: { v: 3, u: Unit.EM },
        height: { v: 1, u: Unit.EM },
      },
      layout,
      children: [{
        label: '1',
        style: {
          width: { v: 0, u: Unit.AUTO },
          height: { v: 1, u: Unit.EM },
          borderRightWidth: { v: 1, u: Unit.EM },
          borderLeftWidth: { v: 1, u: Unit.EM },
        },
      }],
    });
    node.lay(null, 0, 0, 300, 100);
    expect(node.label).toBe('0');
    expect(node.rect).toEqual({
      x: 0,
      y: 0,
      width: 48,
      height: 16,
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
    const child = node.children[0];
    expect(child.label).toBe('1');
    expect(child.rect).toEqual({
      x: 0,
      y: 0,
      width: 48,
      height: 16,
      marginTop: 0,
      marginRight: 0,
      marginBottom: 0,
      marginLeft: 0,
      paddingTop: 0,
      paddingRight: 0,
      paddingBottom: 0,
      paddingLeft: 0,
      borderTopWidth: 0,
      borderRightWidth: 16,
      borderBottomWidth: 0,
      borderLeftWidth: 16,
    });
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
    node.lay(null, 0, 0, 300, 100);
    expect(node.rect).toEqual({
      x: 0,
      y: 0,
      width: 300,
      height: 100,
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
    node.lay(null, 0, 0, 300, 100);
    const child = node.children[0];
    expect(child.rect).toEqual({
      x: 0,
      y: 0,
      width: 150,
      height: 100,
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
