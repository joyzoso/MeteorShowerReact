import React, { Component } from 'react';


export default class UserInput extends Component {
  constructor(props) {
    super(props)
    this.state = {
      value: '',
      data: null};


    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleChange = this.handleChange.bind(this);

  }

    handleSubmit(event) {
      // this.setState({value: event.target.value});
      event.preventDefault();
    }

    handleChange(event) {
      this.setState({value: event.target.value});
  }

  componentDidMount() {
    let URL = 'http://api.openweathermap.org/data/2.5/weather?zip=97231,us&APPID=313186e768d1b0e1e4e192f966703b6e'
    fetch(URL)
    .then((response) => response.json())
    .then((json) => this.setState({data: json.weather.description})

  )}

//http://stackoverflow.com/questions/39436025/accessing-object-attributes-in-the-react-render-method/39436150///



    render() {
      return(
      <div>
        <form className="input" onSubmit={this.handleSubmit}>
          <label>
            Enter Your Zipcode
            <br></br>
            <input type="text" value={this.state.value} onChange={this.handleChange} />
          </label>
          <input type="submit" value="Submit" />

            <p>{this.state.data}</p>
        </form>
        </div>
      );

    }
}
