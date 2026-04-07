import { expect } from 'expect';
import { createTestInputConstraints, genNode } from '../env.ts';
import type { InputConstraints } from '../../dist/index.js';

describe('box-display', () => {
  let inputConstraints: InputConstraints;

  beforeEach(() => {
    inputConstraints = createTestInputConstraints();
  });

  it('block-in-inline-003', () => {
    const node = genNode({
      children: [
        {
          style: {
            display: 'inline',
          },
          children: [
            {
              children: [
                {
                  content: '1234567890',
                },
              ],
            },
          ],
        },
      ],
    });
    node.lay(inputConstraints);
    expect(node.children[0].mixedResult).toMatchObject({
      x: 0,
      y: 0,
      w: 10000,
      h: 24,
      frags: [],
    });
  });

  it('block-in-inline-008', () => {
    const node = genNode({
      children: [
        {
          style: {
            width: '5em',
            height: '5em',
          },
        },
        {
          children: [
            {
              style: {
                display: 'inline',
              },
              children: [
                {
                  style: {
                    position: 'relative',
                    top: '-5em',
                    width: '5em',
                    height: '5em',
                  },
                },
              ],
            },
          ],
        },
      ],
    });
    node.lay(inputConstraints);
    expect(node.children[1].children[0].children[0].mixedResult).toMatchObject({
      x: 0,
      y: 0,
      w: 80,
      h: 80,
    });
  });

  it('containing-block-001', () => {
    const node = genNode({
      style: {
        width: '100px',
        height: '100px',
      },
      children: [
        {
          style: {
            width: '100%',
            height: '100%',
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
      frags: null,
    });
  });

  it('containing-block-003', () => {
    const node = genNode({
      style: {
        display: 'inlineBlock',
        paddingTop: 20,
        paddingRight: 20,
        paddingBottom: 20,
        paddingLeft: 20,
        width: 60,
        height: 60,
      },
      children: [
        {
          style: {
            position: 'relative',
            left: -20,
            top: -20,
            width: 100,
            height: 100,
          },
        },
      ],
    });
    node.lay(inputConstraints);
    expect(node.mixedResult).toMatchObject({
      x: 20,
      y: 20,
      w: 60,
      h: 60,
      frags: null,
    });
    expect(node.children[0].mixedResult).toMatchObject({
      x: 0,
      y: 0,
      w: 100,
      h: 100,
    });
  });

  it('display-001', () => {
    const node = genNode({
      children: [
        {
          style: {
            display: 'inline',
          },
          children: [{ content: 'Filler text' }],
        },
        {
          style: {
            display: 'inline',
          },
          children: [{ content: 'Filler text' }],
        },
      ],
    });
    node.lay(inputConstraints);
    expect(node.mixedResult).toMatchObject({
      x: 0,
      y: 0,
      h: 24,
    });
    expect(node.children[0].mixedResult).toMatchObject({
      type: 'inline',
      x: 0,
      y: 1,
      w: 176,
      h: 22,
    });
    expect(node.children[1].mixedResult).toMatchObject({
      type: 'inline',
      x: 176,
      y: 1,
      w: 176,
      h: 22,
    });
  });

  it('display-002', () => {
    const node = genNode({
      children: [
        {
          children: [{ content: 'Filler text' }],
        },
        {
          children: [{ content: 'Filler text' }],
        },
      ],
    });
    node.lay(inputConstraints);
    expect(node.mixedResult).toMatchObject({
      x: 0,
      y: 0,
      h: 48,
    });
    expect(node.children[0].mixedResult).toMatchObject({
      type: 'block',
      x: 0,
      y: 0,
      h: 24,
    });
    expect(node.children[1].mixedResult).toMatchObject({
      type: 'block',
      x: 0,
      y: 24,
      h: 24,
    });
  });

  it('display-005', () => {
    const node = genNode({
      children: [
        { content: 'Filler text' },
        {
          style: {
            display: 'inlineBlock',
          },
          children: [{ content: 'Filler text' }],
        },
      ],
    });
    node.lay(inputConstraints);
    expect(node.mixedResult).toMatchObject({
      x: 0,
      y: 0,
      h: 24,
    });
    expect(node.children[0].mixedResult).toMatchObject({
      type: 'text',
      x: 0,
      y: 1,
      w: 176,
      h: 22,
    });
    expect(node.children[1].mixedResult).toMatchObject({
      type: 'inlineBlock',
      x: 176,
      y: 0,
      w: 176,
      h: 24,
    });
    expect(node.children[1].children[0].mixedResult).toMatchObject({
      type: 'text',
      x: 176,
      y: 1,
      w: 176,
      h: 22,
    });
  });
});
