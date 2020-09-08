import {NMBS} from "./data/be-nmbs.js";
import {NS} from "./data/nl-ns.js";

/**
 * Selects the right API for the right country,
 * makes available route planning and station lists.
 * It also subscribes to updates and only emits an update in the onChange method
 * when actually something changed.
 * Also cancels any on-going requests when a new look-up is done.
 */
export class DataMediator {
  
  constructor (country) {
    if (country == "be") {
      this.data = new NMBS();
    } else {
      this.data = new NS();
    }
    this.currentInterval = null;
  }
  
  async subscribeToRoute (from, to, callback) {
    //Cancel retrieving updates of another lookup
    if (this.currentInterval) {
      clearInterval(this.currentInterval);
    }
    //fetch connections first time
    this.previousResult = (await this.data.fetchConnections(from, to)).slice(0,5);//max 5 results
    
    callback(this.previousResult);
    this.currentInterval = setInterval(async () => {
      let freshResult = (await this.data.fetchConnections(from, to)).slice(0,5);//max 5 results
      if (JSON.stringify(freshResult) !== JSON.stringify(this.previousResult)) {
        console.log("Data update!");
        this.previousResult = freshResult;
        callback({update: freshResult});
      }
    }, 30000);
  }
};