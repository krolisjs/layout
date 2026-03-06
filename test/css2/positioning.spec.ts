import { expect } from 'expect';
import { createTestContext, genNode } from '../env.ts';
import { Context, FontStyle } from '../../dist/index.js';
import type { IAllNode } from '../../dist/index.js';

describe('positioning', () => {
  let ctx: Context<IAllNode>;

  beforeEach(() => {
    ctx = createTestContext();
  });

  it('absolute-non-replaced-width-001', () => {
    const node = genNode({
      style: {
        position: 'relative',
        width: 200,
        height: 200,
      },
      children: [
        {
          style: {
            position: 'absolute',
            fontSize: 100,
            lineHeight: 1,
          },
          children: [
            {
              content: 'X',
            },
          ],
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

  it('absolute-non-replaced-width-003', () => {
    const node = genNode({
      style: {
        position: 'relative',
        width: 400,
        height: 200,
      },
      children: [
        {
          style: {
            position: 'absolute',
            left: 100,
            right: -200,
            marginLeft: 'auto',
            marginRight: 'auto',
            width: 100,
          },
        },
      ],
    });
    node.lay(ctx.constraints);
    expect(node.children[0].result).toMatchObject({
      x: 300,
      y: 0,
      w: 100,
      left: 100,
      right: -200,
      marginLeft: 200,
      marginRight: 200,
    });
  });
});
