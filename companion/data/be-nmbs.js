export class NMBS {
  
  fetchConnections (from, to) {
    let url = "https://api.irail.be/connections/?from=" + encodeURI(from) + "&to=" + encodeURI(to)  + "&format=json";
    console.log("HTTP Request to " + url)
    return fetch(url, {"User-Agent": "Train Down for FitBit/0.0.1 (https://pietercolpaert.be/)"}).then(async (res) => {
      let response = await res.json();
      let results = [];
      for (var connection of response.connection) {
        if (connection.canceled == "1")
          continue;
        let object = {delay: connection.departure.delay,
                      departureTime: connection.departure.time,
                      platform: connection.departure.platform,
                      trainid: connection.departure.vehicleinfo.shortname,
                      vias: connection.vias?connection.vias.number:0,
                      duration: connection.duration
                     };
        results.push(object);
      }
      return results;
    });
  }
         
};