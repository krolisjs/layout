import { expect } from 'expect';
import { createTestInputConstraints, genNode } from './env.ts';
import type { InputConstraints } from '../dist/index.js';

describe('inline-block alignment', () => {
  let inputConstraints: InputConstraints;

  beforeEach(() => {
    inputConstraints = createTestInputConstraints();
  });

  it('inline-block basic layout', () => {
    const node = genNode({
      style: {
        width: 200,
      },
      children: [
        {
          style: {
            display: 'inlineBlock',
            width: 100,
            height: 50,
          },
        },
        {
          style: {
            display: 'inlineBlock',
            width: 50,
            height: 30,
          },
        },
      ],
    });
    node.lay(inputConstraints);
    expect(node.result).toMatchObject({
      w: 200,
      h: 50,
    });
    expect(node.children[0].result).toMatchObject({
      x: 0,
      y: 0,
      w: 100,
      h: 50,
    });
    expect(node.children[1].result).toMatchObject({
      x: 100,
      y: 0,
      w: 50,
      h: 30,
    });
  });

  it('inline-block with text baseline alignment', () => {
    const node = genNode({
      style: {
        width: 300,
        fontSize: 16,
      },
      children: [
        { content: 'Text content' },
        {
          style: {
            display: 'inlineBlock',
            width: 50,
            height: 30,
          },
        },
      ],
    });
    node.lay(inputConstraints);
    expect(node.result).toMatchObject({
      w: 300,
      h: 24,
    });
  });

  it('inline-block vertical align top', () => {
    const node = genNode({
      style: {
        width: 300,
        fontSize: 16,
      },
      children: [
        { content: 'Text content' },
        {
          style: {
            display: 'inlineBlock',
            width: 50,
            height: 40,
            verticalAlign: 'top',
          },
        },
      ],
    });
    node.lay(inputConstraints);
    expect(node.result).toMatchObject({
      w: 300,
      h: 40,
    });
  });

  it('inline-block vertical align bottom', () => {
    const node = genNode({
      style: {
        width: 300,
        fontSize: 16,
      },
      children: [
        { content: 'Text content' },
        {
          style: {
            display: 'inlineBlock',
            width: 50,
            height: 40,
            verticalAlign: 'bottom',
          },
        },
      ],
    });
    node.lay(inputConstraints);
    expect(node.result).toMatchObject({
      w: 300,
      h: 40,
    });
  });

  it('inline-block vertical align middle', () => {
    const node = genNode({
      style: {
        width: 300,
        fontSize: 16,
      },
      children: [
        { content: 'Text content' },
        {
          style: {
            display: 'inlineBlock',
            width: 50,
            height: 40,
            verticalAlign: 'middle',
          },
        },
      ],
    });
    node.lay(inputConstraints);
    expect(node.result).toMatchObject({
      w: 300,
      h: 40,
    });
  });

  it('inline-block wraps to new line', () => {
    const node = genNode({
      style: {
        width: 100,
      },
      children: [
        {
          style: {
            display: 'inlineBlock',
            width: 60,
            height: 20,
          },
        },
        {
          style: {
            display: 'inlineBlock',
            width: 60,
            height: 20,
          },
        },
      ],
    });
    node.lay(inputConstraints);
    expect(node.result).toMatchObject({
      w: 100,
      h: 40,
    });
    expect(node.children[0].result).toMatchObject({
      x: 0,
      y: 0,
      w: 60,
      h: 20,
    });
    expect(node.children[1].result).toMatchObject({
      x: 0,
      y: 20,
      w: 60,
      h: 20,
    });
  });

  it('inline-block with different font sizes vertical align', () => {
    const node = genNode({
      style: {
        width: 300,
      },
      children: [
        {
          style: {
            fontSize: 24,
          },
          children: [{ content: 'Large text' }],
        },
        {
          style: {
            display: 'inlineBlock',
            width: 30,
            height: 30,
            verticalAlign: 'baseline',
          },
        },
        {
          style: {
            fontSize: 12,
          },
          children: [{ content: 'Small' }],
        },
      ],
    });
    node.lay(inputConstraints);
    expect(node.result!.h).toBeGreaterThan(0);
  });

  it('inline-block nested inside inline', () => {
    const node = genNode({
      style: {
        width: 300,
      },
      children: [
        {
          style: {
            display: 'inline',
          },
          children: [
            { content: 'Before ' },
            {
              style: {
                display: 'inlineBlock',
                width: 50,
                height: 30,
              },
            },
            { content: ' After' },
          ],
        },
      ],
    });
    node.lay(inputConstraints);
    expect(node.result).toMatchObject({
      w: 300,
    });
    const inline = node.children[0];
    expect(inline.result!.h).toBe(30);
  });
});
