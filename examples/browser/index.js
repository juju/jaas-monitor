// Copyright 2018 Canonical Ltd.
// Licensed under the LGPLv3, see LICENCE.txt file for details.

'use strict';


const bakery = require('macaroon-bakery');

const monitor = require('../../monitor.js');
const checkers = require('../../checkers.js');

async function main() {
  const ui = new UI();
  let isFirstDischarge = true;
  const options = {
    debug: false,
    facades: [
      require('jujulib/api/facades/application-v5.js'),
      require('jujulib/api/facades/client-v1.js'),
      require('jujulib/api/facades/model-manager-v4.js')
    ],
    bakery: new bakery.Bakery({
      visitPage: resp => {
        const link = createLink('login', resp.Info.VisitURL);
        const column = createColumn(12, link);
        createRow('login', column);
      },
      onSuccess: () => {
        if (isFirstDischarge) {
          isFirstDischarge = false;
          document.getElementsByClassName('login')[0].remove();
          ui.info('check started');
        }
      }
    })
  };
  const checklist = [checkers.checkModel, checkers.checkUnits];
  try {
    await monitor('wss://jimm.jujucharms.com:443/api', options, checklist, ui);
  } catch (err) {
    ui.error(err);
  }
}


class UI {
  constructor() {
    this._actions = null;
  }

  log(msg) {
    console.log(msg);
  }

  info(msg) {
    this._actions = null;
    createRow(
      'info',
      createColumn(1, createIcon('information')),
      createColumn(11, document.createTextNode(msg))
    );
  }

  error(msg) {
    this._actions = null;
    createRow(
      'error',
      createColumn(1, createIcon('error')),
      createColumn(11, document.createTextNode(msg))
    );
  }

  _addAction(node) {
    if (!this._actions) {
      this._actions = createColumn(11, node);;
      createRow('actions', createColumn(1, document.createTextNode('')), this._actions);
      return;
    }
    this._actions.appendChild(node);
  }

  addAction(msg, callback) {
    this._addAction(createButton(msg, callback));
  }

  addLink(text, href) {
    this._addAction(createLink(text, href));
  }

  refresh() {
    // TODO.
  }
}


function createIcon(name) {
  const icon = document.createElement('i');
  icon.classList.add('p-icon--'+name);
  return icon;
}


function createLink(text, href, blank) {
  const link = document.createElement('a');
  link.classList.add('p-button--brand');
  link.text = text;
  link.href = href;
  link.target = '_blank';
  return link;
}


function createButton(text, callback) {
  const button = document.createElement('button');
  button.classList.add('p-button--positive');
  button.appendChild(document.createTextNode(text));
  button.addEventListener('click', () => {
    button.disabled = true;
    callback();
  });
  return button;
}


function createColumn(num, node) {
  const column = document.createElement('div');
  column.classList.add('col-'+num);
  column.appendChild(node);
  return column;
}


function createRow(cls, ...columns) {
  const row = document.createElement('div');
  row.classList.add(cls, 'row');
  columns.forEach(column => {
    row.appendChild(column);
  });
  const root = document.getElementById('root');
  root.appendChild(row);
  return row;
}


main();
