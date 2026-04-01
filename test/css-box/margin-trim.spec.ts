import { expect } from 'expect';
import { createTestInputConstraints, genNode } from '../env.ts';
import type { InputConstraints } from '../../dist/index.js';

describe('margin-trim', () => {
  let inputConstraints: InputConstraints;

  beforeEach(() => {
    inputConstraints = createTestInputConstraints();
  });

  it('block-container-block-001', () => {
    const node = genNode({
      style: {
        overflow: 'hidden',
        width: 110,
      },
      children: [
        {
          style: {
            width: 100,
          },
          children: [
            {
              style: {
                width: 90,
                height: 50,
                marginTop: 50,
                marginBottom: 50,
              },
            },
          ],
        },
        {
          style: {
            width: 100,
            height: 50,
          },
        },
      ],
    });
    node.lay(inputConstraints);
    expect(node.children[0].result).toMatchObject({
      x: 0,
      y: 50,
      h: 50,
      marginTop: 0,
      marginBottom: 0,
    });
    expect(node.children[0].children[0].result).toMatchObject({
      x: 0,
      y: 50,
      h: 50,
      marginTop: 50,
      marginBottom: 50,
    });
    expect(node.children[1].result).toMatchObject({
      x: 0,
      y: 150,
      h: 50,
      marginTop: 0,
    });
  });
});
