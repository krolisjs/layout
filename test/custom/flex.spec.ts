import { expect } from 'expect';
import { createTestInputConstraints, genNode } from '../env';
import type { InputConstraints } from '../../src/';

describe('flex', () => {
  let inputConstraints: InputConstraints;

  beforeEach(() => {
    inputConstraints = createTestInputConstraints();
  });

  it('flex-row-grow-001', () => {
    const node = genNode({
      style: {
        display: 'flex',
        width: 300,
        height: 40,
      },
      children: [{
        style: { flex: 1 },
      }, {
        style: { flex: 1 },
      }],
    });
    node.lay(inputConstraints);
    expect(node.children[0].mixedResult).toMatchObject({
      x: 0,
      y: 0,
      w: 150,
      h: 40,
      flexBasis: 0,
    });
    expect(node.children[1].mixedResult).toMatchObject({
      x: 150,
      y: 0,
      w: 150,
      h: 40,
      flexBasis: 0,
    });
  });

  it('flex-row-basis-001', () => {
    const node = genNode({
      style: {
        display: 'flex',
        width: 300,
      },
      children: [{
        style: {
          width: 200,
          flexBasis: '25%',
        },
      }, {
        style: {
          width: 80,
        },
      }],
    });
    node.lay(inputConstraints);
    expect(node.children[0].mixedResult).toMatchObject({
      x: 0,
      w: 75,
      flexBasis: 75,
    });
    expect(node.children[1].mixedResult).toMatchObject({
      x: 75,
      w: 80,
      flexBasis: 80,
    });
  });

  it('flex-row-shrink-001', () => {
    const node = genNode({
      style: {
        display: 'flex',
        width: 200,
      },
      children: [{
        style: {
          flexBasis: 100,
          flexShrink: 1,
        },
      }, {
        style: {
          flexBasis: 200,
          flexShrink: 2,
        },
      }],
    });
    node.lay(inputConstraints);
    expect(node.children[0].mixedResult).toMatchObject({
      x: 0,
      w: 80,
      flexBasis: 100,
    });
    expect(node.children[1].mixedResult).toMatchObject({
      x: 80,
      w: 120,
      flexBasis: 200,
    });
  });

  it('flex-row-margin-justify-content-001', () => {
    const node = genNode({
      style: {
        display: 'flex',
        width: 300,
        justifyContent: 'spaceBetween',
      },
      children: [{
        style: {
          width: 50,
          height: 10,
          marginLeft: 10,
          marginRight: 20,
        },
      }, {
        style: {
          width: 50,
          height: 10,
          marginLeft: 5,
          marginRight: 15,
        },
      }],
    });
    node.lay(inputConstraints);
    expect(node.children[0].mixedResult).toMatchObject({
      x: 10,
      y: 0,
      w: 50,
      h: 10,
    });
    expect(node.children[1].mixedResult).toMatchObject({
      x: 235,
      y: 0,
      w: 50,
      h: 10,
    });
  });

  it('flex-row-align-items-001', () => {
    const node = genNode({
      style: {
        display: 'flex',
        width: 100,
        height: 100,
        alignItems: 'center',
      },
      children: [{
        style: {
          width: 20,
          height: 20,
        },
      }, {
        style: {
          width: 20,
          height: 20,
          alignSelf: 'flexEnd',
        },
      }],
    });
    node.lay(inputConstraints);
    expect(node.children[0].mixedResult).toMatchObject({
      x: 0,
      y: 40,
      w: 20,
      h: 20,
    });
    expect(node.children[1].mixedResult).toMatchObject({
      x: 20,
      y: 80,
      w: 20,
      h: 20,
    });
  });

  it('flex-row-align-items-stretch-001', () => {
    const node = genNode({
      style: {
        display: 'flex',
        width: 100,
        height: 100,
        alignItems: 'stretch',
      },
      children: [{
        style: {
          width: 20,
        },
      }],
    });
    node.lay(inputConstraints);
    expect(node.children[0].mixedResult).toMatchObject({
      x: 0,
      y: 0,
      w: 20,
      h: 100,
    });
  });

  it('flex-row-align-items-baseline-001', () => {
    const node = genNode({
      style: {
        display: 'flex',
        width: 100,
        alignItems: 'baseline',
      },
      children: [{
        style: {
          width: 20,
          fontSize: 16,
        },
        children: [{ content: 'A' }],
      }, {
        style: {
          width: 20,
          fontSize: 32,
        },
        children: [{ content: 'A' }],
      }],
    });
    node.lay(inputConstraints);
    expect(node.mixedResult).toMatchObject({ h: 48 });
    expect(node.children[0].mixedResult).toMatchObject({
      x: 0,
      y: 15,
      h: 24,
    });
    expect(node.children[1].mixedResult).toMatchObject({
      x: 20,
      y: 0,
      h: 48,
    });
  });

  it('flex-column-001', () => {
    const node = genNode({
      style: {
        display: 'flex',
        flexDirection: 'column',
        width: 100,
        height: 100,
      },
      children: [{ style: { width: 20, height: 50 } }, { style: { width: 40, height: 50 } }],
    });
    node.lay(inputConstraints);
    expect(node.children[0].mixedResult).toMatchObject({ x: 0, y: 0, w: 20, h: 50 });
    expect(node.children[1].mixedResult).toMatchObject({ x: 0, y: 50, w: 40, h: 50 });
  });

  it('flex-column-stretch-001', () => {
    const node = genNode({
      style: { display: 'flex', flexDirection: 'column', width: 100, height: 100 },
      children: [{ style: { width: 20, height: 20 } }],
    });
    node.lay(inputConstraints);
    expect(node.children[0].mixedResult).toMatchObject({ x: 0, y: 0, w: 20, h: 20 });
  });

  it('flex-row-reverse-001', () => {
    const node = genNode({
      style: { display: 'flex', flexDirection: 'rowReverse', width: 100, height: 20 },
      children: [{ style: { width: 20, height: 10 } }, { style: { width: 30, height: 10 } }],
    });
    node.lay({ ...inputConstraints, aw: 1000 });
    expect(node.children[0].mixedResult).toMatchObject({ x: 80, y: 0, w: 20, h: 10 });
    expect(node.children[1].mixedResult).toMatchObject({ x: 50, y: 0, w: 30, h: 10 });
  });

  it('flex-wrap-001', () => {
    const node = genNode({
      style: { display: 'flex', flexWrap: 'wrap', width: 100 },
      children: [
        { style: { width: 60, height: 10 } },
        { style: { width: 60, height: 20 } },
      ],
    });
    node.lay(inputConstraints);
    expect(node.children[0].mixedResult).toMatchObject({ x: 0, y: 0, w: 60, h: 10 });
    expect(node.children[1].mixedResult).toMatchObject({ x: 0, y: 10, w: 60, h: 20 });
  });

});
