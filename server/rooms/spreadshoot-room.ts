import { Room } from "colyseus";
import { Schema, MapSchema, type } from "@colyseus/schema";

const bounds = {
  // min, max, range
  'x': [0, 4, 5],
  'y': [0, 8, 9]
};

const MIN_ROW_NUMBER = 1; // 0 = ligne du header
const MAX_ROW_NUMBER = 8;
const TABLE_WIDTH = 5;
const COLORS = ['red', 'green', 'blue', 'orange', 'purple'];

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
  
  @type("number")
  colorId: 0;
}

class State extends Schema {
    @type({ map: Entity })
    entities = new MapSchema<Player>();
}

export class SpreadshootRoom extends Room {
    
    // Faire des essais...
    maxClients = 4;
    // this.tableHeight = 9;

  
    onCreate (options) {
      this.setState(new State());
      console.log('State set', this.state);
      console.log("Spreadshoot Room created!", options);
    }

    onJoin (client) {
      // Add player
      this.broadcast(`${ client.sessionId } joined.`);
      console.log(this.state)
      this.state.entities[client.sessionId] = new Player();
      // this.state.entities.push(new Player(0, 0));
    }

    onLeave (client) {
        this.broadcast(`${ client.sessionId } left.`);
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
    
    didCollide() {
      // TODO
    }
    
    // TODO: gestion deplacements
    onMessage (client, data) {
        console.log("Message from", client.sessionId, ":", data);
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
        }
        
        this.broadcast(`(${ client.sessionId }) ${ data.message }`);
    }

    onDispose () {
        console.log("Dispose BasicRoom");
    }

}
