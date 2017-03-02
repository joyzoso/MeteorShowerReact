import React, { Component } from 'react';


export default class UserInput extends Component {
  constructor(props) {
    super(props)
    this.state = {value: ''};


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

    render() {
      return (
        <form className="input" onSubmit={this.handleSubmit}>
          <label>
            Enter Your Zipcode
            <br></br>
            <input type="text" value={this.state.value} onChange={this.handleChange} />
          </label>
          <input type="submit" value="Submit" />
        </form>

      );
    }

}
