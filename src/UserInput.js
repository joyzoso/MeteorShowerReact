import React, { Component } from 'react';
import axios from 'axios';


export default class UserInput extends Component {
  constructor(props) {
    super(props)
    this.state = {
      value: '',
      zip: '',
      forecast: {},
      message: '',
    }

    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.handleInput = this.handleInput.bind(this);



  }

    handleSubmit(event) {
      event.preventDefault();
      console.log('dsds');
      this.setState({
        message: 'the current weather is'
      })
    }


    handleInput(event) {
      this.setState({
        zip: event.target.value
      });
    }


      handleChange() {
          axios.get('http://api.openweathermap.org/data/2.5/weather?zip=' + this.state.zip + ',us&APPID=313186e768d1b0e1e4e192f966703b6e')
          .then((response) => {
            console.log(response.data.weather[0].icon);
            this.setState ({
              forecast : {
                // main: response.weather[0].main,
                description: response.data.weather[0].description,
                icon: "http://openweathermap.org/img/w/" + response.data.weather[0].icon + ".png",
                // temp: response.main.temp
              }
              })
            })

          .catch((error) => {
            console.warn(error);
          })
        }




    render() {
      //only return below if you have forecast set in state
      if (!this.state) {
        return null;
      }

      // Why is this.state still undefined and trying to render everything below here
      return (
<div>
      <div>
        <div className="forecast">
          <h1>{this.state.message}</h1>
        <h1>{this.state.forecast.description}</h1>
        <img src={this.state.forecast.icon}/>

      </div>
        <form className="input" onSubmit={this.handleSubmit}>
          <label>
            Enter Your Zipcode
            <br></br>
            <input type="text" value={this.state.zip} onChange={this.handleInput} />
          </label>
          <button onClick={this.handleChange} value="Submit">Submit</button>
        </form>
        </div>
      </div>
      );

    }
}
