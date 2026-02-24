import { expect } from 'expect';
import { createTestContext, genNode } from '../env.ts';
import { AbstractNode, Context } from '../../dist/index.js';

describe('linebox', () => {
  let ctx: Context<AbstractNode>;

  beforeEach(() => {
    ctx = createTestContext();
  });

  it('inline-box-001', () => {
    const node = genNode({
      style: {
        display: 'inline',
        borderLeftWidth: 2,
        borderRightWidth: 2,
        borderTopWidth: 2,
        borderBottomWidth: 2,
      },
      children: [
        { content: 'First line' },
        { style: { width: '2in' }, children: [ { content: 'Filler text' } ] },
        { content: 'Last line' },
      ],
    });
    node.lay(ctx);
    expect(node.rect).toEqual({
      x: 2,
      y: 0,
      w: 192,
      h: 72,
      marginTop: 0,
      marginRight: 0,
      marginBottom: 0,
      marginLeft: 0,
      paddingTop: 0,
      paddingRight: 0,
      paddingBottom: 0,
      paddingLeft: 0,
      borderTopWidth: 2,
      borderRightWidth: 2,
      borderBottomWidth: 2,
      borderLeftWidth: 2,
      fontSize: 16,
      lineHeight: 24,
      letterSpacing: 0,
      rects: [
        {
          x: 2,
          y: 0,
          w: 160,
          h: 24,
        },
        {
          x: 2,
          y: 48,
          w: 144,
          h: 24,
        },
      ],
      type: 'inline',
    });
    expect(node.children[1].rect).toEqual({
      x: 2,
      y: 24,
      w: 192,
      h: 24,
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
      fontSize: 16,
      lineHeight: 24,
      letterSpacing: 0,
      rects: null,
      type: 'box',
    });
  });

  it('inline-box-002', () => {
    const node = genNode({
      style: {
        position: 'relative',
        top: '2in',
        display: 'inline',
        borderLeftWidth: 2,
        borderRightWidth: 2,
        borderTopWidth: 2,
        borderBottomWidth: 2,
      },
      children: [
        { content: 'First line' },
        { style: { width: '2in' }, children: [ { content: 'Filler text' } ] },
        { content: 'Last line' },
      ],
    });
    node.lay(ctx);
    expect(node.rect).toEqual({
      x: 2,
      y: 192,
      w: 192,
      h: 72,
      marginTop: 0,
      marginRight: 0,
      marginBottom: 0,
      marginLeft: 0,
      paddingTop: 0,
      paddingRight: 0,
      paddingBottom: 0,
      paddingLeft: 0,
      borderTopWidth: 2,
      borderRightWidth: 2,
      borderBottomWidth: 2,
      borderLeftWidth: 2,
      fontSize: 16,
      lineHeight: 24,
      letterSpacing: 0,
      rects: [
        {
          x: 2,
          y: 192,
          w: 160,
          h: 24,
        },
        {
          x: 2,
          y: 240,
          w: 144,
          h: 24,
        },
      ],
      type: 'inline',
    });
    expect(node.children[1].rect).toEqual({
      x: 2,
      y: 216,
      w: 192,
      h: 24,
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
      fontSize: 16,
      lineHeight: 24,
      letterSpacing: 0,
      rects: null,
      type: 'box',
    });
  });
});
