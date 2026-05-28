import React, { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  NavigationContainer,
  useNavigationContainerRef,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import NfcManager, { NfcEvents } from 'react-native-nfc-manager';
import type { TagEvent } from 'react-native-nfc-manager';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import AppNavigator from './src/navigation/AppNavigator';
import QuickActionScreen from './src/screens/QuickActionScreen';
import ConnectionErrorScreen from './src/screens/ConnectionErrorScreen';
import { getSettings } from './src/storage/preferences';
import { pingSpoolman, setSpoolmanBaseUrl } from './src/api/spoolman';
import { setMoonrakerBaseUrl } from './src/api/moonraker';
import { parseNdefTag, getLaunchTag } from './src/nfc/reader';
import type { OpenSpoolTag, RootStackParamList } from './src/types';

const Root = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  const navigationRef = useNavigationContainerRef<RootStackParamList>();
  const [appReady, setAppReady] = useState(false);
  const [connectionError, setConnectionError] = useState(false);
  const [moonrakerConfigured, setMoonrakerConfigured] = useState(false);
  const pendingTagRef = useRef<OpenSpoolTag | null>(null);

  const checkConnection = useCallback(async () => {
    const settings = await getSettings();
    if (!settings.spoolmanUrl) {
      setConnectionError(false);
      setAppReady(true);
      return;
    }
    setSpoolmanBaseUrl(settings.spoolmanUrl);
    setMoonrakerBaseUrl(settings.moonrakerUrl);
    setMoonrakerConfigured(!!settings.moonrakerUrl);

    const ok = await pingSpoolman(settings.spoolmanUrl);
    setConnectionError(!ok);
    setAppReady(true);
  }, []);

  useEffect(() => {
    checkConnection();
  }, [checkConnection]);

  useEffect(() => {
    let mounted = true;

    NfcManager.start().catch(() => {});

    NfcManager.setEventListener(NfcEvents.DiscoverTag, (tag: TagEvent) => {
      if (!mounted) { return; }
      const parsed = parseNdefTag(tag);
      if (!parsed) { return; }
      if (navigationRef.isReady()) {
        navigationRef.navigate('QuickAction', { tag: parsed });
      } else {
        pendingTagRef.current = parsed;
      }
    });

    NfcManager.registerTagEvent().catch(() => {});

    getLaunchTag().then(tag => {
      if (!tag || !mounted) { return; }
      if (navigationRef.isReady()) {
        navigationRef.navigate('QuickAction', { tag });
      } else {
        pendingTagRef.current = tag;
      }
    });

    return () => {
      mounted = false;
      NfcManager.setEventListener(NfcEvents.DiscoverTag, null);
      NfcManager.unregisterTagEvent().catch(() => {});
    };
  }, [navigationRef]);

  const handleNavigatorReady = useCallback(() => {
    const pending = pendingTagRef.current;
    if (pending) {
      pendingTagRef.current = null;
      navigationRef.navigate('QuickAction', { tag: pending });
    }
  }, [navigationRef]);

  if (!appReady) {
    return <View style={styles.splash} />;
  }

  if (connectionError) {
    return (
      <ConnectionErrorScreen
        onRetry={checkConnection}
        onGoToSettings={() => {
          setConnectionError(false);
          setAppReady(true);
        }}
      />
    );
  }

  return (
    <GestureHandlerRootView style={styles.root}>
      <NavigationContainer ref={navigationRef} onReady={handleNavigatorReady}>
        <Root.Navigator screenOptions={{ headerShown: false }}>
          <Root.Screen name="Main" component={AppNavigator} />
          <Root.Screen
            name="QuickAction"
            options={{ presentation: 'modal', headerShown: false }}>
            {props => (
              <QuickActionScreen
                {...props}
                moonrakerConfigured={moonrakerConfigured}
              />
            )}
          </Root.Screen>
        </Root.Navigator>
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  splash: { flex: 1, backgroundColor: '#f2f2f7' },
});
