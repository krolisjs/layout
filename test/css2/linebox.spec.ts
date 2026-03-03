import { expect } from 'expect';
import { createTestContext, genNode } from '../env.ts';
import { Context, FontStyle } from '../../dist/index.js';
import type { IAllNode } from '../../dist/index.js';

describe('linebox', () => {
  let ctx: Context<IAllNode>;

  beforeEach(() => {
    ctx = createTestContext();
  });

  it('border-padding-bleed-001', () => {
    const node = genNode({
      style: { fontSize: 40, lineHeight: 1 },
      children: [
        { content: 'shuldboverlaPPed\n' },
        {
          style: {
            display: 'inline',
            borderTopWidth: 15,
            paddingTop: 25,
          },
          children: [ { content: 'Filler text' } ],
        },
      ],
    });
    node.lay(ctx.constraints);
    expect(node.result).toMatchObject({
      x: 0,
      y: 0,
      w: 10000,
      h: 120,
      lineHeight: 40,
      letterSpacing: 0,
    });
    expect(node.children[1].result).toMatchObject({
      x: 0,
      y: 80,
      w: 440,
      h: 40,
      paddingTop: 25,
      paddingRight: 0,
      paddingBottom: 0,
      paddingLeft: 0,
      borderTopWidth: 15,
      borderRightWidth: 0,
      borderBottomWidth: 0,
      borderLeftWidth: 0,
      lineHeight: 40,
      letterSpacing: 0,
      rects: [
        {
          x: 0,
          y: 80,
          w: 440,
          h: 40,
        },
      ],
    });
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
    node.lay(ctx.constraints);
    expect(node.result).toMatchObject({
      x: 2,
      y: 0,
      w: 192,
      h: 72,
      borderTopWidth: 2,
      borderRightWidth: 2,
      borderBottomWidth: 2,
      borderLeftWidth: 2,
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
    expect(node.children[1].result).toMatchObject({
      x: 2,
      y: 24,
      w: 192,
      h: 24,
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
    node.lay(ctx.constraints);
    expect(node.result).toMatchObject({
      x: 2,
      y: 192,
      w: 192,
      h: 72,
      borderTopWidth: 2,
      borderRightWidth: 2,
      borderBottomWidth: 2,
      borderLeftWidth: 2,
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
    });
    expect(node.children[1].result).toMatchObject({
      x: 2,
      y: 216,
      w: 192,
      h: 24,
    });
  });
});
