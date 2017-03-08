import React, { Component } from 'react';


export default class UserInput extends Component {
  constructor(props) {
    super(props)
    this.state = {
      value: '',
      forecast: {
        forecast: []
      },
    }

    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.setWeather = this.setWeather.bind(this);

  }

    handleSubmit(event) {
      // this.setState({value: event.target.value});
      event.preventDefault();
    }

    handleChange(event) {
      this.setState({value: event.target.value});
  }

  getWeather () {
    let self = this;
    let URL = 'http://api.openweathermap.org/data/2.5/weather?zip=97231,us&APPID=313186e768d1b0e1e4e192f966703b6e'
    fetch(URL)
    .then(function (response) {
      if (response.status !== 200) {
      console.log('oopsies. Status Code: ' + response.status);
      return;
    }
    response.json().then(function(data) {
      self.setWeather(data);
    });
  })
  .catch (function (error) {
    console.log('Get Error : -S', error);
  });
}

  setWeather(forecast) {
    this.setState({
      forecast: forecast
    });
  }

  componentWillMount() {
    this.getWeather();
  }

//http://stackoverflow.com/questions/39436025/accessing-object-attributes-in-the-react-render-method/39436150///



    render() {
      const { forecast } = this.state;
      return (

      <div>
        <div>
        <h1>{forecast.name}</h1>
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
