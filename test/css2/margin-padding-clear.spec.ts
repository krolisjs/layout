import { expect } from 'expect';
import { createTestContext, genNode } from '../env.ts';
import { Context } from '../../dist/index.js';
import type { IAllNode } from '../../dist/index.js';

describe('margin-padding-clear', () => {
  let ctx: Context<IAllNode>;

  beforeEach(() => {
    ctx = createTestContext();
  });

  it('margin-001', () => {
    const node = genNode({
      style: {
        position: 'relative',
      },
      children: [
        {
          style: {
            position: 'absolute',
            borderTopWidth: 10,
            borderRightWidth: 10,
            borderBottomWidth: 10,
            borderLeftWidth: 10,
            width: 10,
            height: 10,
          },
        },
        {
          style: {
            position: 'absolute',
            left: 0,
            top: 0,
            borderTopWidth: 10,
            borderRightWidth: 10,
            borderBottomWidth: 10,
            borderLeftWidth: 10,
          },
          children: [
            {
              style: {
                marginTop: 2,
                marginRight: 2,
                marginBottom: 2,
                marginLeft: 2,
                borderTopWidth: 10,
                borderRightWidth: 10,
                borderBottomWidth: 10,
                borderLeftWidth: 10,
                width: 30,
                height: 10,
              },
            },
          ],
        },
      ],
    });
    node.lay(ctx.constraints);
    expect(node.result?.h).toBe(0);
    expect(node.children[0].result).toMatchObject({
      x: 10,
      y: 10,
      w: 10,
      h: 10,
      borderTopWidth: 10,
      borderRightWidth: 10,
      borderBottomWidth: 10,
      borderLeftWidth: 10,
    });
    expect(node.children[1].result).toMatchObject({
      x: 10,
      y: 10,
      w: 54,
      h: 34,
      borderTopWidth: 10,
      borderRightWidth: 10,
      borderBottomWidth: 10,
      borderLeftWidth: 10,
    });
    expect(node.children[1].children[0].result).toMatchObject({
      x: 22,
      y: 22,
      w: 30,
      h: 10,
      marginTop: 2,
      marginRight: 2,
      marginBottom: 2,
      marginLeft: 2,
      borderTopWidth: 10,
      borderRightWidth: 10,
      borderBottomWidth: 10,
      borderLeftWidth: 10,
    });
  });

  it('margin-005', () => {
    const node = genNode({
      style: {
        position: 'relative',
      },
      children: [
        {
          style: {
            position: 'absolute',
            left: 0,
            top: 0,
            borderTopWidth: 10,
            borderRightWidth: 10,
            borderBottomWidth: 10,
            borderLeftWidth: 10,
          },
          children: [
            {
              style: {
                marginTop: 'auto',
                marginRight: 'auto',
                marginBottom: 'auto',
                marginLeft: 'auto',
                borderTopWidth: 10,
                borderRightWidth: 10,
                borderBottomWidth: 10,
                borderLeftWidth: 10,
                width: 30,
                height: 10,
              },
            },
          ],
        },
      ],
    });
    node.lay(ctx.constraints);
    expect(node.result?.h).toBe(0);
    expect(node.children[0].result).toMatchObject({
      x: 10,
      y: 10,
      w: 50,
      h: 30,
      borderTopWidth: 10,
      borderRightWidth: 10,
      borderBottomWidth: 10,
      borderLeftWidth: 10,
    });
    expect(node.children[0].children[0].result).toMatchObject({
      x: 20,
      y: 20,
      w: 30,
      h: 10,
      borderTopWidth: 10,
      borderRightWidth: 10,
      borderBottomWidth: 10,
      borderLeftWidth: 10,
    });
  });

  it('margin-006', () => {
    const node = genNode({
      style: {
        position: 'relative',
      },
      children: [
        {
          style: {
            position: 'absolute',
            left: 0,
            top: 0,
            marginTop: 10,
            marginRight: 10,
            marginBottom: 10,
            marginLeft: 10,
          },
          children: [
            {
              style: {
                marginTop: 'inherit',
                marginRight: 'inherit',
                marginBottom: 'inherit',
                marginLeft: 'inherit',
                borderTopWidth: 10,
                borderRightWidth: 10,
                borderBottomWidth: 10,
                borderLeftWidth: 10,
                width: 30,
                height: 10,
              },
            },
          ],
        },
      ],
    });
    node.lay(ctx.constraints);
    expect(node.result?.h).toBe(0);
    expect(node.children[0].result).toMatchObject({
      x: 10,
      y: 10,
      w: 70,
      h: 50,
      marginTop: 10,
      marginRight: 10,
      marginBottom: 10,
      marginLeft: 10,
    });
    expect(node.children[0].children[0].result).toMatchObject({
      x: 30,
      y: 30,
      w: 30,
      h: 10,
      marginTop: 10,
      marginRight: 10,
      marginBottom: 10,
      marginLeft: 10,
      borderTopWidth: 10,
      borderRightWidth: 10,
      borderBottomWidth: 10,
      borderLeftWidth: 10,
    });
  });

  it('margin-007', () => {
    const node = genNode({
      style: {
        position: 'relative',
      },
      children: [
        {
          style: {
            position: 'absolute',
            left: 25,
            top: 100,
            width: 30,
            height: 10,
          },
        },
      ],
    });
    node.lay(ctx.constraints);
    expect(node.result?.h).toBe(0);
    expect(node.children[0].result).toMatchObject({
      x: 25,
      y: 100,
      w: 30,
      h: 10,
    });
  });

  it('margin-auto-on-block-box', () => {
    const node = genNode({
      style: {
        marginLeft: 250,
        width: 100,
      },
      children: [
        {
          style: {
            marginTop: 'auto',
            marginRight: 'auto',
            marginBottom: 'auto',
            marginLeft: 'auto',
            width: 50,
            height: 5,
          },
        },
        {
          style: {
            marginRight: 'auto',
            marginLeft: 'auto',
            width: 200,
            height: 5,
          },
        },
        {
          style: {
            marginRight: 'auto',
            marginLeft: -125,
            width: 50,
            height: 5,
          },
        },
        {
          style: {
            marginLeft: 'auto',
            marginRight: -125,
            width: 50,
            height: 5,
          },
        },
      ],
    });
    node.lay(ctx.constraints);
    expect(node.result).toMatchObject({
      x: 250,
      y: 0,
      w: 100,
    });
    expect(node.children[0].result).toMatchObject({
      x: 275,
      y: 0,
      w: 50,
      h: 5,
    });
    expect(node.children[1].result).toMatchObject({
      x: 250,
      y: 5,
      w: 200,
      h: 5,
    });
    expect(node.children[2].result).toMatchObject({
      x: 125,
      w: 50,
      h: 5,
      marginLeft: -125,
    });
    expect(node.children[3].result).toMatchObject({
      x: 375,
      w: 50,
      h: 5,
      marginRight: -125,
    });
  });

  it('margin-border-padding-001', () => {
    const node = genNode({
      style: {
        position: 'relative',
        paddingTop: 10,
        paddingRight: 10,
        paddingBottom: 10,
        paddingLeft: 10,
      },
      children: [
        {
          style: {
            position: 'absolute',
            left: 0,
            top: 0,
            marginTop: 10,
            marginRight: 10,
            marginBottom: 10,
            marginLeft: 10,
            paddingTop: 10,
            paddingRight: 10,
            paddingBottom: 10,
            paddingLeft: 10,
            borderTopWidth: 10,
            borderRightWidth: 10,
            borderBottomWidth: 10,
            borderLeftWidth: 10,
          },
        },
      ],
    });
    node.lay(ctx.constraints);
    expect(node.result?.h).toBe(0);
    expect(node.children[0].result).toMatchObject({
      x: 30,
      y: 30,
      w: 0,
      h: 0,
    });
  });

  it('margin-bottom-004', () => {
    const node = genNode({
      style: {
      },
      children: [
        {
          style: {
            marginBottom: 0,
            borderBottomWidth: 5,
          },
        },
        {
          style: {
            borderTopWidth: 5,
          },
        },
      ],
    });
    node.lay(ctx.constraints);
    expect(node.children[1].result).toMatchObject({
      x: 0,
      y: 10,
      borderTopWidth: 5,
    });
  });

  it('margin-bottom-007', () => {
    const node = genNode({
      style: {
        height: 101,
        borderBottomWidth: 5,
      },
      children: [
        {
          style: {
            marginBottom: 96,
            borderBottomWidth: 5,
          },
        },
        {
          style: {
            borderTopWidth: 5,
          },
        },
      ],
    });
    node.lay(ctx.constraints);
    expect(node.children[1].result).toMatchObject({
      x: 0,
      y: 106,
      borderTopWidth: 5,
    });
  });

  it('margin-collapse-002', () => {
    const node = genNode({
      children: [
        {
          style: {
            marginBottom: 20,
            height: 10,
          },
        },
        {
          style: {
            marginTop: 10,
            height: 10,
          },
        },
      ],
    });
    node.lay(ctx.constraints);
    expect(node.children[1].result).toMatchObject({
      y: 30,
      h: 10,
      marginTop: 10,
    });
  });

  it('margin-collapse-002', () => {
    const node = genNode({
      children: [
        {
          style: {
            marginBottom: 20,
            height: 10,
          },
        },
        {
          style: {
            marginTop: -20,
          },
        },
      ],
    });
    node.lay(ctx.constraints);
    expect(node.children[1].result).toMatchObject({
      y: 10,
      marginTop: -20,
    });
  });

  it('margin-collapse-004', () => {
    const node = genNode({
      children: [
        {
          style: {
            height: 20,
          },
        },
        {
          style: {
            marginTop: -40,
          },
        },
      ],
    });
    node.lay(ctx.constraints);
    expect(node.children[1].result).toMatchObject({
      y: -20,
      marginTop: -40,
    });
  });

  it('margin-collapse-005', () => {
    const node = genNode({
      children: [
        {
          children: [{
            style: {
              marginBottom: 2,
            },
          }],
        },
        {
          style: {
            marginTop: 1,
          },
        },
      ],
    });
    node.lay(ctx.constraints);
    expect(node.children[1].result).toMatchObject({
      y: 2,
      marginTop: 1,
    });
  });

  it('margin-collapse-008', () => {
    const node = genNode({
      children: [
        {
          style: {
            marginTop: 20,
          },
          children: [
            {
              style: {
                marginTop: 20,
              },
            },
          ],
        },
      ],
    });
    node.lay(ctx.constraints);
    expect(node.children[0].children[0].result).toMatchObject({
      y: 20,
      marginTop: 20,
    });
  });

  it('margin-collapse-009', () => {
    const node = genNode({
      children: [
        {
          style: {
            marginTop: 20,
            overflow: 'hidden',
          },
          children: [
            {
              style: {
                marginTop: 20,
              },
            },
          ],
        },
      ],
    });
    node.lay(ctx.constraints);
    expect(node.children[0].children[0].result).toMatchObject({
      y: 40,
      marginTop: 20,
    });
  });

  it('margin-collapse-010', () => {
    const node = genNode({
      children: [
        {
          style: {
            marginTop: 20,
            overflow: 'scroll',
          },
          children: [
            {
              style: {
                marginTop: 20,
              },
            },
          ],
        },
      ],
    });
    node.lay(ctx.constraints);
    expect(node.children[0].children[0].result).toMatchObject({
      y: 40,
      marginTop: 20,
    });
  });

  it('margin-collapse-011', () => {
    const node = genNode({
      children: [
        {
          style: {
            marginTop: 20,
            overflow: 'auto',
          },
          children: [
            {
              style: {
                marginTop: 20,
              },
            },
          ],
        },
      ],
    });
    node.lay(ctx.constraints);
    expect(node.children[0].children[0].result).toMatchObject({
      y: 40,
      marginTop: 20,
    });
  });

  it('margin-collapse-012', () => {
    const node = genNode({
      children: [
        {
          style: {
            marginTop: 10,
          },
        },
        {
          style: {
            position: 'absolute',
            marginTop: 10,
          },
        },
      ],
    });
    node.lay(ctx.constraints);
    expect(node.children[1].result).toMatchObject({
      x: 0,
      y: 20,
    });
  });

  it('margin-collapse-013', () => {
    const node = genNode({
      children: [
        {
          style: {
            position: 'absolute',
            marginTop: 10,
          },
          children: [
            {
              style: {
                marginTop: 10,
              },
            },
          ],
        },
      ],
    });
    node.lay(ctx.constraints);
    expect(node.children[1].result).toMatchObject({
      y: 20,
      marginTop: 10,
    });
  });

  it.skip('margin-collapse-014', () => {
    const node = genNode({
      style: {
        width: 5,
      },
      children: [
        {
          style: {
            display: 'inlineBlock',
            marginTop: 10,
            width: 5,
          },
        },
        {
          style: {
            display: 'inlineBlock',
            marginTop: 10,
            width: 5,
          },
        },
      ],
    });
    node.lay(ctx.constraints);
    expect(node.children[1].result).toMatchObject({
      y: 20,
      marginTop: 10,
    });
  });

  it('margin-left-055', () => {
    const node = genNode({
      style: {
        borderLeftWidth: 25,
      },
      children: [
        {
          style: {
            marginLeft: 25,
          },
          children: [
            {
              style: {
                marginLeft: -50,
              },
            },
          ],
        },
      ],
    });
    node.lay(ctx.constraints);
    expect(node.result).toMatchObject({
      x: 25,
      marginLeft: 0,
    });
    expect(node.children[0].result).toMatchObject({
      x: 50,
      marginLeft: 25,
    });
    expect(node.children[0].children[0].result).toMatchObject({
      x: 0,
      marginLeft: -50,
    });
  });

  it('margin-percentage-inherit-001', () => {
    const node = genNode({
      style: {
        marginTop: '1%',
        marginRight: '1%',
        marginBottom: '1%',
        marginLeft: '1%',
        width: 100,
        borderTopWidth: 1,
      },
      children: [
        {
          style: {
            marginTop: 'inherit',
            marginRight: 'inherit',
            marginBottom: 'inherit',
            marginLeft: 'inherit',
            width: 100,
            height: 100,
          },
        },
      ],
    });
    node.lay(ctx.constraints);
    expect(node.children[0].result).toMatchObject({
      x: 101,
      y: 102,
      marginTop: 1,
      marginRight: 1,
      marginBottom: 1,
      marginLeft: 1,
    });
  });

  it('margin-right-008', () => {
    const node = genNode({
      style: {
        borderRightWidth: 2,
        width: 0,
      },
      children: [
        {
          style: {
            marginRight: 96,
            width: 0,
          },
          children: [
            {
              style: {
                marginRight: -98,
                borderRightWidth: 2,
                height: 1,
              },
            },
          ],
        },
      ],
    });
    node.lay(ctx.constraints);
    expect(node.result).toMatchObject({
      x: 0,
      y: 0,
      w: 0,
      h: 1,
      borderRightWidth: 2,
    });
    expect(node.children[0].result).toMatchObject({
      x: 0,
      y: 0,
      w: 0,
      h: 1,
      marginRight: 96,
    });
    expect(node.children[0].children[0].result).toMatchObject({
      x: 0,
      y: 0,
      w: 96,
      h: 1,
      marginRight: -98,
      borderRightWidth: 2,
    });
  });

  it('margin-top-008', () => {
    const node = genNode({
      children: [
        {
          style: {
            marginBottom: -98,
            borderTopWidth: 2,
          },
        },
        {
          style: {
            marginTop: 96,
            borderTopWidth: 2,
          },
        },
      ],
    });
    node.lay(ctx.constraints);
    expect(node.children[0].result).toMatchObject({
      y: 2,
      h: 0,
      marginBottom: -98,
      borderTopWidth: 2,
    });
    expect(node.children[1].result).toMatchObject({
      y: 2,
      h: 0,
      marginTop: 96,
      borderTopWidth: 2,
    });
  });

  it('padding-001', () => {
    const node = genNode({
      style: {
        position: 'relative',
      },
      children: [
        {
          style: {
            position: 'absolute',
            left: 0,
            top: 0,
            width: 500,
            height: 308,
            borderTopWidth: 10,
            borderRightWidth: 10,
            borderBottomWidth: 10,
            borderLeftWidth: 10,
          },
        },
        {
          style: {
            position: 'absolute',
            left: 0,
            top: 0,
            paddingTop: 96,
            paddingRight: 96,
            paddingBottom: 96,
            paddingLeft: 96,
            borderTopWidth: 10,
            borderRightWidth: 10,
            borderBottomWidth: 10,
            borderLeftWidth: 10,
          },
          children: [
            {
              style: {
                width: 288,
                height: 96,
                borderTopWidth: 10,
                borderRightWidth: 10,
                borderBottomWidth: 10,
                borderLeftWidth: 10,
              },
            },
          ],
        },
      ],
    });
    node.lay(ctx.constraints);
    expect(node.children[0].result).toMatchObject({
      x: 10,
      y: 10,
      w: 500,
      h: 308,
      borderTopWidth: 10,
      borderRightWidth: 10,
      borderBottomWidth: 10,
      borderLeftWidth: 10,
    });
    expect(node.children[1].result).toMatchObject({
      x: 106,
      y: 106,
      w: 308,
      h: 116,
      borderTopWidth: 10,
      borderRightWidth: 10,
      borderBottomWidth: 10,
      borderLeftWidth: 10,
    });
    expect(node.children[1].children[0].result).toMatchObject({
      x: 116,
      y: 116,
      w: 288,
      h: 96,
      borderTopWidth: 10,
      borderRightWidth: 10,
      borderBottomWidth: 10,
      borderLeftWidth: 10,
    });
  });

  it('padding-bottom-003', () => {
    const node = genNode({
      style: {
      },
      children: [
        {
          style: {
            borderTopWidth: 2,
            paddingBottom: 1,
          },
        },
        {
          style: {
            marginTop: -3,
            borderBottomWidth: 2,
          },
        },
      ],
    });
    node.lay(ctx.constraints);
    expect(node.children[0].result).toMatchObject({
      x: 0,
      y: 2,
      paddingBottom: 1,
    });
    expect(node.children[1].result).toMatchObject({
      x: 0,
      y: 0,
      marginTop: -3,
      borderBottomWidth: 2,
    });
  });

  it('padding-left-001', () => {
    const node = genNode({
      style: {
        paddingLeft: -1,
        borderLeftWidth: 5,
      },
      children: [
        {
          style: {
            borderLeftWidth: 5,
            height: '1in',
          },
        },
      ],
    });
    node.lay(ctx.constraints);
    expect(node.result).toMatchObject({
      x: 5,
      y: 0,
      paddingLeft: 0,
      h: 96,
    });
    expect(node.children[0].result).toMatchObject({
      x: 10,
      y: 0,
      h: 96,
    });
  });

  it('padding-left-006', () => {
    const node = genNode({
      style: {
        paddingLeft: 96,
        borderLeftWidth: 2,
      },
      children: [
        {
          style: {
            marginLeft: -98,
            borderLeftWidth: 2,
          },
        },
      ],
    });
    node.lay(ctx.constraints);
    expect(node.result).toMatchObject({
      x: 98,
      paddingLeft: 96,
      borderLeftWidth: 2,
    });
    expect(node.children[0].result).toMatchObject({
      x: 2,
      marginLeft: -98,
      borderLeftWidth: 2,
    });
  });

  it('padding-right-001', () => {
    const node = genNode({
      style: {
        paddingRight: -1,
        borderRightWidth: 5,
      },
      children: [
        {
          style: {
            borderRightWidth: 5,
          },
        },
      ],
    });
    node.lay(ctx.constraints);
    expect(node.children[0].result).toMatchObject({
      x: 0,
      borderRightWidth: 5,
    });
  });

  it('padding-right-018', () => {
    const node = genNode({
      style: {
        paddingRight: 72,
        borderRightWidth: 6,
        width: 0,
      },
      children: [
        {
          style: {
            marginRight: -78,
            borderRightWidth: 6,
          },
        },
      ],
    });
    node.lay(ctx.constraints);
    expect(node.children[0].result).toMatchObject({
      x: 0,
      w: 72,
      borderRightWidth: 6,
    });
  });

  it('padding-top-034', () => {
    const node = genNode({
      style: {
        paddingTop: '-1cm',
        borderTopWidth: 5,
      },
      children: [
        {
          style: {
            borderBottomWidth: 6,
          },
        },
      ],
    });
    node.lay(ctx.constraints);
    expect(node.children[0].result).toMatchObject({
      y: 5,
      borderBottomWidth: 6,
    });
  });

  it('padding-top-094', () => {
    const node = genNode({
      style: {
        width: 100,
      },
      children: [
        {
          style: {
            paddingTop: '50%',
            borderTopWidth: 50,
          },
        },
        {
          style: {
            marginTop: -100,
          },
        },
      ],
    });
    node.lay(ctx.constraints);
    expect(node.children[1].result).toMatchObject({
      y: 0,
      marginTop: -100,
    });
  });
});
