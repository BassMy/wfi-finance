/**
 * @format
 */

import { AppRegistry } from 'react-native';
import App from './src/App.tsx';  // Ajoutez "src/"
import { name as appName } from './app.json';

AppRegistry.registerComponent(appName, () => App);