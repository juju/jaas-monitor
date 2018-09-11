// Copyright 2018 Canonical Ltd.
// Licensed under the LGPLv3, see LICENCE.txt file for details.

'use strict';


const PropTypes = require('prop-types');
const React = require('react');

const {Col, Icon, Row} = require('./widgets');


class Dashboard extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    const notes = this.props.notes.map(note => {
      const contents = [];
      note.infos.forEach(info => {
        contents.push(
          <Row>
            <Col size={1}><Icon name="information"></Icon></Col>
            <Col size={11}>{info}</Col>
          </Row>
        );
      });
      note.errors.forEach(err => {
        contents.push(
          <Row>
            <Col size={1}><Icon name="error"></Icon></Col>
            <Col size={11}>{err}</Col>
          </Row>
        );
      });
      return <div>{contents}</div>
    });
    return <div>{notes}</div>;
  }
}

Dashboard.propTypes = {
  notes: PropTypes.array.isRequired
};


module.exports = Dashboard;
