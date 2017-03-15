import React, { Component } from 'react';
import './App.css';
import UserInput from './UserInput';
import Footer from './Footer';
// import Date from './Date';

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
          <UserInput/>
          {/* <p className="date"></p> */}




        {/* <Date/> */}

          <Footer/>
    </div>

    );
  }
}

export default App;
