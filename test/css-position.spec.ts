import { expect } from 'expect';
import { createTestContext, genNode } from './env.ts';
import { AbstractNode, Context, FontStyle } from '../dist/index.js';

describe('css-position', () => {
  let ctx: Context<AbstractNode>;

  beforeEach(() => {
    ctx = createTestContext();
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
    node.lay(ctx);
    expect(node.children[0].children[0].rect).toEqual({
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
      fontSize: 16,
      fontWeight: 400,
      fontStyle: FontStyle.NORMAL,
      lineHeight: 24,
      letterSpacing: 0,
      rects: null,
      type: 'box',
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
    node.lay(ctx);
    expect(node.children[0].children[0].rect).toEqual({
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
      fontSize: 16,
      fontWeight: 400,
      fontStyle: FontStyle.NORMAL,
      lineHeight: 24,
      letterSpacing: 0,
      rects: null,
      type: 'box',
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
    node.lay(ctx);
    expect(node.children[0].rect).toEqual({
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
      fontSize: 16,
      fontWeight: 400,
      fontStyle: FontStyle.NORMAL,
      lineHeight: 24,
      letterSpacing: 0,
      rects: null,
      type: 'box',
    });
  });
});
