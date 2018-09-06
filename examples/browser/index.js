// Copyright 2018 Canonical Ltd.
// Licensed under the LGPLv3, see LICENCE.txt file for details.

'use strict';


const bakery = require('macaroon-bakery');

const monitor = require('../../monitor.js');
const checkers = require('../../checkers.js');

async function main() {
  const options = {
    debug: false,
    facades: [
      require('jujulib/api/facades/application-v5.js'),
      require('jujulib/api/facades/client-v1.js'),
      require('jujulib/api/facades/model-manager-v4.js')
    ],
    bakery: new bakery.Bakery({
      visitPage: resp => console.log('visit this URL to login:', resp.Info.VisitURL)
    })
  };
  const checklist = [checkers.checkModel, checkers.checkUnits, checkers.checkJujushell];
  try {
    await monitor('wss://jimm.jujucharms.com:443/api', options, checklist, console);
  } catch (err) {
    console.log(err);
    process.exit(1);
  }
  process.exit(0);
}


main();
