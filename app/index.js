import document from "document";
import * as messaging from "messaging";
import clock from "clock";
import { gettext } from "i18n";

const MAX_PANES = 5;
let departureTimes = [];
let textCountdown = [
  document.getElementById("countdown1"),
  document.getElementById("countdown2"),
  document.getElementById("countdown3"),
  document.getElementById("countdown4"),
  document.getElementById("countdown5")
];
let delays = [];
let textDelays = [
  document.getElementById("delay1"),
  document.getElementById("delay2"),
  document.getElementById("delay3"),
  document.getElementById("delay4"),
  document.getElementById("delay5")
];

let stations = [];
let fromStationId = 0;
let toStationId = 1;

function pad(number) {
  if (number < 10) {
    return '0' + number;
  }
  return number;
}

function timeFormatTopPane (date) {
  return date.getUTCFullYear() +
        '-' + pad(date.getMonth() + 1) +
        '-' + pad(date.getDate()) +
        '         ' + pad(date.getHours()) +
        ':' + pad(date.getMinutes());
}

//show time in the pane
document.getElementById("text-date-and-time").text = timeFormatTopPane(new Date());

clock.granularity = "seconds";
clock.ontick = (evt) => {
  let currentTime = evt.date;
  for (let i in departureTimes) {
    let index = parseInt(i)+1;
    let departureTime = departureTimes[i];
    let duration = (departureTime.getTime() - currentTime.getTime())/1000;
    let durationString = formatDuration(duration);
    if (duration >= 0)
      textCountdown[i].text = durationString;
    else if (parseInt(delays[i]) > 0) {
      textCountdown[i].text = "Delayed";
      let delayString = formatDuration(parseInt(delays[i]) + duration);
      if (delayString)
        textDelays[i].text = delayString;
      else
        textDelays[i].text = "~";//TODO: other effect when delay hits zero?
    } else {
      textCountdown[i].text = "~";//TODO: other effect when time hits zero?
    }
    //update time
    if (evt.date.getSeconds() == 0) {
      document.getElementById("text-date-and-time").text = timeFormatTopPane(evt.date);
    }
  }
}

function formatDuration (sec_num) {
  if (sec_num < 0) {
    return false;
  }
  var hours   = Math.floor(sec_num / 3600);
  var minutes = Math.floor((sec_num - (hours * 3600)) / 60);
  var seconds = sec_num - (hours * 3600) - (minutes * 60);
 
  let result = "";
  if (hours > 0) {
    result += pad(hours)+':';
  }
  if (minutes > 0 || result != "") {
    result += pad(minutes) + ":";
  }
  return result + pad(seconds);
}

function formatTripDuration (min_num) {
  var hours   = Math.floor(min_num / 3600);
  var minutes = Math.floor((min_num - (hours * 3600)) / 60); 
  let result = "";
  if (hours > 0) {
    result += pad(hours)+'h';
  }
  if (minutes > 0 || result != "") {
    result += pad(minutes) + "'";
  }
  return result;
}

// Message is received
messaging.peerSocket.onmessage = evt => {
  console.log(`App received: ${JSON.stringify(evt)}`);
  if (evt.data.stations) {
    //Populate stations list from settings
    stations = evt.data.stations;
    launchLookup(stations[fromStationId], stations[toStationId]);
  } else if (evt.data.update) {
    populateResults(evt.data.update);
  } else {
    populateResults(evt.data);
    // Show the first pane
    let container = document.getElementById("container");
    container.value = 0;
    // Get the selected index
    //let currentIndex = container.value;
    // Set the selected index
  }
};

function populateResults(results) {
  document.getElementById("spinner").state = "disabled";
  departureTimes = [];
  delays = [];
  //populate all elements
  for (var i = 0; i < MAX_PANES && i < results.length; i++) {
    let index = i+1;
    let departure = results[i];
    let pane = document.getElementById("item"+index);
    pane.style.display = "inline";
    if (departure.delay) { 
      delays[i] = parseInt(departure.delay);
      if (delays[i] > 0) {
        let delay = formatDuration(departure.delay);
        textDelays[i].text = '+' + delay;
      } else if (departure.delay == 0) {
        textDelays[i].text = "";
      }
    }
    if (departure.platform)
      document.getElementById("platform-text-"+index).text = gettext('platform') + ' ' + departure.platform;
    if (departure.vias !== undefined) {
      for (let j = 0; j < 4; j++) {
        if (j < 3) {
          if (departure.vias == j) {
            document.getElementById(j + "-transfers-" + index).style.display = "inline";
          } else {
            document.getElementById(j + "-transfers-" + index).style.display = "none";
          }
        } else if (j === 4) {
          if (departure.vias >= 3) {
            document.getElementById("x-transfers-" + index).style.display = "inline";
          } else {
            document.getElementById("x-transfers-" + index).style.display = "none";
          }
        }
      }
      if (departure.duration) 
        document.getElementById("duration-text-"+index).text = gettext('duration') + ': ' + formatTripDuration(departure.duration);
    }
    if (departure.departureTime)
      departureTimes[i] = new Date(departure.departureTime*1000)
  }
}

function launchLookup(from, to) {
  // show spinner and hide panes
  document.getElementById("spinner").state = "enabled";
  for (var i = 0; i < MAX_PANES; i++) {
    let index = i+1;
    let pane = document.getElementById("item"+index);
    pane.style.display = "hidden";
  }
  departureTimes = [];
  delays = [];
  document.getElementById("txt-from").text = from;
  document.getElementById("txt-to").text = to;
  messaging.peerSocket.send({action: "lookup", from: from, to: to}); 
}

// Message socket opens
messaging.peerSocket.onopen = () => {
  console.log("App Socket Open");
};

// Message socket closes
messaging.peerSocket.onclose = () => {
  console.log("App Socket Closed");
};

document.getElementById('click-space-from').onclick = (a, evt) => {
  fromStationId ++;
  fromStationId %= stations.length;
  //Make sure origin and destination are not the same, unless there are only 2 in the lest, then swith them around
  if (fromStationId === toStationId) {
    if (stations.length === 2) {
      let helper = fromStationId;
      toStationId = fromStationId;
      fromStationId = helper;
    } else {
      fromStationId ++;
      fromStationId %= stations.length;
    }
  }
  launchLookup(stations[fromStationId], stations[toStationId]);
}

document.getElementById('click-space-to').onclick = (a, evt) => {
  toStationId ++;
  toStationId %= stations.length;
  //Make sure origin and destination are not the same, unless there are only 2 in the lest, then swith them around
  if (fromStationId === toStationId) {
    if (stations.length === 2) {
      let helper = fromStationId;
      toStationId = fromStationId;
      fromStationId = helper;
    } else {
      toStationId ++;
      toStationId %= stations.length;
    }
  }
  launchLookup(stations[fromStationId], stations[toStationId]);
}