import React from 'react';
import MapView from 'react-native-map-clustering';
import MapCluster from './cluster/MapCluster';
import { Region } from 'react-native-maps';
import ChargingStation from '../../types/ChargingStation';
import Site from '../../types/Site';
import SiteArea from '../../types/SiteArea';
import Utils from '../../utils/Utils';
import ThemeManager from '../../custom-theme/ThemeManager';
import computeStyleSheet from './ClusterMapStyle';
import { View } from 'native-base';

interface State {}

type Localizable = ChargingStation | Site | SiteArea;

export interface Props<T> {
  items: T[]
  renderMarker: (item: T, index: number) => React.ReactElement;
  initialRegion: Region;
  onMapRegionChangeComplete: (region: Region) => void;
  satelliteMap?: boolean;
}

export default class ClusterMap<T extends Localizable> extends React.Component<Props<T>, State> {
  public props: Props<T>;
  public state: State;
  private darkMapTheme = require('../../utils/map/google-maps-night-style.json');

  public constructor(props: Props<T>) {
    super(props);
    this.state = {
      satelliteMap: false
    }
  }

  public render() {
    const { items, renderMarker, initialRegion, onMapRegionChangeComplete, satelliteMap } = this.props;
    const commonColors = Utils.getCurrentCommonColor();
    const isDarkModeEnabled = ThemeManager.getInstance()?.isThemeTypeIsDark();
    const style = computeStyleSheet();
    return (
      <View style={style.map}>
        {initialRegion && (
          <MapView
            customMapStyle={isDarkModeEnabled ? this.darkMapTheme : null}
            style={style.map}
            showsCompass={false}
            showsUserLocation={true}
            zoomControlEnabled={false}
            toolbarEnabled={false}
            spiralEnabled={true}
            radius={5}
            tracksViewChanges={false}
            renderCluster={(cluster) => <MapCluster cluster={cluster} />}
            spiderLineColor={commonColors.textColor}
            mapType={satelliteMap ? 'satellite' : 'standard'}
            initialRegion={initialRegion}
            onRegionChangeComplete={onMapRegionChangeComplete}
          >
            {items.map((item, index) => (
              renderMarker?.(item, index)
            ))}
          </MapView>
        )}
      </View>
    )
  }
}
