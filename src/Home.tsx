

import swissArmyKnife from './assets/SwissArmy.svg'
import knife from './assets/Knife.svg'
import saw from './assets/Saw.svg'
import bottleOpener from './assets/bottleopener.svg'
import scissors from './assets/Scissors.svg'
import headshot from './assets/Headshot.png'
import './App.css'
import { useState } from 'react'
 
function Home() {
  const defaultText: string = "Skills inside";
  const [text, setText] = useState(defaultText)
  const handleHover = (text: string) => {
    setText(text);
  }
  return (
    <div className='container'>
      <div className = "left-container">
          <a href="https://www.linkedin.com/in/brodieheginbotham/" target="_blank">
            <img src={headshot} className="logo" alt="headshot" />
          </a>
      </div>
      <div className='right-container'>
        <h1>Hello, my name is Brodie</h1>
        <h3 id="bio">I'm a Sales Operations leader, and a GTM Swiss Army Knife</h3>
      <div className='knife-image'>
          <div className='swissArmy-container'>
            <a data-text = "data text" href = "/revenue-operations" className = "tool-link knife svg" onMouseEnter={() => handleHover("Revenue Operations")} onMouseLeave={() => handleHover(defaultText)}>
              <img src={knife}  className="tool" alt="knife" />
            </a>
            <a data-text = "data text" href = "/sales-strategy" className = "svg saw tool-link" onMouseEnter={() => handleHover("Sales Strategy")} onMouseLeave={() => handleHover(defaultText)}>
              <img src={saw}  className="tool" alt="saw" />
            </a> 
            <a data-text = "data text" href = "/salesforce" className = "tool-link scissors svg"onMouseEnter={() => handleHover("Salesforce")} onMouseLeave={() => handleHover(defaultText)}>
              <img src={scissors}  className="tool" alt="scissors" />
            </a> 
            <a data-text = "data text" href = "/programming" className = "tool-link bottle-opener svg"onMouseEnter={() => handleHover("Programming")} onMouseLeave={() => handleHover(defaultText)}>
              <img src={bottleOpener}  className="tool" alt="bottle opener" />
            </a> 
            <img src={swissArmyKnife}  className="swissArmy svg" alt="swiss army knife" />
            <h2 className = "knife-text">{text}</h2>
          </div>
      </div>
      </div>
    </div>
  )
}

export default Home
