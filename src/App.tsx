import swissArmyKnife from './assets/SwissArmy.svg'
import knife from './assets/Knife.svg'
import saw from './assets/Saw.svg'
import bottleOpener from './assets/bottleopener.svg'
import scissors from './assets/Scissors.svg'
import headshot from './assets/Headshot.png'
import './App.css'
 
function App() {

  return (
    <div className='container'>
      <div className = "left-container">
          <a href="https://www.linkedin.com/in/brodieheginbotham/" target="_blank">
            <img src={headshot} className="logo" alt="headshot" />
          </a>
      </div>
      <div>
        <h1>Hello, my name is Brodie</h1>
        <h3>I'm a Sales Operations leader, and a GTM Swiss Army Knife</h3>
      <div className='knife-image'>
          <img src={knife}  className="knife svg tool" alt="knife" />
          <img src={saw}  className="saw svg tool" alt="saw" />
          <img src={scissors}  className="scissors svg tool" alt="scissors" />
          <img src={bottleOpener}  className="bottle-opener svg tool" alt="bottle opener" />
          <img src={swissArmyKnife}  className="swissArmy svg" alt="swiss army knife" />
      </div>
      </div>
    </div>
  )
}

export default App
