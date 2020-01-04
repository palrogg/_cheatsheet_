import React from 'react';
// import {render, findDOMNode} from 'react-dom';
import { HotTable } from '@handsontable/react';
import Handsontable from 'handsontable';

import { Buffer } from "buffer";
import * as Colyseus from "colyseus.js";

import './App.css';

global.Buffer = Buffer;
const debug = true;

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      name: 'Roger',
      playerId: 'en attente',
      roomId: 'en attente'
    };
    
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
    this.playerId = 'en attente';
    
    this.players = [];
    this.hotSettings = {
       data: this.data,
       colHeaders: true,
       rowHeaders: true,
       selectionMode: 'single',
       licenseKey: 'non-commercial-and-evaluation'
     };
    this.hotTableComponent = React.createRef();
    
    // On se connecte au Colyseus server
    const endpoint = 'ws://localhost:2567';
    const client = new Colyseus.Client(endpoint);
    
    let sendMessage = function(keycode){ console.log('Send message: no room joined yet') };
    const sendKey = function(e){
      // on envoie le key code si >= 37 et <= 40 (fleches)
      if(e.keyCode >= 37 && e.keyCode <= 40){
        e.stopImmediatePropagation();
        sendMessage(e.keyCode);
        
        // pour laisser un “trail”
        // this.setCellMeta(this.getSelected()[0][0], this.getSelected()[0][1], 'className', 'c-trail'); 
        // this.render()
      }
    };
    
    
    client.joinOrCreate("spreadshoot").then(room => {
      console.log("joined, room id: " + room.id + ", sess id: " + room.sessionId );
      this.setState({'playerId': room.sessionId, 'roomId': room.id});
      
      console.log("Table size: ", this.data.length, this.data[0].length);
      
      sendMessage = function(keycode){
        room.send({ keycode: keycode });
      }
      
      console.log('Len', room.state.entities.length, room.state.entities)
      
      room.state.entities.onAdd = (entity, sessionId: string) => {
          // is current player
          if (sessionId === room.sessionId) {
            console.log('entity add: this is me!')
            this.hotTableComponent.current.hotInstance.selectCell(entity.y, entity.x);
          }else{
            // enemy: we draw him
            console.log('entity add: other player')
            this.hotTableComponent.current.hotInstance.setCellMeta(entity.y, entity.x, 'className', 'c-enemy ' + sessionId);
            this.hotTableComponent.current.hotInstance.render()
          }
          
          entity.onChange = (changes) => {
            if (sessionId === room.sessionId) {
              // Player moved
              this.hotTableComponent.current.hotInstance.selectCell(entity.y, entity.x);
            }else{
              // Enemy moved
              console.log('Enemy moved')
              this.hotTableComponent.current.hotInstance.setCellMeta(entity.y, entity.x, 'className', 'c-enemy');
            }
          }
      };
    }).catch(e => {
      console.error("join error", e);
      // TODO: message d’erreur pour utilisateur + invitation à refresh (pour 1e version)
    });
    
    // On ecoute les keyboard events
    Handsontable.hooks.add('beforeKeyDown', sendKey);
  }
  
  
  
  render() {
    let debugBox;
    if(debug && this.playerId){
      debugBox = 'Player id: ' + this.state.playerId + ', room id: ' + this.state.roomId;
    }else{
      debugBox = '';
    }
    console.log(this.props)
    return (
      <div className="main">
        <h2><img className="logo" src="logo-400.png" alt="logo" /> Vacances 2020</h2>
        <p>Vous êtes <b>{this.state.name}</b>.</p>
        <p>[{debugBox}]</p>
        <HotTable ref={this.hotTableComponent} id={this.id} settings={this.hotSettings} tabIndex="0"  />
      </div>
    )
  }
}
export default App;
