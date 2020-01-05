import React, { Suspense } from 'react';
// import {render, findDOMNode} from 'react-dom';
import { HotTable } from '@handsontable/react';
import Handsontable from 'handsontable';
import { useTranslation, Trans, Translation, withTranslation } from 'react-i18next';

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
      name: '',
      playerId: 'en attente',
      roomId: 'en attente',
      nameId: 0,
      enemies: [],
      dead: false,
      score: 0,
      deaths: 0,
      servermessage: 'Server message: welcome',
      error: false
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
          if (!this.hotTableComponent.current){
            console.error('No current hotTable')
            this.error = 'Please reload the page';
            return;
          }
        
          // is current player
          if (sessionId === room.sessionId) {
            console.log('entity add: this is me!', NAME_LIST[entity.nameId]);
            console.log(entity);
            this.setState({name: NAME_LIST[entity.nameId], nameId: entity.nameId});
            this.hotTableComponent.current.hotInstance.selectCell(entity.y, entity.x);
          }else{
            // enemy: we draw him
            console.log('entity add: other player at position', entity.x, ',', entity.y, NAME_LIST[entity.nameId])
            
            this.setState({servermessage: NAME_LIST[entity.nameId] + ' joined the game!'})
            
            this.hotTableComponent.current.hotInstance.setCellMeta(entity.y, entity.x, 'className', 'c-enemy');
            this.hotTableComponent.current.hotInstance.render()
            
            this.setState(prevState => ({
              enemies: [...prevState.enemies,
                {
                  x: entity.x,
                  y: entity.y,
                  playerId: sessionId,
                  nameId: entity.nameId, // used for color and dummy name
                  score: entity.score
                }
              ]
            }));
          }
          
          entity.onChange = (changes) => {
            if (!this.hotTableComponent.current){
              console.error('No current hotTable')
              this.error = 'Please reload the page';
              return;
            }
            
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
                  
                  // clear enemy path -- dirty but easy
                  this.hotTableComponent.current.hotInstance.setCellMeta(newEnemies[i].y, newEnemies[i].x, 'className', '');
                  this.hotTableComponent.current.hotInstance.render();
                                    
                  newEnemies[i].x = entity.x;
                  newEnemies[i].y = entity.y;
                  console.log('after', newEnemies[i])
                  break;
                }
              }
              
              // Show enemies -- currently handsontable seems to erase it :/
              this.hotTableComponent.current.hotInstance.setCellMeta(entity.y, entity.x, 'className', 'c-enemy ' + COLOR_LIST[entity.nameId]);
              this.hotTableComponent.current.hotInstance.render();
            }
          }
      };
    }).catch(e => {
      this.setState({'error': 'error_cant_connect'});
      console.log("join error", e);
      // TODO: user-friendly error message
    });
    
    // On ecoute les keyboard events
    Handsontable.hooks.add('beforeKeyDown', sendKey);
  }
  
  render() {
    // TODO: show enemy name
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
    
    function ConnectedPlayers(props) {
      if (props.enemy_count > 0){
        return <p>{props.enemy_count + 1} <Trans i18nKey="connected_players" /></p>
      }else{
        return <p><Trans i18nKey="connected_alone" /></p>
      }
    }
    
    function ServerMessage(props) {
      if (props.message){
        return <p className="server_message">{props.message}</p>
      }else{
        return '';
      }
    }
    
    // const EnemyCell = ;
    
    return (
      <div className="main">
        <section className="header">
          <h1><img className="logo" src="logo-400.png" alt="Spreadshoot" /></h1>
          <h2><Trans i18nKey="spreadsheet_title" /><br /><span className="menu" title="nope"><Trans i18nKey="fake_menu" /></span></h2>
          
          <button className="share" title="nope"><Trans i18nKey="share" /></button>
          <div className='language_selection'>
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
            </div>
            <div className="clear" />
            </section>
              
            <hr className="separator" />
            
            <section className="body">
            <p><Trans i18nKey="short_instruction" /></p>
            
            <ConnectedPlayers enemy_count={this.state.enemies.length} />
            <ServerMessage message={this.state.servermessage} />
            {this.state.error ? <p className="error"><Trans i18nKey={this.state.error} /></p> : ''}
          
        <hr className="separator" />
        
          <p><Trans i18nKey="you_are" /> <b>{this.state.name}</b>. <Trans i18nKey="your_score" />: {this.state.score} <Trans i18nKey="points" />. <Trans i18nKey="you_are" /> {this.state.dead ? <b><Trans i18nKey="dead" /></b> : <Trans i18nKey="alive" />}.</p>
          <p>[{debugBox}]</p>
          <div className="tableContainer">
            {/*<div className="enemyLayer">
                {this.state.enemies.length > 0 ? this.state.enemies.map(function(item, index){
                      return <EnemyCell key={index} x={item.x} y={item.y} enemyId={item.id} />;
                }): ''}
            </div>*/}
            <HotTable ref={this.hotTableComponent} id={this.id} settings={this.hotSettings} tabIndex="0"  />
          </div>
        </section>
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
