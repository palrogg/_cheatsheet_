import React from 'react';
// import {render, findDOMNode} from 'react-dom';
import { HotTable } from '@handsontable/react';
import Handsontable from 'handsontable';

import { Buffer } from "buffer";
import * as Colyseus from "colyseus.js";

import './App.css';

global.Buffer = Buffer;

class App extends React.Component {
  constructor(props) {
    super(props);
    
    this.data = [
      ['Planning vacances 2020', 'Dominique', 'Roger', 'Claude', 'Chantal'],
      ['15 juin 2020', 0, 11, 12, 13],
      ['16 juin 2020', 0, 11, 14, 13],
      ['17 juin 2020', 0, 15, 12, 13],
      ['18 juin 2020', 0, 15, 12, 13],
      ['19 juin 2020', 0, 15, 12, 13],
      ['20 juin 2020', 1, 15, 12, 13],
      ['21 juin 2020', 0, 15, 12, 13],
      ['22 juin 2020', 0, 15, 12, 13]
    ];
    this.id = 'main';
    this.hotSettings = {
       data: this.data,
       colHeaders: true,
       rowHeaders: true,
       licenseKey: 'non-commercial-and-evaluation'
     };
    this.hotTableComponent = React.createRef();
    // We connect to the Colyseus server
    const endpoint = 'ws://localhost:2567';
    const client = new Colyseus.Client(endpoint);
    
    let sendMessage = function(keycode){ console.log('Send message: no room joined yet') };
    const sendKey = function(e){
      // on enverra le key code si code >= 37 <= 40
      console.log('key down: ' + e.key + ' | ' + e.code + ' | ' + e.keyCode);
      if(e.keyCode >= 37 && e.keyCode <= 40){
        // client.sendMessage(e.keyCode);
        sendMessage(e.keyCode);
        
        console.log('Current cell: ' + this.getSelected()[0][0] + ';' + this.getSelected()[0][1]);
        this.setCellMeta(2, 2, 'className', 'c-deeporange');
        this.setCellMeta(this.getSelected()[0][0], this.getSelected()[0][1], 'className', 'c-enemy');  
      }
    };
    
    
    client.joinOrCreate("spreadshoot").then(room => {
      console.log("joined, room id: " + room.id + ", sess id: " + room.sessionId );
      console.log("Table size: ", this.data.length, this.data[0].length);
      sendMessage = function(keycode){
        room.send({ keycode: keycode });
        console.log('msg sent')
      }
      
      room.onStateChange.once(function(state) {
        console.log("initial room state:", state);
      });
    }).catch(e => {
      console.error("join error", e);
      // TODO: message en clair pour utilisateur
    });
    
    // On ecoute les keyboard events
    Handsontable.hooks.add('afterDocumentKeyDown', sendKey);
  }
  
  render() {
    return (
      <div className="main">
        
        <h2><img className="logo" src="logo-400.png" alt="logo" /> Vacances 2020</h2>
        <HotTable ref={this.hotTableComponent} id={this.id} settings={this.hotSettings} tabIndex="0"  />
      </div>
    )
  }
}
export default App;
