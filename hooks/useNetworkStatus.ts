import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { useEffect, useState } from 'react';

interface NetworkStatus {
  isConnected: boolean;
  isInternetReachable: boolean | null;
  type: string | null;
  details: string | null;
}

export function useNetworkStatus(): NetworkStatus {
  const [status, setStatus] = useState<NetworkStatus>({
    isConnected: true,
    isInternetReachable: true,
    type: null,
    details: null,
  });

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      setStatus({
        isConnected: state.isConnected ?? false,
        isInternetReachable: state.isInternetReachable,
        type: state.type ?? null,
        details: state.isConnected
          ? null
          : 'No internet connection. Some features may be unavailable.',
      });
    });

    return () => unsubscribe();
  }, []);

  return status;
}

export function useIsOffline(): boolean {
  const { isConnected } = useNetworkStatus();
  return !isConnected;
}
