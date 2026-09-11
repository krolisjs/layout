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

  it('abs-margin-top-auto', () => {
    const node = genNode({
      style: {
        position: 'relative',
        width: 200,
        height: 100,
      },
      children: [{
        style: {
          position: 'absolute',
          top: 0,
          bottom: 0,
          width: 20,
          height: 20,
          marginTop: 'auto',
        },
      }],
    });
    node.lay(inputConstraints);
    expect(node.children[0].mixedResult).toMatchObject({
      y: 80,
      h: 20,
      marginTop: 80,
    });
  });

});