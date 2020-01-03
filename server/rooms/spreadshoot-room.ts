import { Room } from "colyseus";

export class SpreadshootRoom extends Room {
    
    // Faire des essais...
    maxClients = 4;

    onCreate (options) {
        console.log("Spreadshoot Room created!", options);
    }

    onJoin (client) {
        this.broadcast(`${ client.sessionId } joined.`);
    }

    onLeave (client) {
        this.broadcast(`${ client.sessionId } left.`);
    }

    // TODO: gestion deplacements
    onMessage (client, data) {
        console.log("BasicRoom received message from", client.sessionId, ":", data);
        this.broadcast(`(${ client.sessionId }) ${ data.message }`);
    }

    onDispose () {
        console.log("Dispose BasicRoom");
    }

}
