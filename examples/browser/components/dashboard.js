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

  widgetDisplayed(note, text) {
    const key = `${note.key}-${text}-widget`;
    const widgets = this.props.widgets[note.key] || [];
    for (let i = 0; i < widgets.length; i++) {
      if (widgets[i].key === key) {
        return true;
      }
    }
    return false;
  }

  render() {
    const props = this.props;
    if (!props.notes.length) {
      return null;
    }
    const notes = props.notes.map(note => {
      const contents = [];

      note.infos.forEach((info, i) => {
        contents.push(
          <Row key={note.key + '-info-' + i}>
            <Col size={12}>
              <Notification type="information">{info}</Notification>
            </Col>
          </Row>
        );
      });

      note.errors.forEach((err, i) => {
        contents.push(
          <Row key={note.key + '-err-' + i}>
            <Col size={12}>
              <Notification type="negative">{err}</Notification>
            </Col>
          </Row>
        );
      });
      if (note.actions.length || note.links.length) {
        const cols = [];
        note.actions.forEach(({text, callback}, i) => {
          const disabled = this.widgetDisplayed(note, text);
          cols.push(
            <li className="p-inline-list__item" key={note.key + '-action-' + i}>
              <Button type="positive" callback={callback} disabled={disabled}>
                {text}
              </Button>
            </li>
          );
        });
        note.links.forEach(({text, href}, i) => {
          cols.push(
            <li className="p-inline-list__item" key={note.key + '-link-' + i}>
              <Link href={href}>
                {text}
              </Link>
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

      (props.widgets[note.key] || []).forEach((widget, i) => {
        contents.push(
          <Row key={widget.key + i}>
            <Col size={12}>
              <Notification type="information">{widget.content}</Notification>
            </Col>
          </Row>
        );
      });

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
  notes: PropTypes.array.isRequired,
  widgets: PropTypes.object.isRequired
};

module.exports = Dashboard;
