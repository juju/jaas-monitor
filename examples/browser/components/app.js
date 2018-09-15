// Copyright 2018 Canonical Ltd.
// Licensed under the LGPLv3, see LICENCE.txt file for details.

'use strict';


const bakery = require('macaroon-bakery');
const PropTypes = require('prop-types');
const React = require('react');
const shapeup = require('shapeup');

const monitor = require('../../../monitor');
const notes = require('../notes');
const Dashboard = require('./dashboard');
const Header = require('./header');
const Login = require('./login');
const StatusBar = require('./statusbar');
const {Col, Row} = require('./widgets');


class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {loginURL: '', notes: [], headerMsg: ''};
  }

  async componentDidMount() {
    const props = this.props;
    const options = {
      debug: props.options.debug,
      facades: props.options.facades,
      bakery: new bakery.Bakery({
        visitPage: resp => this.setState({loginURL: resp.Info.VisitURL}),
        onSuccess: () => this.setState({loginURL: '', headerMsg: 'Check started'})
      })
    };
    const ui = new notes.UI(this._updateNote.bind(this));
    try {
      await monitor(props.url, options, props.checkers, ui);
    } catch (err) {
      ui.error(err);
    }
    this.setState({headerMsg: 'Check completed'});
  }

  _updateNote(note) {
    let found = false;
    const notes = this.state.notes.map(n => {
      if (n.key === note.key) {
        found = true;
        return note;
      }
      return n;
    });
    if (!found) {
      notes.push(note);
    }
    this.setState({notes: notes});
  }

  render() {
    const state = this.state;
    const logs = state.notes.reduce((prev, cur) => prev.concat(cur.logs), []);
    return (
      <div>
        <Row><Col><h1>JAAS Monitor</h1></Col></Row>
        <Header msg={state.headerMsg}></Header>
        <Login url={state.loginURL}></Login>
        <Dashboard notes={state.notes}></Dashboard>
        <footer className="p-footer" id="footer">
          <StatusBar logs={logs}></StatusBar>
        </footer>
      </div>
    );
  }
}

App.propTypes = {
  checkers: PropTypes.array.isRequired,
  options: shapeup.shape({
    debug: PropTypes.bool,
    facades: PropTypes.array
  }).isRequired,
  url: PropTypes.string.isRequired
};


module.exports = App;
