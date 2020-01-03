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
    
    // We connect to the Colyseus server
    const endpoint = 'ws://localhost:2567';
    const client = new Colyseus.Client(endpoint);
    
    const myCallback = function(){ console.log('send move msg!'); };
    Handsontable.hooks.add('afterDocumentKeyDown', myCallback);
    
    client.joinOrCreate("chat").then(room => {
      console.log("joined, room id: " + room.id + ", sess id: " + room.sessionId );
      room.onStateChange.once(function(state) {
        console.log("initial room state:", state);
      });
    });
    
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
  }
  
  // TODO: find appropriate hook
  // afterDocumentKeyDown

  
  handleKeyPress = (event) => {
    //  getCell(row, column, topmost)
    
    console.log(event.key);
    console.log('sadfadsffads')
    if(event.key === 'Enter'){
      console.log('enter press here! ')
    }
  }

  render() {
    const settings = {licenseKey: 'non-commercial-and-evaluation'}
    return (<HotTable onKeyPress={this.handleKeyPress} onKeyDown={this.handleKeyPress} data={this.data} settings={settings} colHeaders={true} rowHeaders={true} width="600" height="300" tabIndex="0" />);
  }
}
export default App;
