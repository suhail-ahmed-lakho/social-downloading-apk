import { registerRootComponent } from 'expo';

import { LogBox } from 'react-native';
import App from './App';

LogBox.ignoreLogs([
  'Due to changes in Androids permission requirements',
  'Due to changes in Android',
  "Can't open url:",
  "Can't open url: intent://",
  'SafeAreaView has been deprecated',
]);

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
