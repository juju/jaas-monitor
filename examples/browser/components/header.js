// Copyright 2018 Canonical Ltd.
// Licensed under the LGPLv3, see LICENCE.txt file for details.

'use strict';

const PropTypes = require('prop-types');
const React = require('react');

const { Col, Icon, Row } = require('./widgets');

function Header(props) {
  return (
    <header id="navigation" className="p-navigation">
      <div className="p-navigation__banner">
        <div className="p-navigation__logo">
          <a className="p-navigation__link" href={props.url}>
            <img
              className="p-navigation__image"
              src="https://assets.ubuntu.com/v1/e2ac88af-juju_black-orange_hex.svg"
              alt="Juju logo"
              width="95"
            />
          </a>
        </div>
        <a
          href="#navigation"
          className="p-navigation__toggle--open"
          title="menu">
          Menu
        </a>
        <a
          href="#navigation-closed"
          className="p-navigation__toggle--close"
          title="close menu">
          Close menu
        </a>
      </div>
      <nav className="p-navigation__nav" role="menubar">
        <span className="u-off-screen">
          <a href="#main-content">Jump to main content</a>
        </span>
        <ul className="p-navigation__links" role="menu">
          <li className="p-navigation__link" role="menuitem">
            <a href={props.url} target="_blank">
              Login
            </a>
          </li>
        </ul>
      </nav>
    </header>
  );
  if (props.msg) {
    return (
      <Row>
        <Col size={1}>
          <Icon name="information" />
        </Col>
        <Col size={11}>{props.msg}</Col>
      </Row>
    );
  }
}

Header.propTypes = {
  msg: PropTypes.string.isRequired
};

module.exports = Header;
