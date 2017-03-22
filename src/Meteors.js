import React, { Component } from 'react';
import './App.css';


export default class Meteors extends Component {
  constructor(props) {
    super(props);

    this.state ={
      date: '',
      event: [
        {month: "January", event:
        [
          {time: "January 21", event: "Perseids"},
          {time: "January 21", event: "Perseids"},
          {time: "January 21", event: "Perseids"},
          {time: "January 21", event: "Perseids"},
          {time: "January 21", event: "Perseids"},
        ]
    }
  ]
}
}
render() {
  return (
  <div>
    {this.state.event.map((event, index) => {
      <p>
        {date.event}
      </p>
    })}
  </div>
)}
}
