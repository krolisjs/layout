import { expect } from 'expect';
import { createTestInputConstraints, genNode } from '../env.ts';
import type { InputConstraints } from '../../dist/index.js';

describe('margin-trim', () => {
  let inputConstraints: InputConstraints;

  beforeEach(() => {
    inputConstraints = createTestInputConstraints();
  });

  it('block-container-block-001', () => {
    const node = genNode({
      style: {
        width: 110,
        // width: 'minContent',
      },
      children: [
        {
          style: {
            width: 100,
          },
          children: [
            {
              style: {
                width: 90,
                height: 50,
                marginTop: 50,
                marginBottom: 50,
              },
            },
          ],
        },
        {
          style: {
            width: 100,
            height: 50,
          },
        },
      ],
    });
    node.lay(inputConstraints);
    expect(node.children[0].result).toMatchObject({
      x: 0,
      y: 50,
      h: 50,
      marginTop: 0,
      marginBottom: 0,
    });
    expect(node.children[0].children[0].result).toMatchObject({
      x: 0,
      y: 50,
      h: 50,
      marginTop: 50,
      marginBottom: 50,
    });
    expect(node.children[1].result).toMatchObject({
      x: 0,
      y: 150,
      h: 50,
      marginTop: 0,
    });
  });

  it('block-container-block-002', () => {
    const node = genNode({
      children: [
        {
          style: {
            width: 110,
            // width: 'minContent',
          },
          children: [
            {
              style: {
                marginTop: 50,
                height: 25,
              },
            },
            {
              style: {
                marginBottom: 15,
                width: 100,
                height: 10,
              },
            },
            {
              style: {
                marginBottom: 50,
                width: 100,
                height: 25,
              },
            },
          ],
        },
        {
          style: {
            width: 100,
            height: 25,
          },
        },
      ],
    });
    node.lay(inputConstraints);
    expect(node.children[0].result).toMatchObject({
      x: 0,
      y: 50,
      h: 75,
      marginTop: 0,
      marginBottom: 0,
    });
    expect(node.children[0].children[0].result).toMatchObject({
      x: 0,
      y: 50,
      h: 25,
      marginTop: 50,
      marginBottom: 0,
    });
    expect(node.children[0].children[1].result).toMatchObject({
      x: 0,
      y: 75,
      h: 10,
      marginTop: 0,
      marginBottom: 15,
    });
    expect(node.children[0].children[2].result).toMatchObject({
      x: 0,
      y: 100,
      h: 25,
      marginTop: 0,
      marginBottom: 50,
    });
    expect(node.children[1].result).toMatchObject({
      x: 0,
      y: 175,
      h: 25,
      marginTop: 0,
      marginBottom: 0,
    });
  });

  it('block-container-block-end-001', () => {
    const node = genNode({
      children: [
        {
          style: {
            width: 110,
            // width: 'minContent',
          },
          children: [
            {
              style: {
                marginBottom: 50,
                width: 100,
                height: 50,
              },
            },
          ],
        },
        {
          style: {
            width: 100,
            height: 50,
          },
        },
      ],
    });
    node.lay(inputConstraints);
    expect(node.children[0].result).toMatchObject({
      x: 0,
      y: 0,
      h: 50,
      marginTop: 0,
      marginBottom: 0,
    });
    expect(node.children[0].children[0].result).toMatchObject({
      x: 0,
      y: 0,
      h: 50,
      marginTop: 0,
      marginBottom: 50,
    });
    expect(node.children[1].result).toMatchObject({
      x: 0,
      y: 100,
      h: 50,
    });
  });

  it('block-container-block-end-002', () => {
    const node = genNode({
      children: [
        {
          style: {
            width: 110,
            // width: 'minContent',
          },
          children: [
            {
              style: {
                marginBottom: 25,
                width: 100,
                height: 25,
              },
            },
            {
              style: {
                marginBottom: 100,
                width: 100,
                height: 10,
              },
            },
          ],
        },
        {
          style: {
            width: 100,
            height: 40,
          },
        },
      ],
    });
    node.lay(inputConstraints);
    expect(node.children[0].result).toMatchObject({
      x: 0,
      y: 0,
      h: 60,
    });
    expect(node.children[0].children[0].result).toMatchObject({
      x: 0,
      y: 0,
      h: 25,
      marginTop: 0,
      marginBottom: 25,
    });
    expect(node.children[0].children[1].result).toMatchObject({
      x: 0,
      y: 50,
      h: 10,
      marginTop: 0,
      marginBottom: 100,
    });
    expect(node.children[1].result).toMatchObject({
      x: 0,
      y: 160,
      h: 40,
    });
  });

  it('block-container-block-start-001', () => {
    const node = genNode({
      children: [
        {
          style: {
            width: 100,
            height: 50,
          },
        },
        {
          style: {
            width: 110,
            // width: 'minContent',
          },
          children: [
            {
              style: {
                marginTop: 50,
                width: 100,
                height: 50,
              },
            },
          ],
        },
      ],
    });
    node.lay(inputConstraints);
    expect(node.children[1].result).toMatchObject({
      x: 0,
      y: 100,
      h: 50,
      marginTop: 0,
    });
    expect(node.children[1].children[0].result).toMatchObject({
      x: 0,
      y: 100,
      h: 50,
      marginTop: 50,
    });
  });

  it('block-container-block-start-002', () => {
    const node = genNode({
      children: [
        {
          style: {
            width: 100,
            height: 10,
          },
        },
        {
          style: {
            width: 110,
            // width: 'minContent',
          },
          children: [
            {
              style: {
                marginTop: 50,
                width: 100,
                height: 40,
              },
            },
            {
              style: {
                marginTop: 10,
                width: 100,
                height: 40,
              },
            },
          ],
        },
      ],
    });
    node.lay(inputConstraints);
    expect(node.children[1].result).toMatchObject({
      x: 0,
      y: 60,
      h: 90,
    });
    expect(node.children[1].children[0].result).toMatchObject({
      x: 0,
      y: 60,
      h: 40,
      marginTop: 50,
    });
    expect(node.children[1].children[1].result).toMatchObject({
      x: 0,
      y: 110,
      h: 40,
      marginTop: 10,
    });
  });

  it('custom-top-bottom-001', () => {
    const node = genNode({
      children: [
        {
          style: {
            marginBottom: 10,
            height: 10,
          },
        },
        {
          style: {
            marginTop: 10,
          },
        },
      ],
    });
    node.lay(inputConstraints);
    expect(node.children[1].result).toMatchObject({
      x: 0,
      y: 20,
      marginTop: 10,
    });
  });
});
