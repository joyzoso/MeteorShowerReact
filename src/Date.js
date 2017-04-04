import React, { Component } from 'react';
import Moment from 'moment';
import { showers } from './Constants';

export default class Date extends Component {


  determineShower(sampleShower, currentMonth) {
      if (currentMonth === sampleShower[0].startMonth || currentMonth === sampleShower[0].endMonth) {
        return sampleShower[0].event;
      }

    }


    render() {
        let date = Moment();
        let formattedDate = Moment(date).format('MMMM Do YYYY, h:mm a')

        // showers - compare the current month with the list of showers
        let sampleShower = [{date: "April",
                            event: "Lyrids",
                            peak: "4/11 - 4/22",
                            startMonth: 3,
                            endMonth: 3}
                      ];

        let currentMonth = date.month();


        // let showerMonth = Moment().set('month', 'April')
        console.log(currentMonth);




             return(
                // is is the local current time? need more moment mumbo jumbo for that
               <div className="date">
                  <p>The local current time is {formattedDate}</p>
                  <p> The next upcoming event will be ...{this.determineShower(sampleShower, currentMonth)} </p>
               </div>
                 )
    }


}

// so this is where I would want to have the date object pull the corresponding month and display the next event(s)
// but along with that I also want a modal to have separate information, so should I have the Modal (or whatever)
// component deal with that logic or have it here in the date component? hmmmm
