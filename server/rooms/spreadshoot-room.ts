import { Room } from "colyseus";
import { Schema, MapSchema, type } from "@colyseus/schema";

// limites du tableau
const bounds = {
  // min, max, range
  'x': [0, 4, 5],
  'y': [0, 8, 9]
};

const MIN_ROW_NUMBER = 1; // 0 = ligne du header
const MAX_ROW_NUMBER = 8;
const TABLE_WIDTH = 5;

let availableNameIds = [0, 1, 2, 3, 4];

// Reference: https://docs.colyseus.io/state/schema/
class Entity extends Schema {
  @type("number")
  x: number = 0;

  @type("number")
  y: number = 0;
}

class Player extends Entity {
  @type("boolean")
  connected: boolean = true;
  
  @type("boolean")
  dead: boolean = false;
  
  @type("number")
  score: number = 0;
  
  @type("number")
  deaths: number = 0;
  
  @type("number")
  nameId: number = 0;
}

class State extends Schema {
    @type({ map: Entity })
    entities = new MapSchema<Player>();
}

export class SpreadshootRoom extends Room {
    
    maxClients = 4;
  
    onCreate (options) {
      this.setState(new State());
      console.log('State set', this.state);
      console.log("Spreadshoot Room created!", options);
    }

    onJoin (client) {
      // Add player
      this.broadcast(`${ client.sessionId } joined.`);
      console.log(this.state)
      
      if(availableNameIds.length < 1){
        availableNameIds = [0, 1, 2, 3, 4];
      }
      let playerNameId = availableNameIds.splice(Math.floor(Math.random() * availableNameIds.length), 1)[0];
      console.log('Name id will be', playerNameId);
      this.state.entities[client.sessionId] = new Player({x: 1, nameId: playerNameId});
      this.state.entities[client.sessionId].nameId = playerNameId;
      
      this.send(client, { message: "You won!" });
    }

    onLeave (client) {
      this.broadcast(`${ client.sessionId } left.`);
      delete this.state.entities[client.sessionId];
    }
    
    getNewPosition (entity, axis, factor, steps = 1) {
      let newPos = entity[axis] + (factor * steps);
      
      // under limit?
      if(newPos < bounds[axis][0]){
        newPos += bounds[axis][2];
        
      // exceeds limit?
      }else if(newPos > bounds[axis][1]){
        newPos -= bounds[axis][2];
      }
      console.log('New position:', newPos);
      return newPos;
    }
    
    respawn(deadPlayerId){
      console.log('Respawning', deadPlayerId);
      this.state.entities[deadPlayerId].x = 0;
      this.state.entities[deadPlayerId].y = 0;
      this.state.entities[deadPlayerId].dead = false;
    }
    
    didCollide(invaderId, x, y) {
      for (var i in this.state.entities){
        if ( i != invaderId && !this.state.entities[i].dead ) { // check if same player && not waiting to respawn
          if ( this.state.entities[i].x == x && this.state.entities[i].y == y ){
            // Attrapé!!
            console.log('Player', i, 'INVADED!');
            this.state.entities[i].dead = true;
            this.state.entities[i].deaths += 1;
            this.state.entities[invaderId].score += 1;
            
            setTimeout(() => { this.respawn(i) }, 2000);
          }
        }
      }
    }
    
    // TODO: gestion deplacements
    onMessage (client, data) {
        console.log("Message from", client.sessionId, ":", data);
        this.send(client, { message: "You won!" });
        
        if(this.state.entities[client.sessionId].dead){
          return;
        }
        
        if('keycode' in data){
          if(data['keycode'] == 37){
            // left
            this.state.entities[client.sessionId].x = this.getNewPosition(this.state.entities[client.sessionId], 'x', -1);;
          }else if(data['keycode'] == 38){
            // up
            this.state.entities[client.sessionId].y = this.getNewPosition(this.state.entities[client.sessionId], 'y', -1);
          }else if(data['keycode'] == 39){
            console.log('right')
            // right
            this.state.entities[client.sessionId].x = this.getNewPosition(this.state.entities[client.sessionId], 'x', 1);
          }else if(data['keycode'] == 40){
            // down
            this.state.entities[client.sessionId].y = this.getNewPosition(this.state.entities[client.sessionId], 'y', 1);
          }
          console.log('Player position is now', this.state.entities[client.sessionId].x, ',', this.state.entities[client.sessionId].y)
          this.didCollide(client.sessionId, this.state.entities[client.sessionId].x, this.state.entities[client.sessionId].y);
        }
        
        this.broadcast(`(${ client.sessionId }) ${ data.message }`);
    }

    onDispose () {
        console.log("Dispose BasicRoom");
    }

}
