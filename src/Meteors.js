import React, { Component } from 'react';
import './App.css';
import { showers } from './Constants';


export default class Meteors extends Component {
  constructor(props) {
    super(props);

    this.state = showers;

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
