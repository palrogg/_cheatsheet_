import React, { Suspense } from 'react';
// import {render, findDOMNode} from 'react-dom';
import { HotTable } from '@handsontable/react';
import Handsontable from 'handsontable';
import { useTranslation, Trans, Translation, withTranslation } from 'react-i18next';
import i18n from 'i18next';

import { Buffer } from "buffer";
import * as Colyseus from "colyseus.js";

import './App.css';

global.Buffer = Buffer;
const debug = true;
const ENDPOINT = (process.env.NODE_ENV==="development")
    ? "ws://localhost:2567"
    : "ws://dogfight.tcch.ch:2567";

const NAME_LIST = ['Dominique', 'Roger', 'Claude', 'Chantal', 'Alfred'];
const COLOR_LIST = ['red', 'green', 'blue', 'orange', 'purple'];

class Spreadshoot extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      name: 'Roger',
      playerId: 'en attente',
      roomId: 'en attente',
      enemies: [],
      dead: false,
      score: 0,
      deaths: 0
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
    this.hotSettings = {
       data: this.data,
       colHeaders: true,
       rowHeaders: true,
       rowHeights: 24,
       // disableVisualSelection: true,
       // rowWidths: 500,
       // manualColumnResize: true,
       // manualRowResize: true,
       selectionMode: 'single',
       licenseKey: 'non-commercial-and-evaluation'
     };
    this.hotTableComponent = React.createRef();
    
    // On se connecte au Colyseus server
    const client = new Colyseus.Client(ENDPOINT);
    
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
      
      room.state.entities.onAdd = (entity, sessionId: string) => {
          // is current player
          if (sessionId === room.sessionId) {
            console.log('entity add: this is me!')
            this.hotTableComponent.current.hotInstance.selectCell(entity.y, entity.x);
          }else{
            // enemy: we draw him
            console.log('entity add: other player')
            this.hotTableComponent.current.hotInstance.setCellMeta(entity.y, entity.x, 'className', 'c-enemy');
            this.hotTableComponent.current.hotInstance.render()
            
            console.log(entity);
            this.setState(prevState => ({
              enemies: [...prevState.enemies,
                {
                  x: entity.x,
                  y: entity.y,
                  playerId: sessionId,
                  score: entity.score
                }
              ]
            }));
          }
          
          entity.onChange = (changes) => {
            if (sessionId === room.sessionId) {
              // Player moved
              this.hotTableComponent.current.hotInstance.selectCell(entity.y, entity.x);
              this.setState({score: entity.score, dead: entity.dead, deaths: entity.deaths});
              
              // Mort du joueur
              if(entity.dead){
                this.hotTableComponent.current.hotInstance.setDataAtCell(entity.y, entity.x, "† Perdu †");
              }
            }else{
              // Enemy moved
              console.log('Enemy moved')
              let newEnemies = Object.assign({}, this.state.enemies);
              
              for (var i in newEnemies) {
                if(newEnemies[i]['playerId'] === sessionId){
                  console.log('before', newEnemies[i])
                  
                  // dirty but easy
                  this.hotTableComponent.current.hotInstance.setCellMeta(newEnemies[i].y, newEnemies[i].x, 'className', '');
                  this.hotTableComponent.current.hotInstance.render();
                                    
                  newEnemies[i].x = entity.x;
                  newEnemies[i].y = entity.y;
                  console.log('after', newEnemies[i])
                  break;
                }
              }
              // this.setState({enemies: newEnemies});
              
              // for dirty debug
              this.hotTableComponent.current.hotInstance.setCellMeta(entity.y, entity.x, 'className', 'c-enemy');
              this.hotTableComponent.current.hotInstance.render();
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
    // TODO: le nom de l’enemi / tout remanier
    /*function EnemyCell({ x = 0, y = 0, name = 'Andrew' }) {
      let style = {
        left: 50 * y + (Math.random()*5),
        top: 24 * x
      };
      return (
        <div className="enemyCell" style={style}>
        Raoul
        </div>
      )
    }*/
    
    let debugBox;
    if(debug){
      debugBox = 'Player id: ' + this.state.playerId + ', room id: ' + this.state.roomId + ', enemies: ' + this.state.enemies.length;
    }else{
      debugBox = '';
    }
    
    // const EnemyCell = ;
    
    return (
      <div className="main">
        
        <h2><img className="logo" src="logo-400.png" alt="logo" /> <Trans i18nKey="spreadsheet_title" /></h2>
        
        <section className='section_language'>
            <Translation>
              {
                (t, { i18n }) => (
                  <div>
                    <button onClick={() => i18n.changeLanguage('en')}>en</button>
                    <button onClick={() => i18n.changeLanguage('fr')}>fr</button>
                  </div>
                )
              }
            </Translation>
          </section>
        <p><Trans i18nKey="short_instruction" /></p>
        
        <p><Trans i18nKey="you_are" /> <b>{this.state.name}</b>. <Trans i18nKey="your_score" />: {this.state.score} <Trans i18nKey="points" />. <Trans i18nKey="you_are" /> {this.state.dead ? <Trans i18nKey="dead" /> : <Trans i18nKey="alive" />}.</p>
        <p>[{debugBox}]</p>
        <div className="tableContainer">
          {/*<div className="enemyLayer">
              {this.state.enemies.length > 0 ? this.state.enemies.map(function(item, index){
                    return <EnemyCell key={index} x={item.x} y={item.y} enemyId={item.id} />;
              }): ''}
          </div>*/}
          <HotTable ref={this.hotTableComponent} id={this.id} settings={this.hotSettings} tabIndex="0"  />
        </div>
      </div>
    );
  }
}
    
function Page() {
  useTranslation();
  const SpreadshootHOC = withTranslation()(Spreadshoot);
  return <SpreadshootHOC />
}
export default function App() {
  return (
    <Suspense fallback="loading">
      <Page />
    </Suspense>
  );
}
