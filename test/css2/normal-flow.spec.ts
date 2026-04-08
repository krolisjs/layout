import { expect } from 'expect';
import { createTestInputConstraints, genNode } from '../env.ts';
import type { InputConstraints } from '../../dist/index.js';

describe('normal-flow', () => {
  let inputConstraints: InputConstraints;

  beforeEach(() => {
    inputConstraints = createTestInputConstraints();
  });

  it('block-formatting-contexts-001', () => {
    const node = genNode({
      style: {
        borderTopWidth: 1,
        borderRightWidth: 1,
        borderBottomWidth: 1,
        borderLeftWidth: 1,
      },
      children: [{
        children: [{ content: 'Fill Text' }],
      }, {
        children: [{ content: 'Fill Text' }],
      }, {
        children: [{ content: 'Fill Text' }],
      }],
    });
    node.lay(inputConstraints);
    expect(node.mixedResult).toMatchObject({
      x: 1,
      y: 1,
      w: 9998,
      h: 72,
      borderTopWidth: 1,
      borderRightWidth: 1,
      borderBottomWidth: 1,
      borderLeftWidth: 1,
    });
    expect(node.children[1].mixedResult).toMatchObject({
      x: 1,
      y: 25,
      w: 9998,
      h: 24,
      borderTopWidth: 0,
      borderRightWidth: 0,
      borderBottomWidth: 0,
      borderLeftWidth: 0,
    });
  });

  it('blocks-011', () => {
    const node = genNode({
      style: {
        width: '3em',
        height: '1em',
      },
      children: [{
        style: {
          height: '1em',
          borderRightWidth: '2em',
          borderLeftWidth: '2em',
        },
      }],
    });
    node.lay(inputConstraints);
    expect(node.mixedResult).toMatchObject({
      x: 0,
      y: 0,
      w: 48,
      h: 16,
    });
    const child = node.children[0];
    expect(child.mixedResult).toMatchObject({
      x: 32,
      y: 0,
      w: 0,
      h: 16,
      borderTopWidth: 0,
      borderRightWidth: 32,
      borderBottomWidth: 0,
      borderLeftWidth: 32,
    });
  });

  it('blocks-012', () => {
    const node = genNode({
      style: {
        width: '3em',
        height: '1em',
      },
      children: [{
        style: {
          paddingLeft: '2em',
          paddingRight: '2em',
        },
      }],
    });
    node.lay(inputConstraints);
    const child = node.children[0];
    expect(child.mixedResult).toMatchObject({
      x: 32,
      y: 0,
      w: 0,
      h: 0,
      paddingTop: 0,
      paddingRight: 32,
      paddingBottom: 0,
      paddingLeft: 32,
    });
  });

  it('blocks-014', () => {
    const node = genNode({
      style: {
        width: '5em',
        height: '1em',
      },
      children: [{
        style: {
          height: '1em',
          borderRightWidth: '2em',
          borderLeftWidth: '2em',
        },
      }],
    });
    node.lay(inputConstraints);
    const child = node.children[0];
    expect(child.mixedResult).toMatchObject({
      x: 32,
      y: 0,
      w: 16,
      h: 16,
      borderTopWidth: 0,
      borderRightWidth: 32,
      borderBottomWidth: 0,
      borderLeftWidth: 32,
    });
  });

  it('blocks-015', () => {
    const node = genNode({
      style: {
        width: '5em',
        height: '1em',
      },
      children: [{
        style: {
          paddingLeft: '2em',
          paddingRight: '2em',
        },
      }],
    });
    node.lay(inputConstraints);
    const child = node.children[0];
    expect(child.mixedResult).toMatchObject({
      x: 32,
      y: 0,
      w: 16,
      h: 0,
      paddingTop: 0,
      paddingRight: 32,
      paddingBottom: 0,
      paddingLeft: 32,
    });
  });

  it('blocks-020', () => {
    const node = genNode({
      style: {
        width: 300,
        height: 100,
      },
      children: [{
        style: {
          width: '200%',
          height: '200%',
        },
      }],
    });
    node.lay(inputConstraints);
    expect(node.children[0].mixedResult).toMatchObject({
      x: 0,
      y: 0,
      w: 600,
      h: 200,
    });
  });

  it('blocks-020', () => {
    const node = genNode({
      style: {
        width: '300px',
        height: 100,
      },
    });
    node.lay(inputConstraints);
    expect(node.mixedResult).toMatchObject({
      x: 0,
      y: 0,
      w: 300,
      h: 100,
    });
  });

  it('blocks-026', () => {
    const node = genNode({
      style: {
        width: 300,
        height: 300,
      },
      children: [{
        style: {
          width: '50%',
          height: 100,
          borderTopWidth: 100,
          borderRightWidth: 100,
          borderBottomWidth: 100,
          borderLeftWidth: 100,
        },
      }],
    });
    node.lay(inputConstraints);
    const child = node.children[0];
    expect(child.mixedResult).toMatchObject({
      x: 100,
      y: 100,
      w: 150,
      h: 100,
      borderTopWidth: 100,
      borderRightWidth: 100,
      borderBottomWidth: 100,
      borderLeftWidth: 100,
    });
  });

  it('blocks-027', () => {
    const node = genNode({
      style: {
        boxSizing: 'borderBox',
        width: '3em',
        height: '1em',
        borderRightWidth: '2em',
        borderLeftWidth: '2em',
      },
    });
    node.lay(inputConstraints);
    expect(node.mixedResult).toMatchObject({
      x: 32,
      y: 0,
      w: 0,
      h: 16,
      borderTopWidth: 0,
      borderRightWidth: 32,
      borderBottomWidth: 0,
      borderLeftWidth: 32,
    });
  });

  it('blocks-028', () => {
    const node = genNode({
      style: {
        boxSizing: 'borderBox',
        width: '3em',
        height: '1em',
        paddingRight: '2em',
        paddingLeft: '2em',
      },
    });
    node.lay(inputConstraints);
    expect(node.mixedResult).toMatchObject({
      x: 32,
      y: 0,
      w: 0,
      h: 16,
      paddingTop: 0,
      paddingRight: 32,
      paddingBottom: 0,
      paddingLeft: 32,
    });
  });

  it('containing-block-percent-margin-bottom', () => {
    const node = genNode({
      style: {
        width: 100,
      },
      children: [{
        style: {
          marginBottom: '50%',
          height: 50,
        },
      }],
    });
    node.lay(inputConstraints);
    expect(node.mixedResult).toMatchObject({
      x: 0,
      y: 0,
      w: 100,
      h: 100,
      marginBottom: 0,
    });
    expect(node.children[0].mixedResult).toMatchObject({
      x: 0,
      y: 0,
      w: 100,
      h: 50,
      marginTop: 0,
      marginRight: 0,
      marginBottom: 50,
      marginLeft: 0,
    });
  });

  it('containing-block-percent-margin-left', () => {
    const node = genNode({
      style: {
        width: 200,
      },
      children: [{
        style: {
          marginLeft: '50%',
          height: 100,
        },
      }],
    });
    node.lay(inputConstraints);
    expect(node.mixedResult).toMatchObject({
      x: 0,
      y: 0,
      w: 200,
      h: 100,
    });
    expect(node.children[0].mixedResult).toMatchObject({
      x: 100,
      y: 0,
      w: 100,
      h: 100,
      marginTop: 0,
      marginRight: 0,
      marginBottom: 0,
      marginLeft: 100,
    });
  });

  it('containing-block-percent-margin-right', () => {
    const node = genNode({
      style: {
        width: 200,
      },
      children: [{
        style: {
          marginRight: '50%',
          height: 100,
        },
      }],
    });
    node.lay(inputConstraints);
    expect(node.mixedResult).toMatchObject({
      x: 0,
      y: 0,
      w: 200,
      h: 100,
    });
    expect(node.children[0].mixedResult).toMatchObject({
      x: 0,
      y: 0,
      w: 100,
      h: 100,
      marginTop: 0,
      marginRight: 100,
      marginBottom: 0,
      marginLeft: 0,
    });
  });

  it('containing-block-percent-margin-top', () => {
    const node = genNode({
      style: {
        width: 100,
      },
      children: [{
        style: {
          marginTop: '50%',
          height: 50,
        },
      }],
    });
    node.lay(inputConstraints);
    expect(node.mixedResult).toMatchObject({
      x: 0,
      y: 0,
      w: 100,
      h: 100,
    });
    expect(node.children[0].mixedResult).toMatchObject({
      x: 0,
      y: 50,
      w: 100,
      h: 50,
      marginTop: 50,
      marginRight: 0,
      marginBottom: 0,
      marginLeft: 0,
    });
  });

  it('containing-block-percent-padding-bottom', () => {
    const node = genNode({
      style: {
        width: 500,
      },
      children: [{
        style: {
          paddingBottom: '10%',
          width: 100,
          height: 50,
        },
      }],
    });
    node.lay(inputConstraints);
    expect(node.mixedResult).toMatchObject({
      x: 0,
      y: 0,
      w: 500,
      h: 100,
    });
    expect(node.children[0].mixedResult).toMatchObject({
      x: 0,
      y: 0,
      w: 100,
      h: 50,
      paddingTop: 0,
      paddingRight: 0,
      paddingBottom: 50,
    });
  });

  it('containing-block-percent-padding-left', () => {
    const node = genNode({
      style: {
        width: 500,
      },
      children: [{
        style: {
          paddingLeft: '10%',
          width: 50,
          height: 100,
        },
      }],
    });
    node.lay(inputConstraints);
    expect(node.mixedResult).toMatchObject({
      x: 0,
      y: 0,
      w: 500,
      h: 100,
    });
    expect(node.children[0].mixedResult).toMatchObject({
      x: 50,
      y: 0,
      w: 50,
      h: 100,
      paddingTop: 0,
      paddingRight: 0,
      paddingBottom: 0,
      paddingLeft: 50,
    });
  });

  it('containing-block-percent-padding-right', () => {
    const node = genNode({
      style: {
        width: 500,
      },
      children: [{
        style: {
          paddingRight: '10%',
          width: 50,
          height: 100,
        },
      }],
    });
    node.lay(inputConstraints);
    expect(node.mixedResult).toMatchObject({
      x: 0,
      y: 0,
      w: 500,
      h: 100,
    });
    expect(node.children[0].mixedResult).toMatchObject({
      x: 0,
      y: 0,
      w: 50,
      h: 100,
      paddingTop: 0,
      paddingRight: 50,
      paddingBottom: 0,
      paddingLeft: 0,
    });
  });

  it('containing-block-percent-padding-top', () => {
    const node = genNode({
      style: {
        width: 500,
      },
      children: [{
        style: {
          paddingTop: '10%',
          width: 100,
          height: 50,
        },
      }],
    });
    node.lay(inputConstraints);
    expect(node.mixedResult).toMatchObject({
      x: 0,
      y: 0,
      w: 500,
      h: 100,
    });
    expect(node.children[0].mixedResult).toMatchObject({
      x: 0,
      y: 50,
      w: 100,
      h: 50,
      paddingTop: 50,
      paddingRight: 0,
      paddingBottom: 0,
      paddingLeft: 0,
    });
  });

  it('width-001', () => {
    const node = genNode({
      style: {
        width: 0,
      },
    });
    node.lay(inputConstraints);
    expect(node.mixedResult).toMatchObject({
      x: 0,
      y: 0,
      w: 0,
      h: 0,
    });
  });

  it('height-001', () => {
    const node = genNode({
      style: {
        height: 0,
      },
    });
    node.lay(inputConstraints);
    expect(node.mixedResult).toMatchObject({
      x: 0,
      y: 0,
      w: 10000,
      h: 0,
    });
  });

  it('inline-block-width-001a', () => {
    const node = genNode({
      style: {
        width: '10em',
      },
      children: [
        { content: 'x' },
        {
          style: {
            display: 'inlineBlock',
          },
          children: [{ content: '1234567890' }],
        },
        { content: 'z' },
      ],
    });
    node.lay(inputConstraints);
    expect(node.mixedResult).toMatchObject({
      x: 0,
      y: 0,
      w: 160,
      h: 72,
    });
    expect(node.children[0].mixedResult).toMatchObject({
      x: 0,
      y: 1,
      w: 16,
      h: 22,
    });
    expect(node.children[1].mixedResult).toMatchObject({
      x: 0,
      y: 24,
      w: 160,
      h: 24,
    });
    expect(node.children[2].mixedResult).toMatchObject({
      x: 0,
      y: 49,
      w: 16,
      h: 22,
    });
  });

  it('inlines-002', () => {
    const node = genNode({
      style: {
        display: 'inline',
        paddingTop: '0.5em',
        paddingBottom: '0.5em',
      },
      children: [{
        style: {
          display: 'inline',
          borderTopWidth: '0.5em',
          borderRightWidth: '0.5em',
          borderBottomWidth: '0.5em',
          borderLeftWidth: '0.5em',
        },
        children: [{
          content: '1234567890',
        }],
      }],
    });
    node.lay(inputConstraints);
    expect(node.mixedResult).toMatchObject({
      x: 0,
      y: 1,
      w: 176,
      h: 22,
      paddingTop: 8,
      paddingRight: 0,
      paddingBottom: 8,
      paddingLeft: 0,
      frags: [
        {
          x: 0,
          y: 1,
          w: 176,
          h: 22,
        },
      ],
      type: 'inline',
    });
    expect(node.children[0].mixedResult).toMatchObject({
      x: 8,
      y: 1,
      w: 160,
      h: 22,
      borderTopWidth: 8,
      borderRightWidth: 8,
      borderBottomWidth: 8,
      borderLeftWidth: 8,
      frags: [
        {
          x: 8,
          y: 1,
          w: 160,
          h: 22,
        },
      ],
      type: 'inline',
    });
    expect(node.children[0].children[0].mixedResult).toMatchObject({
      x: 8,
      y: 1,
      w: 160,
      h: 22,
      frags: [
        {
          x: 8,
          y: 1,
          w: 160,
          h: 22,
          content: '1234567890',
        }
      ],
      type: 'text',
    });
  });
});
