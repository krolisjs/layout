import { expect } from 'expect';
import { genNode } from '../env.ts';
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
        width: '3em',
        height: '1em',
      },
      layout,
      children: [{
        label: '1',
        style: {
          height: '1em',
          borderRightWidth: '1em',
          borderLeftWidth: '1em',
        },
      }],
    });
    node.lay(null, 0, 0, 9999, 9999);
    expect(node.label).toBe('0');
    expect(node.rect).toEqual({
      x: 0,
      y: 0,
      w: 48,
      h: 16,
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
      w: 48,
      h: 16,
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

  it('blocks-012-ref', () => {
    const node = genNode({
      label: '0',
      style: {
        width: '3em',
        height: '1em',
      },
      layout,
      children: [{
        label: '1',
        style: {
          paddingLeft: '2em',
          paddingRight: '2em',
        },
      }],
    });
    node.lay(null, 0, 0, 9999, 9999);
    const child = node.children[0];
    expect(child.rect).toEqual({
      x: 0,
      y: 0,
      w: 48,
      h: 0,
      marginTop: 0,
      marginRight: 0,
      marginBottom: 0,
      marginLeft: 0,
      paddingTop: 0,
      paddingRight: 32,
      paddingBottom: 0,
      paddingLeft: 32,
      borderTopWidth: 0,
      borderRightWidth: 0,
      borderBottomWidth: 0,
      borderLeftWidth: 0,
    });
  });

  it('blocks-020-ref', () => {
    const node = genNode({
      label: '0',
      style: {
        width: '300px',
        height: 100,
      },
      layout,
    });
    node.lay(null, 0, 0, 9999, 9999);
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
        width: 300,
        height: 300,
      },
      layout,
      children: [{
        label: '1',
        style: {
          width: '50%',
          height: 100,
          borderTopWidth: 100,
          borderRightWidth: 100,
          borderBottomWidth: 100,
          borderLeftWidth: 100,
        },
      }],
    });
    node.lay(null, 0, 0, 9999, 9999);
    const child = node.children[0];
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
