// Copyright 2018 Canonical Ltd.
// Licensed under the LGPLv3, see LICENCE.txt file for details.

'use strict';

const PropTypes = require('prop-types');
const React = require('react');

const {Button, Col, Link, Row} = require('./widgets');
const Notification = require('./notification');

class Dashboard extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    const props = this.props;
    if (!props.notes.length) {
      return null;
    }
    const notes = props.notes.map(note => {
      const contents = [];

      note.infos.forEach(info => {
        contents.push(
          <Row key={note.key + '-infos'}>
            <Col size={12}>
              <Notification type="information">{info}</Notification>
            </Col>
          </Row>
        );
      });

      note.errors.forEach(err => {
        contents.push(
          <Row key={note.key + '-errors'}>
            <Col size={12}>
              <Notification type="negative">{err}</Notification>
            </Col>
          </Row>
        );
      });

      if (note.actions.length || note.links.length) {
        const cols = [];
        note.links.forEach(({text, href}, i) => {
          cols.push(
            <li className="p-inline-list__item" key={note.key + '-link-' + i}>
              <Link href={href}>
                {text}
              </Link>
            </li>
          );
        });
        note.actions.forEach(({text, callback}, i) => {
          cols.push(
            <li className="p-inline-list__item" key={note.key + '-action-' + i}>
              <Button type="positive" callback={callback}>
                {text}
              </Button>
            </li>
          );
        });
        contents.push(
          <Row key={note.key + '-actions-and-links'}>
            <ul className="p-inline-list">
              {cols}
            </ul>
          </Row>
        );
      }
      return contents;
    });
    return (
      <div className="p-strip--light">
        <Row>
          <div className="p-card--highlighted">{notes}</div>
        </Row>
      </div>
    );
  }
}

Dashboard.propTypes = {
  notes: PropTypes.array.isRequired
};

module.exports = Dashboard;
