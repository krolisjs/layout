import { expect } from 'expect';
import { createTestContext, genNode } from './env.ts';
import { Context, FontStyle } from '../dist/index.js';
import type { IAllNode } from '../dist/index.js';

describe('css-position', () => {
  let ctx: Context<IAllNode>;

  beforeEach(() => {
    ctx = createTestContext();
  });

  it('position-absolute-dynamic-static-position', () => {
    const node = genNode({
      style: {
        boxSizing: 'borderBox',
        borderTopWidth: 10,
        borderRightWidth: 10,
        borderBottomWidth: 10,
        borderLeftWidth: 10,
        width: 100,
        height: 100,
      },
      children: [
        {
          style: {
            position: 'absolute',
            width: 80,
            height: 80,
          },
        },
      ],
    });
    node.lay(ctx.constraints);
    expect(node.children[0].result).toMatchObject({
      x: 10,
      y: 10,
      w: 80,
      h: 80,
    });
  });

  it('position-relative-001', () => {
    const node = genNode({
      style: {
        width: 100,
        height: 100,
      },
      children: [
        {
          style: {
            position: 'relative',
            display: 'inline',
            top: '100%',
            left: '100%',
          },
          children: [
            {
              style: {
                position: 'relative',
                top: -100,
                left: -100,
                width: 100,
                height: 100,
              },
            },
          ],
        },
      ],
    });
    node.lay(ctx.constraints);
    expect(node.children[0].children[0].result).toMatchObject({
      x: 0,
      y: 0,
      w: 100,
      h: 100,
    });
  });

  it('position-relative-002', () => {
    const node = genNode({
      style: {
        width: 100,
        height: 100,
      },
      children: [
        {
          style: {
            position: 'relative',
            display: 'inline',
            top: 100,
            left: 100,
          },
          children: [
            {
              style: {
                position: 'relative',
                top: '-100%',
                left: '-100%',
                width: 100,
                height: 100,
              },
            },
          ],
        },
      ],
    });
    node.lay(ctx.constraints);
    expect(node.children[0].children[0].result).toMatchObject({
      x: 0,
      y: 0,
      w: 100,
      h: 100,
    });
  });

  it('position-relative-006', () => {
    const node = genNode({
      style: {
        width: 100,
      },
      children: [
        {
          style: {
            position: 'relative',
            top: '-10000%',
            height: 100,
          },
        },
      ],
    });
    node.lay(ctx.constraints);
    expect(node.children[0].result).toMatchObject({
      x: 0,
      y: 0,
      w: 100,
      h: 100,
    });
  });
});
