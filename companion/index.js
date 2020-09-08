import * as messaging from "messaging";
import { settingsStorage } from "settings";
import { geolocation } from "geolocation";
import * as cbor from "cbor";
import {DataMediator} from "./data-mediator.js";

var dataMediator = new DataMediator("be");

geolocation.getCurrentPosition(function(position) {
  //fetch closest stations and send to watch
   console.log(position.coords.latitude + ", " + position.coords.longitude);
});
// Message socket opens
messaging.peerSocket.onopen = () => {
  //console.log("Companion Socket Open");
  sendStations();
};

// Message socket closes
messaging.peerSocket.onclose = () => {
  //console.log("Companion Socket Closed");
};

messaging.peerSocket.onmessage = (evt) => {
  console.log("Event received in companion: " + JSON.stringify(evt.data));
  if (evt.data.action == "lookup") 
    sendDepartures(evt.data.from, evt.data.to);
};

// Send data to device using Messaging API
function sendDepartures(from, to) {
  dataMediator.subscribeToRoute(from, to, (results) => {
    if (messaging.peerSocket.readyState === messaging.peerSocket.OPEN) {
      messaging.peerSocket.send(results);
    }
  });
}

function sendStations() {
  let stations = [{name:"Gent Sint Pieters"},{name:"Brussels Central"},{name:"Brussels Midi"}, {name:"Antwerp Central"}, {name:"Namur"}];
  if (settingsStorage.getItem("stations")) {    
    let settingsStations = JSON.parse(settingsStorage.getItem("stations")).map((item) => {
                    return item.name;
                  });
    if (settingsStations.length > 1) 
      stations = settingsStations;
  }
  if (messaging.peerSocket.readyState === messaging.peerSocket.OPEN) {
    messaging.peerSocket.send({stations});
  }
}


settingsStorage.onchange = function(evt) {
  if (evt.key === "stations") {
      sendStations();
  }
};
