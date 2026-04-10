import { expect } from 'expect';
import { createTestInputConstraints, genNode } from '../env.ts';
import type { InputConstraints } from '../../dist/index.js';

describe('percentage-width', () => {
  let inputConstraints: InputConstraints;

  beforeEach(() => {
    inputConstraints = createTestInputConstraints();
  });

  it('block-auto-child-%', () => {
    const node = genNode({
      style: {
        display: 'block',
        width: 'auto',
      },
      children: [
        {
          style: {
            width: '50%',
          },
        },
      ],
    });
    node.lay(inputConstraints);
    expect(node.children[0].mixedResult).toMatchObject({
      x: 0,
      y: 0,
      w: 5000,
    });
  });

  it('ib-auto-child-%', () => {
    const node = genNode({
      style: {
        display: 'inlineBlock',
        width: 'auto',
      },
      children: [
        {
          style: {
            width: '50%',
          },
          children: [{ content: 'x' }],
        },
      ],
    });
    node.lay(inputConstraints);
    expect(node.mixedResult).toMatchObject({
      x: 0,
      y: 0,
      w: 16,
    });
    expect(node.children[0].mixedResult).toMatchObject({
      x: 0,
      y: 0,
      w: 8,
    });
    expect(node.children[0].children[0].mixedResult).toMatchObject({
      x: 0,
      y: 1,
      w: 16,
    });
  });

  it('abs-%', () => {
    const node = genNode({
      style: {
        position: 'relative',
        width: 200,
      },
      children: [
        {
          style: {
            position: 'absolute',
            width: '50%',
          },
        },
      ],
    });
    node.lay(inputConstraints);
    expect(node.children[0].mixedResult).toMatchObject({
      x: 0,
      y: 0,
      w: 100,
    });
  });

  it('block-auto-child-p-%', () => {
    const node = genNode({
      style: {
        display: 'block',
        width: 'auto',
      },
      children: [
        {
          style: {
            width: '50%',
          },
          children: [
            {
              style: {
                width: '50%',
              },
            },
          ],
        },
      ],
    });
    node.lay(inputConstraints);
    expect(node.children[0].children[0].mixedResult).toMatchObject({
      x: 0,
      y: 0,
      w: 2500,
    });
  });
});

describe('percentage-height', () => {
  let inputConstraints: InputConstraints;

  beforeEach(() => {
    inputConstraints = createTestInputConstraints();
  });
});
