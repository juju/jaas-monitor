// Copyright 2018 Canonical Ltd.
// Licensed under the LGPLv3, see LICENCE.txt file for details.

'use strict';

const React = require('react');
const ReactDOM = require('react-dom');

const App = require('./components/app');
const checkers = require('../../checkers');

function main() {
  const facades = [
    require('jujulib/api/facades/all-watcher-v1'),
    require('jujulib/api/facades/application-v5'),
    require('jujulib/api/facades/client-v1'),
    require('jujulib/api/facades/model-manager-v4')
  ];
  const mountNode = document.getElementById('app');
  ReactDOM.render(
    <App
      checkers={[
        checkers.checkModel,
        checkers.checkUnits,
        checkers.checkJujushell
      ]}
      options={{debug: false, facades: facades}}
    />,
    mountNode
  );
}

main();
