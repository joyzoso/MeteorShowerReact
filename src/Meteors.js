import React, { Component } from 'react';
import './App.css';



export default class Meteors extends Component {
  constructor(props) {
    super(props);

    this.state = {
      showers:[
          {date: "April", event: "Lyrids", peak: "4/11 - 4/22"},
          {date: "May", event: "Eta Aquarids", peak: "4/19 - 4/26"},
          {date: "July ", event: "Alpha Capricornids", peak: "7/26 - 7/27"},
          {date: "August", event: "Perseids", peak: "8/11 - 8/12"},
          {date: "October", event: "Southern Taurids", peak: "10/9 - 10/10"},
          {date: "October", event: "Orionids", peak: "10/21 - 10/22"},
          {date: "November", event: "Northern Taurids", peak: "11/10 - 11/11"},
          {date: "November", event: "Leonids", peak: "11/17 - 11/18"},
          {date: "December", event: "Geminids", peak: "12/13 - 12/14"},
          {date: "December", event: "Ursids", peak: "12/21 - 12/22"},

          ]
      }

      this.showShowers = this.showShowers.bind(this);

    }


    showShowers(showers) {
      this.setState({
        showers: {
          date: showers.date,
          event: showers.event,
          peak: showers.peak,
          }
      });
    }


//probably unnecessary breaks for the table below and on lines 52, 53 aka find better way
    render() {
      let x = this.state.showers.map((showers, index) => (
            <tr><td>{showers.date}</td><br></br><td>{showers.event}</td><br></br><td>{showers.peak}</td></tr>
            ))
      return (
        <div className="fullTable">
          <table className="fullTable">
            <thead className="header">
              <tr>
                <td>Month</td><br></br>
                <td>Event</td><br></br>
                <td>Peak Dates</td>
               </tr>
            </thead>
            <tbody className="table">
            {x}
           </tbody>
          </table>
         </div>
    )
  }
}

