import { expect } from 'expect';
import { createTestInputConstraints, genNode } from '../env';
import type { InputConstraints } from '../../src/';

describe('percentage-width', () => {
  let inputConstraints: InputConstraints;
  
  beforeEach(() => {
    inputConstraints = createTestInputConstraints();
  });
  
  it('line-height-inherit', () => {
    const node = genNode({
      style: {
        fontSize: 20,
        lineHeight: 1.5,
      },
      children: [{
        style: {
          fontSize: 10,
        },
      }],
    });
    node.lay(inputConstraints);
    expect(node.children[0].mixedResult).toMatchObject({
      fontSize: 10,
      lineHeight: 15,
    });
  });
});
