import { expect } from 'expect';
import { createTestInputConstraints, genNode } from '../../env.ts';
import type { InputConstraints } from '../../../dist/index.js';

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

  it('inline-block-000', () => {
    const node = genNode({
      children: [
        { content: 'a' },
        {
          style: {
            display: 'inlineBlock',
          },
          children: [{ content: 'b' }],
        },
        { content: 'c' },
      ],
    });
    node.lay(inputConstraints);
    expect(node.children[1].mixedResult).toMatchObject({
      x: 16,
      y: 0,
      w: 16,
      h: 24,
    });
  });

  it('inline-block-001', () => {
    const node = genNode({
      children: [
        { content: 'This test has:' },
        {
          style: {
            display: 'inlineBlock',
            paddingRight: '1em',
            paddingBottom: '1em',
            paddingLeft: '1em',
            borderTopWidth: '1em',
            borderRightWidth: '1em',
            borderBottomWidth: '1em',
            borderLeftWidth: '1em',
          },
          children: [{ content: '1\n2\n3' }],
        },
      ],
    });
    node.lay(inputConstraints);
    expect(node.children[0].mixedResult).toMatchObject({
      x: 0,
      y: 65,
      w: 224,
      h: 22,
      baseline: 14,
      frags: [
        { x: 0, y: 65, w: 224, h: 22, content: 'This test has:' },
      ],
    });
    expect(node.children[1].mixedResult).toMatchObject({
      x: 256,
      y: 16,
      w: 16,
      h: 72,
    });
    expect(node.children[1].children[0].mixedResult).toMatchObject({
      type: 'text',
      x: 256,
      y: 17,
      w: 16,
      h: 70,
      baseline: 14,
      frags: [
        { x: 256, y: 17, w: 16, h: 22, content: '1' },
        { x: 256, y: 41, w: 16, h: 22, content: '2' },
        { x: 256, y: 65, w: 16, h: 22, content: '3' },
      ],
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

  it('inline-block-width-001b', () => {
    const node = genNode({
      style: {
        width: '10em',
      },
      children: [
        { content: 'x' },
        {
          style: {
            display: 'inlineBlock',
            width: '10em',
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

  it('inline-block-width-002a', () => {
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
          children: [
            {
              style: {
                width: '20em',
              },
              children: [{ content: 'y' }],
            },
          ],
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
    expect(node.children[1].mixedResult).toMatchObject({
      x: 0,
      y: 24,
      w: 320,
      h: 24,
    });
    expect(node.children[2].mixedResult).toMatchObject({
      x: 0,
      y: 49,
      w: 16,
      h: 22,
    });
  });

  it('inline-block-width-002b', () => {
    const node = genNode({
      style: {
        width: '10em',
      },
      children: [
        { content: 'x' },
        {
          style: {
            display: 'inlineBlock',
            width: '20em',
          },
          children: [
            {
              style: {
              },
              children: [{ content: 'y' }],
            },
          ],
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
    expect(node.children[1].mixedResult).toMatchObject({
      x: 0,
      y: 24,
      w: 320,
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

  it('custom-inlineBlock-inline-block-001', () => {
    const node = genNode({
      style: {
        display: 'inlineBlock',
      },
      children: [
        {
          style: {
            display: 'inline',
          },
          children: [
            {
              content: '12',
            },
            {
              style: {
                width: 100,
                height: 20,
              },
            },
            {
              content: 'ab',
            },
          ],
        },
      ],
    });
    node.lay(inputConstraints);
    expect(node.mixedResult).toMatchObject({
      x: 0,
      y: 0,
      w: 100,
      h: 68,
    });

    expect(node.children[0].mixedResult).toMatchObject({
      x: 0,
      y: 1,
      w: 100,
      h: 66,
    });
  });

  it('custom-inlineBlock-inline-block-002', () => {
    const node = genNode({
      style: {
        display: 'inlineBlock',
      },
      children: [
        {
          style: {
            display: 'inline',
          },
          children: [
            {
              style: {
                display: 'inline',
              },
              children: [
                {
                  content: '12',
                },
                {
                  style: {
                    width: 100,
                    height: 20,
                  },
                },
                {
                  content: 'ab',
                },
              ],
            },
          ],
        },
      ],
    });
    node.lay(inputConstraints);
    expect(node.mixedResult).toMatchObject({
      x: 0,
      y: 0,
      w: 100,
      h: 68,
    });

    expect(node.children[0].mixedResult).toMatchObject({
      x: 0,
      y: 1,
      w: 100,
      h: 66,
    });
  });

  it('custom-inlineBlock-inline-001', () => {
    const node = genNode({
      style: {
        display: 'inlineBlock',
      },
      children: [
        {
          style: {
            display: 'block',
          },
          children: [
            {
              content: '12',
            },
            {
              content: 'ab',
            },
          ],
        },
      ],
    });
    node.lay(inputConstraints);
    expect(node.mixedResult).toMatchObject({
      x: 0,
      y: 0,
      w: 64,
      h: 24,
    });
  });

  it('custom-inlineBlock-inline-block-001', () => {
    const node = genNode({
      style: {
        display: 'inlineBlock',
      },
      children: [
        { content: '12' },
        {
          style: {
            display: 'inline',
          },
          children: [
            {
              content: '34',
            },
            {
              style: {
                display: 'block',
                width: 80,
                height: 20,
              },
            },
            {
              content: '567',
            },
          ],
        },
      ],
    });
    node.lay(inputConstraints);
    expect(node.mixedResult).toMatchObject({
      w: 80,
    });
    expect(node.children[1].mixedResult).toMatchObject({
      w: 80,
    });
  });

  it('custom-inlineBlock-inline-block-002', () => {
    const node = genNode({
      style: {
        display: 'inlineBlock',
      },
      children: [
        { content: '12' },
        {
          style: {
            display: 'inline',
          },
          children: [
            {
              style: {
                display: 'block',
                width: 80,
                height: 20,
              },
            },
            {
              content: '567',
            },
          ],
        },
      ],
    });
    node.lay(inputConstraints);
    expect(node.mixedResult).toMatchObject({
      w: 80,
    });
    expect(node.children[1].mixedResult).toMatchObject({
      w: 80,
    });
  });

  it('custom-inlineBlock-inline-block-003', () => {
    const node = genNode({
      style: {
        display: 'inlineBlock',
      },
      children: [
        { content: '12' },
        {
          style: {
            display: 'inline',
          },
          children: [
            {
              style: {
                display: 'block',
                width: 30,
                height: 20,
              },
            },
            {
              content: '567',
            },
          ],
        },
      ],
    });
    node.lay(inputConstraints);
    expect(node.mixedResult).toMatchObject({
      w: 48,
    });
    expect(node.children[1].mixedResult).toMatchObject({
      w: 48,
    });
    expect(node.children[1].children[0].mixedResult).toMatchObject({
      w: 30,
    });
  });

  it('custom-inlineBlock-inline-block-004', () => {
    const node = genNode({
      style: {
        display: 'inlineBlock',
      },
      children: [
        {
          style: {
            display: 'inline',
          },
          children: [
            { content: '123' },
            {
              style: {
                display: 'inline',
              },
              children: [
                { content: '456' },
                {
                  style: {
                    display: 'block',
                    width: 100,
                    height: 20,
                  },
                },
              ],
            },
          ],
        },
      ],
    });
    node.lay(inputConstraints);
    expect(node.mixedResult).toMatchObject({
      w: 100,
    });
    expect(node.children[0].mixedResult).toMatchObject({
      w: 100,
    });
  });

  it('custom-inlineBlock-inline-block-005', () => {
    const node = genNode({
      style: {
        display: 'inlineBlock',
      },
      children: [
        {
          style: {
            display: 'inline',
          },
          children: [
            { content: '1234567890' },
            {
              style: {
                display: 'inline',
              },
              children: [
                { content: 'abc' },
                {
                  style: {
                    display: 'block',
                    width: 100,
                    height: 20,
                  },
                },
                { content: 'd' },
              ],
            },
            { content: 'ef' },
          ],
        },
      ],
    });
    node.lay(inputConstraints);
    expect(node.mixedResult).toMatchObject({
      w: 208,
    });
    expect(node.children[0].mixedResult).toMatchObject({
      w: 208,
    });
  });

  it('custom-inlineBlock-inline-block-006', () => {
    const node = genNode({
      style: {
        display: 'inlineBlock',
      },
      children: [
        {
          style: {
            display: 'inline', // #parent-inline
          },
          children: [
            { content: 'x' }, // 💥 加上这个前缀！让后面的节点在父级循环里走“不是首行了”的分支
            {
              style: {
                display: 'inline', // #child-inline
              },
              children: [
                { content: 'a' },
                {
                  style: {
                    display: 'block',
                    width: 500, // 💥 中间怪兽 500px
                    height: 20,
                  },
                },
                { content: 'b' },
                {
                  style: {
                    display: 'block',
                    width: 100,
                    height: 20,
                  },
                },
                { content: 'c' },
              ],
            },
            { content: '12345678901234567890' }, // 后缀 320px
          ],
        },
      ],
    });
    node.lay(inputConstraints);
    expect(node.mixedResult).toMatchObject({
      w: 500,
    });
    expect(node.children[0].mixedResult).toMatchObject({
      w: 500,
    });
    expect(node.children[0].children[0].mixedResult).toMatchObject({
      y: 1,
      w: 16,
    });
    expect(node.children[0].children[1].mixedResult).toMatchObject({
      x: 0,
      y: 1,
      w: 500,
    });
    expect(node.children[0].children[1].children[0].mixedResult).toMatchObject({
      x: 16,
      y: 1,
      w: 16,
    });
    expect(node.children[0].children[1].children[1].mixedResult).toMatchObject({
      x: 0,
      y: 24,
      w: 500,
    });
    expect(node.children[0].children[1].children[2].mixedResult).toMatchObject({
      x: 0,
      y: 45,
      w: 16,
    });
    expect(node.children[0].children[1].children[3].mixedResult).toMatchObject({
      x: 0,
      y: 68,
      w: 100,
    });
    expect(node.children[0].children[1].children[4].mixedResult).toMatchObject({
      x: 0,
      y: 89,
      w: 16,
    });
    expect(node.children[0].children[2].mixedResult).toMatchObject({
      x: 16,
      y: 89,
      w: 320,
    });
  });

  it('custom-inlineBlock-inline-block-007', () => {
    const node = genNode({
      style: {
        display: 'inlineBlock', // 入口
      },
      children: [
        {
          style: { display: 'inline' }, // #test-inline
          children: [
            { content: 'aaa' }, // 3个字 = 48px
            { style: { display: 'block', width: 800, height: 20 } }, // 800px 怪兽 Block
            { content: 'bbb' }, // 3个字 = 48px
            { style: { display: 'block', width: 100, height: 20 } }, // 100px 普通 Block
            { content: 'ccc' }  // 3个字 = 48px
          ]
        }
      ]
    });
    node.lay(inputConstraints);
    expect(node.mixedResult).toMatchObject({
      w: 800,
    });
    expect(node.children[0].mixedResult).toMatchObject({
      w: 800,
    });
    expect(node.children[0].children[0].mixedResult).toMatchObject({
      w: 48,
    });
    expect(node.children[0].children[1].mixedResult).toMatchObject({
      y: 24,
      w: 800,
    });
    expect(node.children[0].children[2].mixedResult).toMatchObject({
      y: 45,
      w: 48,
    });
    expect(node.children[0].children[3].mixedResult).toMatchObject({
      y: 68,
      w: 100,
    });
    expect(node.children[0].children[4].mixedResult).toMatchObject({
      y: 89,
      w: 48,
    });
  });

  it('custom-inlineBlock-inline-block-008', () => {
    const node = genNode({
      style: { display: 'inlineBlock' },
      children: [
        { content: '12' }, // 32px
        {
          style: { display: 'inline' },
          children: [
            { content: '12345中文67890' }, // 192px
            { content: 'abc' }, // 48px
          ],
        },
      ],
    });
    node.lay(inputConstraints);
    expect(node.mixedResult).toMatchObject({
      w: 272,
    });
    expect(node.children[1].mixedResult).toMatchObject({
      x: 32,
      w: 240,
    });
  });

  it('custom-inlineBlock-inline-block-009', () => {
    const node = genNode({
      style: { display: 'inlineBlock' },
      children: [
        { content: '12' }, // 32px
        {
          style: { display: 'inline' },
          children: [
            { content: '12345中文67890' }, // 192px
          ],
        },
        { content: 'abc' }, // 48px
      ],
    });
    node.lay(inputConstraints);
    expect(node.mixedResult).toMatchObject({
      w: 272,
    });
    expect(node.children[2].mixedResult).toMatchObject({
      x: 224,
      w: 48,
    });
  });

  it('custom-inlineBlock-inline-block-010', () => {
    const node = genNode({
      style: { display: 'inlineBlock' },
      children: [
        { content: '12' }, // 32px
        {
          style: { display: 'inline' }, // 200
          children: [
            { style: { display: 'inlineBlock', width: 200, height: 10 } },
            { style: { display: 'block', width: 50, height: 10 } },
            { content: 'abc' }, // 48px
          ],
        },
      ],
    });
    node.lay(inputConstraints);
    expect(node.mixedResult).toMatchObject({
      w: 232,
    });
    // expect(node.children[1].mixedResult).toMatchObject({
    //   w: 200,
    // });
  });

  // it('custom-inlineBlock-inline-block-011', () => {
  //   // inlineBlock > [text(32), inline > [text(16), inlineBlock(200), block(50), text(48)]]
  //   // 首行 = 32 + 16 + 200 = 248, block = 50, 尾行 = 48
  //   // 预期 max = 248
  //   const node = genNode({
  //     style: { display: 'inlineBlock' },
  //     children: [
  //       { content: '12' }, // 32px
  //       {
  //         style: { display: 'inline' },
  //         children: [
  //           { content: 'x' }, // 16px
  //           { style: { display: 'inlineBlock', width: 200, height: 10 } },
  //           { style: { display: 'block', width: 50, height: 10 } },
  //           { content: 'abc' }, // 48px
  //         ],
  //       },
  //     ],
  //   });
  //   node.lay(inputConstraints);
  //   expect(node.mixedResult).toMatchObject({
  //     w: 248,
  //   });
  // });
  //
  // it('custom-inlineBlock-inline-block-012', () => {
  //   // inlineBlock > [text(32), inline > [inlineBlock(200), text(16), block(50), text(48)]]
  //   // 首行 = 32 + 200 + 16 = 248, block = 50, 尾行 = 48
  //   // 预期 max = 248
  //   const node = genNode({
  //     style: { display: 'inlineBlock' },
  //     children: [
  //       { content: '12' }, // 32px
  //       {
  //         style: { display: 'inline' },
  //         children: [
  //           { style: { display: 'inlineBlock', width: 200, height: 10 } },
  //           { content: 'x' }, // 16px
  //           { style: { display: 'block', width: 50, height: 10 } },
  //           { content: 'abc' }, // 48px
  //         ],
  //       },
  //     ],
  //   });
  //   node.lay(inputConstraints);
  //   expect(node.mixedResult).toMatchObject({
  //     w: 248,
  //   });
  // });
  //
  // // ========== Bug: inline含inlineBlock但无block切割时，父级无法正确累加 ==========
  // // shrink2FitInline中inlineBlock设firstLineMax=0，导致入口方法误判为有切割
  //
  // it('custom-inlineBlock-inline-block-013', () => {
  //   // inlineBlock > [text(32), inline > [inlineBlock(200), text(48)]]
  //   // 无block切割，所有内容在同一行：32 + 200 + 48 = 280
  //   const node = genNode({
  //     style: { display: 'inlineBlock' },
  //     children: [
  //       { content: '12' }, // 32px
  //       {
  //         style: { display: 'inline' },
  //         children: [
  //           { style: { display: 'inlineBlock', width: 200, height: 10 } },
  //           { content: 'abc' }, // 48px
  //         ],
  //       },
  //     ],
  //   });
  //   node.lay(inputConstraints);
  //   expect(node.mixedResult).toMatchObject({
  //     w: 280,
  //   });
  // });
  //
  // it('custom-inlineBlock-inline-block-014', () => {
  //   // inlineBlock > [text(32), inline > [inlineBlock(200)]]
  //   // 无block切割，所有内容在同一行：32 + 200 = 232
  //   const node = genNode({
  //     style: { display: 'inlineBlock' },
  //     children: [
  //       { content: '12' }, // 32px
  //       {
  //         style: { display: 'inline' },
  //         children: [
  //           { style: { display: 'inlineBlock', width: 200, height: 10 } },
  //         ],
  //       },
  //     ],
  //   });
  //   node.lay(inputConstraints);
  //   expect(node.mixedResult).toMatchObject({
  //     w: 232,
  //   });
  // });
  //
  // // ========== Bug: inline > [block] 时 firstLineMax=0/lastLineMax=0 被误判为无切割 ==========
  // // 当inline只包含block（首尾行都为空），入口方法走maxCount+=o.max分支，
  // // 错误地将block宽度累加到当前行
  //
  // it('custom-inlineBlock-inline-block-015', () => {
  //   // inlineBlock > [text(32), inline > [block(200)], text(48)]
  //   // block切割：行1=32, block=200, 行2=48
  //   // 预期 max = 200
  //   const node = genNode({
  //     style: { display: 'inlineBlock' },
  //     children: [
  //       { content: '12' }, // 32px
  //       {
  //         style: { display: 'inline' },
  //         children: [
  //           { style: { display: 'block', width: 200, height: 10 } },
  //         ],
  //       },
  //       { content: 'abc' }, // 48px
  //     ],
  //   });
  //   node.lay(inputConstraints);
  //   expect(node.mixedResult).toMatchObject({
  //     w: 200,
  //   });
  // });
  //
  // it('custom-inlineBlock-inline-block-016', () => {
  //   // inlineBlock > [text(32), inline > [block(50)], text(48)]
  //   // block切割：行1=32, block=50, 行2=48
  //   // 预期 max = max(32, 50, 48) = 50
  //   const node = genNode({
  //     style: { display: 'inlineBlock' },
  //     children: [
  //       { content: '12' }, // 32px
  //       {
  //         style: { display: 'inline' },
  //         children: [
  //           { style: { display: 'block', width: 50, height: 10 } },
  //         ],
  //       },
  //       { content: 'abc' }, // 48px
  //     ],
  //   });
  //   node.lay(inputConstraints);
  //   expect(node.mixedResult).toMatchObject({
  //     w: 50,
  //   });
  // });
  //
  // // ========== Bug: 嵌套inline中inlineBlock + block切割的传播 ==========
  //
  // it('custom-inlineBlock-inline-block-017', () => {
  //   // inlineBlock > [text(32), inline > [inline > [inlineBlock(200), block(50)], text(48)]]
  //   // 内层inline: firstLineMax=0(因为ib), block切割
  //   // 外层inline处理内层inline时，应该识别出切割
  //   // 首行 = 32 + 200 = 232, block = 50, 尾行 = 48
  //   // 预期 max = 232
  //   const node = genNode({
  //     style: { display: 'inlineBlock' },
  //     children: [
  //       { content: '12' }, // 32px
  //       {
  //         style: { display: 'inline' },
  //         children: [
  //           {
  //             style: { display: 'inline' },
  //             children: [
  //               { style: { display: 'inlineBlock', width: 200, height: 10 } },
  //               { style: { display: 'block', width: 50, height: 10 } },
  //             ],
  //           },
  //           { content: 'abc' }, // 48px
  //         ],
  //       },
  //     ],
  //   });
  //   node.lay(inputConstraints);
  //   expect(node.mixedResult).toMatchObject({
  //     w: 232,
  //   });
  // });
  //
  // it('custom-inlineBlock-inline-block-018', () => {
  //   // inlineBlock > [text(32), inline > [inlineBlock(200), block(50), text(48)], text(64)]
  //   // 首行 = 32 + 200 = 232, block = 50, 尾行 = 48 + 64 = 112
  //   // 预期 max = 232
  //   const node = genNode({
  //     style: { display: 'inlineBlock' },
  //     children: [
  //       { content: '12' }, // 32px
  //       {
  //         style: { display: 'inline' },
  //         children: [
  //           { style: { display: 'inlineBlock', width: 200, height: 10 } },
  //           { style: { display: 'block', width: 50, height: 10 } },
  //           { content: 'abc' }, // 48px
  //         ],
  //       },
  //       { content: '1234' }, // 64px
  //     ],
  //   });
  //   node.lay(inputConstraints);
  //   expect(node.mixedResult).toMatchObject({
  //     w: 232,
  //   });
  // });
  //
  // // ========== 对照组：确认正常情况仍然正确 ==========
  //
  // it('custom-inlineBlock-inline-block-019', () => {
  //   // inlineBlock > [inline > [inlineBlock(100), inlineBlock(150), block(50), text(48)]]
  //   // 首行 = 100 + 150 = 250, block = 50, 尾行 = 48
  //   // 预期 max = 250（这个case已经通过，作为对照）
  //   const node = genNode({
  //     style: { display: 'inlineBlock' },
  //     children: [
  //       {
  //         style: { display: 'inline' },
  //         children: [
  //           { style: { display: 'inlineBlock', width: 100, height: 10 } },
  //           { style: { display: 'inlineBlock', width: 150, height: 10 } },
  //           { style: { display: 'block', width: 50, height: 10 } },
  //           { content: 'abc' }, // 48px
  //         ],
  //       },
  //     ],
  //   });
  //   node.lay(inputConstraints);
  //   expect(node.mixedResult).toMatchObject({
  //     w: 250,
  //   });
  // });
  //
  // it('custom-inlineBlock-inline-block-020', () => {
  //   // inlineBlock > [inline > [text(48), block(50), inlineBlock(200), text(32)]]
  //   // 首行 = 48, block = 50, 尾行 = 200 + 32 = 232
  //   // 预期 max = 232
  //   const node = genNode({
  //     style: { display: 'inlineBlock' },
  //     children: [
  //       {
  //         style: { display: 'inline' },
  //         children: [
  //           { content: 'abc' }, // 48px
  //           { style: { display: 'block', width: 50, height: 10 } },
  //           { style: { display: 'inlineBlock', width: 200, height: 10 } },
  //           { content: '12' }, // 32px
  //         ],
  //       },
  //     ],
  //   });
  //   node.lay(inputConstraints);
  //   expect(node.mixedResult).toMatchObject({
  //     w: 232,
  //   });
  // });
});
