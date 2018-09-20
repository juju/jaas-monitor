// Copyright 2018 Canonical Ltd.
// Licensed under the LGPLv3, see LICENCE.txt file for details.

'use strict';

class Note {
  constructor(key) {
    this.key = key;
    this.logs = [];
    this.infos = [];
    this.errors = [];
    this.actions = [];
    this.links = [];
  }
}

class UI {
  constructor(addNote, addLog, ctx = {}) {
    this._ctx = ctx;
    const parts = [];
    if (ctx.model) {
      parts.push(ctx.model);
    }
    if (ctx.checker) {
      parts.push(ctx.checker);
    }
    this._note = new Note(parts.join('-'));
    this._addNote = addNote;
    this._addLog = addLog;
  }

  withContext(ctx) {
    const newContext = Object.assign({}, this._ctx, ctx);
    return new UI(this._addNote, this._addLog, newContext);
  }

  log(msg) {
    this._addLog(msg);
  }

  info(msg) {
    this._note.infos.push(msg);
    this._addNote(this._note);
  }

  error(msg) {
    this._note.errors.push(msg);
    this._addNote(this._note);
  }

  addAction(text, callback) {
    this._note.actions.push({text, callback});
    this._addNote(this._note);
  }

  addLink(text, href) {
    this._note.links.push({text, href});
    this._addNote(this._note);
  }

  refresh() {
    this._note = new Note(this._note.key);
    this._addNote(this._note);
  }
}

module.exports = {Note, UI};
