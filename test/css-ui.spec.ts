import { expect } from 'expect';
import { createTestInputConstraints, genNode } from './env.ts';
import type { InputConstraints } from '../dist/index.js';

describe('css-ui', () => {
  let inputConstraints: InputConstraints;

  beforeEach(() => {
    inputConstraints = createTestInputConstraints();
  });

  it('box-sizing-001', () => {
    const node = genNode({
      style: {
        position: 'absolute',
        width: 100,
        height: 100,
      },
      children: [
        {
          style: {
            boxSizing: 'borderBox',
            marginTop: 25,
            marginRight: 5,
            marginLeft: 'auto',
            paddingLeft: 25,
            paddingRight: 25,
            width: 70,
            height: 70,
          },
        },
      ],
    });
    node.lay(inputConstraints);
    expect(node.children[0].mixedResult).toMatchObject({
      x: 20,
      y: 25,
      w: 20,
      h: 70,
    });
  });
});
