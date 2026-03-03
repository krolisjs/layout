import { expect } from 'expect';
import { createTestContext, genNode } from '../env.ts';
import { Context, FontStyle } from '../../dist/index.js';
import type { IAllNode } from '../../dist/index.js';

describe('normal-flow', () => {
  let ctx: Context<IAllNode>;

  beforeEach(() => {
    ctx = createTestContext();
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
    }, ctx);
    node.lay(ctx.getConstraints());
    expect(node.result).toEqual({
      x: 1,
      y: 1,
      w: 9998,
      h: 72,
      marginTop: 0,
      marginRight: 0,
      marginBottom: 0,
      marginLeft: 0,
      paddingTop: 0,
      paddingRight: 0,
      paddingBottom: 0,
      paddingLeft: 0,
      borderTopWidth: 1,
      borderRightWidth: 1,
      borderBottomWidth: 1,
      borderLeftWidth: 1,
      fontFamily: 'sans-serif',
      fontSize: 16,
      fontWeight: 400,
      fontStyle: FontStyle.NORMAL,
      lineHeight: 24,
      letterSpacing: 0,
      rects: null,
      type: 'box',
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
    }, ctx);
    node.lay(ctx.getConstraints());
    expect(node.result).toEqual({
      x: 0,
      y: 0,
      w: 48,
      h: 16,
      marginTop: 0,
      marginRight: 0,
      marginBottom: 0,
      marginLeft: 0,
      paddingTop: 0,
      paddingRight: 0,
      paddingBottom: 0,
      paddingLeft: 0,
      borderTopWidth: 0,
      borderRightWidth: 0,
      borderBottomWidth: 0,
      borderLeftWidth: 0,
      fontFamily: 'sans-serif',
      fontSize: 16,
      fontWeight: 400,
      fontStyle: FontStyle.NORMAL,
      lineHeight: 24,
      letterSpacing: 0,
      rects: null,
      type: 'box',
    });
    const child = node.children[0];
    expect(child.result).toEqual({
      x: 32,
      y: 0,
      w: 0,
      h: 16,
      marginTop: 0,
      marginRight: 0,
      marginBottom: 0,
      marginLeft: 0,
      paddingTop: 0,
      paddingRight: 0,
      paddingBottom: 0,
      paddingLeft: 0,
      borderTopWidth: 0,
      borderRightWidth: 32,
      borderBottomWidth: 0,
      borderLeftWidth: 32,
      fontFamily: 'sans-serif',
      fontSize: 16,
      fontWeight: 400,
      fontStyle: FontStyle.NORMAL,
      lineHeight: 24,
      letterSpacing: 0,
      rects: null,
      type: 'box',
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
    }, ctx);
    node.lay(ctx.getConstraints());
    const child = node.children[0];
    expect(child.result).toEqual({
      x: 32,
      y: 0,
      w: 0,
      h: 0,
      marginTop: 0,
      marginRight: 0,
      marginBottom: 0,
      marginLeft: 0,
      paddingTop: 0,
      paddingRight: 32,
      paddingBottom: 0,
      paddingLeft: 32,
      borderTopWidth: 0,
      borderRightWidth: 0,
      borderBottomWidth: 0,
      borderLeftWidth: 0,
      fontFamily: 'sans-serif',
      fontSize: 16,
      fontWeight: 400,
      fontStyle: FontStyle.NORMAL,
      lineHeight: 24,
      letterSpacing: 0,
      rects: null,
      type: 'box',
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
    }, ctx);
    node.lay(ctx.getConstraints());
    const child = node.children[0];
    expect(child.result).toEqual({
      x: 32,
      y: 0,
      w: 16,
      h: 16,
      marginTop: 0,
      marginRight: 0,
      marginBottom: 0,
      marginLeft: 0,
      paddingTop: 0,
      paddingRight: 0,
      paddingBottom: 0,
      paddingLeft: 0,
      borderTopWidth: 0,
      borderRightWidth: 32,
      borderBottomWidth: 0,
      borderLeftWidth: 32,
      fontFamily: 'sans-serif',
      fontSize: 16,
      fontWeight: 400,
      fontStyle: FontStyle.NORMAL,
      lineHeight: 24,
      letterSpacing: 0,
      rects: null,
      type: 'box',
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
    }, ctx);
    node.lay(ctx.getConstraints());
    const child = node.children[0];
    expect(child.result).toEqual({
      x: 32,
      y: 0,
      w: 16,
      h: 0,
      marginTop: 0,
      marginRight: 0,
      marginBottom: 0,
      marginLeft: 0,
      paddingTop: 0,
      paddingRight: 32,
      paddingBottom: 0,
      paddingLeft: 32,
      borderTopWidth: 0,
      borderRightWidth: 0,
      borderBottomWidth: 0,
      borderLeftWidth: 0,
      fontFamily: 'sans-serif',
      fontSize: 16,
      fontWeight: 400,
      fontStyle: FontStyle.NORMAL,
      lineHeight: 24,
      letterSpacing: 0,
      rects: null,
      type: 'box',
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
    }, ctx);
    node.lay(ctx.getConstraints());
    expect(node.children[0].result).toEqual({
      x: 0,
      y: 0,
      w: 600,
      h: 200,
      marginTop: 0,
      marginRight: 0,
      marginBottom: 0,
      marginLeft: 0,
      paddingTop: 0,
      paddingRight: 0,
      paddingBottom: 0,
      paddingLeft: 0,
      borderTopWidth: 0,
      borderRightWidth: 0,
      borderBottomWidth: 0,
      borderLeftWidth: 0,
      fontFamily: 'sans-serif',
      fontSize: 16,
      fontWeight: 400,
      fontStyle: FontStyle.NORMAL,
      lineHeight: 24,
      letterSpacing: 0,
      rects: null,
      type: 'box',
    });
  });

  it('blocks-020', () => {
    const node = genNode({
      style: {
        width: '300px',
        height: 100,
      },
    }, ctx);
    node.lay(ctx.getConstraints());
    expect(node.result).toEqual({
      x: 0,
      y: 0,
      w: 300,
      h: 100,
      marginTop: 0,
      marginRight: 0,
      marginBottom: 0,
      marginLeft: 0,
      paddingTop: 0,
      paddingRight: 0,
      paddingBottom: 0,
      paddingLeft: 0,
      borderTopWidth: 0,
      borderRightWidth: 0,
      borderBottomWidth: 0,
      borderLeftWidth: 0,
      fontFamily: 'sans-serif',
      fontSize: 16,
      fontWeight: 400,
      fontStyle: FontStyle.NORMAL,
      lineHeight: 24,
      letterSpacing: 0,
      rects: null,
      type: 'box',
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
    }, ctx);
    node.lay(ctx.getConstraints());
    const child = node.children[0];
    expect(child.result).toEqual({
      x: 100,
      y: 100,
      w: 150,
      h: 100,
      marginTop: 0,
      marginRight: 0,
      marginBottom: 0,
      marginLeft: 0,
      paddingTop: 0,
      paddingRight: 0,
      paddingBottom: 0,
      paddingLeft: 0,
      borderTopWidth: 100,
      borderRightWidth: 100,
      borderBottomWidth: 100,
      borderLeftWidth: 100,
      fontFamily: 'sans-serif',
      fontSize: 16,
      fontWeight: 400,
      fontStyle: FontStyle.NORMAL,
      lineHeight: 24,
      letterSpacing: 0,
      rects: null,
      type: 'box',
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
    }, ctx);
    node.lay(ctx.getConstraints());
    expect(node.result).toEqual({
      x: 32,
      y: 0,
      w: 0,
      h: 16,
      marginTop: 0,
      marginRight: 0,
      marginBottom: 0,
      marginLeft: 0,
      paddingTop: 0,
      paddingRight: 0,
      paddingBottom: 0,
      paddingLeft: 0,
      borderTopWidth: 0,
      borderRightWidth: 32,
      borderBottomWidth: 0,
      borderLeftWidth: 32,
      fontFamily: 'sans-serif',
      fontSize: 16,
      fontWeight: 400,
      fontStyle: FontStyle.NORMAL,
      lineHeight: 24,
      letterSpacing: 0,
      rects: null,
      type: 'box',
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
    }, ctx);
    node.lay(ctx.getConstraints());
    expect(node.result).toEqual({
      x: 32,
      y: 0,
      w: 0,
      h: 16,
      marginTop: 0,
      marginRight: 0,
      marginBottom: 0,
      marginLeft: 0,
      paddingTop: 0,
      paddingRight: 32,
      paddingBottom: 0,
      paddingLeft: 32,
      borderTopWidth: 0,
      borderRightWidth: 0,
      borderBottomWidth: 0,
      borderLeftWidth: 0,
      fontFamily: 'sans-serif',
      fontSize: 16,
      fontWeight: 400,
      fontStyle: FontStyle.NORMAL,
      lineHeight: 24,
      letterSpacing: 0,
      rects: null,
      type: 'box',
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
    }, ctx);
    node.lay(ctx.getConstraints());
    expect(node.result).toEqual({
      x: 0,
      y: 0,
      w: 100,
      h: 100,
      marginTop: 0,
      marginRight: 0,
      marginBottom: 0,
      marginLeft: 0,
      paddingTop: 0,
      paddingRight: 0,
      paddingBottom: 0,
      paddingLeft: 0,
      borderTopWidth: 0,
      borderRightWidth: 0,
      borderBottomWidth: 0,
      borderLeftWidth: 0,
      fontFamily: 'sans-serif',
      fontSize: 16,
      fontWeight: 400,
      fontStyle: FontStyle.NORMAL,
      lineHeight: 24,
      letterSpacing: 0,
      rects: null,
      type: 'box',
    });
    expect(node.children[0].result).toEqual({
      x: 0,
      y: 0,
      w: 100,
      h: 50,
      marginTop: 0,
      marginRight: 0,
      marginBottom: 50,
      marginLeft: 0,
      paddingTop: 0,
      paddingRight: 0,
      paddingBottom: 0,
      paddingLeft: 0,
      borderTopWidth: 0,
      borderRightWidth: 0,
      borderBottomWidth: 0,
      borderLeftWidth: 0,
      fontFamily: 'sans-serif',
      fontSize: 16,
      fontWeight: 400,
      fontStyle: FontStyle.NORMAL,
      lineHeight: 24,
      letterSpacing: 0,
      rects: null,
      type: 'box',
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
    }, ctx);
    node.lay(ctx.getConstraints());
    expect(node.result).toEqual({
      x: 0,
      y: 0,
      w: 200,
      h: 100,
      marginTop: 0,
      marginRight: 0,
      marginBottom: 0,
      marginLeft: 0,
      paddingTop: 0,
      paddingRight: 0,
      paddingBottom: 0,
      paddingLeft: 0,
      borderTopWidth: 0,
      borderRightWidth: 0,
      borderBottomWidth: 0,
      borderLeftWidth: 0,
      fontFamily: 'sans-serif',
      fontSize: 16,
      fontWeight: 400,
      fontStyle: FontStyle.NORMAL,
      lineHeight: 24,
      letterSpacing: 0,
      rects: null,
      type: 'box',
    });
    expect(node.children[0].result).toEqual({
      x: 100,
      y: 0,
      w: 100,
      h: 100,
      marginTop: 0,
      marginRight: 0,
      marginBottom: 0,
      marginLeft: 100,
      paddingTop: 0,
      paddingRight: 0,
      paddingBottom: 0,
      paddingLeft: 0,
      borderTopWidth: 0,
      borderRightWidth: 0,
      borderBottomWidth: 0,
      borderLeftWidth: 0,
      fontFamily: 'sans-serif',
      fontSize: 16,
      fontWeight: 400,
      fontStyle: FontStyle.NORMAL,
      lineHeight: 24,
      letterSpacing: 0,
      rects: null,
      type: 'box',
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
    }, ctx);
    node.lay(ctx.getConstraints());
    expect(node.result).toEqual({
      x: 0,
      y: 0,
      w: 200,
      h: 100,
      marginTop: 0,
      marginRight: 0,
      marginBottom: 0,
      marginLeft: 0,
      paddingTop: 0,
      paddingRight: 0,
      paddingBottom: 0,
      paddingLeft: 0,
      borderTopWidth: 0,
      borderRightWidth: 0,
      borderBottomWidth: 0,
      borderLeftWidth: 0,
      fontFamily: 'sans-serif',
      fontSize: 16,
      fontWeight: 400,
      fontStyle: FontStyle.NORMAL,
      lineHeight: 24,
      letterSpacing: 0,
      rects: null,
      type: 'box',
    });
    expect(node.children[0].result).toEqual({
      x: 0,
      y: 0,
      w: 100,
      h: 100,
      marginTop: 0,
      marginRight: 100,
      marginBottom: 0,
      marginLeft: 0,
      paddingTop: 0,
      paddingRight: 0,
      paddingBottom: 0,
      paddingLeft: 0,
      borderTopWidth: 0,
      borderRightWidth: 0,
      borderBottomWidth: 0,
      borderLeftWidth: 0,
      fontFamily: 'sans-serif',
      fontSize: 16,
      fontWeight: 400,
      fontStyle: FontStyle.NORMAL,
      lineHeight: 24,
      letterSpacing: 0,
      rects: null,
      type: 'box',
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
    }, ctx);
    node.lay(ctx.getConstraints());
    expect(node.result).toEqual({
      x: 0,
      y: 0,
      w: 100,
      h: 100,
      marginTop: 0,
      marginRight: 0,
      marginBottom: 0,
      marginLeft: 0,
      paddingTop: 0,
      paddingRight: 0,
      paddingBottom: 0,
      paddingLeft: 0,
      borderTopWidth: 0,
      borderRightWidth: 0,
      borderBottomWidth: 0,
      borderLeftWidth: 0,
      fontFamily: 'sans-serif',
      fontSize: 16,
      fontWeight: 400,
      fontStyle: FontStyle.NORMAL,
      lineHeight: 24,
      letterSpacing: 0,
      rects: null,
      type: 'box',
    });
    expect(node.children[0].result).toEqual({
      x: 0,
      y: 50,
      w: 100,
      h: 50,
      marginTop: 50,
      marginRight: 0,
      marginBottom: 0,
      marginLeft: 0,
      paddingTop: 0,
      paddingRight: 0,
      paddingBottom: 0,
      paddingLeft: 0,
      borderTopWidth: 0,
      borderRightWidth: 0,
      borderBottomWidth: 0,
      borderLeftWidth: 0,
      fontFamily: 'sans-serif',
      fontSize: 16,
      fontWeight: 400,
      fontStyle: FontStyle.NORMAL,
      lineHeight: 24,
      letterSpacing: 0,
      rects: null,
      type: 'box',
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
    }, ctx);
    node.lay(ctx.getConstraints());
    expect(node.result).toEqual({
      x: 0,
      y: 0,
      w: 500,
      h: 100,
      marginTop: 0,
      marginRight: 0,
      marginBottom: 0,
      marginLeft: 0,
      paddingTop: 0,
      paddingRight: 0,
      paddingBottom: 0,
      paddingLeft: 0,
      borderTopWidth: 0,
      borderRightWidth: 0,
      borderBottomWidth: 0,
      borderLeftWidth: 0,
      fontFamily: 'sans-serif',
      fontSize: 16,
      fontWeight: 400,
      fontStyle: FontStyle.NORMAL,
      lineHeight: 24,
      letterSpacing: 0,
      rects: null,
      type: 'box',
    });
    expect(node.children[0].result).toEqual({
      x: 0,
      y: 0,
      w: 100,
      h: 50,
      marginTop: 0,
      marginRight: 0,
      marginBottom: 0,
      marginLeft: 0,
      paddingTop: 0,
      paddingRight: 0,
      paddingBottom: 50,
      paddingLeft: 0,
      borderTopWidth: 0,
      borderRightWidth: 0,
      borderBottomWidth: 0,
      borderLeftWidth: 0,
      fontFamily: 'sans-serif',
      fontSize: 16,
      fontWeight: 400,
      fontStyle: FontStyle.NORMAL,
      lineHeight: 24,
      letterSpacing: 0,
      rects: null,
      type: 'box',
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
    }, ctx);
    node.lay(ctx.getConstraints());
    expect(node.result).toEqual({
      x: 0,
      y: 0,
      w: 500,
      h: 100,
      marginTop: 0,
      marginRight: 0,
      marginBottom: 0,
      marginLeft: 0,
      paddingTop: 0,
      paddingRight: 0,
      paddingBottom: 0,
      paddingLeft: 0,
      borderTopWidth: 0,
      borderRightWidth: 0,
      borderBottomWidth: 0,
      borderLeftWidth: 0,
      fontFamily: 'sans-serif',
      fontSize: 16,
      fontWeight: 400,
      fontStyle: FontStyle.NORMAL,
      lineHeight: 24,
      letterSpacing: 0,
      rects: null,
      type: 'box',
    });
    expect(node.children[0].result).toEqual({
      x: 50,
      y: 0,
      w: 50,
      h: 100,
      marginTop: 0,
      marginRight: 0,
      marginBottom: 0,
      marginLeft: 0,
      paddingTop: 0,
      paddingRight: 0,
      paddingBottom: 0,
      paddingLeft: 50,
      borderTopWidth: 0,
      borderRightWidth: 0,
      borderBottomWidth: 0,
      borderLeftWidth: 0,
      fontFamily: 'sans-serif',
      fontSize: 16,
      fontWeight: 400,
      fontStyle: FontStyle.NORMAL,
      lineHeight: 24,
      letterSpacing: 0,
      rects: null,
      type: 'box',
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
    }, ctx);
    node.lay(ctx.getConstraints());
    expect(node.result).toEqual({
      x: 0,
      y: 0,
      w: 500,
      h: 100,
      marginTop: 0,
      marginRight: 0,
      marginBottom: 0,
      marginLeft: 0,
      paddingTop: 0,
      paddingRight: 0,
      paddingBottom: 0,
      paddingLeft: 0,
      borderTopWidth: 0,
      borderRightWidth: 0,
      borderBottomWidth: 0,
      borderLeftWidth: 0,
      fontFamily: 'sans-serif',
      fontSize: 16,
      fontWeight: 400,
      fontStyle: FontStyle.NORMAL,
      lineHeight: 24,
      letterSpacing: 0,
      rects: null,
      type: 'box',
    });
    expect(node.children[0].result).toEqual({
      x: 0,
      y: 0,
      w: 50,
      h: 100,
      marginTop: 0,
      marginRight: 0,
      marginBottom: 0,
      marginLeft: 0,
      paddingTop: 0,
      paddingRight: 50,
      paddingBottom: 0,
      paddingLeft: 0,
      borderTopWidth: 0,
      borderRightWidth: 0,
      borderBottomWidth: 0,
      borderLeftWidth: 0,
      fontFamily: 'sans-serif',
      fontSize: 16,
      fontWeight: 400,
      fontStyle: FontStyle.NORMAL,
      lineHeight: 24,
      letterSpacing: 0,
      rects: null,
      type: 'box',
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
    }, ctx);
    node.lay(ctx.getConstraints());
    expect(node.result).toEqual({
      x: 0,
      y: 0,
      w: 500,
      h: 100,
      marginTop: 0,
      marginRight: 0,
      marginBottom: 0,
      marginLeft: 0,
      paddingTop: 0,
      paddingRight: 0,
      paddingBottom: 0,
      paddingLeft: 0,
      borderTopWidth: 0,
      borderRightWidth: 0,
      borderBottomWidth: 0,
      borderLeftWidth: 0,
      fontFamily: 'sans-serif',
      fontSize: 16,
      fontWeight: 400,
      fontStyle: FontStyle.NORMAL,
      lineHeight: 24,
      letterSpacing: 0,
      rects: null,
      type: 'box',
    });
    expect(node.children[0].result).toEqual({
      x: 0,
      y: 50,
      w: 100,
      h: 50,
      marginTop: 0,
      marginRight: 0,
      marginBottom: 0,
      marginLeft: 0,
      paddingTop: 50,
      paddingRight: 0,
      paddingBottom: 0,
      paddingLeft: 0,
      borderTopWidth: 0,
      borderRightWidth: 0,
      borderBottomWidth: 0,
      borderLeftWidth: 0,
      fontFamily: 'sans-serif',
      fontSize: 16,
      fontWeight: 400,
      fontStyle: FontStyle.NORMAL,
      lineHeight: 24,
      letterSpacing: 0,
      rects: null,
      type: 'box',
    });
  });

  it('width-001', () => {
    const node = genNode({
      style: {
        width: 0,
      },
    }, ctx);
    node.lay(ctx.getConstraints());
    expect(node.result).toEqual({
      x: 0,
      y: 0,
      w: 0,
      h: 0,
      marginTop: 0,
      marginRight: 0,
      marginBottom: 0,
      marginLeft: 0,
      paddingTop: 0,
      paddingRight: 0,
      paddingBottom: 0,
      paddingLeft: 0,
      borderTopWidth: 0,
      borderRightWidth: 0,
      borderBottomWidth: 0,
      borderLeftWidth: 0,
      fontFamily: 'sans-serif',
      fontSize: 16,
      fontWeight: 400,
      fontStyle: FontStyle.NORMAL,
      lineHeight: 24,
      letterSpacing: 0,
      rects: null,
      type: 'box',
    });
  });

  it('height-001', () => {
    const node = genNode({
      style: {
        height: 0,
      },
    }, ctx);
    node.lay(ctx.getConstraints());
    expect(node.result).toEqual({
      x: 0,
      y: 0,
      w: 10000,
      h: 0,
      marginTop: 0,
      marginRight: 0,
      marginBottom: 0,
      marginLeft: 0,
      paddingTop: 0,
      paddingRight: 0,
      paddingBottom: 0,
      paddingLeft: 0,
      borderTopWidth: 0,
      borderRightWidth: 0,
      borderBottomWidth: 0,
      borderLeftWidth: 0,
      fontFamily: 'sans-serif',
      fontSize: 16,
      fontWeight: 400,
      fontStyle: FontStyle.NORMAL,
      lineHeight: 24,
      letterSpacing: 0,
      rects: null,
      type: 'box',
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
    }, ctx);
    node.lay(ctx.getConstraints());
    expect(node.result).toEqual({
      x: 0,
      y: 0,
      w: 176,
      h: 24,
      marginTop: 0,
      marginRight: 0,
      marginBottom: 0,
      marginLeft: 0,
      paddingTop: 8,
      paddingRight: 0,
      paddingBottom: 8,
      paddingLeft: 0,
      borderTopWidth: 0,
      borderRightWidth: 0,
      borderBottomWidth: 0,
      borderLeftWidth: 0,
      fontFamily: 'sans-serif',
      fontSize: 16,
      fontWeight: 400,
      fontStyle: FontStyle.NORMAL,
      lineHeight: 24,
      letterSpacing: 0,
      rects: [
        {
          x: 0,
          y: 0,
          w: 176,
          h: 24,
        },
      ],
      type: 'inline',
    });
    expect(node.children[0].result).toEqual({
      x: 8,
      y: 0,
      w: 160,
      h: 24,
      marginTop: 0,
      marginRight: 0,
      marginBottom: 0,
      marginLeft: 0,
      paddingTop: 0,
      paddingRight: 0,
      paddingBottom: 0,
      paddingLeft: 0,
      borderTopWidth: 8,
      borderRightWidth: 8,
      borderBottomWidth: 8,
      borderLeftWidth: 8,
      fontFamily: 'sans-serif',
      fontSize: 16,
      fontWeight: 400,
      fontStyle: FontStyle.NORMAL,
      lineHeight: 24,
      letterSpacing: 0,
      rects: [
        {
          x: 8,
          y: 0,
          w: 160,
          h: 24,
        },
      ],
      type: 'inline',
    });
    expect(node.children[0].children[0].result).toEqual({
      x: 8,
      y: 0,
      w: 160,
      h: 24,
      marginTop: 0,
      marginRight: 0,
      marginBottom: 0,
      marginLeft: 0,
      paddingTop: 0,
      paddingRight: 0,
      paddingBottom: 0,
      paddingLeft: 0,
      borderTopWidth: 0,
      borderRightWidth: 0,
      borderBottomWidth: 0,
      borderLeftWidth: 0,
      fontFamily: 'sans-serif',
      fontSize: 16,
      fontWeight: 400,
      fontStyle: FontStyle.NORMAL,
      lineHeight: 24,
      letterSpacing: 0,
      rects: [
        {
          x: 8,
          y: 0,
          w: 160,
          h: 24,
          baseline: 23,
          list: [
            {
              x: 8,
              y: 0,
              w: 160,
              h: 24,
              content: '1234567890',
              baseline: 23,
            },
          ],
        },
      ],
      type: 'text',
    });
  });
});
