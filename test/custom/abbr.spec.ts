import { expect } from 'expect';
import { createTestInputConstraints, genNode } from '../env.ts';
import type { InputConstraints } from '../../dist/index.js';

describe('abbr', () => {
  let inputConstraints: InputConstraints;

  beforeEach(() => {
    inputConstraints = createTestInputConstraints();
  });

  it('margin', () => {
    const node = genNode({
      style: {
        margin: '1px 2px 3px 4px',
      },
    });
    node.lay(inputConstraints);
    expect(node.mixedResult).toMatchObject({
      marginTop: 1,
      marginRight: 2,
      marginBottom: 3,
      marginLeft: 4,
    });
  });

  it('padding', () => {
    const node = genNode({
      style: {
        padding: '1px 2px 3px 4px',
      },
    });
    node.lay(inputConstraints);
    expect(node.mixedResult).toMatchObject({
      paddingTop: 1,
      paddingRight: 2,
      paddingBottom: 3,
      paddingLeft: 4,
    });
  });

});
