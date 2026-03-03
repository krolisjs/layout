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
});
