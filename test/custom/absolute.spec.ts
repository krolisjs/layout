import { expect } from 'expect';
import { createTestInputConstraints, genNode } from '../env';
import type { InputConstraints } from '../../src/';

describe('absolute', () => {
  let inputConstraints: InputConstraints;

  beforeEach(() => {
    inputConstraints = createTestInputConstraints();
  });

  it('abs-height-non-negative', () => {
    const node = genNode({
      style: {
        position: 'relative',
        width: 200,
        height: 100,
      },
      children: [{
        style: {
          position: 'absolute',
          top: 80,
          bottom: 50,
        },
      }],
    });
    node.lay(inputConstraints);
    expect(node.children[0].mixedResult).toMatchObject({
      y: 80,
      h: 0,
    });
  });
});