import React, { Component } from 'react';
import Moment from 'moment';
import { SHOWERS } from './Constants';

export default class Date extends Component {
  constructor(props) {
    super(props);

    this.state = SHOWERS;
  }

  determineShower(showers, currentMonth) {
    let currentShowers = showers.filter(function(shower) {
      return shower.date === currentMonth;
    })
    return currentShowers
  }

  render() {
    let date = Moment();
    let showers = this.state.showers;
    let currentMonth = date.format('MMMM');
    let currentShowers = this.determineShower(showers, currentMonth)

    let formattedDate = Moment(date).format('MMMM Do YYYY, h:mm a')

    return(
        // todo, display all of the event names for the current showers, using a map
       <div className="date">
          <p>The local current time is {formattedDate}</p>
          <p> The next upcoming event will be ...{currentShowers[0].event} </p>
       </div>
    )
   }
}

// so this is where I would want to have the date object pull the corresponding month and display the next event(s)
// but along with that I also want a modal to have separate information, so should I have the Modal (or whatever)
// component deal with that logic or have it here in the date component? hmmmm
