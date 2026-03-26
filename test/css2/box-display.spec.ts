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
    expect(node.children[0].result).toMatchObject({
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
    expect(node.children[1].children[0].children[0].result).toMatchObject({
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
    expect(node.children[0].result).toMatchObject({
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
    expect(node.result).toMatchObject({
      x: 20,
      y: 20,
      w: 60,
      h: 60,
      frags: null,
    });
    expect(node.children[0].result).toMatchObject({
      x: 0,
      y: 0,
      w: 100,
      h: 100,
    });
  });
});
