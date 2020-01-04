import { Room } from "colyseus";
import { Schema, MapSchema, type } from "@colyseus/schema";

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
}

class State extends Schema {
    @type({ map: Entity })
    players = new MapSchema<Player>();
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
      // this.state.entities[client.sessionId] = new Player();
      // this.state.entities.push(new Player(0, 0));
    }

    onLeave (client) {
        this.broadcast(`${ client.sessionId } left.`);
    }

    // TODO: gestion deplacements
    onMessage (client, data) {
        console.log("Message from", client.sessionId, ":", data);
        if('keycode' in data){
          if(data['keycode'] == 37){
            console.log('left');
          }else if(data['keycode'] == 38){
            console.log('up')
          }else if(data['keycode'] == 39){
            console.log('right')
          }else if(data['keycode'] == 40){
            console.log('down')
          }
        }
        
        this.broadcast(`(${ client.sessionId }) ${ data.message }`);
    }

    onDispose () {
        console.log("Dispose BasicRoom");
    }

}
