import React, { Component } from 'react';
import Moment from 'moment';
 
export default class Date extends Component {
 

    render() {
        let date = Moment();
        let formattedDate = Moment(date).format('MMMM Do YYYY, h:mm a')
         
             return(
                // is is the local current time? need more moment mumbo jumbo for that
               <div className="date">
                  <p>The local current time is {formattedDate}</p>
                  <p> The next upcoming event will be ... </p>
               </div>
                 )
    }
}

// so this is where I would want to have the date object pull the corresponding month and display the next event(s)
// but along with that I also want a modal to have separate information, so should I have the Modal (or whatever) 
// component deal with that logic or have it here in the date component? hmmmm




