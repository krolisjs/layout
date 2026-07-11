import { expect } from 'expect';
import { createTestInputConstraints, genNode } from '../env.ts';
import type { InputConstraints } from '../../dist/index.js';

describe('abbr', () => {
  let inputConstraints: InputConstraints;

  beforeEach(() => {
    inputConstraints = createTestInputConstraints();
  });

  it('margin-001', () => {
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

  it('margin-002', () => {
    const node = genNode({
      style: {
        margin: 1,
      },
    });
    node.lay(inputConstraints);
    expect(node.mixedResult).toMatchObject({
      marginTop: 1,
      marginRight: 1,
      marginBottom: 1,
      marginLeft: 1,
    });
  });

  it('margin-003', () => {
    const node = genNode({
      style: {
        margin: [1],
      },
    });
    node.lay(inputConstraints);
    expect(node.mixedResult).toMatchObject({
      marginTop: 1,
      marginRight: 1,
      marginBottom: 1,
      marginLeft: 1,
    });
  });

  it('margin-004', () => {
    const node = genNode({
      style: {
        margin: [1, 2],
      },
    });
    node.lay(inputConstraints);
    expect(node.mixedResult).toMatchObject({
      marginTop: 1,
      marginRight: 2,
      marginBottom: 1,
      marginLeft: 2,
    });
  });

  it('margin-005', () => {
    const node = genNode({
      style: {
        margin: [1, 2, 3],
      },
    });
    node.lay(inputConstraints);
    expect(node.mixedResult).toMatchObject({
      marginTop: 1,
      marginRight: 2,
      marginBottom: 3,
      marginLeft: 2,
    });
  });

  it('margin-006', () => {
    const node = genNode({
      style: {
        margin: [1, 2, 3, 4],
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

  it('padding-001', () => {
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

  it('font-001', () => {
    const node = genNode({
      style: {
        font: 'italic bold 12px Arial',
      },
    });
    node.lay(inputConstraints);
    expect(node.mixedResult).toMatchObject({
      fontStyle: 2,
      fontWeight: 700,
      fontSize: 12,
      fontFamily: 'Arial',
    });
  });

  it('font-002', () => {
    const node = genNode({
      style: {
        font: 'normal 12px/2 Arial',
      },
    });
    node.lay(inputConstraints);
    expect(node.mixedResult).toMatchObject({
      fontStyle: 1,
      fontWeight: 400,
      fontSize: 12,
      lineHeight: 24,
      fontFamily: 'Arial',
    });
  });

  it('border-001', () => {
    const node = genNode({
      style: {
        border: '1px solid #000',
      },
    });
    node.lay(inputConstraints);
    expect(node.mixedResult).toMatchObject({
      borderTopWidth: 1,
      borderRightWidth: 1,
      borderBottomWidth: 1,
      borderLeftWidth: 1,
    });
  });

  it('flex-001', () => {
    const node = genNode({
      style: {
        flex: 'none',
      },
    });
    node.lay(inputConstraints);
    expect(node.mixedResult).toMatchObject({
      flexGrow: 0,
      flexShrink: 0,
      flexBasis: 0,
    });
  });

  it('flex-002', () => {
    const node = genNode({
      style: {
        flex: 'auto',
      },
    });
    node.lay(inputConstraints);
    expect(node.mixedResult).toMatchObject({
      flexGrow: 1,
      flexShrink: 1,
      flexBasis: 0,
    });
  });

  it('flex-003', () => {
    const node = genNode({
      style: {
        flex: '1',
      },
    });
    node.lay(inputConstraints);
    expect(node.mixedResult).toMatchObject({
      flexGrow: 1,
      flexShrink: 1,
      flexBasis: 0,
    });
  });

  it('flex-004', () => {
    const node = genNode({
      style: {
        flex: '1 2',
      },
    });
    node.lay(inputConstraints);
    expect(node.mixedResult).toMatchObject({
      flexGrow: 1,
      flexShrink: 2,
      flexBasis: 0,
    });
  });

  it('flex-005', () => {
    const node = genNode({
      style: {
        flex: '1 20px',
      },
    });
    node.lay(inputConstraints);
    expect(node.mixedResult).toMatchObject({
      flexGrow: 1,
      flexShrink: 1,
      flexBasis: 20,
    });
  });

  it('flex-006', () => {
    const node = genNode({
      style: {
        flex: '1 2 30%',
      },
    });
    node.lay(inputConstraints);
    expect(node.mixedResult).toMatchObject({
      flexGrow: 1,
      flexShrink: 2,
      // flexBasis: 0,
    });
  });

  it('flex-007', () => {
    const node = genNode({
      style: {
        flex: 'content',
      },
    });
    node.lay(inputConstraints);
    expect(node.mixedResult).toMatchObject({
      flexGrow: 0,
      flexShrink: 1,
      flexBasis: 0,
    });
  });

  it('flex-008', () => {
    const node = genNode({
      style: {
        flex: [2],
      },
    });
    node.lay(inputConstraints);
    expect(node.mixedResult).toMatchObject({
      flexGrow: 2,
      flexShrink: 1,
      flexBasis: 0,
    });
  });

  it('flex-009', () => {
    const node = genNode({
      style: {
        flex: [2, 3],
      },
    });
    node.lay(inputConstraints);
    expect(node.mixedResult).toMatchObject({
      flexGrow: 2,
      flexShrink: 3,
      flexBasis: 0,
    });
  });

  it('flex-010', () => {
    const node = genNode({
      style: {
        flex: [2, '4px'],
      },
    });
    node.lay(inputConstraints);
    expect(node.mixedResult).toMatchObject({
      flexGrow: 2,
      flexShrink: 1,
      flexBasis: 4,
    });
  });

  it('flex-011', () => {
    const node = genNode({
      style: {
        flex: [2, 3, 0],
      },
    });
    node.lay(inputConstraints);
    expect(node.mixedResult).toMatchObject({
      flexGrow: 2,
      flexShrink: 3,
      flexBasis: 0,
    });
  });

  it('flex-012', () => {
    const node = genNode({
      style: {
        flex: [2, 3, 'content'],
      },
    });
    node.lay(inputConstraints);
    expect(node.mixedResult).toMatchObject({
      flexGrow: 2,
      flexShrink: 3,
      flexBasis: 0,
    });
  });

});
