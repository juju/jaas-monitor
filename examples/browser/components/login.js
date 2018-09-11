// Copyright 2018 Canonical Ltd.
// Licensed under the LGPLv3, see LICENCE.txt file for details.

'use strict';


const PropTypes = require('prop-types');
const React = require('react');

const {Col, Link, Row} = require('./widgets');


function Login(props) {
  if (!props.url) {
    return null;
  }
  return (
    <Row>
      <Col>
        <Link href={props.url}>login</Link>
      </Col>
    </Row>
  );
}
Login.propTypes = {
  url: PropTypes.string.isRequired
};


module.exports = Login;
