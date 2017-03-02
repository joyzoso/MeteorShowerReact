import React, { Component } from 'react';
import './App.css';
import UserInput from './UserInput';

class App extends Component {
  render() {
    return (
      <div>
        <div className="App">
            <h2>METEOR SHOWER APP</h2>
          <p className="App-intro">
            METEOR SHOWER FUNTIME SENSATIONALISM
          </p>
        </div>
          <p className="input"></p>
          <UserInput/>
    </div>

    );
  }
}

export default App;
