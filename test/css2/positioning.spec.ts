import { expect } from 'expect';
import { createTestInputConstraints, genNode } from '../env.ts';
import type { InputConstraints } from '../../dist/index.js';

describe('positioning', () => {
  let inputConstraints: InputConstraints;

  beforeEach(() => {
    inputConstraints = createTestInputConstraints();
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
              style: { lineHeight: 1 },
              content: 'X',
            },
          ],
        },
      ],
    });
    node.lay(inputConstraints);
    expect(node.children[0].mixedResult).toMatchObject({
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
    node.lay(inputConstraints);
    expect(node.children[0].mixedResult).toMatchObject({
      x: 300,
      y: 0,
      w: 100,
      left: 100,
      right: -200,
      marginLeft: 200,
      marginRight: 200,
    });
  });

  it('position-relative-002', () => {
    const node = genNode({
      children: [
        {
          style: {
            position: 'relative',
            left: 0,
            top: 24,
            width: 200,
            height: 2,
          },
        },
        {
          style: {
            position: 'relative',
            top: 25,
            display: 'inline',
          },
          children: [{ content: 'a' }],
        },
        {
          style: {
            display: 'inline',
          },
          children: [{ content: 'b' }],
        },
      ],
    });
    node.lay(inputConstraints);
    expect(node.children[0].mixedResult).toMatchObject({
      x: 0,
      y: 24,
      h: 2,
      top: 24,
    });
    expect(node.children[1].mixedResult).toMatchObject({
      x: 0,
      y: 28,
      w: 16,
      h: 22,
      top: 25,
    });
    expect(node.children[2].mixedResult).toMatchObject({
      x: 16,
      y: 3,
      w: 16,
      h: 22,
    });
  });

  it('position-relative-004', () => {
    const node = genNode({
      children: [
        {
          style: {
            position: 'absolute',
            width: 10,
            height: 10,
          },
        },
        {
          style: {
            position: 'relative',
            left: 10,
            width: 10,
            height: 10,
          },
        },
        {
          style: {
            position: 'relative',
            right: -10,
            width: 10,
            height: 10,
          },
        },
      ],
    });
    node.lay(inputConstraints);
    expect(node.children[0].mixedResult).toMatchObject({
      x: 0,
      y: 0,
      w: 10,
      h: 10,
    });
    expect(node.children[1].mixedResult).toMatchObject({
      x: 10,
      y: 0,
      w: 10,
      h: 10,
    });
    expect(node.children[2].mixedResult).toMatchObject({
      x: 10,
      y: 10,
      w: 10,
      h: 10,
    });
  });

  it('position-relative-006', () => {
    const node = genNode({
      children: [
        {
          style: {
            width: 10,
            height: 10,
          },
        },
        {
          style: {
            position: 'relative',
            right: -10,
            top: -10,
            width: 10,
            height: 10,
          },
        },
      ],
    });
    node.lay(inputConstraints);
    expect(node.mixedResult).toMatchObject({
      x: 0,
      y: 0,
      h: 20,
    });
    expect(node.children[1].mixedResult).toMatchObject({
      x: 10,
      y: 0,
      w: 10,
      h: 10,
    });
  });

  it('position-relative-007', () => {
    const node = genNode({
      style: {
        marginLeft: -10,
      },
      children: [
        {
          style: {
            width: 10,
            height: 10,
          },
        },
        {
          style: {
            position: 'relative',
            left: 'auto',
            right: 10,
            top: -10,
            width: 10,
            height: 10,
          },
        },
      ],
    });
    node.lay(inputConstraints);
    expect(node.children[0].mixedResult).toMatchObject({
      x: -10,
      y: 0,
      w: 10,
      h: 10,
    });
    expect(node.children[1].mixedResult).toMatchObject({
      x: -20,
      y: 0,
      w: 10,
      h: 10,
      left: 0,
      right: 10,
      top: -10,
    });
  });

  it('position-relative-008', () => {
    const node = genNode({
      style: {
        marginLeft: 10,
      },
      children: [
        {
          style: {
            width: 10,
            height: 10,
          },
        },
        {
          style: {
            position: 'relative',
            left: 10,
            right: 'auto',
            top: -10,
            width: 10,
            height: 10,
          },
        },
      ],
    });
    node.lay(inputConstraints);
    expect(node.children[0].mixedResult).toMatchObject({
      x: 10,
      y: 0,
      w: 10,
      h: 10,
    });
    expect(node.children[1].mixedResult).toMatchObject({
      x: 20,
      y: 0,
      w: 10,
      h: 10,
      left: 10,
      top: -10,
    });
  });

  it('position-relative-008', () => {
    const node = genNode({
      children: [
        {
          style: {
            width: 10,
            height: 10,
          },
        },
        {
          style: {
            position: 'relative',
            left: 10,
            right: 10,
            top: -10,
            width: 10,
            height: 10,
          },
        },
      ],
    });
    node.lay(inputConstraints);
    expect(node.children[0].mixedResult).toMatchObject({
      x: 0,
      y: 0,
      w: 10,
      h: 10,
    });
    expect(node.children[1].mixedResult).toMatchObject({
      x: 10,
      y: 0,
      w: 10,
      h: 10,
      left: 10,
      right: 10,
      top: -10,
    });
  });

  it('position-relative-013', () => {
    const node = genNode({
      children: [
        {
          style: {
            width: 100,
            height: 100,
          },
        },
        {
          style: {
            position: 'relative',
            top: 'auto',
            bottom: 100,
            width: 100,
            height: 100,
          },
        },
        {
          style: {
            position: 'relative',
            top: -200,
            bottom: 0,
            width: 100,
            height: 100,
          },
        },
      ],
    });
    node.lay(inputConstraints);
    expect(node.children[1].mixedResult).toMatchObject({
      x: 0,
      y: 0,
      w: 100,
      h: 100,
      top: 0,
      bottom: 100,
    });
    expect(node.children[2].mixedResult).toMatchObject({
      x: 0,
      y: 0,
      w: 100,
      h: 100,
      top: -200,
      bottom: 0,
    });
  });

  it('position-relative-014', () => {
    const node = genNode({
      children: [
        {
          style: {
            position: 'absolute',
            width: 100,
            height: 100,
          },
        },
        {
          style: {
            position: 'relative',
            top: 100,
            width: 100,
            height: 100,
          },
        },
      ],
    });
    node.lay(inputConstraints);
    expect(node.children[1].mixedResult).toMatchObject({
      x: 0,
      y: 100,
      w: 100,
      h: 100,
      top: 100,
    });
  });

  it('position-relative-015', () => {
    const node = genNode({
      children: [
        {
          style: {
            position: 'relative',
            top: 100,
            width: 100,
            height: 100,
          },
        },
        {
          style: {
            position: 'relative',
            bottom: 100,
            width: 100,
            height: 100,
          },
        },
      ],
    });
    node.lay(inputConstraints);
    expect(node.children[0].mixedResult).toMatchObject({
      x: 0,
      y: 100,
      w: 100,
      h: 100,
      top: 100,
    });
    expect(node.children[1].mixedResult).toMatchObject({
      x: 0,
      y: 0,
      w: 100,
      h: 100,
      bottom: 100,
    });
  });

  it('position-relative-016', () => {
    const node = genNode({
      children: [
        {
          style: {
            borderTopWidth: 1,
            borderRightWidth: 1,
            borderBottomWidth: 1,
            borderLeftWidth: 1,
          },
        },
        {
          style: {
            position: 'absolute',
            marginTop: 100,
            width: 100,
            height: 100,
          },
        },
        {
          style: {
            position: 'relative',
            top: 'auto',
            bottom: -100,
            width: 100,
            height: 100,
          },
          children: [
            {
              style: {
                position: 'relative',
                top: 'inherit',
                width: 100,
                height: 100,
              },
            },
          ],
        },
      ],
    });
    node.lay(inputConstraints);
    expect(node.children[1].mixedResult).toMatchObject({
      x: 0,
      y: 102,
      w: 100,
      h: 100,
      marginTop: 100,
    });
    expect(node.children[2].mixedResult).toMatchObject({
      x: 0,
      y: 102,
      w: 100,
      h: 100,
      top: 0,
      bottom: -100,
    });
    expect(node.children[2].children[0].mixedResult).toMatchObject({
      x: 0,
      y: 102,
      w: 100,
      h: 100,
      top: 0,
      bottom: 0,
    });
  });

  it('position-relative-017', () => {
    const node = genNode({
      style: {
        width: 100,
        height: 200,
      },
      children: [
        {
          style: {
            position: 'relative',
            top: 'auto',
            bottom: 'auto',
            width: 100,
            height: 100,
          },
        },
      ],
    });
    node.lay(inputConstraints);
    expect(node.children[0].mixedResult).toMatchObject({
      x: 0,
      y: 0,
      w: 100,
      h: 100,
      top: 0,
      bottom: 0,
    });
  });

  it('position-relative-019', () => {
    const node = genNode({
      children: [
        {
          style: {
            position: 'absolute',
            width: 100,
            height: 100,
          },
        },
        {
          style: {
            position: 'relative',
            top: 100,
            bottom: 300,
            width: 100,
            height: 100,
          },
        },
      ],
    });
    node.lay(inputConstraints);
    expect(node.children[0].mixedResult).toMatchObject({
      x: 0,
      y: 0,
      w: 100,
      h: 100,
      top: 0,
    });
    expect(node.children[1].mixedResult).toMatchObject({
      x: 0,
      y: 100,
      w: 100,
      h: 100,
      top: 100,
      bottom: 300,
    });
  });

  it('position-static-001', () => {
    const node = genNode({
      style: {
        position: 'relative',
        width: 200,
        height: 200,
      },
      children: [
        {
          children: [{ content: 'Filler Text' }],
        },
      ],
    });
    node.lay(inputConstraints);
    expect(node.mixedResult).toMatchObject({
      x: 0,
      y: 0,
      w: 200,
      h: 200,
    });
    expect(node.children[0].mixedResult).toMatchObject({
      type: 'block',
      x: 0,
      y: 0,
      w: 200,
      h: 24,
    });
    expect(node.children[0].children[0].mixedResult).toMatchObject({
      type: 'text',
      x: 0,
      y: 1,
      w: 176,
      h: 22,
    });
  });
});
