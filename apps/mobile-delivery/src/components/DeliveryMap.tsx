import MapView, { Marker, Polyline, type Region } from "react-native-maps";
import { View } from "react-native";

interface DeliveryMapProps {
  customerLat: number;
  customerLng: number;
  driverLat?: number;
  driverLng?: number;
  routeCoords?: { latitude: number; longitude: number }[];
}

export function DeliveryMap({ customerLat, customerLng, driverLat, driverLng, routeCoords }: DeliveryMapProps) {
  const region: Region = {
    latitude: driverLat ?? customerLat,
    longitude: driverLng ?? customerLng,
    latitudeDelta: 0.02,
    longitudeDelta: 0.02,
  };

  return (
    <View className="flex-1 rounded-2xl overflow-hidden border border-slate-200">
      <MapView
        style={{ flex: 1, minHeight: 200 }}
        initialRegion={region}
        showsUserLocation
        showsMyLocationButton
        className="flex-1"
      >
        <Marker
          coordinate={{ latitude: customerLat, longitude: customerLng }}
          title="Customer"
          description="Delivery destination"
          pinColor="#059669"
        />
        {driverLat !== undefined && driverLng !== undefined && (
          <Marker
            coordinate={{ latitude: driverLat, longitude: driverLng }}
            title="You"
            pinColor="#2563EB"
          />
        )}
        {routeCoords && routeCoords.length > 0 && (
          <Polyline coordinates={routeCoords} strokeColor="#059669" strokeWidth={3} />
        )}
      </MapView>
    </View>
  );
}
