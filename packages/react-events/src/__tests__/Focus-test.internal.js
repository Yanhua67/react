/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

let React;
let ReactFeatureFlags;
let ReactDOM;
let Focus;

const createFocusEvent = type => {
  const event = document.createEvent('Event');
  event.initEvent(type, true, true);
  return event;
};

describe('Focus event responder', () => {
  let container;

  beforeEach(() => {
    jest.resetModules();
    ReactFeatureFlags = require('shared/ReactFeatureFlags');
    ReactFeatureFlags.enableEventAPI = true;
    React = require('react');
    ReactDOM = require('react-dom');
    Focus = require('react-events/focus');

    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
    container = null;
  });

  describe('disabled', () => {
    let onBlur, onFocus, ref;

    beforeEach(() => {
      onBlur = jest.fn();
      onFocus = jest.fn();
      ref = React.createRef();
      const element = (
        <Focus disabled={true} onBlur={onBlur} onFocus={onFocus}>
          <div ref={ref} />
        </Focus>
      );
      ReactDOM.render(element, container);
    });

    it('prevents custom events being dispatched', () => {
      ref.current.dispatchEvent(createFocusEvent('focus'));
      ref.current.dispatchEvent(createFocusEvent('blur'));
      expect(onFocus).not.toBeCalled();
      expect(onBlur).not.toBeCalled();
    });
  });

  describe('onBlur', () => {
    let onBlur, ref;

    beforeEach(() => {
      onBlur = jest.fn();
      ref = React.createRef();
      const element = (
        <Focus onBlur={onBlur}>
          <div ref={ref} />
        </Focus>
      );
      ReactDOM.render(element, container);
    });

    it('is called after "blur" event', () => {
      ref.current.dispatchEvent(createFocusEvent('focus'));
      ref.current.dispatchEvent(createFocusEvent('blur'));
      expect(onBlur).toHaveBeenCalledTimes(1);
    });
  });

  describe('onFocus', () => {
    let onFocus, ref, innerRef;

    beforeEach(() => {
      onFocus = jest.fn();
      ref = React.createRef();
      innerRef = React.createRef();
      const element = (
        <Focus onFocus={onFocus}>
          <div ref={ref}>
            <a ref={innerRef} />
          </div>
        </Focus>
      );
      ReactDOM.render(element, container);
    });

    it('is called after "focus" event', () => {
      ref.current.dispatchEvent(createFocusEvent('focus'));
      expect(onFocus).toHaveBeenCalledTimes(1);
    });

    it('is not called if descendants of target receive focus', () => {
      const target = innerRef.current;
      target.dispatchEvent(createFocusEvent('focus'));
      expect(onFocus).not.toBeCalled();
    });
  });

  describe('onFocusChange', () => {
    let onFocusChange, ref;

    beforeEach(() => {
      onFocusChange = jest.fn();
      ref = React.createRef();
      const element = (
        <Focus onFocusChange={onFocusChange}>
          <div ref={ref} />
        </Focus>
      );
      ReactDOM.render(element, container);
    });

    it('is called after "blur" and "focus" events', () => {
      ref.current.dispatchEvent(createFocusEvent('focus'));
      expect(onFocusChange).toHaveBeenCalledTimes(1);
      expect(onFocusChange).toHaveBeenCalledWith(true);
      ref.current.dispatchEvent(createFocusEvent('blur'));
      expect(onFocusChange).toHaveBeenCalledTimes(2);
      expect(onFocusChange).toHaveBeenCalledWith(false);
    });
  });

  describe('nested Focus components', () => {
    it('do not propagate events by default', () => {
      const events = [];
      const innerRef = React.createRef();
      const outerRef = React.createRef();
      const createEventHandler = msg => () => {
        events.push(msg);
      };

      const element = (
        <Focus
          onBlur={createEventHandler('outer: onBlur')}
          onFocus={createEventHandler('outer: onFocus')}
          onFocusChange={createEventHandler('outer: onFocusChange')}>
          <div ref={outerRef}>
            <Focus
              onBlur={createEventHandler('inner: onBlur')}
              onFocus={createEventHandler('inner: onFocus')}
              onFocusChange={createEventHandler('inner: onFocusChange')}>
              <div ref={innerRef} />
            </Focus>
          </div>
        </Focus>
      );

      ReactDOM.render(element, container);

      outerRef.current.dispatchEvent(createFocusEvent('focus'));
      outerRef.current.dispatchEvent(createFocusEvent('blur'));
      innerRef.current.dispatchEvent(createFocusEvent('focus'));
      innerRef.current.dispatchEvent(createFocusEvent('blur'));
      expect(events).toEqual([
        'outer: onFocus',
        'outer: onFocusChange',
        'outer: onBlur',
        'outer: onFocusChange',
        'inner: onFocus',
        'inner: onFocusChange',
        'inner: onBlur',
        'inner: onFocusChange',
      ]);
    });
  });

  it('expect displayName to show up for event component', () => {
    expect(Focus.displayName).toBe('Focus');
  });
});
