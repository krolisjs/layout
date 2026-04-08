import { expect } from 'expect';
import { createTestInputConstraints, genNode } from '../env.ts';
import type { InputConstraints } from '../../dist/index.js';

describe('box-display', () => {
  let inputConstraints: InputConstraints;

  beforeEach(() => {
    inputConstraints = createTestInputConstraints();
  });

  it('block-in-inline-003', () => {
    const node = genNode({
      children: [
        {
          style: {
            display: 'inline',
          },
          children: [
            {
              children: [
                {
                  content: '1234567890',
                },
              ],
            },
          ],
        },
      ],
    });
    node.lay(inputConstraints);
    expect(node.children[0].mixedResult).toMatchObject({
      x: 0,
      y: 0,
      w: 10000,
      h: 24,
      frags: [],
    });
  });

  it('block-in-inline-008', () => {
    const node = genNode({
      children: [
        {
          style: {
            width: '5em',
            height: '5em',
          },
        },
        {
          children: [
            {
              style: {
                display: 'inline',
              },
              children: [
                {
                  style: {
                    position: 'relative',
                    top: '-5em',
                    width: '5em',
                    height: '5em',
                  },
                },
              ],
            },
          ],
        },
      ],
    });
    node.lay(inputConstraints);
    expect(node.children[1].children[0].children[0].mixedResult).toMatchObject({
      x: 0,
      y: 0,
      w: 80,
      h: 80,
    });
  });

  it('containing-block-001', () => {
    const node = genNode({
      style: {
        width: '100px',
        height: '100px',
      },
      children: [
        {
          style: {
            width: '100%',
            height: '100%',
          },
        },
      ],
    });
    node.lay(inputConstraints);
    expect(node.children[0].mixedResult).toMatchObject({
      x: 0,
      y: 0,
      w: 100,
      h: 100,
      frags: null,
    });
  });

  it('containing-block-003', () => {
    const node = genNode({
      style: {
        display: 'inlineBlock',
        paddingTop: 20,
        paddingRight: 20,
        paddingBottom: 20,
        paddingLeft: 20,
        width: 60,
        height: 60,
      },
      children: [
        {
          style: {
            position: 'relative',
            left: -20,
            top: -20,
            width: 100,
            height: 100,
          },
        },
      ],
    });
    node.lay(inputConstraints);
    expect(node.mixedResult).toMatchObject({
      x: 20,
      y: 20,
      w: 60,
      h: 60,
      frags: null,
    });
    expect(node.children[0].mixedResult).toMatchObject({
      x: 0,
      y: 0,
      w: 100,
      h: 100,
    });
  });

  it('containing-block-004', () => {
    const node = genNode({
      style: {
        width: 100,
        height: 100,
      },
      children: [
        {
          style: {
            position: 'static',
            width: '100%',
            height: '100%',
          },
        },
      ],
    });
    node.lay(inputConstraints);
    expect(node.children[0].mixedResult).toMatchObject({
      x: 0,
      y: 0,
      w: 100,
      h: 100,
    });
  });

  it('containing-block-006', () => {
    const node = genNode({
      style: {
        display: 'inlineBlock',
        width: 100,
        height: 100,
      },
      children: [
        {
          style: {
            width: '100%',
            height: '100%',
          },
        },
      ],
    });
    node.lay(inputConstraints);
    expect(node.children[0].mixedResult).toMatchObject({
      x: 0,
      y: 0,
      w: 100,
      h: 100,
    });
  });

  it('containing-block-008', () => {
    const node = genNode({
      style: {
        position: 'absolute',
        marginTop: 50,
        marginLeft: 50,
        marginBottom: 50,
        marginRight: 50,
        top: 0,
        borderTopWidth: 1,
        borderRightWidth: 1,
        borderBottomWidth: 1,
        borderLeftWidth: 1,
      },
      children: [
        {
          style: {
            marginTop: 50,
            marginLeft: 50,
            marginBottom: 50,
            marginRight: 50,
            width: 100,
            height: 100,
          },
          children: [
            {
              style: {
                position: 'absolute',
                top: 0,
                right: 0,
                width: 100,
                height: 100,
              },
            }
          ],
        },
      ],
    });
    node.lay(inputConstraints);
    expect(node.mixedResult).toMatchObject({
      x: 51,
      y: 51,
      w: 200,
      h: 200,
      marginTop: 50,
      marginLeft: 50,
      marginBottom: 50,
      marginRight: 50,
      borderTopWidth: 1,
      borderRightWidth: 1,
      borderBottomWidth: 1,
      borderLeftWidth: 1,
    });
    expect(node.children[0].mixedResult).toMatchObject({
      x: 101,
      y: 101,
      w: 100,
      h: 100,
      marginTop: 50,
      marginLeft: 50,
      marginBottom: 50,
      marginRight: 50,
    });
    expect(node.children[0].children[0].mixedResult).toMatchObject({
      x: 151,
      y: 51,
      w: 100,
      h: 100,
    });
  });

  it('containing-block-009', () => {
    const node = genNode({
      style: {
        position: 'relative',
        marginTop: 50,
        marginLeft: 50,
        marginBottom: 50,
        marginRight: 50,
        top: 0,
        borderTopWidth: 1,
        borderRightWidth: 1,
        borderBottomWidth: 1,
        borderLeftWidth: 1,
      },
      children: [
        {
          style: {
            marginTop: 50,
            marginLeft: 50,
            marginBottom: 50,
            marginRight: 50,
            width: 100,
            height: 100,
          },
          children: [
            {
              style: {
                position: 'absolute',
                top: 0,
                right: 0,
                width: 100,
                height: 100,
              },
            }
          ],
        },
      ],
    });
    node.lay(inputConstraints);
    expect(node.children[0].children[0].mixedResult).toMatchObject({
      x: 9849,
      y: 51,
      w: 100,
      h: 100,
    });
  });

  it('containing-block-011', () => {
    const node = genNode({
      style: {
        position: 'relative',
        paddingTop: 100,
        paddingLeft: 100,
        paddingBottom: 100,
        paddingRight: 100,
        borderTopWidth: 1,
        borderRightWidth: 1,
        borderBottomWidth: 1,
        borderLeftWidth: 1,
        width: 0,
      },
      children: [
        {
          style: {
            display: 'inline',
          },
          children: [
            {
              style: {
                position: 'absolute',
                display: 'inline',
                width: 100,
                height: 100,
              },
            }
          ],
        },
      ],
    });
    node.lay(inputConstraints);
    expect(node.children[0].children[0].mixedResult).toMatchObject({
      x: 101,
      y: 101,
      w: 100,
      h: 100,
    });
  });

  it('containing-block-013', () => {
    const node = genNode({
      style: {
        position: 'absolute',
        paddingTop: 100,
        paddingLeft: 100,
        paddingBottom: 100,
        paddingRight: 100,
        borderTopWidth: 1,
        borderRightWidth: 1,
        borderBottomWidth: 1,
        borderLeftWidth: 1,
        width: 0,
      },
      children: [
        {
          style: {
            display: 'inline',
          },
          children: [
            {
              style: {
                position: 'absolute',
                display: 'inline',
                width: 100,
                height: 100,
              },
            }
          ],
        },
      ],
    });
    node.lay(inputConstraints);
    expect(node.mixedResult).toMatchObject({
      x: 101,
      y: 101,
      w: 0,
      h: 0,
      paddingTop: 100,
      paddingLeft: 100,
      paddingBottom: 100,
      paddingRight: 100,
    });
    expect(node.children[0].children[0].mixedResult).toMatchObject({
      x: 101,
      y: 101,
      w: 100,
      h: 100,
    });
  });

  it('containing-block-023', () => {
    const node = genNode({
      children: [
        {
          style: {
            marginTop: 50,
            marginLeft: 50,
            marginBottom: 50,
            marginRight: 50,
            width: 100,
          },
          children: [
            {
              style: {
                marginTop: 50,
                marginLeft: 50,
                marginBottom: 50,
                marginRight: 50,
              },
              children: [
                {
                  style: {
                    position: 'absolute',
                    left: 0,
                    bottom: 0,
                    width: 100,
                    height: 100,
                  },
                }
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
      h: 50,
    });
    expect(node.children[0].mixedResult).toMatchObject({
      x: 50,
      y: 50,
      h: 0,
    });
    expect(node.children[0].children[0].mixedResult).toMatchObject({
      x: 100,
      y: 50,
      h: 0,
    });
    expect(node.children[0].children[0].children[0].mixedResult).toMatchObject({
      x: 0,
      y: 9900,
      w: 100,
      h: 100,
    });
  });

  it('containing-block-027', () => {
    const node = genNode({
      style: {
        paddingTop: 5,
        width: 100,
        height: 100,
      },
      children: [
        {
          style: {
            paddingTop: 5,
            width: 200,
            height: 50,
          },
        },
      ],
    });
    node.lay(inputConstraints);
    expect(node.children[0].mixedResult).toMatchObject({
      x: 0,
      y: 10,
      w: 200,
      h: 50,
    });
  });

  it('containing-block-028', () => {
    const node = genNode({
      style: {
        position: 'absolute',
        width: 100,
        height: 100,
      },
      children: [
        {
          style: {
            position: 'absolute',
            right: 0,
            bottom: 0,
            width: 25,
            height: 25,
          },
        },
      ],
    });
    node.lay(inputConstraints);
    expect(node.children[0].mixedResult).toMatchObject({
      x: 75,
      y: 75,
      w: 25,
      h: 25,
    });
  });

  it('containing-block-029', () => {
    const node = genNode({
      style: {
        paddingLeft: 5,
        width: 100,
        height: 100,
      },
      children: [
        {
          style: {
            width: 50,
            height: 200,
          },
        },
      ],
    });
    node.lay(inputConstraints);
    expect(node.mixedResult).toMatchObject({
      x: 5,
      y: 0,
      w: 100,
      h: 100,
    });
    expect(node.children[0].mixedResult).toMatchObject({
      x: 5,
      y: 0,
      w: 50,
      h: 200,
    });
  });

  it('display-001', () => {
    const node = genNode({
      children: [
        {
          style: {
            display: 'inline',
          },
          children: [{ content: 'Filler text' }],
        },
        {
          style: {
            display: 'inline',
          },
          children: [{ content: 'Filler text' }],
        },
      ],
    });
    node.lay(inputConstraints);
    expect(node.mixedResult).toMatchObject({
      x: 0,
      y: 0,
      h: 24,
    });
    expect(node.children[0].mixedResult).toMatchObject({
      type: 'inline',
      x: 0,
      y: 1,
      w: 176,
      h: 22,
    });
    expect(node.children[1].mixedResult).toMatchObject({
      type: 'inline',
      x: 176,
      y: 1,
      w: 176,
      h: 22,
    });
  });

  it('display-002', () => {
    const node = genNode({
      children: [
        {
          children: [{ content: 'Filler text' }],
        },
        {
          children: [{ content: 'Filler text' }],
        },
      ],
    });
    node.lay(inputConstraints);
    expect(node.mixedResult).toMatchObject({
      x: 0,
      y: 0,
      h: 48,
    });
    expect(node.children[0].mixedResult).toMatchObject({
      type: 'block',
      x: 0,
      y: 0,
      h: 24,
    });
    expect(node.children[1].mixedResult).toMatchObject({
      type: 'block',
      x: 0,
      y: 24,
      h: 24,
    });
  });

  it('display-005', () => {
    const node = genNode({
      children: [
        { content: 'Filler text' },
        {
          style: {
            display: 'inlineBlock',
          },
          children: [{ content: 'Filler text' }],
        },
      ],
    });
    node.lay(inputConstraints);
    expect(node.mixedResult).toMatchObject({
      x: 0,
      y: 0,
      h: 24,
    });
    expect(node.children[0].mixedResult).toMatchObject({
      type: 'text',
      x: 0,
      y: 1,
      w: 176,
      h: 22,
    });
    expect(node.children[1].mixedResult).toMatchObject({
      type: 'inlineBlock',
      x: 176,
      y: 0,
      w: 176,
      h: 24,
    });
    expect(node.children[1].children[0].mixedResult).toMatchObject({
      type: 'text',
      x: 176,
      y: 1,
      w: 176,
      h: 22,
    });
  });
});
