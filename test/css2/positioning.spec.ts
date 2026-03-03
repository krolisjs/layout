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
    }, ctx);
    node.lay(ctx.constraints);
    expect(node.children[0].result).toEqual({
      x: 0,
      y: 0,
      w: 100,
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
      fontFamily: 'sans-serif',
      fontSize: 100,
      fontWeight: 400,
      fontStyle: FontStyle.NORMAL,
      lineHeight: 100,
      letterSpacing: 0,
      rects: null,
      type: 'box',
    });
  });
});
