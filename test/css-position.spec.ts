import { expect } from 'expect';
import { createTestInputConstraints, genNode } from './env.ts';
import type { InputConstraints } from '../dist/index.js';

describe('css-position', () => {
  let inputConstraints: InputConstraints;

  beforeEach(() => {
    inputConstraints = createTestInputConstraints();
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
    node.lay(inputConstraints);
    expect(node.children[0].result).toMatchObject({
      x: 10,
      y: 10,
      w: 80,
      h: 80,
    });
  });

  it('position-absolute-in-inline-001', () => {
    const node = genNode({
      style: {
        display: 'inline',
        position: 'relative',
      },
      children: [
        {
          style: {
            width: 100,
            height: 100,
          },
        },
        {
          style: {
            position: 'absolute',
            left: 0,
            top: 0,
            width: 100,
            height: 100,
          },
        },
      ],
    });
    node.lay(inputConstraints);
    expect(node.children[1].result).toMatchObject({
      x: 0,
      y: 0,
      w: 100,
      h: 100,
    });
  });

  it('position-absolute-in-inline-002', () => {
    const node = genNode({
      style: {
        display: 'inline',
      },
      children: [
        {
          content: 'outer begin',
        },
        {
          style: {
            display: 'inline',
            position: 'relative',
          },
          children: [
            {
              content: 'container start',
            },
            {
              style: {
                width: 10,
                height: 10,
              },
            },
            {
              style: {
                position: 'absolute',
                top: 0,
                right: 0,
                bottom: 0,
                left: 0,
              },
            },
            {
              content: 'container end',
            },
          ],
        },
        {
          content: 'outer end',
        },
      ],
    });
    node.lay(inputConstraints);
    expect(node.result).toMatchObject({
      x: 0,
      y: 1,
      w: 416,
      h: 56,
    });
    expect(node.children[0].result).toMatchObject({
      x: 0,
      y: 1,
      w: 176,
      h: 22,
    });
    expect(node.children[1].result).toMatchObject({
      x: 0,
      y: 1,
      w: 416,
      h: 56,
      frags: [
        { x: 176, y: 1, w: 240, h: 22 },
        { x: 0, y: 35, w: 208, h: 22 },
      ],
    });
    expect(node.children[1].children[0].result).toMatchObject({
      x: 176,
      y: 1,
      w: 240,
      h: 22,
    });
    expect(node.children[1].children[1].result).toMatchObject({
      x: 0,
      y: 24,
      w: 10,
      h: 10,
    });
    expect(node.children[1].children[2].result).toMatchObject({
      x: 176,
      y: 1,
      w: 32,
      h: 56,
    });
    expect(node.children[1].children[3].result).toMatchObject({
      x: 0,
      y: 35,
      w: 208,
      h: 22,
    });
    expect(node.children[2].result).toMatchObject({
      x: 208,
      y: 35,
      w: 144,
      h: 22,
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
    node.lay(inputConstraints);
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
    node.lay(inputConstraints);
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
    node.lay(inputConstraints);
    expect(node.children[0].result).toMatchObject({
      x: 0,
      y: 0,
      w: 100,
      h: 100,
    });
  });
});
