// Copyright 2018 Canonical Ltd.
// Licensed under the LGPLv3, see LICENCE.txt file for details.

'use strict';


const WebSocket = require('websocket').w3cwebsocket;
const bakery = require('macaroon-bakery');
// Bakery uses btoa and MLHttpRequest.
global.btoa = require('btoa');
global.XMLHttpRequest = require('xhr2');

const monitor = require('../monitor');
const checkers = require('../checkers');


async function main() {
  const options = {
    debug: false,
    facades: [
      require('jujulib/api/facades/application-v5'),
      require('jujulib/api/facades/client-v1'),
      require('jujulib/api/facades/model-manager-v4')
    ],
    wsclass: WebSocket,
    bakery: new bakery.Bakery({
      visitPage: resp => console.log('visit this URL to login:', resp.Info.VisitURL)
    })
  };
  const checklist = [checkers.checkModel, checkers.checkUnits, checkers.checkJujushell];
  try {
    await monitor('wss://jimm.jujucharms.com:443/api', options, checklist, new UI());
  } catch (err) {
    console.log(err);
    process.exit(1);
  }
  process.exit(0);
}


class UI {

  withContext(_) {
    return this;
  }

  log(msg) {
    console.log(msg);
  }

  info(msg) {
    console.info(msg);
  }

  error(msg) {
    console.error(msg);
  }

  addAction(text, callback) {
    console.log('addAction not implemented');
  }

  addLink(text, href) {
    console.info(`${text} --> click <${href}>`);
  }

  refresh() {
    console.log('refresh not implemented');
  }
}


main();
