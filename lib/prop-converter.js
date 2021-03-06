'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _errorMessages = require('./error-messages');

var _enterLeavePresets = require('./enter-leave-presets');

var _helpers = require('./helpers');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } /**
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * React Flip Move | propConverter
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * (c) 2016-present Joshua Comeau
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                *
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * Abstracted away a bunch of the messy business with props.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                *   - propTypes and defaultProps
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                *   - Type conversion (We accept 'string' and 'number' values for duration,
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                *     delay, and other fields, but we actually need them to be ints.)
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                *   - Children conversion (we need the children to be an array. May not always
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                *     be, if a single child is passed in.)
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                *   - Resolving animation presets into their base CSS styles
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                */

function propConverter(ComposedComponent) {
  var FlipMovePropConverter = function (_Component) {
    _inherits(FlipMovePropConverter, _Component);

    function FlipMovePropConverter() {
      _classCallCheck(this, FlipMovePropConverter);

      return _possibleConstructorReturn(this, (FlipMovePropConverter.__proto__ || Object.getPrototypeOf(FlipMovePropConverter)).apply(this, arguments));
    }

    _createClass(FlipMovePropConverter, [{
      key: 'convertProps',
      value: function convertProps(props) {
        var propTypes = FlipMovePropConverter.propTypes,
            defaultProps = FlipMovePropConverter.defaultProps;

        // Create a non-immutable working copy

        var workingProps = _extends({}, props);

        // Convert `children` to an array. This is to standardize when a single
        // child is passed, as well as if the child is falsy.
        workingProps.children = _react2.default.Children.toArray(props.children);

        // FlipMove does not support stateless functional components.
        // Check to see if any supplied components won't work.
        // If the child doesn't have a key, it means we aren't animating it.
        // It's allowed to be an SFC, since we ignore it.
        var noStateless = workingProps.children.every(function (child) {
          return !(0, _helpers.isElementAnSFC)(child) || typeof child.key === 'undefined';
        });

        if (!noStateless) {
          console.warn((0, _errorMessages.statelessFunctionalComponentSupplied)());
        }

        // Do string-to-int conversion for all timing-related props
        var timingPropNames = ['duration', 'delay', 'staggerDurationBy', 'staggerDelayBy'];

        timingPropNames.forEach(function (prop) {
          var rawValue = workingProps[prop];
          var value = typeof rawValue === 'string' ? parseInt(rawValue, 10) : rawValue;

          if (isNaN(value)) {
            var defaultValue = defaultProps[prop];
            var errorMessage = (0, _errorMessages.invalidTypeForTimingProp)({
              prop: prop,
              value: value,
              defaultValue: defaultValue
            });
            console.error(errorMessage);

            value = defaultValue;
          }

          workingProps[prop] = value;
        });

        // Our enter/leave animations can be specified as boolean (default or
        // disabled), string (preset name), or object (actual animation values).
        // Let's standardize this so that they're always objects
        workingProps.enterAnimation = this.convertAnimationProp(workingProps.enterAnimation, _enterLeavePresets.enterPresets);
        workingProps.leaveAnimation = this.convertAnimationProp(workingProps.leaveAnimation, _enterLeavePresets.leavePresets);

        // Accept `disableAnimations`, but add a deprecation warning
        if (typeof props.disableAnimations !== 'undefined') {
          console.warn((0, _errorMessages.deprecatedDisableAnimations)());
          workingProps.disableAnimations = undefined;
          workingProps.disableAllAnimations = props.disableAnimations;
        }

        // Gather any additional props;
        // they will be delegated to the ReactElement created.
        var primaryPropKeys = Object.keys(propTypes);
        var delegatedProps = (0, _helpers.omit)(this.props, primaryPropKeys);

        // The FlipMove container element needs to have a non-static position.
        // We use `relative` by default, but it can be overridden by the user.
        // Now that we're delegating props, we need to merge this in.
        delegatedProps.style = _extends({
          position: 'relative'
        }, delegatedProps.style);

        workingProps = (0, _helpers.omit)(workingProps, Object.keys(delegatedProps));
        workingProps.delegated = delegatedProps;

        return workingProps;
      }

      // eslint-disable-next-line class-methods-use-this

    }, {
      key: 'convertAnimationProp',
      value: function convertAnimationProp(animation, presets) {
        var newAnimation = void 0;

        switch (typeof animation === 'undefined' ? 'undefined' : _typeof(animation)) {
          case 'boolean':
            {
              // If it's true, we want to use the default preset.
              // If it's false, we want to use the 'none' preset.
              newAnimation = presets[animation ? _enterLeavePresets.defaultPreset : _enterLeavePresets.disablePreset];
              break;
            }

          case 'string':
            {
              var presetKeys = Object.keys(presets);

              if (presetKeys.indexOf(animation) === -1) {
                console.error((0, _errorMessages.invalidEnterLeavePreset)({
                  value: animation,
                  acceptableValues: presetKeys.join(', '),
                  defaultValue: _enterLeavePresets.defaultPreset
                }));
                newAnimation = presets[_enterLeavePresets.defaultPreset];
              } else {
                newAnimation = presets[animation];
              }
              break;
            }

          default:
            {
              newAnimation = animation;
              break;
            }
        }

        return newAnimation;
      }
    }, {
      key: 'render',
      value: function render() {
        return _react2.default.createElement(ComposedComponent, this.convertProps(this.props));
      }
    }]);

    return FlipMovePropConverter;
  }(_react.Component);

  FlipMovePropConverter.propTypes = {
    children: _react.PropTypes.node,
    easing: _react.PropTypes.string,
    duration: _react.PropTypes.oneOfType([_react.PropTypes.string, _react.PropTypes.number]),
    delay: _react.PropTypes.oneOfType([_react.PropTypes.string, _react.PropTypes.number]),
    staggerDurationBy: _react.PropTypes.oneOfType([_react.PropTypes.string, _react.PropTypes.number]),
    staggerDelayBy: _react.PropTypes.oneOfType([_react.PropTypes.string, _react.PropTypes.number]),
    onStart: _react.PropTypes.func,
    onFinish: _react.PropTypes.func,
    onStartAll: _react.PropTypes.func,
    onFinishAll: _react.PropTypes.func,
    typeName: _react.PropTypes.string,
    enterAnimation: _react.PropTypes.oneOfType([_react.PropTypes.string, _react.PropTypes.bool, _react.PropTypes.shape({
      from: _react.PropTypes.object,
      to: _react.PropTypes.object
    })]),
    leaveAnimation: _react.PropTypes.oneOfType([_react.PropTypes.string, _react.PropTypes.bool, _react.PropTypes.shape({
      from: _react.PropTypes.object,
      to: _react.PropTypes.object
    })]),
    disableAllAnimations: _react.PropTypes.bool,
    getPosition: _react.PropTypes.func,
    maintainContainerHeight: _react.PropTypes.bool.isRequired
  };

  FlipMovePropConverter.defaultProps = {
    easing: 'ease-in-out',
    duration: 350,
    delay: 0,
    staggerDurationBy: 0,
    staggerDelayBy: 0,
    typeName: 'div',
    enterAnimation: _enterLeavePresets.defaultPreset,
    leaveAnimation: _enterLeavePresets.defaultPreset,
    disableAllAnimations: false,
    getPosition: function getPosition(node) {
      return node.getBoundingClientRect();
    },
    maintainContainerHeight: false
  };

  return FlipMovePropConverter;
}

exports.default = propConverter;
module.exports = exports['default'];