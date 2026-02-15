import { expect } from 'expect';
import { genNode } from '../env.ts';
import { AbstractNode, Context, FontStyle } from '../../dist/index.js';

describe('normal-flow', () => {
  let ctx: Context<AbstractNode>;

  beforeEach(() => {
    ctx = new Context<AbstractNode>({
      constraints: {
        aw: 10000,
        ah: 10000,
      },
      onConfigured: (node, rect) => {
        node.rect = rect;
      },
      measureText: (
        content: string,
        fontFamily: string,
        fontSize: number,
        lineHeight: number,
        fontWeight?: number,
        fontStyle?: FontStyle,
        letterSpacing?: number,
      ) => {
        return {
          width: fontSize * content.length,
          height: lineHeight,
          baseline: lineHeight - 1,
        };
      },
    });
  });

  it('blocks-011', () => {
    const node = genNode({
      label: '0',
      style: {
        width: '3em',
        height: '1em',
      },
      children: [{
        label: '1',
        style: {
          height: '1em',
          borderRightWidth: '2em',
          borderLeftWidth: '2em',
        },
      }],
    });
    node.lay(ctx);
    expect(node.label).toBe('0');
    expect(node.rect).toEqual({
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
      fontSize: 16,
      lineHeight: 24,
      letterSpacing: 0,
      rects: null,
      type: 'box',
    });
    const child = node.children[0];
    expect(child.label).toBe('1');
    expect(child.rect).toEqual({
      x: 0,
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
      fontSize: 16,
      lineHeight: 24,
      letterSpacing: 0,
      rects: null,
      type: 'box',
    });
  });

  it('blocks-012', () => {
    const node = genNode({
      label: '0',
      style: {
        width: '3em',
        height: '1em',
      },
      children: [{
        label: '1',
        style: {
          paddingLeft: '2em',
          paddingRight: '2em',
        },
      }],
    });
    node.lay(ctx);
    const child = node.children[0];
    expect(child.rect).toEqual({
      x: 0,
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
      fontSize: 16,
      lineHeight: 24,
      letterSpacing: 0,
      rects: null,
      type: 'box',
    });
  });

  it('blocks-014', () => {
    const node = genNode({
      label: '0',
      style: {
        width: '5em',
        height: '1em',
      },
      children: [{
        label: '1',
        style: {
          height: '1em',
          borderRightWidth: '2em',
          borderLeftWidth: '2em',
        },
      }],
    });
    node.lay(ctx);
    const child = node.children[0];
    expect(child.rect).toEqual({
      x: 0,
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
      fontSize: 16,
      lineHeight: 24,
      letterSpacing: 0,
      rects: null,
      type: 'box',
    });
  });

  it('blocks-015', () => {
    const node = genNode({
      label: '0',
      style: {
        width: '5em',
        height: '1em',
      },
      children: [{
        label: '1',
        style: {
          paddingLeft: '2em',
          paddingRight: '2em',
        },
      }],
    });
    node.lay(ctx);
    const child = node.children[0];
    expect(child.rect).toEqual({
      x: 0,
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
      fontSize: 16,
      lineHeight: 24,
      letterSpacing: 0,
      rects: null,
      type: 'box',
    });
  });

  it('blocks-020', () => {
    const node = genNode({
      label: '0',
      style: {
        width: 300,
        height: 100,
      },
      children: [{
        label: '1',
        style: {
          width: '200%',
          height: '200%',
        },
      }],
    });
    node.lay(ctx);
    expect(node.children[0].rect).toEqual({
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
      fontSize: 16,
      lineHeight: 24,
      letterSpacing: 0,
      rects: null,
      type: 'box',
    });
  });

  it('blocks-020', () => {
    const node = genNode({
      label: '0',
      style: {
        width: '300px',
        height: 100,
      },
    });
    node.lay(ctx);
    expect(node.rect).toEqual({
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
      fontSize: 16,
      lineHeight: 24,
      letterSpacing: 0,
      rects: null,
      type: 'box',
    });
  });

  it('blocks-026', () => {
    const node = genNode({
      label: '0',
      style: {
        width: 300,
        height: 300,
      },
      children: [{
        label: '1',
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
    node.lay(ctx);
    const child = node.children[0];
    expect(child.rect).toEqual({
      x: 0,
      y: 0,
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
      fontSize: 16,
      lineHeight: 24,
      letterSpacing: 0,
      rects: null,
      type: 'box',
    });
  });

  it('blocks-027', () => {
    const node = genNode({
      label: '0',
      style: {
        boxSizing: 'borderBox',
        width: '3em',
        height: '1em',
        borderRightWidth: '2em',
        borderLeftWidth: '2em',
      },
    });
    node.lay(ctx);
    expect(node.rect).toEqual({
      x: 0,
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
      fontSize: 16,
      lineHeight: 24,
      letterSpacing: 0,
      rects: null,
      type: 'box',
    });
  });

  it('blocks-028', () => {
    const node = genNode({
      label: '0',
      style: {
        boxSizing: 'borderBox',
        width: '3em',
        height: '1em',
        paddingRight: '2em',
        paddingLeft: '2em',
      },
    });
    node.lay(ctx);
    expect(node.rect).toEqual({
      x: 0,
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
      fontSize: 16,
      lineHeight: 24,
      letterSpacing: 0,
      rects: null,
      type: 'box',
    });
  });

  it('containing-block-percent-margin-bottom', () => {
    const node = genNode({
      label: '0',
      style: {
        width: 100,
      },
      children: [{
        label: '1',
        style: {
          marginBottom: '50%',
          height: 50,
        },
      }],
    });
    node.lay(ctx);
    expect(node.rect).toEqual({
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
      fontSize: 16,
      lineHeight: 24,
      letterSpacing: 0,
      rects: null,
      type: 'box',
    });
    expect(node.children[0].rect).toEqual({
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
      fontSize: 16,
      lineHeight: 24,
      letterSpacing: 0,
      rects: null,
      type: 'box',
    });
  });

  it('containing-block-percent-margin-left', () => {
    const node = genNode({
      label: '0',
      style: {
        width: 200,
      },
      children: [{
        label: '1',
        style: {
          marginLeft: '50%',
          height: 100,
        },
      }],
    });
    node.lay(ctx);
    expect(node.rect).toEqual({
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
      fontSize: 16,
      lineHeight: 24,
      letterSpacing: 0,
      rects: null,
      type: 'box',
    });
    expect(node.children[0].rect).toEqual({
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
      fontSize: 16,
      lineHeight: 24,
      letterSpacing: 0,
      rects: null,
      type: 'box',
    });
  });

  it('containing-block-percent-margin-right', () => {
    const node = genNode({
      label: '0',
      style: {
        width: 200,
      },
      children: [{
        label: '1',
        style: {
          marginRight: '50%',
          height: 100,
        },
      }],
    });
    node.lay(ctx);
    expect(node.rect).toEqual({
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
      fontSize: 16,
      lineHeight: 24,
      letterSpacing: 0,
      rects: null,
      type: 'box',
    });
    expect(node.children[0].rect).toEqual({
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
      fontSize: 16,
      lineHeight: 24,
      letterSpacing: 0,
      rects: null,
      type: 'box',
    });
  });

  it('containing-block-percent-margin-top', () => {
    const node = genNode({
      label: '0',
      style: {
        width: 100,
      },
      children: [{
        label: '1',
        style: {
          marginTop: '50%',
          height: 50,
        },
      }],
    });
    node.lay(ctx);
    expect(node.rect).toEqual({
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
      fontSize: 16,
      lineHeight: 24,
      letterSpacing: 0,
      rects: null,
      type: 'box',
    });
    expect(node.children[0].rect).toEqual({
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
      fontSize: 16,
      lineHeight: 24,
      letterSpacing: 0,
      rects: null,
      type: 'box',
    });
  });

  it('containing-block-percent-padding-bottom', () => {
    const node = genNode({
      label: '0',
      style: {
        width: 500,
      },
      children: [{
        label: '1',
        style: {
          paddingBottom: '10%',
          width: 100,
          height: 50,
        },
      }],
    });
    node.lay(ctx);
    expect(node.rect).toEqual({
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
      fontSize: 16,
      lineHeight: 24,
      letterSpacing: 0,
      rects: null,
      type: 'box',
    });
    expect(node.children[0].rect).toEqual({
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
      fontSize: 16,
      lineHeight: 24,
      letterSpacing: 0,
      rects: null,
      type: 'box',
    });
  });

  it('containing-block-percent-padding-left', () => {
    const node = genNode({
      label: '0',
      style: {
        width: 500,
      },
      children: [{
        label: '1',
        style: {
          paddingLeft: '10%',
          width: 50,
          height: 100,
        },
      }],
    });
    node.lay(ctx);
    expect(node.rect).toEqual({
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
      fontSize: 16,
      lineHeight: 24,
      letterSpacing: 0,
      rects: null,
      type: 'box',
    });
    expect(node.children[0].rect).toEqual({
      x: 0,
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
      fontSize: 16,
      lineHeight: 24,
      letterSpacing: 0,
      rects: null,
      type: 'box',
    });
  });

  it('containing-block-percent-padding-right', () => {
    const node = genNode({
      label: '0',
      style: {
        width: 500,
      },
      children: [{
        label: '1',
        style: {
          paddingRight: '10%',
          width: 50,
          height: 100,
        },
      }],
    });
    node.lay(ctx);
    expect(node.rect).toEqual({
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
      fontSize: 16,
      lineHeight: 24,
      letterSpacing: 0,
      rects: null,
      type: 'box',
    });
    expect(node.children[0].rect).toEqual({
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
      fontSize: 16,
      lineHeight: 24,
      letterSpacing: 0,
      rects: null,
      type: 'box',
    });
  });

  it('containing-block-percent-padding-top', () => {
    const node = genNode({
      label: '0',
      style: {
        width: 500,
      },
      children: [{
        label: '1',
        style: {
          paddingTop: '10%',
          width: 100,
          height: 50,
        },
      }],
    });
    node.lay(ctx);
    expect(node.rect).toEqual({
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
      fontSize: 16,
      lineHeight: 24,
      letterSpacing: 0,
      rects: null,
      type: 'box',
    });
    expect(node.children[0].rect).toEqual({
      x: 0,
      y: 0,
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
      fontSize: 16,
      lineHeight: 24,
      letterSpacing: 0,
      rects: null,
      type: 'box',
    });
  });

  it('width-001', () => {
    const node = genNode({
      label: '0',
      style: {
        width: 0,
      },
    });
    node.lay(ctx);
    expect(node.rect).toEqual({
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
      fontSize: 16,
      lineHeight: 24,
      letterSpacing: 0,
      rects: null,
      type: 'box',
    });
  });

  it('height-001', () => {
    const node = genNode({
      label: '0',
      style: {
        height: 0,
      },
    });
    node.lay(ctx);
    expect(node.rect).toEqual({
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
      fontSize: 16,
      lineHeight: 24,
      letterSpacing: 0,
      rects: null,
      type: 'box',
    });
  });

  it('inlines-002', () => {
    const node = genNode({
      label: '0',
      style: {
        display: 'inline',
        paddingTop: '0.5em',
        paddingBottom: '0.5em',
      },
      children: [{
        label: '1',
        style: {
          display: 'inline',
          borderTopWidth: '0.5em',
          borderRightWidth: '0.5em',
          borderBottomWidth: '0.5em',
          borderLeftWidth: '0.5em',
        },
        children: [{
          label: '2',
          content: '1234567890',
        }],
      }],
    });
    node.lay(ctx);
    expect(node.rect).toEqual({
      x: 0,
      y: 0,
      w: 168,
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
      fontSize: 16,
      lineHeight: 24,
      letterSpacing: 0,
      rects: [
        {
          x: 0,
          y: 0,
          w: 168,
          h: 24,
        },
      ],
      type: 'inline',
    });
    expect(node.children[0].rect).toEqual({
      x: 0,
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
      fontSize: 16,
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
    expect(node.children[0].children[0].rect).toEqual({
      x: 0,
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
      fontSize: 16,
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
