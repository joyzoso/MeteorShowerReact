import React, { Component } from 'react';
import Moment from 'moment';
import { SHOWERS } from './Constants';

export default class Date extends Component {
  constructor(props) {
    super(props);

    this.state = SHOWERS;
  }

  determineShower(SHOWERS, currentMonth) {
    let showers = this.state.showers

    // Use the currentMonth (a string) to find the corresponsing events
    if (currentMonth === SHOWERS[0].date) {
      return SHOWERS[0].event;
      //this is what we had before
      // if (currentMonth === sampleShower[0].startMonth || currentMonth === sampleShower[0].endMonth) {
      //   return sampleShower[0].event;
      }

    }
    render() {
        let date = Moment();
        let showers = this.state.showers



        // let formattedDate = Moment().set('month', 4);
        // let currentMonth = Moment().set('month', 4);
        let formattedDate = Moment(date).format('MMMM Do YYYY, h:mm a')
        // showers - compare the current month with the list of showers
        let sampleShower = [{date: "April",
                            event: "Lyrids",
                            peak: "4/11 - 4/22",
                            startMonth: 3,
                            endMonth: 3}
                      ];

        let currentMonth = date.format('MMMM');
        // let currentMonth = formattedDate;
          // let currentMonth = date.format('MMMM',4);
        // let showerMonth = Moment().set('month', '4');
        // let testMonth = Moment().set('month', 4);


        // let showerMonth = Moment().set('month', 'April')
        console.log(currentMonth);




             return(
                // is is the local current time? need more moment mumbo jumbo for that
               <div className="date">
                  <p>The local current time is {formattedDate}</p>
                  <p> The next upcoming event will be ...{this.determineShower(showers, currentMonth)} </p>
               </div>
                 )
    }


}

// so this is where I would want to have the date object pull the corresponding month and display the next event(s)
// but along with that I also want a modal to have separate information, so should I have the Modal (or whatever)
// component deal with that logic or have it here in the date component? hmmmm
