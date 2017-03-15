import React, { Component } from 'react';
import axios from 'axios';


export default class UserInput extends Component {
  constructor(props) {
    super(props)
    this.state = {
      value: '',
      forecast: {},
    }

    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleChange = this.handleChange.bind(this);



  }

    handleSubmit(event) {
      event.preventDefault();
    }

    handleChange(event) {
      this.setState({value: event.target.value});
  }

    componentWillMount() {
        axios.get('http://api.openweathermap.org/data/2.5/weather?zip=97231,us&APPID=313186e768d1b0e1e4e192f966703b6e')
        .then((response) => {
          console.log(response.data.weather[0].description);
          this.setState ({
            forecast : {
              // main: response.weather[0].main,
              description: response.data.weather[0].description,
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
        <h1>{this.state.forecast.description}</h1>
      </div>
        <form className="input" onSubmit={this.handleSubmit}>
          <label>
            Enter Your Zipcode
            <br></br>
            <input type="text" value={this.state.value} onChange={this.handleChange} />
          </label>
          <input type="submit" value="Submit" />
        </form>
        </div>
      );

    }
}
