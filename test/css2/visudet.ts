import { expect } from 'expect';
import { createTestInputConstraints, genNode } from '../env.ts';
import type { InputConstraints } from '../../dist/index.js';

describe('visudet', () => {
  let inputConstraints: InputConstraints;

  beforeEach(() => {
    inputConstraints = createTestInputConstraints();
  });

  it.skip('content-height-001', () => {
    const node = genNode({
      style: {
        fontSize: 50,
      },
      children: [
        {
          style: {
            display: 'inlineBlock',
            lineHeight: '200px',
          },
          children: [
            {
              style: {
                display: 'inline',
              },
              children: [
                {
                  content: '1234567890',
                },
              ],
            },
          ],
        },
        {
          style: {
            display: 'inlineBlock',
            lineHeight: '30px',
          },
          children: [
            {
              style: {
                display: 'inline',
              },
              children: [
                {
                  content: '1234567890',
                },
              ],
            },
          ],
        },
        {
          style: {
            display: 'inlineBlock',
            lineHeight: 'normal',
          },
          children: [
            {
              style: {
                display: 'inline',
              },
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
      w: 0,
      h: 0,
    });
  });
});
