import { expect } from 'expect';
import { createTestInputConstraints, genNode } from '../env.ts';
import type { InputConstraints } from '../../dist/index.js';

describe('prohibited-line', () => {
  let inputConstraints: InputConstraints;

  beforeEach(() => {
    inputConstraints = createTestInputConstraints();
  });

  it('end', () => {
    const node = genNode({
      style: {
        width: 32,
      },
      children: [
        {
          content: '我“说',
        },
      ],
    });
    node.lay(inputConstraints);
    expect(node.children[0].mixedResult).toMatchObject({
      frags: [
        {
          content: '我',
          w: 16,
        },
        {
          content: '“说',
          w: 32,
        },
      ],
    });
  });

  it('start', () => {
    const node = genNode({
      style: {
        width: 32,
      },
      children: [
        {
          content: '我说。',
        },
      ],
    });
    node.lay(inputConstraints);
    expect(node.children[0].mixedResult).toMatchObject({
      frags: [
        {
          content: '我',
          w: 16,
        },
        {
          content: '说。',
          w: 32,
        },
      ],
    });
  });

  it('start & end', () => {
    const node = genNode({
      style: {
        width: 32,
      },
      children: [
        {
          content: '我（。',
        },
      ],
    });
    node.lay(inputConstraints);
    expect(node.children[0].mixedResult).toMatchObject({
      frags: [
        {
          content: '我',
          w: 16,
        },
        {
          content: '（。',
          w: 32,
        },
      ],
    });
  });

  it('at lease 1', () => {
    const node = genNode({
      style: {
        width: 32,
      },
      children: [
        {
          content: '（（',
        },
      ],
    });
    node.lay(inputConstraints);
    expect(node.children[0].mixedResult).toMatchObject({
      frags: [
        {
          content: '（',
          w: 16,
        },
        {
          content: '（',
          w: 16,
        },
      ],
    });
  });

});
