// Copyright 2018 Canonical Ltd.
// Licensed under the LGPLv3, see LICENCE.txt file for details.

'use strict';

const PropTypes = require('prop-types');
const React = require('react');

const { Button, Col, Icon, Link, Row } = require('./widgets');

class Dashboard extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    console.log('============ DASHBOARD RENDER:', this.props.notes);
    const notes = this.props.notes.map(note => {
      const contents = [];
      note.infos.forEach(info => {
        contents.push(
          <Row key={note.key + '-infos'}>
            <Col size={1}>
              <Icon name="information" />
            </Col>
            <Col size={11}>{info}</Col>
          </Row>
        );
      });
      note.errors.forEach(err => {
        contents.push(
          <Row key={note.key + '-errors'}>
            <Col size={1}>
              <Icon name="error" />
            </Col>
            <Col size={11}>{err}</Col>
          </Row>
        );
      });
      if (note.actions.length || note.links.length) {
        const cols = [];
        note.actions.forEach(({ text, callback }) => {
          cols.push(
            <Col key={note.key + '-action'} size={2}>
              <Button callback={callback}>{text}</Button>
            </Col>
          );
        });
        note.links.forEach(({ text, href }) => {
          cols.push(
            <Col key={note.key + '-link'} size={2}>
              <Link href={href}>{text}</Link>
            </Col>
          );
        });
        contents.push(
          <Row key={note.key + '-actions-and-links'}>
            <Col size={1} />
            {cols}
          </Row>
        );
      }
      return contents;
    });
    return <div>{notes}</div>;
  }
}

Dashboard.propTypes = {
  notes: PropTypes.array.isRequired
};

module.exports = Dashboard;
