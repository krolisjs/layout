import { expect } from 'expect';
import { createTestInputConstraints, genNode } from '../env.ts';
import type { InputConstraints } from '../../dist/index.js';

describe('linebox', () => {
  let inputConstraints: InputConstraints;

  beforeEach(() => {
    inputConstraints = createTestInputConstraints();
  });

  it('border-padding-bleed-001', () => {
    const node = genNode({
      style: { fontSize: 40, lineHeight: 1 },
      children: [
        { style: { lineHeight: 1 }, content: 'shuldboverlaPPed\n' },
        {
          style: {
            display: 'inline',
            borderTopWidth: 15,
            paddingTop: 25,
            lineHeight: 1,
          },
          children: [ { style: { lineHeight: 1 }, content: 'Filler text' } ],
        },
      ],
    });
    node.lay(inputConstraints);
    expect(node.result).toMatchObject({
      x: 0,
      y: 0,
      w: 10000,
      h: 80,
      lineHeight: 40,
      letterSpacing: 0,
    });
    expect(node.children[1].result).toMatchObject({
      x: 0,
      y: 40,
      w: 440,
      h: 40,
      paddingTop: 25,
      paddingRight: 0,
      paddingBottom: 0,
      paddingLeft: 0,
      borderTopWidth: 15,
      borderRightWidth: 0,
      borderBottomWidth: 0,
      borderLeftWidth: 0,
      lineHeight: 40,
      letterSpacing: 0,
      frags: [
        {
          x: 0,
          y: 40,
          w: 440,
          h: 40,
        },
      ],
    });
  });

  it('empty-inline-001', () => {
    const node = genNode({
      children: [
        {
          style: {
            display: 'inline',
          },
        },
      ],
    });
    node.lay(inputConstraints);
    expect(node.children[0].result).toMatchObject({
      x: 0,
      y: 0,
      w: 0,
      h: 0,
    });
  });

  it('empty-inline-002', () => {
    const node = genNode({
      style: {
        marginTop: 100,
      },
      children: [{
        style: {
          width: 500,
          borderTopWidth: 25,
          borderRightWidth: 25,
          borderBottomWidth: 25,
          borderLeftWidth: 25,
        },
        children: [
          {
            style: {
              display: 'inline',
              marginTop: 100,
              marginRight: 100,
              marginBottom: 100,
              marginLeft: 100,
              paddingTop: 100,
              paddingRight: 100,
              paddingBottom: 100,
              paddingLeft: 100,
              borderTopWidth: 25,
              borderRightWidth: 25,
              borderBottomWidth: 25,
              borderLeftWidth: 25,
            },
          },
        ],
      }],
    });
    node.lay(inputConstraints);
    expect(node.children[0].children[0].result).toMatchObject({
      x: 250,
      y: 125,
      w: 0,
      h: 24,
    });
  });

  it('inline-box-001', () => {
    const node = genNode({
      style: {
        display: 'inline',
        borderLeftWidth: 2,
        borderRightWidth: 2,
        borderTopWidth: 2,
        borderBottomWidth: 2,
      },
      children: [
        { content: 'First line' },
        { style: { width: '2in' }, children: [ { content: 'Filler text' } ] },
        { content: 'Last line' },
      ],
    });
    node.lay(inputConstraints);
    expect(node.result).toMatchObject({
      x: 0,
      y: 0,
      w: 192,
      h: 72,
      borderTopWidth: 2,
      borderRightWidth: 2,
      borderBottomWidth: 2,
      borderLeftWidth: 2,
      frags: [
        {
          x: 2,
          y: 0,
          w: 160,
          h: 24,
        },
        {
          x: 0,
          y: 48,
          w: 144,
          h: 24,
        },
      ],
      type: 'inline',
    });
    expect(node.children[1].result).toMatchObject({
      x: 0,
      y: 24,
      w: 192,
      h: 24,
      frags: null,
      type: 'box',
    });
  });

  it('inline-box-002', () => {
    const node = genNode({
      style: {
        position: 'relative',
        top: '2in',
        display: 'inline',
        borderLeftWidth: 2,
        borderRightWidth: 2,
        borderTopWidth: 2,
        borderBottomWidth: 2,
      },
      children: [
        { content: 'First line' },
        { style: { width: '2in' }, children: [ { content: 'Filler text' } ] },
        { content: 'Last line' },
      ],
    });
    node.lay(inputConstraints);
    expect(node.result).toMatchObject({
      x: 0,
      y: 192,
      w: 192,
      h: 72,
      borderTopWidth: 2,
      borderRightWidth: 2,
      borderBottomWidth: 2,
      borderLeftWidth: 2,
      frags: [
        {
          x: 2,
          y: 192,
          w: 160,
          h: 24,
        },
        {
          x: 0,
          y: 240,
          w: 144,
          h: 24,
        },
      ],
    });
    expect(node.children[1].result).toMatchObject({
      x: 0,
      y: 216,
      w: 192,
      h: 24,
    });
  });

  it('inline-formatting-context-001', () => {
    const node = genNode({
      children: [
        {
          style: {
            display: 'inline',
          },
          children: [
            {
              content: '1234567890',
            },
          ],
        },
        {
          style: {
            display: 'inline',
          },
          children: [
            {
              content: '1234567890',
            },
          ],
        },
        {
          style: {
            display: 'inline',
          },
          children: [
            {
              content: '1234567890',
            },
          ],
        },
      ],
    });
    node.lay(inputConstraints);
    expect(node.result).toMatchObject({
      x: 0,
      y: 0,
      h: 24,
    });
    expect(node.children[2].result).toMatchObject({
      x: 320,
      y: 0,
      w: 160,
      h: 24,
    });
  });
});
