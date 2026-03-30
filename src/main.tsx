import { render } from 'preact'
import 'reactflow/dist/style.css'
import './index.css'
import { App } from './app.tsx'

render(<App />, document.getElementById('app')!)
