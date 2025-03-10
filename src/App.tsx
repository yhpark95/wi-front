import React from 'react';
import './App.css';
import LinearChart from './charts/linear';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>Linear Chart Example</h1>
        <LinearChart />
      </header>
    </div>
  );
}

export default App;