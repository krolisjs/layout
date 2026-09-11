import { expect } from 'expect';
import { createTestInputConstraints, genNode } from '../env';
import type { InputConstraints } from '../../src/';

describe('percentage-width', () => {
  let inputConstraints: InputConstraints;

  beforeEach(() => {
    inputConstraints = createTestInputConstraints();
  });

  it('block-auto-child-%', () => {
    const node = genNode({
      style: {
        display: 'block',
        width: 'auto',
      },
      children: [
        {
          style: {
            width: '50%',
          },
        },
      ],
    });
    node.lay(inputConstraints);
    expect(node.children[0].mixedResult).toMatchObject({
      x: 0,
      y: 0,
      w: 5000,
    });
  });

  it('ib-auto-child-%', () => {
    const node = genNode({
      style: {
        display: 'inlineBlock',
        width: 'auto',
      },
      children: [
        {
          style: {
            width: '50%',
          },
          children: [{ content: 'x' }],
        },
      ],
    });
    node.lay(inputConstraints);
    expect(node.mixedResult).toMatchObject({
      x: 0,
      y: 0,
      w: 16,
    });
    expect(node.children[0].mixedResult).toMatchObject({
      x: 0,
      y: 0,
      w: 8,
    });
    expect(node.children[0].children[0].mixedResult).toMatchObject({
      x: 0,
      y: 1,
      w: 16,
    });
  });

  it('abs-%', () => {
    const node = genNode({
      style: {
        position: 'relative',
        width: 200,
      },
      children: [
        {
          style: {
            position: 'absolute',
            width: '50%',
          },
        },
      ],
    });
    node.lay(inputConstraints);
    expect(node.children[0].mixedResult).toMatchObject({
      x: 0,
      y: 0,
      w: 100,
    });
  });

  it('block-auto-child-p-%', () => {
    const node = genNode({
      style: {
        display: 'block',
        width: 'auto',
      },
      children: [
        {
          style: {
            width: '50%',
          },
          children: [
            {
              style: {
                width: '50%',
              },
            },
          ],
        },
      ],
    });
    node.lay(inputConstraints);
    expect(node.children[0].children[0].mixedResult).toMatchObject({
      x: 0,
      y: 0,
      w: 2500,
    });
  });
});

describe('percentage-height', () => {
  let inputConstraints: InputConstraints;

  beforeEach(() => {
    inputConstraints = createTestInputConstraints();
  });

  it('abs-%', () => {
    const node = genNode({
      style: {
        position: 'relative',
        width: 200,
        height: 200,
      },
      children: [{
        style: {
          position: 'absolute',
          width: 200,
          height: '50%',
        },
      }],
    });
    node.lay(inputConstraints);
    expect(node.children[0].mixedResult).toMatchObject({
      y: 0,
      h: 100,
    });
  });

  it('abs-child-%', () => {
    const node = genNode({
      style: {
        position: 'relative',
        width: 200,
        height: 200,
      },
      children: [{
        style: {
          position: 'absolute',
          width: 150,
          height: 100,
        },
        children: [{
          style: {
            width: 100,
            height: '50%',
          },
        }, {
          style: {
            position: 'absolute',
            width: 50,
            height: '50%',
          },
        }],
      }],
    });
    node.lay(inputConstraints);
    expect(node.children[0].children[0].mixedResult).toMatchObject({
      y: 0,
      h: 50,
    });
    expect(node.children[0].children[1].mixedResult).toMatchObject({
      y: 50,
      h: 50,
    });
  });

  it('abs-abs-child%', () => {
    const node = genNode({
      style: {
        position: 'relative',
        width: 200,
        height: 200,
      },
      children: [{
        style: {
          position: 'absolute',
          width: 150,
          height: '50%',
        },
        children: [{
          style: {
            width: 100,
            height: '50%',
          },
        }, {
          style: {
            position: 'absolute',
            width: 50,
            height: '50%',
          },
        }],
      }],
    });
    node.lay(inputConstraints);
    expect(node.children[0].children[0].mixedResult).toMatchObject({
      y: 0,
      h: 50,
    });
    expect(node.children[0].children[1].mixedResult).toMatchObject({
      y: 50,
      h: 50,
    });
  });

  it('abs-percent-height-auto-containing-block', () => {
    const node = genNode({
      style: {
        position: 'relative',
        width: 200,
      },
      children: [{
        style: {
          position: 'absolute',
          width: 150,
          height: '50%',
        },
        children: [{
          style: {
            width: 100,
            height: 40,
          },
        }],
      }],
    });
    node.lay(inputConstraints);
    expect(node.children[0].mixedResult).toMatchObject({
      y: 0,
      h: 0,
    });
    expect(node.children[0].children[0].mixedResult).toMatchObject({
      y: 0,
      h: 40,
    });
  });

  it('abs-%-child-auto-containing-block', () => {
    const node = genNode({
      style: {
        position: 'relative',
        width: 200,
      },
      children: [{
        style: {
          position: 'absolute',
          width: 150,
          height: '50%',
        },
        children: [{
          style: {
            width: 100,
            height: '50%',
          },
        }],
      }],
    });
    node.lay(inputConstraints);
    expect(node.children[0].mixedResult).toMatchObject({
      y: 0,
      h: 0,
    });
    expect(node.children[0].children[0].mixedResult).toMatchObject({
      y: 0,
      h: 0,
    });
  });

});
